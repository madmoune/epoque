import { Injectable, inject } from '@angular/core';
import {
  DataSnapshot,
  Database,
  DatabaseReference,
  child,
  get,
  off,
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import { Observable } from 'rxjs';

import { FirebaseAuthService } from '../firebase/firebase-auth.service';
import { FirebaseClientService } from '../firebase/firebase-client.service';

export type MultiplayerRoomStatus = 'waiting' | 'playing' | 'finished';

export interface MultiplayerPlayer {
  id: string;
  name: string;
  joinedAt: object;
  lastSeen: object;
  online: boolean;
}

export interface MultiplayerRoom<TState = unknown> {
  id: string;
  gameId: string;
  hostId: string;
  status: MultiplayerRoomStatus;
  createdAt: object;
  updatedAt: object;
  players: Record<string, MultiplayerPlayer>;
  state: TState;
}

@Injectable({ providedIn: 'root' })
export class FirebaseRoomService {
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly firebaseClient = inject(FirebaseClientService);
  private database?: Database;

  get isConfigured(): boolean {
    return this.firebaseClient.isConfigured;
  }

  async createRoom<TState>(
    gameId: string,
    initialState: TState,
    playerName = 'Player',
  ): Promise<{ roomCode: string; playerId: string }> {
    const database = this.getDatabase();
    const playerId = await this.getPlayerId();
    const roomCode = await this.createUniqueRoomCode();
    const player = this.createPlayer(playerId, playerName);

    await set(ref(database, `rooms/${roomCode}`), {
      id: roomCode,
      gameId,
      hostId: playerId,
      status: 'waiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      players: {
        [playerId]: player,
      },
      state: initialState,
    } satisfies MultiplayerRoom<TState>);

    this.trackPresence(roomCode, playerId, true);

    return { roomCode, playerId };
  }

  async joinRoom(roomCode: string, playerName = 'Player'): Promise<{ playerId: string }> {
    const database = this.getDatabase();
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const playerId = await this.getPlayerId();
    const roomSnapshot = await get(ref(database, `rooms/${normalizedRoomCode}`));

    if (!roomSnapshot.exists()) {
      throw new Error('Room not found.');
    }

    await update(ref(database, `rooms/${normalizedRoomCode}`), {
      [`players/${playerId}`]: this.createPlayer(playerId, playerName),
      updatedAt: serverTimestamp(),
    });

    this.trackPresence(normalizedRoomCode, playerId, false);

    return { playerId };
  }

  watchRoom<TState>(roomCode: string): Observable<MultiplayerRoom<TState> | null> {
    return new Observable((subscriber) => {
      let roomRef: DatabaseReference | undefined;
      let closed = false;

      void this.firebaseAuth
        .ensureAuthenticated()
        .then(() => {
          if (closed) {
            return;
          }

          roomRef = ref(this.getDatabase(), `rooms/${this.normalizeRoomCode(roomCode)}`);
          onValue(
            roomRef,
            (snapshot: DataSnapshot) => {
              subscriber.next(snapshot.exists() ? (snapshot.val() as MultiplayerRoom<TState>) : null);
            },
            (error) => subscriber.error(error),
          );
        })
        .catch((error: unknown) => subscriber.error(error));

      return () => {
        closed = true;

        if (roomRef) {
          off(roomRef);
        }
      };
    });
  }

  async setRoomStatus(roomCode: string, status: MultiplayerRoomStatus): Promise<void> {
    await update(ref(this.getDatabase(), `rooms/${this.normalizeRoomCode(roomCode)}`), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  async setRoomState<TState>(roomCode: string, state: TState): Promise<void> {
    await update(ref(this.getDatabase(), `rooms/${this.normalizeRoomCode(roomCode)}`), {
      state,
      updatedAt: serverTimestamp(),
    });
  }

  async patchRoomState<TState extends Record<string, unknown>>(
    roomCode: string,
    statePatch: Partial<TState>,
  ): Promise<void> {
    const updates = Object.fromEntries(
      Object.entries(statePatch).map(([key, value]) => [`state/${key}`, value]),
    );

    await update(ref(this.getDatabase(), `rooms/${this.normalizeRoomCode(roomCode)}`), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async leaveRoom(roomCode: string): Promise<void> {
    const database = this.getDatabase();
    const playerId = await this.getPlayerId();
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const roomRef = ref(database, `rooms/${normalizedRoomCode}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val() as MultiplayerRoom | null;

    if (room?.hostId === playerId) {
      await remove(roomRef);
      return;
    }

    await remove(ref(database, `rooms/${normalizedRoomCode}/players/${playerId}`));
    await this.deleteRoomIfEmpty(normalizedRoomCode);
  }

  async deleteRoom(roomCode: string): Promise<void> {
    await remove(ref(this.getDatabase(), `rooms/${this.normalizeRoomCode(roomCode)}`));
  }

  async deleteRoomIfEmpty(roomCode: string): Promise<void> {
    const database = this.getDatabase();
    const roomRef = ref(database, `rooms/${this.normalizeRoomCode(roomCode)}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val() as MultiplayerRoom | null;

    if (room && Object.keys(room.players ?? {}).length === 0) {
      await remove(roomRef);
    }
  }

  private getDatabase(): Database {
    if (!this.isConfigured) {
      throw new Error(
        'Firebase is not configured. Add your Firebase web app values to environment.ts.',
      );
    }

    this.database ??= this.firebaseClient.database;

    return this.database;
  }

  private async createUniqueRoomCode(): Promise<string> {
    const database = this.getDatabase();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const roomCode = this.generateRoomCode();
      const snapshot = await get(child(ref(database), `rooms/${roomCode}`));

      if (!snapshot.exists()) {
        return roomCode;
      }
    }

    throw new Error('Could not create a unique room code.');
  }

  private generateRoomCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from(
      { length: 6 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('');
  }

  private normalizeRoomCode(roomCode: string): string {
    return roomCode.trim().toUpperCase();
  }

  private async getPlayerId(): Promise<string> {
    const user = await this.firebaseAuth.ensureAuthenticated();
    return user.uid;
  }

  private createPlayer(playerId: string, playerName: string): MultiplayerPlayer {
    return {
      id: playerId,
      name: playerName.trim() || 'Player',
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      online: true,
    };
  }

  private trackPresence(roomCode: string, playerId: string, isHost: boolean): void {
    const database = this.getDatabase();
    const roomRef = ref(database, `rooms/${roomCode}`);
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);

    if (isHost) {
      onDisconnect(roomRef).remove();
      return;
    }

    onDisconnect(playerRef).remove();
  }
}

import { Injectable } from '@angular/core';
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, signInAnonymously } from 'firebase/auth';
import {
  DataSnapshot,
  Database,
  child,
  get,
  getDatabase,
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

import { environment } from '../../../environments/environment';

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
  private app?: FirebaseApp;
  private auth?: Auth;
  private database?: Database;

  get isConfigured(): boolean {
    const config = environment.firebase;

    return Boolean(
      config.apiKey &&
      config.projectId &&
      config.databaseURL &&
      config.appId &&
      !String(config.apiKey).startsWith('YOUR_') &&
      !String(config.projectId).startsWith('YOUR_') &&
      !String(config.databaseURL).includes('YOUR_') &&
      !String(config.appId).startsWith('YOUR_'),
    );
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
    const roomSnapshot = await get(ref(database, `rooms/${normalizedRoomCode}`));

    if (!roomSnapshot.exists()) {
      throw new Error('Room not found.');
    }

    const playerId = await this.getPlayerId();

    await update(ref(database, `rooms/${normalizedRoomCode}`), {
      [`players/${playerId}`]: this.createPlayer(playerId, playerName),
      updatedAt: serverTimestamp(),
    });

    this.trackPresence(normalizedRoomCode, playerId, false);

    return { playerId };
  }

  watchRoom<TState>(roomCode: string): Observable<MultiplayerRoom<TState> | null> {
    const database = this.getDatabase();
    const roomRef = ref(database, `rooms/${this.normalizeRoomCode(roomCode)}`);

    return new Observable((subscriber) => {
      onValue(
        roomRef,
        (snapshot: DataSnapshot) => {
          subscriber.next(snapshot.exists() ? (snapshot.val() as MultiplayerRoom<TState>) : null);
        },
        (error) => subscriber.error(error),
      );

      return () => off(roomRef);
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

    if (!this.database) {
      this.app = this.getFirebaseApp(environment.firebase);
      this.database = getDatabase(this.app);
      this.auth = getAuth(this.app);
    }

    return this.database;
  }

  private getFirebaseApp(config: FirebaseOptions): FirebaseApp {
    return getApps().length ? getApp() : initializeApp(config);
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
    this.getDatabase();
    const auth = this.auth;

    if (!auth) {
      throw new Error('Firebase Auth is not available.');
    }

    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error('Could not start an anonymous Firebase session.');
    }

    return uid;
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

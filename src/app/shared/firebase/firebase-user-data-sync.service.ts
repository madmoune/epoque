import { Injectable, effect, inject, signal } from '@angular/core';
import { User } from 'firebase/auth';
import { DataSnapshot, get, onValue, ref, serverTimestamp, update } from 'firebase/database';

import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseClientService } from './firebase-client.service';
import { AppStorageService } from '../storage/app-storage.service';
import { DOCUMENT } from '@angular/common';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

const PLAYLISTS_KEY = 'epique-puzzle-playlists';
const PLAY_HISTORY_KEY = 'epique-puzzle-play-history';
const SOLVED_HISTORY_KEY = 'epique-puzzle-solved-history';

@Injectable({ providedIn: 'root' })
export class FirebaseUserDataSyncService {
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly firebaseClient = inject(FirebaseClientService);
  private readonly storage = inject(AppStorageService);
  private readonly document = inject(DOCUMENT);
  private readonly statusState = signal<SyncStatus>('idle');
  private activeUid: string | null = null;
  private activeGeneration = 0;
  private stopRemoteListener?: () => void;
  private uploadTimer?: ReturnType<typeof setTimeout>;
  private readonly pendingLocalChanges = new Map<string, string | null>();
  private isHydrating = false;

  readonly status = this.statusState.asReadonly();

  constructor() {
    effect(() => {
      const user = this.firebaseAuth.user();
      void this.activateUser(user);
    });

    this.storage.changes$.subscribe((change) => {
      if (change.source !== 'local' || !this.activeUid || !change.key.startsWith('epique-')) {
        return;
      }

      this.pendingLocalChanges.set(change.key, change.value);

      if (!this.isHydrating) {
        this.scheduleUpload();
      }
    });
  }

  private async activateUser(user: User | null): Promise<void> {
    const generation = ++this.activeGeneration;
    this.stopRemoteListener?.();
    this.stopRemoteListener = undefined;

    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
      this.uploadTimer = undefined;
    }

    this.pendingLocalChanges.clear();
    this.activeUid = user && !user.isAnonymous ? user.uid : null;
    this.isHydrating = Boolean(this.activeUid);
    this.statusState.set(this.activeUid ? 'syncing' : 'idle');

    if (!this.activeUid) {
      return;
    }

    const uid = this.activeUid;
    this.isHydrating = true;

    try {
      const userDataRef = ref(this.firebaseClient.database, this.userDataPath(uid));
      const snapshot = await get(userDataRef);

      if (generation !== this.activeGeneration || this.activeUid !== uid) {
        return;
      }

      const remoteValues = this.parseRemoteValues(snapshot);
      const mergedValues = this.mergeInitialValues(remoteValues, this.storage.snapshot());
      const initialChanges = this.valuesDifferentFrom(remoteValues, mergedValues);
      this.storage.replace(mergedValues);
      this.applyTheme(mergedValues['epique-theme']);

      for (const [key, value] of Object.entries(initialChanges)) {
        if (!this.pendingLocalChanges.has(key)) {
          this.pendingLocalChanges.set(key, value);
        }
      }

      if (Object.keys(initialChanges).length > 0) {
        await this.writeValueChanges(uid, initialChanges);

        for (const [key, value] of Object.entries(initialChanges)) {
          if (this.pendingLocalChanges.get(key) === value) {
            this.pendingLocalChanges.delete(key);
          }
        }
      }

      if (generation !== this.activeGeneration || this.activeUid !== uid) {
        return;
      }

      this.isHydrating = false;
      this.stopRemoteListener = onValue(userDataRef, (nextSnapshot) => {
        if (this.activeUid !== uid || this.isHydrating) {
          return;
        }

        const nextValues = this.parseRemoteValues(nextSnapshot);

        if (!this.valuesEqual(nextValues, this.storage.snapshot())) {
          this.storage.replace(nextValues);
          this.applyTheme(nextValues['epique-theme']);
        }
      });
      this.statusState.set('synced');
    } catch {
      if (generation === this.activeGeneration) {
        this.statusState.set('error');
      }
    } finally {
      if (generation === this.activeGeneration) {
        this.isHydrating = false;

        if (this.pendingLocalChanges.size > 0) {
          this.scheduleUpload();
        }
      }
    }
  }

  private scheduleUpload(): void {
    if (!this.activeUid || this.isHydrating) {
      return;
    }

    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
    }

    this.uploadTimer = setTimeout(() => {
      this.uploadTimer = undefined;
      void this.uploadCurrentValues();
    }, 250);
  }

  private async uploadCurrentValues(): Promise<void> {
    const uid = this.activeUid;

    if (!uid) {
      return;
    }

    const changes = new Map(this.pendingLocalChanges);
    this.pendingLocalChanges.clear();

    if (changes.size === 0) {
      return;
    }

    try {
      this.statusState.set('syncing');
      await this.writeValueChanges(uid, Object.fromEntries(changes));

      if (this.activeUid === uid) {
        this.statusState.set('synced');
      }
    } catch {
      if (this.activeUid === uid) {
        for (const [key, value] of changes) {
          if (!this.pendingLocalChanges.has(key)) {
            this.pendingLocalChanges.set(key, value);
          }
        }

        this.statusState.set('error');
      }
    } finally {
      if (this.activeUid === uid && this.pendingLocalChanges.size > 0 && !this.uploadTimer) {
        this.scheduleUpload();
      }
    }
  }

  private async writeValueChanges(
    uid: string,
    changes: Record<string, string | null>,
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      version: 1,
      updatedAt: serverTimestamp(),
    };

    for (const [key, value] of Object.entries(changes)) {
      updates[`values/${key}`] = value;
    }

    await update(ref(this.firebaseClient.database, this.userDataPath(uid)), updates);
  }

  private userDataPath(uid: string): string {
    return `users/${uid}/localStorage`;
  }

  private applyTheme(value: string | undefined): void {
    if (value === 'dark' || value === 'light') {
      this.document.documentElement.dataset['theme'] = value;
    }
  }

  private parseRemoteValues(snapshot: DataSnapshot): Record<string, string> {
    const stored = snapshot.val();

    if (!stored || typeof stored !== 'object' || typeof stored.values !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(stored.values as Record<string, unknown>).filter(
        ([key, value]) => key.startsWith('epique-') && typeof value === 'string',
      ),
    ) as Record<string, string>;
  }

  private mergeInitialValues(
    remoteValues: Record<string, string>,
    localValues: Record<string, string>,
  ): Record<string, string> {
    const merged = { ...localValues, ...remoteValues };
    const mergedPlaylists = this.mergeArraysById(
      remoteValues[PLAYLISTS_KEY],
      localValues[PLAYLISTS_KEY],
    );

    if (mergedPlaylists) {
      merged[PLAYLISTS_KEY] = mergedPlaylists;
    }

    const mergedPlayHistory = this.mergeNumberRecords(
      remoteValues[PLAY_HISTORY_KEY],
      localValues[PLAY_HISTORY_KEY],
    );

    if (mergedPlayHistory) {
      merged[PLAY_HISTORY_KEY] = mergedPlayHistory;
    }

    const mergedSolvedHistory = this.mergeBooleanRecords(
      remoteValues[SOLVED_HISTORY_KEY],
      localValues[SOLVED_HISTORY_KEY],
    );

    if (mergedSolvedHistory) {
      merged[SOLVED_HISTORY_KEY] = mergedSolvedHistory;
    }

    return merged;
  }

  private valuesDifferentFrom(
    source: Record<string, string>,
    target: Record<string, string>,
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(target).filter(([key, value]) => source[key] !== value),
    );
  }

  private mergeArraysById(
    remoteValue: string | undefined,
    localValue: string | undefined,
  ): string | null {
    const remote = this.parseArrayWithIds(remoteValue);
    const local = this.parseArrayWithIds(localValue);

    if (remote) {
      // Once the account has a remote playlist list, it is the source of truth.
      // Local-only entries may be stale data from another device and must not be
      // reintroduced into Firebase during the next upload.
      return JSON.stringify(remote);
    }

    return local ? JSON.stringify(local) : null;
  }

  private mergeNumberRecords(
    remoteValue: string | undefined,
    localValue: string | undefined,
  ): string | null {
    const remote = this.parseRecord(remoteValue);
    const local = this.parseRecord(localValue);

    if (!remote && !local) {
      return null;
    }

    const merged: Record<string, number> = {};

    for (const key of new Set([...Object.keys(remote ?? {}), ...Object.keys(local ?? {})])) {
      const remoteTimestamp = typeof remote?.[key] === 'number' ? remote[key] : 0;
      const localTimestamp = typeof local?.[key] === 'number' ? local[key] : 0;
      merged[key] = Math.max(remoteTimestamp, localTimestamp);
    }

    return JSON.stringify(merged);
  }

  private mergeBooleanRecords(
    remoteValue: string | undefined,
    localValue: string | undefined,
  ): string | null {
    const remote = this.parseRecord(remoteValue);
    const local = this.parseRecord(localValue);

    if (!remote && !local) {
      return null;
    }

    const merged: Record<string, boolean> = {};

    for (const key of new Set([...Object.keys(remote ?? {}), ...Object.keys(local ?? {})])) {
      merged[key] = remote?.[key] === true || local?.[key] === true;
    }

    return JSON.stringify(merged);
  }

  private parseArrayWithIds(value: string | undefined): Array<Record<string, unknown>> | null {
    try {
      const parsed: unknown = value ? JSON.parse(value) : null;

      if (!Array.isArray(parsed)) {
        return null;
      }

      return parsed.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string',
      );
    } catch {
      return null;
    }
  }

  private parseRecord(value: string | undefined): Record<string, unknown> | null {
    try {
      const parsed: unknown = value ? JSON.parse(value) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private valuesEqual(first: Record<string, string>, second: Record<string, string>): boolean {
    const firstKeys = Object.keys(first).sort();
    const secondKeys = Object.keys(second).sort();

    return (
      firstKeys.length === secondKeys.length &&
      firstKeys.every((key, index) => key === secondKeys[index] && first[key] === second[key])
    );
  }
}

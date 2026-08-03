import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type AppStorageChange = {
  key: string;
  value: string | null;
  source: 'local' | 'remote';
};

@Injectable({ providedIn: 'root' })
export class AppStorageService {
  private readonly keyPrefix = 'epique-';
  private readonly changesSubject = new Subject<AppStorageChange>();

  readonly changes$: Observable<AppStorageChange> = this.changesSubject.asObservable();

  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  set(key: string, value: string, notify = true): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Les préférences restent valables pendant la session si le stockage est indisponible.
    }

    if (notify) {
      this.changesSubject.next({ key, value, source: 'local' });
    }
  }

  remove(key: string, notify = true): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Le stockage peut être indisponible dans certains modes privés.
    }

    if (notify) {
      this.changesSubject.next({ key, value: null, source: 'local' });
    }
  }

  snapshot(): Record<string, string> {
    const snapshot: Record<string, string> = {};

    try {
      const storage = globalThis.localStorage;

      if (!storage) {
        return snapshot;
      }

      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);

        if (!key?.startsWith(this.keyPrefix)) {
          continue;
        }

        const value = storage.getItem(key);

        if (value !== null) {
          snapshot[key] = value;
        }
      }
    } catch {
      // Une copie partielle vaut mieux qu'une erreur qui empêcherait l'application de démarrer.
    }

    return snapshot;
  }

  replace(snapshot: Record<string, string>): void {
    const current = this.snapshot();
    const changedKeys = new Set<string>();

    for (const key of Object.keys(current)) {
      if (!(key in snapshot)) {
        this.remove(key, false);
        changedKeys.add(key);
      }
    }

    for (const [key, value] of Object.entries(snapshot)) {
      if (current[key] !== value) {
        changedKeys.add(key);
      }

      this.set(key, value, false);
    }

    for (const key of changedKeys) {
      this.changesSubject.next({ key, value: snapshot[key] ?? null, source: 'remote' });
    }
  }
}

import { Injectable } from '@angular/core';
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  browserSessionPersistence,
  getAuth,
  setPersistence,
  signInAnonymously,
} from 'firebase/auth';
import { Database, get, getDatabase, ref, serverTimestamp, update } from 'firebase/database';

import { environment } from '../../../environments/environment';

export type PuzzleCatalogApprovalState = 'approved' | 'pending' | 'deleted';

export type PuzzleCatalogStatusOverrides = {
  typeNames: Record<string, string>;
  typeStates: Record<string, PuzzleCatalogApprovalState>;
  familyNames: Record<string, Record<string, string>>;
  familyStates: Record<string, Record<string, PuzzleCatalogApprovalState>>;
  variantNames: Record<string, Record<string, string>>;
  variantStates: Record<string, Record<string, PuzzleCatalogApprovalState>>;
  typeComments: Record<string, string>;
  familyComments: Record<string, Record<string, string>>;
  variantComments: Record<string, Record<string, string>>;
  variantExampleCounts: Record<string, Record<string, number>>;
};

type StoredPuzzleCatalog = {
  types?: Record<string, StoredPuzzleType>;
};

type StoredPuzzleType = {
  id?: unknown;
  name?: unknown;
  state?: unknown;
  comment?: unknown;
  variants?: Record<string, StoredPuzzleVariant>;
  families?: Record<string, StoredPuzzleFamily>;
};

type StoredPuzzleFamily = {
  id?: unknown;
  name?: unknown;
  state?: unknown;
  comment?: unknown;
};

type StoredPuzzleVariant = {
  id?: unknown;
  name?: unknown;
  state?: unknown;
  comment?: unknown;
  exampleCount?: unknown;
};

const MAX_COMMENT_LENGTH = 1000;

@Injectable({ providedIn: 'root' })
export class FirebasePuzzleCatalogService {
  private readonly authSessionKey = 'epique.firebase.authSessionStarted';
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

  async loadStatuses(): Promise<PuzzleCatalogStatusOverrides> {
    const snapshot = await get(ref(await this.getDatabase(), 'puzzleCatalog'));
    const catalog = snapshot.val() as StoredPuzzleCatalog | null;

    return this.parseStatuses(catalog);
  }

  async saveTypeStatus(typeId: string, state: PuzzleCatalogApprovalState): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      state,
      updatedAt: serverTimestamp(),
    });
  }

  async saveTypeName(typeId: string, name: string): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      name,
      updatedAt: serverTimestamp(),
    });
  }

  async saveVariantName(typeId: string, variantId: string, name: string): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      [`variants/${variantId}/id`]: variantId,
      [`variants/${variantId}/name`]: name,
      [`variants/${variantId}/updatedAt`]: serverTimestamp(),
    });
  }

  async saveVariantStatus(
    typeId: string,
    variantId: string,
    state: PuzzleCatalogApprovalState,
  ): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      [`variants/${variantId}/id`]: variantId,
      [`variants/${variantId}/state`]: state,
      [`variants/${variantId}/updatedAt`]: serverTimestamp(),
    });
  }

  async saveFamilyStatus(
    typeId: string,
    familyId: string,
    state: PuzzleCatalogApprovalState,
  ): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      [`families/${familyId}/id`]: familyId,
      [`families/${familyId}/state`]: state,
      [`families/${familyId}/updatedAt`]: serverTimestamp(),
    });
  }

  async saveFamilyName(typeId: string, familyId: string, name: string): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      [`families/${familyId}/id`]: familyId,
      [`families/${familyId}/name`]: name,
      [`families/${familyId}/updatedAt`]: serverTimestamp(),
    });
  }

  async saveTypeComment(typeId: string, comment: string): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      comment: comment || null,
      updatedAt: serverTimestamp(),
    });
  }

  async saveVariantComment(typeId: string, variantId: string, comment: string): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      [`variants/${variantId}/id`]: variantId,
      [`variants/${variantId}/comment`]: comment || null,
      [`variants/${variantId}/updatedAt`]: serverTimestamp(),
    });
  }

  async saveFamilyComment(typeId: string, familyId: string, comment: string): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      [`families/${familyId}/id`]: familyId,
      [`families/${familyId}/comment`]: comment || null,
      [`families/${familyId}/updatedAt`]: serverTimestamp(),
    });
  }

  async saveVariantExampleCount(typeId: string, variantId: string, exampleCount: number): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      [`variants/${variantId}/id`]: variantId,
      [`variants/${variantId}/exampleCount`]: exampleCount,
      [`variants/${variantId}/updatedAt`]: serverTimestamp(),
    });
  }

  private async getDatabase(): Promise<Database> {
    if (!this.isConfigured) {
      throw new Error(
        'Firebase n’est pas configuré. Ajoutez les valeurs Firebase dans environment.ts.',
      );
    }

    if (!this.database) {
      this.app = this.getFirebaseApp(environment.firebase);
      this.database = getDatabase(this.app);
      this.auth = getAuth(this.app);
    }

    await this.ensureAuthenticated();

    return this.database;
  }

  private async ensureAuthenticated(): Promise<void> {
    const auth = this.auth;

    if (!auth) {
      throw new Error('Firebase Auth n’est pas disponible.');
    }

    await setPersistence(auth, browserSessionPersistence);

    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error('Impossible de démarrer la session Firebase.');
    }

    sessionStorage.setItem(this.authSessionKey, uid);
  }

  private getFirebaseApp(config: FirebaseOptions): FirebaseApp {
    return getApps().length ? getApp() : initializeApp(config);
  }

  private parseStatuses(catalog: StoredPuzzleCatalog | null): PuzzleCatalogStatusOverrides {
    const typeNames: Record<string, string> = {};
    const typeStates: Record<string, PuzzleCatalogApprovalState> = {};
    const familyNames: Record<string, Record<string, string>> = {};
    const familyStates: Record<string, Record<string, PuzzleCatalogApprovalState>> = {};
    const variantNames: Record<string, Record<string, string>> = {};
    const variantStates: Record<string, Record<string, PuzzleCatalogApprovalState>> = {};
    const typeComments: Record<string, string> = {};
    const familyComments: Record<string, Record<string, string>> = {};
    const variantComments: Record<string, Record<string, string>> = {};
    const variantExampleCounts: Record<string, Record<string, number>> = {};

    for (const [typeId, type] of Object.entries(catalog?.types ?? {})) {
      if (this.isName(type.name)) {
        typeNames[typeId] = type.name;
      }
      if (this.isApprovalState(type.state)) {
        typeStates[typeId] = type.state;
      }
      if (this.isComment(type.comment)) {
        typeComments[typeId] = type.comment;
      }

      for (const [familyId, family] of Object.entries(type.families ?? {})) {
        if (this.isName(family.name)) {
          familyNames[typeId] ??= {};
          familyNames[typeId][familyId] = family.name;
        }
        if (this.isApprovalState(family.state)) {
          familyStates[typeId] ??= {};
          familyStates[typeId][familyId] = family.state;
        }
        if (this.isComment(family.comment)) {
          familyComments[typeId] ??= {};
          familyComments[typeId][familyId] = family.comment;
        }
      }

      for (const [variantId, variant] of Object.entries(type.variants ?? {})) {
        if (this.isName(variant.name)) {
          variantNames[typeId] ??= {};
          variantNames[typeId][variantId] = variant.name;
        }
        if (this.isApprovalState(variant.state)) {
          variantStates[typeId] ??= {};
          variantStates[typeId][variantId] = variant.state;
        }
        if (this.isComment(variant.comment)) {
          variantComments[typeId] ??= {};
          variantComments[typeId][variantId] = variant.comment;
        }
        if (this.isExampleCount(variant.exampleCount)) {
          variantExampleCounts[typeId] ??= {};
          variantExampleCounts[typeId][variantId] = variant.exampleCount;
        }
      }
    }

    return {
      typeNames,
      typeStates,
      familyNames,
      familyStates,
      variantNames,
      variantStates,
      typeComments,
      familyComments,
      variantComments,
      variantExampleCounts,
    };
  }

  private isApprovalState(value: unknown): value is PuzzleCatalogApprovalState {
    return value === 'approved' || value === 'pending' || value === 'deleted';
  }

  private isComment(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_COMMENT_LENGTH;
  }

  private isName(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= 120;
  }

  private isExampleCount(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 20;
  }
}

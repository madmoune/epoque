import { Injectable, inject } from '@angular/core';
import { Database, get, ref, serverTimestamp, update } from 'firebase/database';

import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseClientService } from './firebase-client.service';

export type PuzzleCatalogApprovalState = 'approved' | 'pending' | 'deleted';

export type PuzzleCatalogStatusOverrides = {
  typeNames: Record<string, string>;
  typeStates: Record<string, PuzzleCatalogApprovalState>;
  typeCreatedAt: Record<string, number>;
  typeUpdatedAt: Record<string, number>;
  typeDescriptions: Record<string, string>;
  variantNames: Record<string, Record<string, string>>;
  variantStates: Record<string, Record<string, PuzzleCatalogApprovalState>>;
  variantDescriptions: Record<string, Record<string, string>>;
  typeComments: Record<string, string>;
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
  description?: unknown;
  comment?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  variants?: Record<string, StoredPuzzleVariant>;
};

type StoredPuzzleVariant = {
  id?: unknown;
  name?: unknown;
  state?: unknown;
  description?: unknown;
  comment?: unknown;
  exampleCount?: unknown;
};

const MAX_COMMENT_LENGTH = 1000;

@Injectable({ providedIn: 'root' })
export class FirebasePuzzleCatalogService {
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly firebaseClient = inject(FirebaseClientService);
  private database?: Database;

  get isConfigured(): boolean {
    return this.firebaseClient.isConfigured;
  }

  async loadStatuses(): Promise<PuzzleCatalogStatusOverrides> {
    const snapshot = await get(ref(await this.getDatabase(), 'puzzleCatalog'));
    const catalog = snapshot.val() as StoredPuzzleCatalog | null;

    return this.parseStatuses(catalog);
  }

  async ensureTypeDates(typeId: string, createdAt: string, updatedAt: string): Promise<void> {
    const typeRef = ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`);
    const snapshot = await get(typeRef);
    const storedType = snapshot.val() as StoredPuzzleType | null;
    const updates: Record<string, unknown> = { id: typeId };

    if (this.parseTimestamp(storedType?.createdAt) === undefined) {
      updates['createdAt'] = createdAt;
    }

    if (this.parseTimestamp(storedType?.updatedAt) === undefined) {
      updates['updatedAt'] = updatedAt;
    }

    if (Object.keys(updates).length > 1) {
      await update(typeRef, updates);
    }
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

  async saveTypeDescription(typeId: string, description: string): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      description: description || null,
      updatedAt: serverTimestamp(),
    });
  }

  async saveVariantName(typeId: string, variantId: string, name: string): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      updatedAt: serverTimestamp(),
      [`variants/${variantId}/id`]: variantId,
      [`variants/${variantId}/name`]: name,
      [`variants/${variantId}/updatedAt`]: serverTimestamp(),
    });
  }

  async saveVariantDescription(
    typeId: string,
    variantId: string,
    description: string,
  ): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      updatedAt: serverTimestamp(),
      [`variants/${variantId}/id`]: variantId,
      [`variants/${variantId}/description`]: description || null,
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
      updatedAt: serverTimestamp(),
      [`variants/${variantId}/id`]: variantId,
      [`variants/${variantId}/state`]: state,
      [`variants/${variantId}/updatedAt`]: serverTimestamp(),
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
      updatedAt: serverTimestamp(),
      [`variants/${variantId}/id`]: variantId,
      [`variants/${variantId}/comment`]: comment || null,
      [`variants/${variantId}/updatedAt`]: serverTimestamp(),
    });
  }

  async saveVariantExampleCount(typeId: string, variantId: string, exampleCount: number): Promise<void> {
    await update(ref(await this.getDatabase(), `puzzleCatalog/types/${typeId}`), {
      id: typeId,
      updatedAt: serverTimestamp(),
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

    this.database ??= this.firebaseClient.database;
    await this.firebaseAuth.ensureAuthenticated();

    return this.database;
  }

  private parseStatuses(catalog: StoredPuzzleCatalog | null): PuzzleCatalogStatusOverrides {
    const typeNames: Record<string, string> = {};
    const typeStates: Record<string, PuzzleCatalogApprovalState> = {};
    const typeCreatedAt: Record<string, number> = {};
    const typeUpdatedAt: Record<string, number> = {};
    const typeDescriptions: Record<string, string> = {};
    const variantNames: Record<string, Record<string, string>> = {};
    const variantStates: Record<string, Record<string, PuzzleCatalogApprovalState>> = {};
    const variantDescriptions: Record<string, Record<string, string>> = {};
    const typeComments: Record<string, string> = {};
    const variantComments: Record<string, Record<string, string>> = {};
    const variantExampleCounts: Record<string, Record<string, number>> = {};

    for (const [typeId, type] of Object.entries(catalog?.types ?? {})) {
      if (this.isName(type.name)) {
        typeNames[typeId] = type.name;
      }
      if (this.isApprovalState(type.state)) {
        typeStates[typeId] = type.state;
      }
      if (this.isDescription(type.description)) {
        typeDescriptions[typeId] = type.description;
      }
      if (this.isComment(type.comment)) {
        typeComments[typeId] = type.comment;
      }
      const createdAt = this.parseTimestamp(type.createdAt);
      if (createdAt !== undefined) {
        typeCreatedAt[typeId] = createdAt;
      }
      const updatedAt = this.parseTimestamp(type.updatedAt);
      if (updatedAt !== undefined) {
        typeUpdatedAt[typeId] = updatedAt;
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
        if (this.isDescription(variant.description)) {
          variantDescriptions[typeId] ??= {};
          variantDescriptions[typeId][variantId] = variant.description;
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
      typeCreatedAt,
      typeUpdatedAt,
      typeDescriptions,
      variantNames,
      variantStates,
      variantDescriptions,
      typeComments,
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

  private isDescription(value: unknown): value is string {
    return this.isComment(value);
  }

  private isName(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= 120;
  }

  private isExampleCount(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 20;
  }

  private parseTimestamp(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }

    if (typeof value === 'string') {
      const timestamp = Date.parse(value);
      return Number.isNaN(timestamp) ? undefined : timestamp;
    }

    return undefined;
  }
}

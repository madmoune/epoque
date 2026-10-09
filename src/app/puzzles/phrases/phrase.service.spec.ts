import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { PhraseService } from './phrase.service';

describe('PhraseService', () => {
  it('expands the œ ligature into two playable letters', () => {
    const service = Object.create(PhraseService.prototype) as any;

    expect(service.normalizePhrase('Cœur et nœud')).toBe('COEUR ET NOEUD');
  });
});

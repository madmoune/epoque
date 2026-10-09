import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { PhrasesPage } from './phrase.page';

describe('PhrasesPage', () => {
  it('accepts the œ ligature when checking a typed answer', () => {
    const page = Object.create(PhrasesPage.prototype) as any;

    expect(page.normalizeAnswer('Cœur et nœud')).toBe('coeur et noeud');
  });
});

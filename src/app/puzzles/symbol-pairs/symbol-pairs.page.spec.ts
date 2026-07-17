import '@angular/compiler';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MEMORY_GRID_COLORS,
  MEMORY_GRID_SHAPES,
} from '../memory-grid/memory-grid.service';
import { SymbolPairsPage } from './symbol-pairs.page';

describe('SymbolPairsPage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates eight pairs of shuffled symbols', () => {
    const page = new SymbolPairsPage() as any;
    const symbolCounts = new Map<string, number>();

    for (const card of page.cards()) {
      symbolCounts.set(card.id, (symbolCounts.get(card.id) ?? 0) + 1);
    }

    expect(page.cards()).toHaveLength(16);
    expect(symbolCounts.size).toBe(8);
    expect([...symbolCounts.values()]).toEqual(Array.from({ length: 8 }, () => 2));
    expect(page.pairsFound()).toBe(0);
    expect(page.moves()).toBe(0);
  });

  it('uses every memory-grid color and shape', () => {
    const page = new SymbolPairsPage() as any;
    const colors = new Set(page.cards().map((card: { color: string }) => card.color));
    const shapes = new Set(page.cards().map((card: { shape: string }) => card.shape));

    expect(colors).toEqual(new Set(MEMORY_GRID_COLORS));
    expect(shapes).toEqual(new Set(MEMORY_GRID_SHAPES));
  });

  it('keeps a matching pair revealed', () => {
    const page = new SymbolPairsPage() as any;
    const [firstIndex, secondIndex] = matchingIndexes(page.cards());

    page.flipCard(firstIndex);
    page.flipCard(secondIndex);

    expect(page.isCardVisible(firstIndex)).toBe(true);
    expect(page.isCardVisible(secondIndex)).toBe(true);
    expect(page.pairsFound()).toBe(1);
    expect(page.moves()).toBe(1);
  });

  it('hides a mismatched pair after a short pause', () => {
    vi.useFakeTimers();
    const page = new SymbolPairsPage() as any;
    const firstIndex = 0;
    const secondIndex = page
      .cards()
      .findIndex((card: { id: string }) => card.id !== page.cards()[firstIndex].id);

    page.flipCard(firstIndex);
    page.flipCard(secondIndex);

    expect(page.locked()).toBe(true);
    expect(page.isCardVisible(firstIndex)).toBe(true);
    expect(page.isCardVisible(secondIndex)).toBe(true);

    vi.advanceTimersByTime(900);

    expect(page.locked()).toBe(false);
    expect(page.isCardVisible(firstIndex)).toBe(false);
    expect(page.isCardVisible(secondIndex)).toBe(false);
  });

  it('finishes after every pair is matched', () => {
    const page = new SymbolPairsPage() as any;
    const indexesBySymbol = new Map<string, number[]>();

    page.cards().forEach((card: { id: string }, index: number) => {
      indexesBySymbol.set(card.id, [...(indexesBySymbol.get(card.id) ?? []), index]);
    });

    for (const [firstIndex, secondIndex] of indexesBySymbol.values()) {
      page.flipCard(firstIndex);
      page.flipCard(secondIndex);
    }

    expect(page.isSolved()).toBe(true);
    expect(page.pairsFound()).toBe(8);
    expect(page.moves()).toBe(8);
  });
});

function matchingIndexes(cards: Array<{ id: string }>): [number, number] {
  const firstIndex = 0;
  const secondIndex = cards.findIndex(
    (card, index) => index > firstIndex && card.id === cards[firstIndex].id,
  );

  return [firstIndex, secondIndex];
}

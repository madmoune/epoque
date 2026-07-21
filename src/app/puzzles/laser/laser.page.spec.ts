import { LaserPage } from './laser.page';

describe('LaserPage', () => {
  it('limits every mirror control to itself and at most one other mirror', () => {
    const page = new LaserPage() as any;
    const controls = page.puzzle().controls as Array<{
      mirrorId: number;
      effects: Array<{ mirrorId: number }>;
    }>;
    const incomingLinks = new Map<number, number>();

    for (const control of controls) {
      const linkedMirrorIds = new Set(
        control.effects
          .map((effect) => effect.mirrorId)
          .filter((mirrorId) => mirrorId !== control.mirrorId),
      );

      expect(linkedMirrorIds.size).toBeLessThanOrEqual(1);

      for (const linkedMirrorId of linkedMirrorIds) {
        incomingLinks.set(linkedMirrorId, (incomingLinks.get(linkedMirrorId) ?? 0) + 1);
      }
    }

    expect(Math.max(...incomingLinks.values())).toBeLessThanOrEqual(1);
  });

  it('generates only puzzles whose configured solution reaches the target', () => {
    const page = new LaserPage() as any;

    for (let puzzleIndex = 0; puzzleIndex < 20; puzzleIndex += 1) {
      if (puzzleIndex > 0) {
        page.newPuzzle();
      }

      expect(page.isValidCandidate(page.puzzle())).toBe(true);
    }
  });
});

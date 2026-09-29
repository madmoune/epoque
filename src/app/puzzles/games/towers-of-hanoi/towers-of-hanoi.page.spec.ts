import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TowersOfHanoiPage } from './towers-of-hanoi.page';

describe('TowersOfHanoiPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TowersOfHanoiPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('moves disks only when the destination is legal', () => {
    const fixture = TestBed.createComponent(TowersOfHanoiPage);
    const page = fixture.componentInstance as unknown as {
      rods: () => number[][];
      moves: () => number;
      diskCount: () => number;
      startRod: () => number;
      selectRod: (rodIndex: number) => void;
    };
    const source = page.startRod();
    const target = [0, 1, 2].find((rodIndex) => rodIndex !== source)!;

    page.selectRod(source);
    page.selectRod(target);
    expect(page.rods()[source]).toHaveLength(page.diskCount() - 1);
    expect(page.rods()[target]).toEqual([1]);
    expect(page.moves()).toBe(1);

    page.selectRod(source);
    page.selectRod(target);
    expect(page.rods()[source]).toHaveLength(page.diskCount() - 1);
    expect(page.rods()[target]).toEqual([1]);
    expect(page.moves()).toBe(1);
  });

  it('creates a random challenge with four or five rings and distinct endpoints', () => {
    const fixture = TestBed.createComponent(TowersOfHanoiPage);
    const page = fixture.componentInstance as unknown as {
      diskCount: () => number;
      startRod: () => number;
      targetRod: () => number;
      rods: () => number[][];
    };

    expect([4, 5]).toContain(page.diskCount());
    expect(page.startRod()).toBeGreaterThanOrEqual(0);
    expect(page.startRod()).toBeLessThanOrEqual(2);
    expect(page.targetRod()).toBeGreaterThanOrEqual(0);
    expect(page.targetRod()).toBeLessThanOrEqual(2);
    expect(page.targetRod()).not.toBe(page.startRod());
    expect(page.rods().filter((rod) => rod.length > 0)).toHaveLength(1);
  });

  it('recognizes the optimal four-disk solution', () => {
    const fixture = TestBed.createComponent(TowersOfHanoiPage);
    const page = fixture.componentInstance as unknown as {
      selectRod: (rodIndex: number) => void;
      isSolved: () => boolean;
      moves: () => number;
      diskCount: () => number;
      startRod: () => number;
      targetRod: () => number;
    };
    const source = page.startRod();
    const target = page.targetRod();
    const auxiliary = [0, 1, 2].find((rodIndex) => rodIndex !== source && rodIndex !== target)!;
    const optimalMoves: Array<[number, number]> = [];
    const buildSolution = (count: number, from: number, to: number, spare: number): void => {
      if (count === 0) return;
      buildSolution(count - 1, from, spare, to);
      optimalMoves.push([from, to]);
      buildSolution(count - 1, spare, to, from);
    };

    buildSolution(page.diskCount(), source, target, auxiliary);

    for (const [source, target] of optimalMoves) {
      page.selectRod(source);
      page.selectRod(target);
    }

    expect(page.isSolved()).toBe(true);
    expect(page.moves()).toBe(2 ** page.diskCount() - 1);
  });

  it('restarts the same challenge and provides a legal hint', () => {
    const fixture = TestBed.createComponent(TowersOfHanoiPage);
    const page = fixture.componentInstance as unknown as {
      diskCount: () => number;
      startRod: () => number;
      targetRod: () => number;
      rods: () => number[][];
      moves: () => number;
      hintVisible: () => boolean;
      hintMove: () => { source: number; target: number; disk: number } | null;
      selectRod: (rodIndex: number) => void;
      showHint: () => void;
      restartGame: () => void;
    };
    const count = page.diskCount();
    const source = page.startRod();
    const temporaryTarget = [0, 1, 2].find((rodIndex) => rodIndex !== source)!;

    page.selectRod(source);
    page.selectRod(temporaryTarget);
    page.showHint();

    expect(page.hintVisible()).toBe(true);
    expect(page.hintMove()).not.toBeNull();
    expect(page.hintMove()?.source).toBeGreaterThanOrEqual(0);
    expect(page.hintMove()?.target).toBeGreaterThanOrEqual(0);
    expect(page.hintMove()?.source).not.toBe(page.hintMove()?.target);

    page.restartGame();

    expect(page.diskCount()).toBe(count);
    expect(page.startRod()).toBe(source);
    expect(page.rods()[source]).toEqual(Array.from({ length: count }, (_, index) => count - index));
    expect(page.rods().filter((rod) => rod.length === 0)).toHaveLength(2);
    expect(page.moves()).toBe(0);
    expect(page.hintVisible()).toBe(false);
  });
});

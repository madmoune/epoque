import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeLayersPage } from './shape-layers.page';

describe('ShapeLayersPage', () => {
  let page: any;

  beforeEach(() => {
    page = new ShapeLayersPage() as any;
  });

  it('accepts the generated solution as solved', () => {
    page.pieces.set(page.solution().map((piece: any) => ({ ...piece })));

    expect(page.isSolved()).toBe(true);
  });

  it('matches the diagonal accent triangle used by the board', () => {
    const isInsideAccent = (x: number, y: number): boolean =>
      page.isInsideAccent('diagonal', x, y);

    expect(isInsideAccent(0.3, -0.3)).toBe(true);
    expect(isInsideAccent(0.1, -0.1)).toBe(false);
    expect(isInsideAccent(-0.1, -0.4)).toBe(false);
  });
});

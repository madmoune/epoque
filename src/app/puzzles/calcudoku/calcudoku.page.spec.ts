import { CalcudokuPage } from './calcudoku.page';

describe('CalcudokuPage', () => {
  it('creates a complete 6 by 6 Latin grid and cage layout', () => {
    const page = new CalcudokuPage() as any;
    const expectedDigits = new Set([1, 2, 3, 4, 5, 6]);

    expect(page.size).toBe(6);
    expect(page.gridIndexes).toEqual([0, 1, 2, 3, 4, 5]);
    expect(page.cells()).toHaveLength(36);
    expect(
      new Set(page.cells().map((cell: { row: number; col: number }) => `${cell.row}:${cell.col}`))
        .size,
    ).toBe(36);

    for (const row of page.solution()) {
      expect(new Set(row)).toEqual(expectedDigits);
    }

    for (let col = 0; col < page.size; col += 1) {
      expect(new Set(page.solution().map((row: number[]) => row[col]))).toEqual(expectedDigits);
    }

    page.answers.set(page.solution().map((row: number[]) => row.map(String)));
    expect(page.isSolved()).toBe(true);
  });
});

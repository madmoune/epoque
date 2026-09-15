import { CalcudokuPage } from './calcudoku.page';

describe('CalcudokuPage', () => {
  it('creates a complete 5 by 5 Latin grid and cage layout', () => {
    const page = new CalcudokuPage() as any;
    const expectedDigits = new Set([1, 2, 3, 4, 5]);

    expect(page.size).toBe(5);
    expect(page.gridIndexes).toEqual([0, 1, 2, 3, 4]);
    expect(page.cells()).toHaveLength(25);
    expect(
      new Set(page.cells().map((cell: { row: number; col: number }) => `${cell.row}:${cell.col}`))
        .size,
    ).toBe(25);

    for (const row of page.solution()) {
      expect(new Set(row)).toEqual(expectedDigits);
    }

    for (let col = 0; col < page.size; col += 1) {
      expect(new Set(page.solution().map((row: number[]) => row[col]))).toEqual(expectedDigits);
    }

    page.answers.set(page.solution().map((row: number[]) => row.map(String)));
    expect(page.isSolved()).toBe(true);
  });

  it('places each cage clue in its visual top-left cell and highlights the cage', () => {
    const page = new CalcudokuPage() as any;
    const selectedCageId = page.cages()[0].id;

    for (const cage of page.cages()) {
      const cageCells = page
        .cells()
        .filter((cell: { cage: string }) => cell.cage === cage.id)
        .sort(
          (first: { row: number; col: number }, second: { row: number; col: number }) =>
            first.row - second.row || first.col - second.col,
        );

      expect(page.cageLabel(cageCells[0])).toBe(page.cageLabelFor(cage.id));
      expect(cageCells.slice(1).every((cell: object) => page.cageLabel(cell) === '')).toBe(true);
    }

    page.selectCellCage(selectedCageId);

    expect(page.selectedCageId()).toBe(selectedCageId);
    expect(page.isCageSelected(selectedCageId)).toBe(true);

    page.clearCageSelection();

    expect(page.selectedCageId()).toBe(null);
    expect(page.isCageSelected(selectedCageId)).toBe(false);
  });
});

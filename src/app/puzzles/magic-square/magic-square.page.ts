import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type MagicSquareSize = 3 | 4;

type MagicCell = {
  row: number;
  col: number;
  value: number;
  given: boolean;
};

type MagicPuzzle = {
  size: MagicSquareSize;
  cells: MagicCell[][];
  lines: MagicCell[][];
  targetSum: number;
  numberBank: number[];
};

type LineState = 'empty' | 'partial' | 'wrong' | 'correct';

const BASE_SQUARES = {
  3: [
    [8, 1, 6],
    [3, 5, 7],
    [4, 9, 2],
  ],
  4: [
    [16, 2, 3, 13],
    [5, 11, 10, 8],
    [9, 7, 6, 12],
    [4, 14, 15, 1],
  ],
};

@Component({
  selector: 'app-magic-square-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './magic-square.page.html',
  styleUrl: './magic-square.page.scss',
})
export class MagicSquarePage {
  protected readonly sizes = [3, 4] as const;
  protected readonly puzzle = signal<MagicPuzzle>(this.createPuzzle(4));
  protected readonly answers = signal<(number | null)[][]>(this.createEmptyAnswers());
  protected readonly selectedCell = signal<{ row: number; col: number } | null>(null);
  protected readonly draggedNumber = signal<number | null>(null);
  private draggedSource: { row: number; col: number } | null = null;
  private completedDrop = false;

  protected readonly availableNumbers = computed(() => {
    const usedAnswers = new Set(
      this.answers()
        .flat()
        .filter((value): value is number => value !== null),
    );

    return this.puzzle().numberBank.filter((number) => !usedAnswers.has(number));
  });

  protected readonly isSolved = computed(
    () => this.isGridFilled() && this.lineStates().every((state) => state === 'correct'),
  );

  protected readonly lineStates = computed<LineState[]>(() => {
    const { lines, targetSum } = this.puzzle();
    return lines.map((line) => {
      const values = line.map(({ row, col }) => this.cellValue(row, col));

      if (values.every((value) => value === null)) return 'empty';
      if (values.some((value) => value === null)) return 'partial';

      return values.reduce<number>((sum, value) => sum + (value ?? 0), 0) === targetSum
        ? 'correct'
        : 'wrong';
    });
  });

  protected setSize(size: MagicSquareSize): void {
    if (this.puzzle().size === size) return;

    this.newPuzzle(size);
  }

  protected newPuzzle(size = this.puzzle().size): void {
    this.puzzle.set(this.createPuzzle(size));
    this.resetPuzzle();
  }

  protected resetPuzzle(): void {
    this.answers.set(this.createEmptyAnswers());
    this.selectedCell.set(null);
    this.draggedNumber.set(null);
    this.draggedSource = null;
    this.completedDrop = false;
  }

  protected selectCell(row: number, col: number): void {
    if (this.puzzle().cells[row][col].given) return;
    this.selectedCell.set({ row, col });
  }

  protected placeNumber(number: number): void {
    const selectedCell = this.selectedCell();
    if (!selectedCell) return;

    this.placeNumberAt(selectedCell.row, selectedCell.col, number, null);
  }

  protected placeNumberAt(
    row: number,
    col: number,
    number: number,
    source: { row: number; col: number } | null,
  ): void {
    if (this.puzzle().cells[row][col].given) return;
    if (!source && !this.availableNumbers().includes(number)) return;
    if (source?.row === row && source.col === col) return;

    this.answers.update((answers) =>
      answers.map((answerRow, rowIndex) => {
        if (source && rowIndex === source.row) {
          answerRow = answerRow.map((answer, answerCol) =>
            answerCol === source.col ? null : answer,
          );
        }

        if (rowIndex === row) {
          return answerRow.map((answer, answerCol) => (answerCol === col ? number : answer));
        }

        return answerRow;
      }),
    );
    this.selectedCell.set({ row, col });
  }

  protected clearSelectedCell(): void {
    const selectedCell = this.selectedCell();
    if (!selectedCell) return;

    this.answers.update((answers) =>
      answers.map((answerRow, row) =>
        row === selectedCell.row
          ? answerRow.map((answer, col) => (col === selectedCell.col ? null : answer))
          : answerRow,
      ),
    );
  }

  protected placeHint(): void {
    if (this.isSolved()) return;

    const hintCell = this.puzzle()
      .cells.flat()
      .find((cell) => !cell.given && this.cellValue(cell.row, cell.col) !== cell.value);

    if (!hintCell) return;

    this.answers.update((answers) =>
      answers.map((answerRow, row) =>
        answerRow.map((answer, col) => {
          if (row === hintCell.row && col === hintCell.col) {
            return hintCell.value;
          }

          return answer === hintCell.value ? null : answer;
        }),
      ),
    );
    this.selectedCell.set({ row: hintCell.row, col: hintCell.col });
  }

  protected beginDrag(number: number, event: DragEvent): void {
    if (!this.availableNumbers().includes(number)) return;

    this.draggedNumber.set(number);
    this.draggedSource = null;
    this.completedDrop = false;
    event.dataTransfer?.setData('text/plain', String(number));
    event.dataTransfer?.setDragImage(event.target as Element, 18, 18);
  }

  protected beginPointerDrag(number: number, event: PointerEvent): void {
    if (!this.availableNumbers().includes(number)) return;

    this.draggedNumber.set(number);
    this.draggedSource = null;
    this.completedDrop = false;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  protected beginCellDrag(row: number, col: number, event: DragEvent): void {
    const number = this.cellValue(row, col);
    if (this.puzzle().cells[row][col].given || number === null) return;

    this.draggedNumber.set(number);
    this.draggedSource = { row, col };
    this.completedDrop = false;
    event.dataTransfer?.setData('text/plain', String(number));
    event.dataTransfer?.setDragImage(event.target as Element, 24, 24);
  }

  protected beginCellPointerDrag(row: number, col: number, event: PointerEvent): void {
    const number = this.cellValue(row, col);
    if (this.puzzle().cells[row][col].given || number === null) return;

    this.draggedNumber.set(number);
    this.draggedSource = { row, col };
    this.completedDrop = false;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  protected endDrag(): void {
    if (this.draggedSource && !this.completedDrop) {
      this.clearCell(this.draggedSource.row, this.draggedSource.col);
    }

    this.draggedNumber.set(null);
    this.draggedSource = null;
    this.completedDrop = false;
  }

  @HostListener('document:pointerup', ['$event'])
  protected endPointerDrag(event: PointerEvent): void {
    const number = this.draggedNumber();
    if (number === null) return;

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target instanceof HTMLElement ? target.closest<HTMLElement>('.number-cell') : null;

    if (cell?.dataset['row'] !== undefined && cell.dataset['col'] !== undefined) {
      this.placeNumberAt(
        Number(cell.dataset['row']),
        Number(cell.dataset['col']),
        number,
        this.draggedSource,
      );
    } else if (this.draggedSource) {
      this.clearCell(this.draggedSource.row, this.draggedSource.col);
    }

    this.draggedNumber.set(null);
    this.draggedSource = null;
    this.completedDrop = false;
  }

  protected allowDrop(row: number, col: number, event: DragEvent): void {
    if (this.puzzle().cells[row][col].given) return;
    event.preventDefault();
  }

  protected dropNumber(row: number, col: number, event: DragEvent): void {
    event.preventDefault();
    const number = Number(event.dataTransfer?.getData('text/plain') || this.draggedNumber());
    if (Number.isNaN(number)) return;

    this.placeNumberAt(row, col, number, this.draggedSource);
    this.completedDrop = true;
    this.draggedNumber.set(null);
    this.draggedSource = null;
  }

  private clearCell(row: number, col: number): void {
    if (this.puzzle().cells[row][col].given) return;

    this.answers.update((answers) =>
      answers.map((answerRow, rowIndex) =>
        rowIndex === row
          ? answerRow.map((answer, answerCol) => (answerCol === col ? null : answer))
          : answerRow,
      ),
    );
  }

  protected cellValue(row: number, col: number): number | null {
    const cell = this.puzzle().cells[row][col];
    return cell.given ? cell.value : this.answers()[row][col];
  }

  protected cellState(row: number, col: number): 'selected' | 'wrong' | 'correct' | null {
    const selected = this.selectedCell();
    if (selected?.row === row && selected.col === col) return 'selected';
    if (this.puzzle().cells[row][col].given) return null;
    if (this.cellValue(row, col) === null) return null;

    return this.isCellInWrongCompletedLine(row, col) ? 'wrong' : 'correct';
  }

  protected rowState(row: number): LineState {
    return this.lineStates()[row];
  }

  protected columnState(col: number): LineState {
    return this.lineStates()[this.puzzle().size + col];
  }

  protected diagonalState(index: 0 | 1): LineState {
    return this.lineStates()[2 * this.puzzle().size + index];
  }

  private createPuzzle(size: MagicSquareSize): MagicPuzzle {
    const offset = this.randomInt(0, 15);
    const cells = this.transformSquare(BASE_SQUARES[size]).map((row, rowIndex) =>
      row.map((value, colIndex) => ({
        row: rowIndex,
        col: colIndex,
        value: value + offset,
        given: false,
      })),
    );
    const lines = [
      ...cells,
      ...cells[0].map((_, col) => cells.map((row) => row[col])),
      cells.map((row, index) => row[index]),
      cells.map((row, index) => row[size - 1 - index]),
    ];

    const allCells = cells.flat();
    this.setGivenCells(allCells, lines, size);
    const solutionNumbers = allCells.map((cell) => cell.value);
    const missingNumbers = allCells.filter((cell) => !cell.given).map((cell) => cell.value);

    return {
      size,
      cells,
      lines,
      targetSum: cells[0].reduce((sum, cell) => sum + cell.value, 0),
      numberBank: this.shuffle([...missingNumbers, ...this.createDistractors(solutionNumbers)]),
    };
  }

  private isGridFilled(): boolean {
    return this.puzzle().cells.every((row) =>
      row.every((cell) => this.cellValue(cell.row, cell.col) !== null),
    );
  }

  private isCellInWrongCompletedLine(row: number, col: number): boolean {
    const { cells, lines } = this.puzzle();
    const states = this.lineStates();
    return lines.some((line, index) => states[index] === 'wrong' && line.includes(cells[row][col]));
  }

  private setGivenCells(cells: MagicCell[], lines: MagicCell[][], size: MagicSquareSize): void {
    const givenCount = size === 3 ? this.randomInt(1, 3) : this.randomInt(4, 6);
    const maxGivensPerLine = size === 3 ? 1 : size - 1;
    const shuffledCells = this.shuffle(cells);

    // A locally valid clue can block the remaining choices, such as the center of a 3×3.
    const placeGivens = (start: number, remaining: number): boolean => {
      if (remaining === 0) return true;

      for (let index = start; index <= shuffledCells.length - remaining; index += 1) {
        const cell = shuffledCells[index];
        cell.given = true;
        if (
          lines.every(
            (line) => line.filter((candidate) => candidate.given).length <= maxGivensPerLine,
          ) &&
          placeGivens(index + 1, remaining - 1)
        ) {
          return true;
        }
        cell.given = false;
      }
      return false;
    };

    placeGivens(0, givenCount);
  }

  private createDistractors(solutionNumbers: number[]): number[] {
    const solutionSet = new Set(solutionNumbers);
    const distractors: number[] = [];
    const min = Math.min(...solutionNumbers);
    const max = Math.max(...solutionNumbers);

    while (distractors.length < 3) {
      const candidate = this.randomInt(Math.max(1, min - 5), max + 6);

      if (!solutionSet.has(candidate) && !distractors.includes(candidate)) {
        distractors.push(candidate);
      }
    }

    return distractors;
  }

  private transformSquare(square: number[][]): number[][] {
    let transformed = square.map((row) => [...row]);
    const rotations = this.randomInt(0, 3);

    for (let count = 0; count < rotations; count += 1) {
      transformed = transformed[0].map((_, col) => transformed.map((row) => row[col]).reverse());
    }

    if (Math.random() < 0.5) {
      transformed = transformed.map((row) => [...row].reverse());
    }

    return transformed;
  }

  private createEmptyAnswers(): (number | null)[][] {
    return this.puzzle().cells.map((row) => row.map(() => null));
  }

  private randomInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  private shuffle<T>(items: T[]): T[] {
    return [...items].sort(() => Math.random() - 0.5);
  }
}

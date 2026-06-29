import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type MagicCell = {
  row: number;
  col: number;
  value: number;
  given: boolean;
};

type MagicPuzzle = {
  cells: MagicCell[][];
  targetSum: number;
  numberBank: number[];
};

type LineState = 'empty' | 'partial' | 'wrong' | 'correct';

const BASE_SQUARE = [
  [8, 1, 6],
  [3, 5, 7],
  [4, 9, 2],
];

const LINES = [
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
] as const;

@Component({
  selector: 'app-magic-square-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './magic-square.page.html',
  styleUrl: './magic-square.page.scss',
})
export class MagicSquarePage {
  protected readonly puzzle = signal<MagicPuzzle>(this.createPuzzle());
  protected readonly answers = signal<(number | null)[][]>(this.createEmptyAnswers());
  protected readonly selectedCell = signal<{ row: number; col: number } | null>(null);
  protected readonly draggedNumber = signal<number | null>(null);
  protected readonly hasChecked = signal(false);
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

  protected readonly isSolved = computed(() =>
    this.puzzle().cells.every((row) =>
      row.every((cell) => this.cellValue(cell.row, cell.col) === cell.value),
    ),
  );

  protected readonly lineStates = computed<LineState[]>(() =>
    LINES.map((line) => {
      const values = line.map(([row, col]) => this.cellValue(row, col));

      if (values.every((value) => value === null)) return 'empty';
      if (values.some((value) => value === null)) return 'partial';

      return values.reduce<number>((sum, value) => sum + (value ?? 0), 0) ===
        this.puzzle().targetSum
        ? 'correct'
        : 'wrong';
    }),
  );

  protected newPuzzle(): void {
    this.puzzle.set(this.createPuzzle());
    this.answers.set(this.createEmptyAnswers());
    this.selectedCell.set(null);
    this.draggedNumber.set(null);
    this.draggedSource = null;
    this.hasChecked.set(false);
  }

  protected resetPuzzle(): void {
    this.answers.set(this.createEmptyAnswers());
    this.selectedCell.set(null);
    this.draggedNumber.set(null);
    this.draggedSource = null;
    this.hasChecked.set(false);
  }

  protected selectCell(row: number, col: number): void {
    if (this.puzzle().cells[row][col].given) return;
    this.selectedCell.set({ row, col });
  }

  protected placeNumber(number: number): void {
    const selectedCell = this.selectedCell();
    if (!selectedCell) return;

    this.placeNumberAt(selectedCell.row, selectedCell.col, number, null);
    this.selectNextEmptyCell(selectedCell.row, selectedCell.col);
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
    this.hasChecked.set(false);
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
    this.hasChecked.set(false);
  }

  protected checkPuzzle(): void {
    this.hasChecked.set(true);
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
    this.hasChecked.set(false);
  }

  protected cellValue(row: number, col: number): number | null {
    const cell = this.puzzle().cells[row][col];
    return cell.given ? cell.value : this.answers()[row][col];
  }

  protected cellState(row: number, col: number): 'selected' | 'wrong' | 'correct' | null {
    const selected = this.selectedCell();
    if (selected?.row === row && selected.col === col) return 'selected';
    if (!this.hasChecked() || this.puzzle().cells[row][col].given) return null;

    return this.cellValue(row, col) === this.puzzle().cells[row][col].value ? 'correct' : 'wrong';
  }

  protected rowState(row: number): LineState {
    return this.lineStates()[row];
  }

  protected columnState(col: number): LineState {
    return this.lineStates()[3 + col];
  }

  protected diagonalState(index: 0 | 1): LineState {
    return this.lineStates()[6 + index];
  }

  private createPuzzle(): MagicPuzzle {
    const offset = this.randomInt(0, 15);
    const transformed = this.transformSquare(BASE_SQUARE).map((row) =>
      row.map((value) => value + offset),
    );
    const givenCount = Math.random() < 0.35 ? 2 : 3;
    const givenPositions = new Set(this.createGivenPositions(givenCount));
    const cells = transformed.map((row, rowIndex) =>
      row.map((value, colIndex) => ({
        row: rowIndex,
        col: colIndex,
        value,
        given: givenPositions.has(this.positionKey(rowIndex, colIndex)),
      })),
    );

    const solutionNumbers = transformed.flat();
    const missingNumbers = solutionNumbers.filter((value, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return !givenPositions.has(this.positionKey(row, col));
    });

    return {
      cells,
      targetSum: 15 + offset * 3,
      numberBank: this.shuffle([...missingNumbers, ...this.createDistractors(solutionNumbers)]),
    };
  }

  private createGivenPositions(count: number): string[] {
    const positions = this.shuffle(this.createPositions());
    const selected: string[] = [];

    for (const position of positions) {
      const candidate = [...selected, position];

      if (this.hasLineWithTwoGivenCells(candidate)) continue;

      selected.push(position);
      if (selected.length === count) return selected;
    }

    return selected;
  }

  private hasLineWithTwoGivenCells(positions: string[]): boolean {
    const selected = new Set(positions);

    return LINES.some(
      (line) => line.filter(([row, col]) => selected.has(this.positionKey(row, col))).length >= 2,
    );
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

  private selectNextEmptyCell(row: number, col: number): void {
    const positions = this.createPositions();
    const currentIndex = positions.indexOf(this.positionKey(row, col));
    const nextPosition = positions
      .slice(currentIndex + 1)
      .concat(positions.slice(0, currentIndex))
      .find((position) => {
        const [nextRow, nextCol] = position.split(':').map(Number);
        return (
          !this.puzzle().cells[nextRow][nextCol].given && this.answers()[nextRow][nextCol] === null
        );
      });

    if (!nextPosition) return;

    const [nextRow, nextCol] = nextPosition.split(':').map(Number);
    this.selectedCell.set({ row: nextRow, col: nextCol });
  }

  private createEmptyAnswers(): (number | null)[][] {
    return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null));
  }

  private createPositions(): string[] {
    return Array.from({ length: 9 }, (_, index) =>
      this.positionKey(Math.floor(index / 3), index % 3),
    );
  }

  private positionKey(row: number, col: number): string {
    return `${row}:${col}`;
  }

  private randomInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  private shuffle<T>(items: T[]): T[] {
    return [...items].sort(() => Math.random() - 0.5);
  }
}

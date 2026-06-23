import { Component, HostListener, computed, ElementRef, QueryList, signal, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type LatinSquareSize = 4 | 5;

type LatinSquareCell = {
  row: number;
  col: number;
  value: number;
  given: boolean;
};

type LatinSquarePuzzle = {
  size: LatinSquareSize;
  cells: LatinSquareCell[][];
};

@Component({
  selector: 'app-latin-square-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './latin-square.page.html',
  styleUrl: './latin-square.page.scss',
})
export class LatinSquarePage {
  @ViewChildren('answerField')
  private readonly answerFields!: QueryList<ElementRef<HTMLInputElement>>;

  protected readonly selectedSize = signal<LatinSquareSize>(4);
  protected readonly puzzle = signal<LatinSquarePuzzle>(this.createPuzzle(4));
  protected readonly answers = signal<string[][]>(this.createEmptyAnswers(4));
  protected readonly hintedPositions = signal<Set<string>>(new Set());
  protected readonly hasChecked = signal(false);
  protected readonly activeCell = signal<{ row: number; col: number } | null>(null);

  protected readonly symbols = computed(() => this.createSymbols(this.selectedSize()));
  protected readonly numberKeyboardRows = computed<CustomKeyboardKey[][]>(() => [
    this.symbols().map((symbol) => String(symbol)),
    ['backspace'],
  ]);
  protected readonly gridTemplateColumns = computed(
    () => `repeat(${this.puzzle().size}, minmax(0, var(--latin-cell-size)))`,
  );

  protected readonly isSolved = computed(() => {
    const values = this.enteredValues();

    return values !== null && this.isValidLatinSquare(values);
  });

  protected readonly hasAvailableHint = computed(() =>
    this.puzzle().cells.some((row) =>
      row.some((cell) => !cell.given && !this.isHinted(cell.row, cell.col)),
    ),
  );

  protected setSize(size: LatinSquareSize): void {
    if (this.selectedSize() === size) {
      return;
    }

    this.selectedSize.set(size);
    this.newPuzzle(size);
  }

  protected newPuzzle(size = this.selectedSize()): void {
    this.puzzle.set(this.createPuzzle(size));
    this.answers.set(this.createEmptyAnswers(size));
    this.hintedPositions.set(new Set());
    this.hasChecked.set(false);
    window.setTimeout(() => this.answerFields.first?.nativeElement.focus());
  }

  protected resetGrid(): void {
    const answers = this.createEmptyAnswers(this.puzzle().size);

    for (const position of this.hintedPositions()) {
      const [row, col] = position.split(':').map(Number);
      answers[row][col] = String(this.puzzle().cells[row][col].value);
    }

    this.answers.set(answers);
    this.hasChecked.set(false);
  }

  protected updateAnswer(row: number, col: number, value: string): void {
    if (this.isHinted(row, col)) {
      return;
    }

    const cleanValue = this.cleanAnswer(value);

    this.answers.update((answers) =>
      answers.map((answerRow, rowIndex) =>
        rowIndex === row
          ? answerRow.map((answer, colIndex) => (colIndex === col ? cleanValue : answer))
          : answerRow,
      ),
    );
    this.hasChecked.set(false);
  }

  protected activateInput(row: number, col: number, event: Event): void {
    this.activeCell.set({ row, col });

    if (event.target instanceof HTMLInputElement) {
      event.target.select();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('.number-cell input') || target.closest('app-custom-keyboard')) return;
    this.activeCell.set(null);
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    const activeCell = this.activeCell();
    if (!activeCell || this.isHinted(activeCell.row, activeCell.col)) return;

    if (key === 'backspace') {
      this.updateAnswer(activeCell.row, activeCell.col, '');
      return;
    }

    if (key === 'space') return;

    this.updateAnswer(activeCell.row, activeCell.col, key);
    this.focusNextInput(activeCell.row, activeCell.col);
  }

  protected checkPuzzle(): void {
    this.hasChecked.set(true);
  }

  protected cellAnswer(row: number, col: number): string {
    return this.answers()[row]?.[col] ?? '';
  }

  protected showHint(): void {
    const hintCell = this.findHintCell();

    if (!hintCell) {
      return;
    }

    this.answers.update((answers) =>
      answers.map((answerRow, rowIndex) =>
        rowIndex === hintCell.row
          ? answerRow.map((answer, colIndex) =>
              colIndex === hintCell.col ? String(hintCell.value) : answer,
            )
          : answerRow,
      ),
    );
    this.hintedPositions.update(
      (positions) => new Set([...positions, this.positionKey(hintCell.row, hintCell.col)]),
    );
    this.hasChecked.set(false);
  }

  protected isHinted(row: number, col: number): boolean {
    return this.hintedPositions().has(this.positionKey(row, col));
  }

  private focusNextInput(row: number, col: number): void {
    const inputs = this.answerFields.toArray().map((input) => input.nativeElement);
    const currentInput = inputs.find(
      (input) => input.dataset['row'] === String(row) && input.dataset['col'] === String(col),
    );

    if (!currentInput) return;

    const currentIndex = inputs.indexOf(currentInput);
    const nextInput = inputs[currentIndex + 1];
    if (!nextInput) return;

    window.setTimeout(() => {
      nextInput.focus();
      nextInput.select();
      this.activeCell.set({
        row: Number(nextInput.dataset['row']),
        col: Number(nextInput.dataset['col']),
      });
    });
  }

  private createPuzzle(size: LatinSquareSize): LatinSquarePuzzle {
    const targetGivens = size === 4 ? 4 : 7;
    let bestPuzzle = this.createPuzzleCandidate(size, targetGivens);

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const puzzle = this.createPuzzleCandidate(size, targetGivens);

      if (this.givenCount(puzzle) < this.givenCount(bestPuzzle)) {
        bestPuzzle = puzzle;
      }

      if (this.givenCount(bestPuzzle) <= targetGivens) {
        return bestPuzzle;
      }
    }

    return bestPuzzle;
  }

  private createPuzzleCandidate(size: LatinSquareSize, targetGivens: number): LatinSquarePuzzle {
    const solution = this.createSolution(size);
    const givenPositions = new Set(
      Array.from({ length: size * size }, (_, index) =>
        this.positionKey(Math.floor(index / size), index % size),
      ),
    );

    for (const position of this.shuffle([...givenPositions])) {
      if (givenPositions.size <= targetGivens) {
        break;
      }

      givenPositions.delete(position);

      if (this.countSolutions(solution, givenPositions) !== 1) {
        givenPositions.add(position);
      }
    }

    return {
      size,
      cells: solution.map((row, rowIndex) =>
        row.map((value, colIndex) => ({
          row: rowIndex,
          col: colIndex,
          value,
          given: givenPositions.has(this.positionKey(rowIndex, colIndex)),
        })),
      ),
    };
  }

  private givenCount(puzzle: LatinSquarePuzzle): number {
    return puzzle.cells.flat().filter((cell) => cell.given).length;
  }

  private createSolution(size: LatinSquareSize): number[][] {
    const rowOrder = this.shuffle(this.createIndexes(size));
    const colOrder = this.shuffle(this.createIndexes(size));
    const symbols = this.shuffle(this.createSymbols(size));

    return rowOrder.map((rowValue) =>
      colOrder.map((colValue) => symbols[(rowValue + colValue) % size]),
    );
  }

  private findHintCell(): LatinSquareCell | null {
    const emptyCells = this.puzzle()
      .cells.flat()
      .filter(
        (cell) =>
          !cell.given &&
          !this.isHinted(cell.row, cell.col) &&
          this.cellAnswer(cell.row, cell.col).trim().length === 0,
      );

    if (emptyCells.length > 0) {
      return emptyCells[this.randomInt(0, emptyCells.length - 1)];
    }

    const unlockedCells = this.puzzle()
      .cells.flat()
      .filter((cell) => !cell.given && !this.isHinted(cell.row, cell.col));

    if (unlockedCells.length === 0) {
      return null;
    }

    return unlockedCells[this.randomInt(0, unlockedCells.length - 1)];
  }

  private enteredValues(): number[][] | null {
    const puzzle = this.puzzle();
    const values: number[][] = [];

    for (const row of puzzle.cells) {
      const valueRow: number[] = [];

      for (const cell of row) {
        if (cell.given) {
          valueRow.push(cell.value);
          continue;
        }

        const answer = this.cellAnswer(cell.row, cell.col).trim();

        if (answer.length === 0) {
          return null;
        }

        const numericAnswer = Number(answer);

        if (!this.createSymbols(puzzle.size).includes(numericAnswer)) {
          return null;
        }

        valueRow.push(numericAnswer);
      }

      values.push(valueRow);
    }

    return values;
  }

  private isValidLatinSquare(values: number[][]): boolean {
    const size = values.length;
    const symbols = this.createSymbols(size as LatinSquareSize);

    return (
      values.every((row) => this.hasAllSymbols(row, symbols)) &&
      symbols.every((_, colIndex) =>
        this.hasAllSymbols(
          values.map((row) => row[colIndex]),
          symbols,
        ),
      )
    );
  }

  private countSolutions(solution: number[][], givenPositions: Set<string>): number {
    const size = solution.length as LatinSquareSize;
    const symbols = this.createSymbols(size);
    const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
    const rowUsed = Array.from({ length: size }, () => new Set<number>());
    const colUsed = Array.from({ length: size }, () => new Set<number>());
    let solutionCount = 0;

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!givenPositions.has(this.positionKey(row, col))) {
          continue;
        }

        const value = solution[row][col];

        grid[row][col] = value;
        rowUsed[row].add(value);
        colUsed[col].add(value);
      }
    }

    const search = (): void => {
      if (solutionCount > 1) {
        return;
      }

      const nextCell = this.findNextEmptyCell(grid, rowUsed, colUsed, symbols);

      if (!nextCell) {
        solutionCount += 1;
        return;
      }

      const { row, col, candidates } = nextCell;

      for (const value of candidates) {
        grid[row][col] = value;
        rowUsed[row].add(value);
        colUsed[col].add(value);

        search();

        grid[row][col] = 0;
        rowUsed[row].delete(value);
        colUsed[col].delete(value);
      }
    };

    search();

    return solutionCount;
  }

  private findNextEmptyCell(
    grid: number[][],
    rowUsed: Set<number>[],
    colUsed: Set<number>[],
    symbols: number[],
  ): { row: number; col: number; candidates: number[] } | null {
    let bestCell: { row: number; col: number; candidates: number[] } | null = null;

    for (let row = 0; row < grid.length; row += 1) {
      for (let col = 0; col < grid.length; col += 1) {
        if (grid[row][col] !== 0) {
          continue;
        }

        const candidates = symbols.filter(
          (symbol) => !rowUsed[row].has(symbol) && !colUsed[col].has(symbol),
        );

        if (!bestCell || candidates.length < bestCell.candidates.length) {
          bestCell = { row, col, candidates };
        }
      }
    }

    return bestCell;
  }

  private cleanAnswer(value: string): string {
    const digit = value.replace(/\D/g, '').slice(-1);
    const numericDigit = Number(digit);

    if (!this.createSymbols(this.selectedSize()).includes(numericDigit)) {
      return '';
    }

    return digit;
  }

  private hasAllSymbols(values: number[], symbols: number[]): boolean {
    return (
      symbols.every((symbol) => values.includes(symbol)) && new Set(values).size === symbols.length
    );
  }

  private createEmptyAnswers(size: LatinSquareSize): string[][] {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
  }

  private createIndexes(size: LatinSquareSize): number[] {
    return Array.from({ length: size }, (_, index) => index);
  }

  private createSymbols(size: LatinSquareSize): number[] {
    return Array.from({ length: size }, (_, index) => index + 1);
  }

  private positionKey(row: number, col: number): string {
    return `${row}:${col}`;
  }

  private shuffle<T>(values: T[]): T[] {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swapIndex = this.randomInt(0, index);
      [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }

    return values;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

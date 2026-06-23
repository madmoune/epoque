import { Component, HostListener, computed, ElementRef, QueryList, signal, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type CrossmathSize = 3 | 4;
type CrossmathOperator = '+' | '-' | '×';

type CrossmathCell = {
  row: number;
  col: number;
  value: number;
  given: boolean;
};

type CrossmathPuzzle = {
  size: CrossmathSize;
  cells: CrossmathCell[][];
  rowOperators: CrossmathOperator[][];
  columnOperators: CrossmathOperator[][];
  rowTargets: number[];
  columnTargets: number[];
};

const CROSSMATH_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

@Component({
  selector: 'app-crossmath-page',
  imports: [FormsModule, RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './crossmath.page.html',
  styleUrl: './crossmath.page.scss',
})
export class CrossmathPage {
  @ViewChildren('answerField')
  private readonly answerFields!: QueryList<ElementRef<HTMLInputElement>>;

  protected readonly selectedSize = signal<CrossmathSize>(3);
  protected readonly puzzle = signal<CrossmathPuzzle>(this.createPuzzle(3));
  protected readonly answers = signal<string[][]>(this.createEmptyAnswers(3));
  protected readonly hintedPositions = signal<Set<string>>(new Set());
  protected readonly hasChecked = signal(false);
  protected readonly activeCell = signal<{ row: number; col: number } | null>(null);
  protected readonly numberKeyboardRows: CustomKeyboardKey[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['backspace'],
  ];

  protected readonly gridTemplateColumns = computed(() => {
    const columns: string[] = [];

    for (let index = 0; index < this.puzzle().size; index += 1) {
      columns.push('var(--crossmath-number-cell-size)');

      if (index < this.puzzle().size - 1) {
        columns.push('var(--crossmath-operator-cell-size)');
      }
    }

    columns.push('var(--crossmath-operator-cell-size)', 'var(--crossmath-target-cell-size)');
    return columns.join(' ');
  });

  protected readonly isCorrect = computed(() => {
    const values = this.enteredValues();
    const puzzle = this.puzzle();

    if (!values) {
      return false;
    }

    const rowsAreCorrect = puzzle.rowTargets.every(
      (target, rowIndex) =>
        this.evaluate(values[rowIndex], puzzle.rowOperators[rowIndex]) === target,
    );
    const columnsAreCorrect = puzzle.columnTargets.every((target, colIndex) => {
      const columnValues = values.map((row) => row[colIndex]);

      return this.evaluate(columnValues, puzzle.columnOperators[colIndex]) === target;
    });

    return rowsAreCorrect && columnsAreCorrect;
  });

  protected readonly hasAvailableHint = computed(() =>
    this.puzzle().cells.some((row) =>
      row.some((cell) => !cell.given && !this.isHinted(cell.row, cell.col)),
    ),
  );

  protected setSize(size: CrossmathSize): void {
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

    const cleanValue = value.replace(/[^1-9]/g, '').slice(0, 1);

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

  private createPuzzle(size: CrossmathSize): CrossmathPuzzle {
    const searchConfigs =
      size === 3
        ? [
            { minGivens: 2, maxGivens: 3, maxLineGivens: 1, attempts: 300 },
            { minGivens: 4, maxGivens: 5, maxLineGivens: 2, attempts: 200 },
          ]
        : [
            { minGivens: 5, maxGivens: 7, maxLineGivens: 2, attempts: 450 },
            { minGivens: 8, maxGivens: 9, maxLineGivens: 2, attempts: 250 },
          ];

    for (const config of searchConfigs) {
      for (let givenCount = config.minGivens; givenCount <= config.maxGivens; givenCount += 1) {
        for (let attempt = 0; attempt < config.attempts; attempt += 1) {
          const puzzle = this.createPuzzleCandidate(size, givenCount, config.maxLineGivens);

          if (this.countSolutions(puzzle) === 1) {
            return puzzle;
          }
        }
      }
    }

    return this.createPuzzleCandidate(size, size * size - 1, size - 1);
  }

  private createPuzzleCandidate(
    size: CrossmathSize,
    givenCount: number,
    maxLineGivens: number,
  ): CrossmathPuzzle {
    const values = this.createSolutionValues(size);
    const rowOperators = Array.from({ length: size }, () => this.createOperators(size));
    const columnOperators = Array.from({ length: size }, () => this.createOperators(size));
    const givenPositions = this.pickGivenPositions(size, givenCount, maxLineGivens);

    const cells = values.map((row, rowIndex) =>
      row.map((value, colIndex) => ({
        row: rowIndex,
        col: colIndex,
        value,
        given: givenPositions.has(this.positionKey(rowIndex, colIndex)),
      })),
    );

    return {
      size,
      cells,
      rowOperators,
      columnOperators,
      rowTargets: values.map((row, rowIndex) => this.evaluate(row, rowOperators[rowIndex])),
      columnTargets: values[0].map((_, colIndex) =>
        this.evaluate(
          values.map((row) => row[colIndex]),
          columnOperators[colIndex],
        ),
      ),
    };
  }

  private findHintCell(): CrossmathCell | null {
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

  private createSolutionValues(size: CrossmathSize): number[][] {
    return Array.from({ length: size }, () =>
      Array.from(
        { length: size },
        () => CROSSMATH_DIGITS[this.randomInt(0, CROSSMATH_DIGITS.length - 1)],
      ),
    );
  }

  private createOperators(size: CrossmathSize): CrossmathOperator[] {
    const operators: CrossmathOperator[] = ['+', '-', '×'];

    return Array.from(
      { length: size - 1 },
      () => operators[this.randomInt(0, operators.length - 1)],
    );
  }

  private createEmptyAnswers(size: CrossmathSize): string[][] {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
  }

  private pickGivenPositions(
    size: CrossmathSize,
    count: number,
    maxLineGivens: number,
  ): Set<string> {
    const positions = Array.from({ length: size * size }, (_, index) =>
      this.positionKey(Math.floor(index / size), index % size),
    );

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const shuffledPositions = this.shuffle([...positions]);
      const selectedPositions: string[] = [];
      const rowCounts = Array.from({ length: size }, () => 0);
      const columnCounts = Array.from({ length: size }, () => 0);

      for (const position of shuffledPositions) {
        const [row, col] = position.split(':').map(Number);

        if (rowCounts[row] >= maxLineGivens || columnCounts[col] >= maxLineGivens) {
          continue;
        }

        selectedPositions.push(position);
        rowCounts[row] += 1;
        columnCounts[col] += 1;

        if (selectedPositions.length === count) {
          return new Set(selectedPositions);
        }
      }
    }

    return new Set(this.shuffle(positions).slice(0, count));
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

        if (!CROSSMATH_DIGITS.includes(numericAnswer)) {
          return null;
        }

        valueRow.push(numericAnswer);
      }

      values.push(valueRow);
    }

    return values;
  }

  private evaluate(values: number[], operators: CrossmathOperator[]): number {
    return operators.reduce((total, operator, index) => {
      const nextValue = values[index + 1];

      if (operator === '+') {
        return total + nextValue;
      }

      if (operator === '-') {
        return total - nextValue;
      }

      return total * nextValue;
    }, values[0]);
  }

  private countSolutions(puzzle: CrossmathPuzzle): number {
    const rowCandidates = puzzle.cells.map((row, rowIndex) =>
      this.createRowCandidates(row, puzzle.rowOperators[rowIndex], puzzle.rowTargets[rowIndex]),
    );
    const selectedRows: number[][] = [];
    let solutionCount = 0;

    const search = (rowIndex: number): void => {
      if (solutionCount > 1) {
        return;
      }

      if (rowIndex === puzzle.size) {
        const columnsAreCorrect = puzzle.columnTargets.every((target, colIndex) => {
          const columnValues = selectedRows.map((row) => row[colIndex]);

          return this.evaluate(columnValues, puzzle.columnOperators[colIndex]) === target;
        });

        if (columnsAreCorrect) {
          solutionCount += 1;
        }

        return;
      }

      for (const candidate of rowCandidates[rowIndex]) {
        selectedRows[rowIndex] = candidate;
        search(rowIndex + 1);
      }

      selectedRows.pop();
    };

    search(0);

    return solutionCount;
  }

  private createRowCandidates(
    row: CrossmathCell[],
    operators: CrossmathOperator[],
    target: number,
  ): number[][] {
    const candidates: number[][] = [];
    const currentValues: number[] = [];

    const search = (colIndex: number): void => {
      if (colIndex === row.length) {
        if (this.evaluate(currentValues, operators) === target) {
          candidates.push([...currentValues]);
        }

        return;
      }

      const cell = row[colIndex];
      const possibleValues = cell.given ? [cell.value] : CROSSMATH_DIGITS;

      for (const value of possibleValues) {
        currentValues[colIndex] = value;
        search(colIndex + 1);
      }

      currentValues.pop();
    };

    search(0);

    return candidates;
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

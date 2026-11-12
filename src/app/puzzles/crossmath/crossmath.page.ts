import {
  Component,
  HostListener,
  computed,
  ElementRef,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
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
  imports: [RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './crossmath.page.html',
  styleUrl: './crossmath.page.scss',
})
export class CrossmathPage {
  @ViewChildren('answerField')
  private readonly answerFields!: QueryList<ElementRef<HTMLInputElement>>;
  private suppressNextSelection = false;

  protected readonly selectedSize = signal<CrossmathSize>(4);
  protected readonly puzzle = signal<CrossmathPuzzle>(this.createPuzzle(4));
  protected readonly answers = signal<string[][]>(this.createEmptyAnswers(4));
  protected readonly hintedPositions = signal<Set<string>>(new Set());
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
    window.setTimeout(() => {
      this.suppressNextSelection = true;
      this.answerFields.first?.nativeElement.focus();
    });
  }

  protected resetGrid(): void {
    const answers = this.createEmptyAnswers(this.puzzle().size);

    for (const position of this.hintedPositions()) {
      const [row, col] = position.split(':').map(Number);
      answers[row][col] = String(this.puzzle().cells[row][col].value);
    }

    this.answers.set(answers);
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
  }

  protected activateInput(row: number, col: number, event: Event): void {
    this.activeCell.set({ row, col });

    if (event.target instanceof HTMLInputElement) {
      if (this.suppressNextSelection) {
        this.suppressNextSelection = false;
        return;
      }
      event.target.select();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      target.closest('.number-cell input') ||
      target.closest('button') ||
      target.closest('app-custom-keyboard') ||
      target.closest('app-puzzle-success-popup')
    )
      return;
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
  }

  protected isHinted(row: number, col: number): boolean {
    return this.hintedPositions().has(this.positionKey(row, col));
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

          if (this.isSolvableByDeduction(puzzle)) {
            return puzzle;
          }
        }
      }
    }

    return this.createFallbackPuzzle(size);
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

    return this.buildPuzzle(size, values, rowOperators, columnOperators, givenPositions);
  }

  private createFallbackPuzzle(size: CrossmathSize): CrossmathPuzzle {
    const givenPositions = new Set<string>();
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (col !== row && col !== row + 1) {
          givenPositions.add(this.positionKey(row, col));
        }
      }
    }

    // The blanks form a chain. Each sum at the end of the chain has one missing digit.
    const operators = Array.from({ length: size }, () =>
      Array<CrossmathOperator>(size - 1).fill('+'),
    );
    return this.buildPuzzle(
      size,
      this.createSolutionValues(size),
      operators,
      operators,
      givenPositions,
    );
  }

  private buildPuzzle(
    size: CrossmathSize,
    values: number[][],
    rowOperators: CrossmathOperator[][],
    columnOperators: CrossmathOperator[][],
    givenPositions: Set<string>,
  ): CrossmathPuzzle {
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

  private isSolvableByDeduction(puzzle: CrossmathPuzzle): boolean {
    const lines = [
      ...puzzle.cells.map((cells, row) => ({
        cells,
        operators: puzzle.rowOperators[row],
        target: puzzle.rowTargets[row],
      })),
      ...puzzle.columnTargets.map((target, col) => ({
        cells: puzzle.cells.map((row) => row[col]),
        operators: puzzle.columnOperators[col],
        target,
      })),
    ].map(({ cells, operators, target }) => ({
      cells,
      candidates: this.createLineCandidates(cells, operators, target),
    }));
    const possibleDigits = puzzle.cells.map((row) =>
      row.map((cell) => new Set(cell.given ? [cell.value] : CROSSMATH_DIGITS)),
    );

    // A digit must occur in a valid combination in both its row and its column.
    let changed: boolean;
    do {
      changed = false;
      for (const line of lines) {
        line.candidates = line.candidates.filter((candidate) =>
          line.cells.every(({ row, col }, index) => possibleDigits[row][col].has(candidate[index])),
        );
        if (line.candidates.length === 0) {
          return false;
        }

        for (const [index, { row, col }] of line.cells.entries()) {
          if (possibleDigits[row][col].size === 1) {
            continue;
          }

          const supportedDigits = new Set(line.candidates.map((candidate) => candidate[index]));
          if (supportedDigits.size < possibleDigits[row][col].size) {
            possibleDigits[row][col] = supportedDigits;
            changed = true;
          }
        }
      }
    } while (changed);

    return possibleDigits.every((row) => row.every((digits) => digits.size === 1));
  }

  private createLineCandidates(
    cells: CrossmathCell[],
    operators: CrossmathOperator[],
    target: number,
  ): number[][] {
    const candidates: number[][] = [];
    const currentValues: number[] = [];

    const search = (index: number): void => {
      if (index === cells.length) {
        if (this.evaluate(currentValues, operators) === target) {
          candidates.push([...currentValues]);
        }

        return;
      }

      const cell = cells[index];
      const possibleValues = cell.given ? [cell.value] : CROSSMATH_DIGITS;

      for (const value of possibleValues) {
        currentValues[index] = value;
        search(index + 1);
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

import {
  Component,
  ElementRef,
  HostListener,
  QueryList,
  computed,
  signal,
  ViewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type PyramidCell = {
  row: number;
  col: number;
  value: number;
  given: boolean;
};

type SumPyramidPuzzle = {
  size: number;
  rows: PyramidCell[][];
};

@Component({
  selector: 'app-sum-pyramid-page',
  imports: [RouterLink, CustomKeyboardComponent, PuzzleSuccessPopupComponent],
  templateUrl: './sum-pyramid.page.html',
  styleUrl: './sum-pyramid.page.scss',
})
export class SumPyramidPage {
  @ViewChildren('answerField')
  private readonly answerFields!: QueryList<ElementRef<HTMLInputElement>>;

  protected readonly puzzle = signal<SumPyramidPuzzle>(this.createPuzzle());
  protected readonly answers = signal<string[][]>(this.createEmptyAnswers());
  protected readonly hintedPositions = signal<Set<string>>(new Set());
  protected readonly activeCell = signal<{ row: number; col: number } | null>(null);

  protected readonly numberKeyboardRows = computed<CustomKeyboardKey[][]>(() => [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace'],
  ]);

  protected readonly isSolved = computed(() =>
    this.puzzle().rows.every((row) =>
      row.every((cell) => this.cellValue(cell.row, cell.col) === cell.value),
    ),
  );

  protected readonly hasAvailableHint = computed(() =>
    this.puzzle().rows.some((row) =>
      row.some((cell) => !cell.given && !this.isHinted(cell.row, cell.col)),
    ),
  );

  protected updateAnswer(row: number, col: number, value: string): void {
    if (this.puzzle().rows[row][col].given || this.isHinted(row, col)) {
      return;
    }

    const cleanValue = value.replace(/\D/g, '').slice(0, 3);

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
      event.target.select();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('.pyramid-cell input') || target.closest('app-custom-keyboard')) return;
    this.activeCell.set(null);
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    const activeCell = this.activeCell();
    if (!activeCell || this.puzzle().rows[activeCell.row][activeCell.col].given) return;
    if (this.isHinted(activeCell.row, activeCell.col)) return;

    if (key === 'backspace') {
      const currentValue = this.cellAnswer(activeCell.row, activeCell.col);
      this.updateAnswer(activeCell.row, activeCell.col, currentValue.slice(0, -1));
      return;
    }

    if (key === 'clear') {
      this.updateAnswer(activeCell.row, activeCell.col, '');
      return;
    }

    if (key === 'space') return;

    this.updateAnswer(activeCell.row, activeCell.col, this.cellAnswer(activeCell.row, activeCell.col) + key);
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
    window.setTimeout(() => this.focusNextEmptyCell());
  }

  protected resetPuzzle(): void {
    this.answers.set(this.createEmptyAnswers());
    this.hintedPositions.set(new Set());
    this.activeCell.set(null);
  }

  protected newPuzzle(): void {
    this.puzzle.set(this.createPuzzle());
    this.resetPuzzle();
  }

  protected cellAnswer(row: number, col: number): string {
    return this.answers()[row]?.[col] ?? '';
  }

  protected cellValue(row: number, col: number): number | null {
    const cell = this.puzzle().rows[row][col];

    if (cell.given) {
      return cell.value;
    }

    const answer = this.cellAnswer(row, col);
    return answer ? Number(answer) : null;
  }

  protected isHinted(row: number, col: number): boolean {
    return this.hintedPositions().has(this.positionKey(row, col));
  }

  private createPuzzle(): SumPyramidPuzzle {
    const size = 6;
    const solutionRows = this.createSolutionRows(size);
    const givenPositions = this.createGivenPositions(size);

    return {
      size,
      rows: solutionRows.map((row, rowIndex) =>
        row.map((value, colIndex) => ({
          row: rowIndex,
          col: colIndex,
          value,
          given: givenPositions.has(this.positionKey(rowIndex, colIndex)),
        })),
      ),
    };
  }

  private createSolutionRows(size: number): number[][] {
    const rows = Array.from({ length: size }, () => [] as number[]);
    rows[size - 1] = Array.from({ length: size }, () => this.randomInt(1, 9));

    for (let row = size - 2; row >= 0; row -= 1) {
      rows[row] = Array.from(
        { length: row + 1 },
        (_, col) => rows[row + 1][col] + rows[row + 1][col + 1],
      );
    }

    return rows;
  }

  private createGivenPositions(size: number): Set<string> {
    const adjacentPairs: string[][] = [];

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        if (col < row) {
          adjacentPairs.push([this.positionKey(row, col), this.positionKey(row, col + 1)]);
        }

        if (row < size - 1) {
          adjacentPairs.push([this.positionKey(row, col), this.positionKey(row + 1, col)]);
          adjacentPairs.push([this.positionKey(row, col), this.positionKey(row + 1, col + 1)]);
        }
      }
    }

    const givenPositions = new Set(this.shuffle(adjacentPairs)[0]);
    const remainingPositions = this.shuffle(this.createPositionKeys(size)).filter(
      (position) => !givenPositions.has(position),
    );

    for (const position of remainingPositions) {
      if (givenPositions.size >= size) {
        break;
      }

      const currentRank = this.coefficientRank([...givenPositions], size);
      const nextRank = this.coefficientRank([...givenPositions, position], size);

      if (nextRank > currentRank) {
        givenPositions.add(position);
      }
    }

    return givenPositions;
  }

  private createPositionKeys(size: number): string[] {
    const positions: string[] = [];

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        positions.push(this.positionKey(row, col));
      }
    }

    return positions;
  }

  private coefficientRank(positions: string[], size: number): number {
    const matrix = positions.map((position) => {
      const [row, col] = position.split(':').map(Number);

      return this.cellCoefficients(size, row, col);
    });
    let rank = 0;
    let pivotCol = 0;

    while (rank < matrix.length && pivotCol < size) {
      let pivotRow = rank;

      for (let row = rank; row < matrix.length; row += 1) {
        if (Math.abs(matrix[row][pivotCol]) > Math.abs(matrix[pivotRow][pivotCol])) {
          pivotRow = row;
        }
      }

      if (Math.abs(matrix[pivotRow][pivotCol]) === 0) {
        pivotCol += 1;
        continue;
      }

      [matrix[rank], matrix[pivotRow]] = [matrix[pivotRow], matrix[rank]];

      const pivot = matrix[rank][pivotCol];
      matrix[rank] = matrix[rank].map((value) => value / pivot);

      for (let row = 0; row < matrix.length; row += 1) {
        if (row === rank) {
          continue;
        }

        const factor = matrix[row][pivotCol];
        matrix[row] = matrix[row].map((value, index) => value - factor * matrix[rank][index]);
      }

      rank += 1;
      pivotCol += 1;
    }

    return rank;
  }

  private cellCoefficients(size: number, row: number, col: number): number[] {
    if (row === size - 1) {
      return Array.from({ length: size }, (_, index) => (index === col ? 1 : 0));
    }

    const leftCoefficients = this.cellCoefficients(size, row + 1, col);
    const rightCoefficients = this.cellCoefficients(size, row + 1, col + 1);

    return leftCoefficients.map((coefficient, index) => coefficient + rightCoefficients[index]);
  }

  private createEmptyAnswers(): string[][] {
    return this.puzzle().rows.map((row) => row.map(() => ''));
  }

  private findHintCell(): PyramidCell | null {
    for (const row of this.puzzle().rows) {
      for (const cell of row) {
        if (!cell.given && !this.isHinted(cell.row, cell.col) && this.cellValue(cell.row, cell.col) !== cell.value) {
          return cell;
        }
      }
    }

    return null;
  }

  private focusNextEmptyCell(): void {
    const nextCell = this.puzzle()
      .rows.flat()
      .find((cell) => !cell.given && !this.isHinted(cell.row, cell.col) && this.cellValue(cell.row, cell.col) === null);

    if (!nextCell) {
      return;
    }

    this.activeCell.set({ row: nextCell.row, col: nextCell.col });
    const field = this.answerFields.find((fieldRef) => {
      const element = fieldRef.nativeElement;

      return element.dataset['row'] === String(nextCell.row) && element.dataset['col'] === String(nextCell.col);
    });

    field?.nativeElement.focus();
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

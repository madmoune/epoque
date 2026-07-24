import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type CalcudokuCell = {
  row: number;
  col: number;
  cage: string;
};

type CalcudokuCage = {
  id: string;
  operator: '+' | 'x' | '-' | '/' | '';
};

type CalcudokuCageTemplate = {
  cages: CalcudokuCage[];
  cells: CalcudokuCell[];
};

@Component({
  selector: 'app-calcudoku-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './calcudoku.page.html',
  styleUrl: './calcudoku.page.scss',
})
export class CalcudokuPage {
  protected readonly size = 5;
  protected readonly numberKeyboardRows: CustomKeyboardKey[][] = [
    ['1', '2', '3'],
    ['4', '5'],
    ['backspace'],
  ];

  protected readonly gridIndexes = Array.from({ length: this.size }, (_, index) => index);
  private readonly cageTemplate = signal<CalcudokuCageTemplate>(this.createRandomCageTemplate());
  protected readonly cages = computed(() => this.cageTemplate().cages);
  protected readonly cells = computed(() => this.cageTemplate().cells);
  protected readonly solution = signal<number[][]>(this.createSolution());
  protected readonly answers = signal<string[][]>(this.createEmptyAnswers());
  protected readonly hintedPositions = signal<Set<string>>(new Set());
  protected readonly activeCell = signal<{ row: number; col: number } | null>(null);

  constructor() {
    this.assignCageOperators();
  }

  protected readonly isSolved = computed(() => {
    const enteredValues = this.enteredValues();

    if (!enteredValues) {
      return false;
    }

    return this.hasValidRowsAndColumns(enteredValues) && this.hasValidCages(enteredValues);
  });

  protected readonly hasAvailableHint = computed(() =>
    this.cells().some((cell) => !this.isHinted(cell.row, cell.col)),
  );

  protected updateAnswer(row: number, col: number, value: string): void {
    if (this.isHinted(row, col)) {
      return;
    }

    const cleanValue = value.replace(/[^1-5]/g, '').slice(0, 1);
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

    if (!(target instanceof Element)) {
      return;
    }

    if (
      target.closest('.calcudoku-grid input') ||
      target.closest('button') ||
      target.closest('app-custom-keyboard') ||
      target.closest('app-puzzle-success-popup')
    ) {
      return;
    }

    this.activeCell.set(null);
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    const activeCell = this.activeCell();

    if (!activeCell || this.isHinted(activeCell.row, activeCell.col)) {
      return;
    }

    if (key === 'backspace' || key === 'clear') {
      this.updateAnswer(activeCell.row, activeCell.col, '');
      return;
    }

    if (key === 'space') {
      return;
    }

    this.updateAnswer(activeCell.row, activeCell.col, key);
  }

  protected resetPuzzle(): void {
    this.answers.set(this.createEmptyAnswers());
    this.hintedPositions.set(new Set());
    this.activeCell.set(null);
  }

  protected newPuzzle(): void {
    this.cageTemplate.set(this.createRandomCageTemplate());
    this.solution.set(this.createSolution());
    this.assignCageOperators();
    this.resetPuzzle();
  }

  protected showHint(): void {
    const hintCell = this.cells().find(
      (cell) =>
        !this.isHinted(cell.row, cell.col) &&
        Number(this.answerAt(cell.row, cell.col)) !== this.solution()[cell.row][cell.col],
    );

    if (!hintCell) {
      return;
    }

    this.answers.update((answers) =>
      answers.map((answerRow, rowIndex) =>
        rowIndex === hintCell.row
          ? answerRow.map((answer, colIndex) =>
              colIndex === hintCell.col
                ? String(this.solution()[hintCell.row][hintCell.col])
                : answer,
            )
          : answerRow,
      ),
    );
    this.hintedPositions.update(
      (positions) => new Set([...positions, this.positionKey(hintCell.row, hintCell.col)]),
    );
  }

  protected cellAt(row: number, col: number): CalcudokuCell {
    return this.cells().find((cell) => cell.row === row && cell.col === col) ?? this.cells()[0];
  }

  protected cageLabel(cell: CalcudokuCell): string {
    const isFirstCell = this.cells().find((candidate) => candidate.cage === cell.cage) === cell;
    if (!isFirstCell) {
      return '';
    }

    return this.cageLabelFor(cell.cage);
  }

  protected answerAt(row: number, col: number): string {
    return this.answers()[row]?.[col] ?? '';
  }

  protected isHinted(row: number, col: number): boolean {
    return this.hintedPositions().has(this.positionKey(row, col));
  }

  protected isActiveCell(row: number, col: number): boolean {
    const activeCell = this.activeCell();

    return activeCell?.row === row && activeCell.col === col;
  }

  protected cellClass(cell: CalcudokuCell): string {
    const classes = ['cell'];

    if (this.isHinted(cell.row, cell.col)) {
      classes.push('hinted');
    }

    if (this.neighborCage(cell.row - 1, cell.col) !== cell.cage) {
      classes.push('cage-top');
    }

    if (this.neighborCage(cell.row, cell.col + 1) !== cell.cage) {
      classes.push('cage-right');
    }

    if (this.neighborCage(cell.row + 1, cell.col) !== cell.cage) {
      classes.push('cage-bottom');
    }

    if (this.neighborCage(cell.row, cell.col - 1) !== cell.cage) {
      classes.push('cage-left');
    }

    return classes.join(' ');
  }

  private createEmptyAnswers(): string[][] {
    return Array.from({ length: this.size }, () => Array.from({ length: this.size }, () => ''));
  }

  private createSolution(): number[][] {
    const digits = this.shuffle(Array.from({ length: this.size }, (_, index) => index + 1));
    const shift = this.randomInt(0, this.size - 1);

    return Array.from({ length: this.size }, (_, row) =>
      Array.from({ length: this.size }, (_, col) => digits[(row + col + shift) % this.size]),
    );
  }

  private createRandomCageTemplate(): CalcudokuCageTemplate {
    const unassignedCells = new Set(
      this.gridIndexes.flatMap((row) => this.gridIndexes.map((col) => this.positionKey(row, col))),
    );
    const cages: CalcudokuCage[] = [];
    const cells: CalcudokuCell[] = [];
    let cageIndex = 0;

    while (unassignedCells.size > 0) {
      const seedKey = this.randomItem([...unassignedCells]);
      const cageKeys = [seedKey];
      unassignedCells.delete(seedKey);
      const desiredSize = Math.min(this.randomCageSize(), unassignedCells.size + 1);

      while (cageKeys.length < desiredSize) {
        const candidates = cageKeys.flatMap((key) => {
          const [row, col] = this.parsePositionKey(key);

          return this.neighborPositions(row, col).filter((position) =>
            unassignedCells.has(this.positionKey(position.row, position.col)),
          );
        });
        const uniqueCandidates = [
          ...new Map(
            candidates.map((candidate) => [
              this.positionKey(candidate.row, candidate.col),
              candidate,
            ]),
          ).values(),
        ];

        if (uniqueCandidates.length === 0) {
          break;
        }

        const nextCell = this.randomItem(uniqueCandidates);
        const nextKey = this.positionKey(nextCell.row, nextCell.col);
        cageKeys.push(nextKey);
        unassignedCells.delete(nextKey);
      }

      const cageId = `cage-${cageIndex}`;
      cages.push({ id: cageId, operator: '' });
      cells.push(
        ...cageKeys.map((key) => {
          const [row, col] = this.parsePositionKey(key);

          return { row, col, cage: cageId };
        }),
      );
      cageIndex += 1;
    }

    return { cages, cells };
  }

  private assignCageOperators(): void {
    const solution = this.solution();

    this.cageTemplate.update((template) => ({
      ...template,
      cages: template.cages.map((cage) => ({
        ...cage,
        operator: this.randomOperatorForCage(cage.id, solution, template.cells),
      })),
    }));
  }

  private randomOperatorForCage(
    cageId: string,
    solution: number[][],
    cells: CalcudokuCell[],
  ): CalcudokuCage['operator'] {
    const cageValues = cells
      .filter((cell) => cell.cage === cageId)
      .map((cell) => solution[cell.row][cell.col]);

    if (cageValues.length <= 1) {
      return '';
    }

    if (cageValues.length > 2) {
      return this.randomItem(['+', 'x'] as const);
    }

    const [first, second] = [...cageValues].sort((a, b) => b - a);
    const operators: CalcudokuCage['operator'][] = ['+', 'x'];

    if (first !== second) {
      operators.push('-');
    }

    if (second !== 0 && first % second === 0) {
      operators.push('/');
    }

    return this.randomItem(operators);
  }

  private randomCageSize(): number {
    const roll = Math.random();

    if (roll < 0.12) {
      return 1;
    }

    if (roll < 0.62) {
      return 2;
    }

    if (roll < 0.92) {
      return 3;
    }

    return 4;
  }

  private neighborPositions(row: number, col: number): Array<{ row: number; col: number }> {
    return [
      { row: row - 1, col },
      { row, col: col + 1 },
      { row: row + 1, col },
      { row, col: col - 1 },
    ].filter(
      (position) =>
        position.row >= 0 &&
        position.row < this.size &&
        position.col >= 0 &&
        position.col < this.size,
    );
  }

  private parsePositionKey(key: string): [number, number] {
    const [row, col] = key.split(':').map(Number);

    return [row, col];
  }

  private cageLabelFor(cageId: string): string {
    const cage = this.cages().find((candidate) => candidate.id === cageId);
    const values = this.cells()
      .filter((cell) => cell.cage === cageId)
      .map((cell) => this.solution()[cell.row][cell.col]);

    if (!cage || values.length === 0) {
      return '';
    }

    if (cage.operator === '') {
      return String(values[0]);
    }

    if (cage.operator === '+') {
      return `${values.reduce((total, value) => total + value, 0)}+`;
    }

    if (cage.operator === 'x') {
      return `${values.reduce((total, value) => total * value, 1)}x`;
    }

    const [first, second] = [...values].sort((a, b) => b - a);

    if (cage.operator === '-') {
      return `${first - second}-`;
    }

    return `${first / second}/`;
  }

  private enteredValues(): number[][] | null {
    const values = this.answers().map((row) => row.map((answer) => Number(answer)));

    if (
      values.some((row) =>
        row.some((value) => !Number.isInteger(value) || value < 1 || value > this.size),
      )
    ) {
      return null;
    }

    return values;
  }

  private hasValidRowsAndColumns(values: number[][]): boolean {
    for (let index = 0; index < this.size; index += 1) {
      const rowValues = values[index];
      const columnValues = values.map((row) => row[index]);

      if (!this.hasAllDigitsOnce(rowValues) || !this.hasAllDigitsOnce(columnValues)) {
        return false;
      }
    }

    return true;
  }

  private hasAllDigitsOnce(values: number[]): boolean {
    return (
      new Set(values).size === this.size &&
      values.every((value) => value >= 1 && value <= this.size)
    );
  }

  private hasValidCages(values: number[][]): boolean {
    return this.cages().every((cage) => {
      const cageValues = this.cells()
        .filter((cell) => cell.cage === cage.id)
        .map((cell) => values[cell.row][cell.col]);
      const target = this.cageTarget(cage.id);

      if (target === null) {
        return false;
      }

      if (cage.operator === '') {
        return cageValues.length === 1 && cageValues[0] === target;
      }

      if (cage.operator === '+') {
        return cageValues.reduce((total, value) => total + value, 0) === target;
      }

      if (cage.operator === 'x') {
        return cageValues.reduce((total, value) => total * value, 1) === target;
      }

      if (cageValues.length !== 2) {
        return false;
      }

      const [first, second] = [...cageValues].sort((a, b) => b - a);

      if (cage.operator === '-') {
        return first - second === target;
      }

      return second !== 0 && first / second === target;
    });
  }

  private cageTarget(cageId: string): number | null {
    const label = this.cageLabelFor(cageId);
    const match = label.match(/^\d+/);

    return match ? Number(match[0]) : null;
  }

  private neighborCage(row: number, col: number): string | null {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
      return null;
    }

    return this.cellAt(row, col).cage;
  }

  private positionKey(row: number, col: number): string {
    return `${row}:${col}`;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomItem<T>(values: T[]): T {
    return values[this.randomInt(0, values.length - 1)]!;
  }

  private shuffle<T>(values: T[]): T[] {
    const shuffledValues = [...values];

    for (let index = shuffledValues.length - 1; index > 0; index -= 1) {
      const swapIndex = this.randomInt(0, index);
      [shuffledValues[index], shuffledValues[swapIndex]] = [
        shuffledValues[swapIndex],
        shuffledValues[index],
      ];
    }

    return shuffledValues;
  }
}

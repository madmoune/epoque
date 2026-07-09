import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type Operation = '+' | '-' | 'x' | '/';
type NumberCount = 4 | 5 | 6;
type DragSource = 'number-pool' | 'operation-pool' | 'number-slot' | 'operation-slot';

type DragPayload = {
  source: DragSource;
  index: number;
};

type CountPuzzle = {
  target: number;
  numbers: number[];
  operations: Operation[];
};

type CountSolution = {
  numbers: number[];
  operations: Operation[];
};

@Component({
  selector: 'app-count-is-good-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './count-is-good.page.html',
  styleUrl: './count-is-good.page.scss',
})
export class CountIsGoodPage {
  protected readonly modeOptions: NumberCount[] = [4, 5, 6];
  protected readonly numberCount = signal<NumberCount>(5);
  protected readonly puzzle = signal<CountPuzzle>(this.createPuzzle(this.numberCount()));
  protected readonly availableNumbers = signal<number[]>([...this.puzzle().numbers]);
  protected readonly availableOperations = signal<Operation[]>([...this.puzzle().operations]);
  protected readonly expressionNumbers = signal<Array<number | undefined>>(this.createEmptyNumberSlots());
  protected readonly expressionOperations = signal<Array<Operation | undefined>>(this.createEmptyOperationSlots());
  protected readonly feedback = signal('Choisis un nombre pour commencer ton équation.');
  protected readonly hint = signal('');
  private dropHandled = false;

  protected readonly currentResult = computed(() =>
    this.evaluateExpression(this.filledNumbers(), this.filledOperations()),
  );
  protected readonly isSolved = computed(
    () =>
      this.expressionNumbers().every((number) => number !== undefined) &&
      this.expressionOperations().every((operation) => operation !== undefined) &&
      this.currentResult() === this.puzzle().target,
  );
  protected readonly numberSlots = computed(() => Array.from({ length: this.numberCount() }, (_, index) => index));

  protected chooseNumberCount(count: NumberCount): void {
    this.numberCount.set(count);
    this.puzzle.set(this.createPuzzle(count));
    this.resetPuzzle();
  }

  protected selectNumber(index: number): void {
    const slotIndex = this.nextNumberSlotIndex();
    if (slotIndex === -1) {
      this.feedback.set('Toutes les cases de nombres sont remplies.');
      return;
    }

    if (!this.canPlaceNumber(slotIndex)) {
      this.feedback.set("Choisis d'abord une opération.");
      return;
    }

    const numbers = [...this.availableNumbers()];
    const [number] = numbers.splice(index, 1);
    this.availableNumbers.set(numbers);
    this.expressionNumbers.update((slots) => this.withValueAt(slots, slotIndex, number));
    this.hint.set('');

    this.feedback.set(this.availableNumbers().length === 0 ? 'Équation complète.' : 'Choisis une opération.');
  }

  protected chooseOperation(index: number): void {
    const slotIndex = this.nextOperationSlotIndex();
    if (slotIndex === -1) {
      this.feedback.set("Toutes les cases d'opérations sont remplies.");
      return;
    }

    if (!this.canPlaceOperation(slotIndex)) {
      this.feedback.set("Choisis d'abord un nombre.");
      return;
    }

    const operations = [...this.availableOperations()];
    const [operation] = operations.splice(index, 1);
    this.availableOperations.set(operations);
    this.expressionOperations.update((slots) => this.withValueAt(slots, slotIndex, operation));
    this.hint.set('');
    this.feedback.set('Choisis le nombre suivant.');
  }

  protected undoLastEntry(): void {
    this.hint.set('');

    const lastOperationIndex = this.lastFilledIndex(this.expressionOperations());
    const lastNumberIndex = this.lastFilledIndex(this.expressionNumbers());

    if (lastOperationIndex > lastNumberIndex - 1) {
      const operations = [...this.expressionOperations()];
      const [operation] = operations.splice(lastOperationIndex, 1, undefined);
      this.expressionOperations.set(operations);
      if (operation !== undefined) {
        this.availableOperations.update((available) => [...available, operation]);
      }
      this.feedback.set('Opération retirée.');
      return;
    }

    const numbers = [...this.expressionNumbers()];
    const lastNumber = numbers[lastNumberIndex];
    if (lastNumber === undefined) {
      return;
    }

    numbers[lastNumberIndex] = undefined;
    this.expressionNumbers.set(numbers);
    this.availableNumbers.update((available) => [...available, lastNumber]);
    this.feedback.set('Nombre retiré.');
  }

  protected startDrag(event: DragEvent, source: DragSource, index: number): void {
    this.dropHandled = false;
    event.dataTransfer?.setData('application/json', JSON.stringify({ source, index } satisfies DragPayload));
    event.dataTransfer?.setData('text/plain', `${source}:${index}`);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected finishDrag(source: DragSource, index: number): void {
    if (this.dropHandled || (source !== 'number-slot' && source !== 'operation-slot')) {
      return;
    }

    if (source === 'number-slot') {
      this.returnNumberToPool(index);
    } else {
      this.returnOperationToPool(index);
    }
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  protected dropOnNumberSlot(event: DragEvent, slotIndex: number): void {
    event.preventDefault();
    const payload = this.readDragPayload(event);
    if (payload === null || (payload.source !== 'number-pool' && payload.source !== 'number-slot')) {
      return;
    }

    this.dropHandled = true;
    this.hint.set('');

    if (payload.source === 'number-pool') {
      this.dropNumberFromPool(payload.index, slotIndex);
    } else {
      this.moveNumberSlot(payload.index, slotIndex);
    }
  }

  protected dropOnOperationSlot(event: DragEvent, slotIndex: number): void {
    event.preventDefault();
    const payload = this.readDragPayload(event);
    if (payload === null || (payload.source !== 'operation-pool' && payload.source !== 'operation-slot')) {
      return;
    }

    this.dropHandled = true;
    this.hint.set('');

    if (payload.source === 'operation-pool') {
      this.dropOperationFromPool(payload.index, slotIndex);
    } else {
      this.moveOperationSlot(payload.index, slotIndex);
    }
  }

  protected dropOnNumberPool(event: DragEvent): void {
    event.preventDefault();
    const payload = this.readDragPayload(event);
    if (payload?.source !== 'number-slot') {
      return;
    }

    this.dropHandled = true;
    this.returnNumberToPool(payload.index);
  }

  protected returnNumberToPool(index: number): void {
    const numbers = [...this.expressionNumbers()];
    const number = numbers[index];
    if (number === undefined) {
      return;
    }

    numbers[index] = undefined;
    this.expressionNumbers.set(numbers);
    this.availableNumbers.update((available) => [...available, number]);
    this.hint.set('');
    this.feedback.set('Nombre retiré.');
  }

  protected dropOnOperationPool(event: DragEvent): void {
    event.preventDefault();
    const payload = this.readDragPayload(event);
    if (payload?.source !== 'operation-slot') {
      return;
    }

    this.dropHandled = true;
    this.returnOperationToPool(payload.index);
  }

  protected returnOperationToPool(index: number): void {
    const operations = [...this.expressionOperations()];
    const operation = operations[index];
    if (operation === undefined) {
      return;
    }

    operations[index] = undefined;
    this.expressionOperations.set(operations);
    this.availableOperations.update((available) => [...available, operation]);
    this.hint.set('');
    this.feedback.set('Opération retirée.');
  }

  protected showHint(): void {
    const solution = this.findSolution();
    const hintSlot = this.nextHintSlot();

    if (solution === null || hintSlot === null) {
      return;
    }

    if (hintSlot.kind === 'number') {
      const number = solution.numbers[hintSlot.index];
      const poolIndex = this.availableNumbers().indexOf(number);

      if (poolIndex === -1) {
        return;
      }

      this.dropNumberFromPool(poolIndex, hintSlot.index, false);
      return;
    }

    const operation = solution.operations[hintSlot.index];
    const poolIndex = this.availableOperations().indexOf(operation);

    if (poolIndex === -1) {
      return;
    }

    this.dropOperationFromPool(poolIndex, hintSlot.index, false);
  }

  protected resetPuzzle(): void {
    this.availableNumbers.set([...this.puzzle().numbers]);
    this.availableOperations.set([...this.puzzle().operations]);
    this.expressionNumbers.set(this.createEmptyNumberSlots());
    this.expressionOperations.set(this.createEmptyOperationSlots());
    this.hint.set('');
    this.feedback.set('Choisis un nombre pour commencer ton équation.');
  }

  protected newPuzzle(): void {
    this.puzzle.set(this.createPuzzle(this.numberCount()));
    this.resetPuzzle();
  }

  private evaluateExpression(numbers: number[], operations: Operation[]): number | null {
    if (numbers.length === 0 || numbers.length !== operations.length + 1) {
      return null;
    }

    return operations.reduce<number | null>((total, operation, index) => {
      if (total === null) {
        return null;
      }

      const nextValue = numbers[index + 1];

      if (operation === '+') return total + nextValue;
      if (operation === '-') return total - nextValue;
      if (operation === 'x') return total * nextValue;

      return nextValue === 0 || total % nextValue !== 0 ? null : total / nextValue;
    }, numbers[0]);
  }

  private createPuzzle(numberCount: NumberCount): CountPuzzle {
    for (let attempt = 0; attempt < 200; attempt++) {
      const numbers = this.createNumbers(numberCount);
      const operations = this.createOperationsFor(numbers);
      const target = this.evaluateExpression(numbers, operations);

      if (
        target !== null &&
        target >= 120 &&
        target <= 899 &&
        this.distinctOperationCount(operations) >= 3
      ) {
        return {
          target,
          numbers: this.shuffle(numbers),
          operations: this.shuffle(operations),
        };
      }
    }

    const fallback =
      numberCount === 4
        ? { numbers: [6, 25, 4, 2], operations: ['x', '+', '-'] as Operation[] }
        : numberCount === 5
          ? { numbers: [6, 25, 4, 2, 3], operations: ['x', '+', '-', '+'] as Operation[] }
          : { numbers: [2, 3, 4, 5, 6, 25], operations: ['+', 'x', '+', 'x', '-'] as Operation[] };

    return {
      target: this.evaluateExpression(fallback.numbers, fallback.operations) ?? 0,
      numbers: this.shuffle(fallback.numbers),
      operations: this.shuffle(fallback.operations),
    };
  }

  private createNumbers(numberCount: NumberCount): number[] {
    const largeCount = numberCount === 4 ? 1 : 2;
    const smallNumbers = Array.from({ length: numberCount - largeCount }, () => this.randomInt(1, 10));
    const largeNumbers = this.shuffle([25, 50, 75, 100]).slice(0, largeCount);
    return this.shuffle([...smallNumbers, ...largeNumbers]);
  }

  private createOperationsFor(numbers: number[]): Operation[] {
    let total = numbers[0];

    return numbers.slice(1).map((number) => {
      const candidates: Operation[] = ['+', '-', 'x'];

      if (number !== 0 && total % number === 0) {
        candidates.push('/');
      }

      const operation = candidates[this.randomInt(0, candidates.length - 1)];

      if (operation === '+') total += number;
      if (operation === '-') total -= number;
      if (operation === 'x') total *= number;
      if (operation === '/') total /= number;

      return operation;
    });
  }

  private distinctOperationCount(operations: Operation[]): number {
    return new Set(operations).size;
  }

  private findSolution(): CountSolution | null {
    const numbers = [...this.expressionNumbers()];
    const operations = [...this.expressionOperations()];
    const availableNumbers = [...this.availableNumbers()];
    const availableOperations = [...this.availableOperations()];

    const solve = (tokenIndex: number): CountSolution | null => {
      if (tokenIndex === this.numberCount() * 2 - 1) {
        if (numbers.some((number) => number === undefined) || operations.some((operation) => operation === undefined)) {
          return null;
        }

        const solvedNumbers = numbers as number[];
        const solvedOperations = operations as Operation[];
        return this.evaluateExpression(solvedNumbers, solvedOperations) === this.puzzle().target
          ? { numbers: [...solvedNumbers], operations: [...solvedOperations] }
          : null;
      }

      if (tokenIndex % 2 === 0) {
        const slotIndex = tokenIndex / 2;
        if (numbers[slotIndex] !== undefined) {
          return solve(tokenIndex + 1);
        }

        for (let index = 0; index < availableNumbers.length; index++) {
          const [number] = availableNumbers.splice(index, 1);
          numbers[slotIndex] = number;

          const solution = solve(tokenIndex + 1);
          if (solution !== null) {
            return solution;
          }

          numbers[slotIndex] = undefined;
          availableNumbers.splice(index, 0, number);
        }

        return null;
      }

      const slotIndex = Math.floor(tokenIndex / 2);
      if (operations[slotIndex] !== undefined) {
        return solve(tokenIndex + 1);
      }

      for (let index = 0; index < availableOperations.length; index++) {
        const [operation] = availableOperations.splice(index, 1);
        operations[slotIndex] = operation;

        const solution = solve(tokenIndex + 1);
        if (solution !== null) {
          return solution;
        }

        operations[slotIndex] = undefined;
        availableOperations.splice(index, 0, operation);
      }

      return null;
    };

    return solve(0);
  }

  private nextHintSlot(): { kind: 'number' | 'operation'; index: number } | null {
    for (let index = 0; index < this.numberSlots().length; index++) {
      if (this.expressionNumbers()[index] === undefined) {
        return { kind: 'number', index };
      }

      if (index < this.numberCount() - 1 && this.expressionOperations()[index] === undefined) {
        return { kind: 'operation', index };
      }
    }

    return null;
  }

  private shuffle<T>(values: T[]): T[] {
    return [...values].sort(() => Math.random() - 0.5);
  }

  private randomInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  private dropNumberFromPool(poolIndex: number, slotIndex: number, announce = true): void {
    const available = [...this.availableNumbers()];
    const [number] = available.splice(poolIndex, 1);
    if (number === undefined) {
      return;
    }

    const slots = [...this.expressionNumbers()];
    const replacedNumber = slots[slotIndex];
    slots[slotIndex] = number;

    this.expressionNumbers.set(slots);
    this.availableNumbers.set(replacedNumber === undefined ? available : [...available, replacedNumber]);
    if (announce) {
      this.feedback.set('Nombre placé.');
    }
  }

  private dropOperationFromPool(poolIndex: number, slotIndex: number, announce = true): void {
    const available = [...this.availableOperations()];
    const [operation] = available.splice(poolIndex, 1);
    if (operation === undefined) {
      return;
    }

    const slots = [...this.expressionOperations()];
    const replacedOperation = slots[slotIndex];
    slots[slotIndex] = operation;

    this.expressionOperations.set(slots);
    this.availableOperations.set(replacedOperation === undefined ? available : [...available, replacedOperation]);
    if (announce) {
      this.feedback.set('Opération placée.');
    }
  }

  private moveNumberSlot(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) {
      return;
    }

    const slots = [...this.expressionNumbers()];
    [slots[fromIndex], slots[toIndex]] = [slots[toIndex], slots[fromIndex]];
    this.expressionNumbers.set(slots);
    this.feedback.set('Nombres inversés.');
  }

  private moveOperationSlot(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) {
      return;
    }

    const slots = [...this.expressionOperations()];
    [slots[fromIndex], slots[toIndex]] = [slots[toIndex], slots[fromIndex]];
    this.expressionOperations.set(slots);
    this.feedback.set('Opérations inversées.');
  }

  private filledNumbers(): number[] {
    const numbers: number[] = [];

    for (const number of this.expressionNumbers()) {
      if (number === undefined) {
        break;
      }

      numbers.push(number);
    }

    return numbers;
  }

  private filledOperations(): Operation[] {
    const operations: Operation[] = [];

    for (let index = 0; index < this.expressionOperations().length; index++) {
      const operation = this.expressionOperations()[index];
      if (operation === undefined || this.expressionNumbers()[index + 1] === undefined) {
        break;
      }

      operations.push(operation);
    }

    return operations;
  }

  private nextNumberSlotIndex(): number {
    return this.expressionNumbers().findIndex((number) => number === undefined);
  }

  private nextOperationSlotIndex(): number {
    return this.expressionOperations().findIndex((operation) => operation === undefined);
  }

  private canPlaceNumber(slotIndex: number): boolean {
    return (
      this.expressionNumbers()[slotIndex] !== undefined ||
      slotIndex === 0 ||
      this.expressionOperations()[slotIndex - 1] !== undefined
    );
  }

  private canPlaceOperation(slotIndex: number): boolean {
    return (
      this.expressionNumbers()[slotIndex] !== undefined &&
      (this.expressionOperations()[slotIndex] !== undefined || this.expressionNumbers()[slotIndex + 1] === undefined)
    );
  }

  private lastFilledIndex(values: Array<number | Operation | undefined>): number {
    for (let index = values.length - 1; index >= 0; index--) {
      if (values[index] !== undefined) {
        return index;
      }
    }

    return -1;
  }

  private withValueAt<T>(values: Array<T | undefined>, index: number, value: T): Array<T | undefined> {
    const nextValues = [...values];
    nextValues[index] = value;
    return nextValues;
  }

  private createEmptyNumberSlots(): Array<number | undefined> {
    return Array.from({ length: this.numberCount() }, () => undefined);
  }

  private createEmptyOperationSlots(): Array<Operation | undefined> {
    return Array.from({ length: this.numberCount() - 1 }, () => undefined);
  }

  private readDragPayload(event: DragEvent): DragPayload | null {
    const rawPayload = event.dataTransfer?.getData('application/json');
    if (!rawPayload) {
      return null;
    }

    try {
      const payload = JSON.parse(rawPayload) as DragPayload;
      return typeof payload.index === 'number' && typeof payload.source === 'string' ? payload : null;
    } catch {
      return null;
    }
  }
}

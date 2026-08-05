import { Injectable } from '@angular/core';
import { MathSequencePuzzle } from './sequences.model';

type MathTemplateFactory = () => MathSequencePuzzle;
type MathTemplate = {
  genre: string;
  create: MathTemplateFactory;
};

@Injectable({
  providedIn: 'root',
})
export class SequencesService {
  private lastGenre: string | null = null;
  private templateDeck: MathTemplate[] = [];
  private readonly templates: MathTemplate[] = [
    this.withGenre('arithmetic', () => this.createIncreasingDifferenceSequence()),
    this.withGenre('arithmetic', () => this.createDecreasingDifferenceSequence()),
    this.withGenre('arithmetic', () => this.createAlternatingAddSubtractSequence()),
    this.withGenre('geometric', () => this.createAlternatingMultiplyAddSequence()),
    this.withGenre('interleaved', () => this.createInterleavedArithmeticSequence()),
    this.withGenre('interleaved', () => this.createInterleavedArithmeticAndGeometricSequence()),
    this.withGenre('interleaved', () => this.createInterleavedArithmeticAndSquaresSequence()),
    this.withGenre('arithmetic', () => this.createArithmeticWithPeriodicBoostSequence()),
    this.withGenre('recurrence', () => this.createFibonacciLikeSequence()),
    this.withGenre('recurrence', () => this.createTribonacciLikeSequence()),
    this.withGenre('polynomial', () => this.createSquaresSequence()),
    this.withGenre('arithmetic', () => this.createRepeatedGrowingAdditionSequence()),
    this.withGenre('arithmetic', () => this.createAlternatingGrowingPositiveDifferencesSequence()),
    this.withGenre('arithmetic', () => this.createPrimeDifferenceSequence()),
    this.withGenre('polynomial', () => this.createSquareDifferenceSequence()),
    this.withGenre('arithmetic', () => this.createRepeatedDifferenceCycleSequence()),
    this.withGenre('arithmetic', () => this.createAddIncreasingOddNumbersSequence()),
    this.withGenre('arithmetic', () => this.createAddIncreasingEvenNumbersSequence()),
    this.withGenre('geometric', () => this.createAlternatingTwoMultipliersSequence()),
    this.withGenre('geometric', () => this.createPositionMultiplierSequence()),
    this.withGenre('arithmetic', () => this.createRepeatedGrowingSubtractionSequence()),
    this.withGenre('polynomial', () => this.createPreviousPlusPositionSquaredSequence()),
    this.withGenre('recurrence', () => this.createPreviousPlusFibonacciDifferenceSequence()),
    this.withGenre('interleaved', () => this.createAlternatingPrimeAndSquareDifferencesSequence()),
    this.withGenre('interleaved', () => this.createDoubleInterleavedMultiplicationSequence()),
    this.withGenre('recurrence', () => this.createTwoPreviousPlusConstantSequence()),
    this.withGenre('geometric', () => this.createDescendingHalvesSequence()),
    this.withGenre('geometric', () => this.createMultiplyByIncreasingNumbersSequence()),
    this.withGenre('recurrence', () => this.createPreviousDifferenceTimesTwoSequence()),
    this.withGenre('arithmetic', () => this.createAbsoluteBounceSequence()),
    this.withGenre('polynomial', () => this.createProductOfPositionSequence()),
    this.withGenre('polynomial', () => this.createSquareMinusPositionSequence()),
    this.withGenre('arithmetic', () => this.createDifferenceStaircaseSequence()),
    this.withGenre('arithmetic', () => this.createAlternatingSignGrowthSequence()),
    this.withGenre('arithmetic', () => this.createAlternatingGrowingAddSubtractSequence()),
    this.withGenre('geometric', () => this.createMultiplyThenAddIncreasingOffsetSequence()),
    this.withGenre('interleaved', () => this.createInterleavedFibonacciAndSquaresSequence()),
    this.withGenre('recurrence', () => this.createPreviousTwoDifferencePlusPositionSequence()),
    this.withGenre('arithmetic', () => this.createSecondDifferenceCycleSequence()),

    // Écarts et opérations faciles à expliquer.
    this.withGenre('arithmetic', () => this.createSmallThenGrowingLargeDifferenceSequence()),
    this.withGenre('arithmetic', () => this.createGrowingSubtractionSequence()),
    this.withGenre('arithmetic', () => this.createDoubleMinusOneDifferencesSequence()),
    this.withGenre('arithmetic', () => this.createAlternatingDifferenceGrowthSequence()),
    this.withGenre('operations', () => this.createDoubleMinusGrowingAmountSequence()),
    this.withGenre('operations', () => this.createDoubleThenHalfPlusSequence()),
    this.withGenre('operations', () => this.createTripleThenThirdPlusSequence()),
    this.withGenre('arithmetic', () => this.createPreviousPlusConsecutiveProductsSequence()),

    // Règles visuelles par paires.
    this.withGenre('operations', () => this.createDoubleThenGrowingAdditionSequence()),
    this.withGenre('pairs', () => this.createNumberAndDoublePairsSequence()),
    this.withGenre('pairs', () => this.createNumberAndTriplePairsSequence()),
    this.withGenre('pairs', () => this.createNumberAndOffsetPairsSequence()),
    this.withGenre('pairs', () => this.createNumberAndReversePairsSequence()),

    // Règles sur les chiffres et règle conditionnelle.
    this.withGenre('digits', () => this.createReverseAndAddSequence()),
    this.withGenre('conditional', () => this.createCollatzSequence()),
    this.withGenre('digits', () => this.createLookAndSaySequence()),
    this.withGenre('digits', () => this.createDigitSumGrowthSequence()),
    this.withGenre('digits', () => this.createDigitSquareSumGrowthSequence()),

    // Cycles d'opérations de deux à quatre étapes.
    this.withGenre('operations', () => this.createThreeOperationCycleSequence()),
    this.withGenre('operations', () => this.createMultiplyAddDivideCycleSequence()),
    this.withGenre('operations', () => this.createAlternatingAffineSequence()),
    this.withGenre('operations', () => this.createAddAddDoubleCycleSequence()),
    this.withGenre('operations', () => this.createMultiplySubtractSubtractCycleSequence()),
    this.withGenre('operations', () => this.createFourOperationBalanceCycleSequence()),
    this.withGenre('operations', () => this.createNegativeMultiplyAddCycleSequence()),
    this.withGenre('operations', () => this.createGrowingThreeOperationCycleSequence()),

    // Récurrences qui ne se résument pas à une seule addition fixe.
    this.withGenre('recurrence', () => this.createPellLikeSequence()),
    this.withGenre('recurrence', () => this.createJacobsthalLikeSequence()),
    this.withGenre('recurrence', () => this.createTwoPreviousMinusConstantSequence()),
    this.withGenre('recurrence', () => this.createPreviousPlusThirdBackSequence()),
    this.withGenre('recurrence', () => this.createTwoPreviousPlusPositionSequence()),
    this.withGenre('recurrence', () => this.createAlternatingRecurrenceSequence()),
    this.withGenre('recurrence', () => this.createWeightedTwoPreviousMinusConstantSequence()),

    // Règles simples supplémentaires.
    this.withGenre('arithmetic', () => this.createAlternatingDifferenceTransformSequence()),
    this.withGenre('interleaved', () => this.createInterleavedAscendingDescendingSequence()),
    this.withGenre('pairs', () => this.createNumberAndHalfPairsSequence()),
    this.withGenre('digits', () => this.createLastDigitAdditionSequence()),
    this.withGenre('digits', () => this.createFirstDigitAdditionSequence()),
    this.withGenre('digits', () => this.createDigitProductAdditionSequence()),
    this.withGenre('recurrence', () => this.createDoubleMinusPositionSquaredSequence()),

    // Mélanges supplémentaires qui évitent les progressions élémentaires.
    this.withGenre('interleaved', () => this.createNumberAndSquarePairsSequence()),
    this.withGenre('recurrence', () => this.createTwoPreviousSumAlternatingAdjustmentSequence()),
    this.withGenre('recurrence', () => this.createTwoPreviousDifferencePlusConstantSequence()),
  ];

  createPuzzle(): MathSequencePuzzle {
    const maximumAttempts = this.templates.length * 4;

    for (let attempt = 0; attempt < maximumAttempts; attempt++) {
      const template = this.drawTemplate();
      const puzzle = template.create();

      if (this.isPerfectCube(puzzle.answer) || this.isTooSimpleSequence(puzzle.sequence)) {
        continue;
      }

      this.lastGenre = template.genre;

      return puzzle;
    }

    throw new Error('Impossible de générer une suite mathématique suffisamment variée.');
  }

  private drawTemplate(): MathTemplate {
    if (this.templateDeck.length === 0) {
      this.templateDeck = this.shuffle(this.templates);
    }

    const differentGenreIndex = this.templateDeck.findIndex(
      (template) => template.genre !== this.lastGenre,
    );
    const selectedIndex = differentGenreIndex >= 0 ? differentGenreIndex : 0;

    return this.templateDeck.splice(selectedIndex, 1)[0];
  }

  private withGenre(genre: string, create: MathTemplateFactory): MathTemplate {
    return { genre, create };
  }

  private isPerfectCube(value: number): boolean {
    if (!Number.isInteger(value)) {
      return false;
    }

    const magnitude = Math.abs(value);
    const root = Math.round(Math.cbrt(magnitude));

    return root ** 3 === magnitude;
  }

  private isTooSimpleSequence(sequence: number[]): boolean {
    const differences = sequence.slice(1).map((value, index) => value - sequence[index]);

    // Reject a constant addition/subtraction, such as +12 at every step.
    if (
      differences.length > 0 &&
      differences.every((difference) => difference === differences[0])
    ) {
      return true;
    }

    // Reject a constant ratio, such as ×3 at every step.
    if (
      sequence[0] !== 0 &&
      sequence.length > 1 &&
      sequence
        .slice(2)
        .every((value, index) => value * sequence[0] === sequence[index + 1] * sequence[1])
    ) {
      return true;
    }

    // Also reject a fixed rule of the form ×a puis +b, which is only a
    // slightly disguised version of a single repeated operation.
    if (differences.length < 3 || differences[0] === 0) {
      return false;
    }

    return differences
      .slice(2)
      .every(
        (difference, index) =>
          difference * differences[0] === differences[index + 1] * differences[1],
      );
  }

  private createArithmeticSequence(): MathSequencePuzzle {
    const start = this.randomInt(-20, 40);
    const step = this.randomNonZeroInt(-12, 12);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => start + step * index);

    return this.createPuzzleFromSequence(
      sequence,
      step > 0 ? `Ajoute ${step} chaque fois.` : `Soustrais ${Math.abs(step)} chaque fois.`,
    );
  }

  private createGeometricSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 8);
    const multiplier = this.getRandomItem([2, 3, 4]);
    const length = this.randomInt(5, 7);

    const sequence = Array.from({ length }, (_, index) => start * multiplier ** index);

    return this.createPuzzleFromSequence(sequence, `Multiplie par ${multiplier} chaque fois.`);
  }

  private createIncreasingDifferenceSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 25);
    const firstStep = this.randomInt(2, 8);
    const increase = this.randomInt(1, 5);
    const length = this.randomInt(6, 8);

    const sequence = [start];
    const differences: number[] = [];
    let step = firstStep;

    while (sequence.length < length) {
      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
      step += increase;
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les écarts sont ${differences.slice(0, 4).join(', ')}... Ils augmentent de ${increase}.`,
    );
  }

  private createDecreasingDifferenceSequence(): MathSequencePuzzle {
    const length = this.randomInt(6, 8);
    const decrease = this.randomInt(2, 4);
    const firstStep = decrease * (length + 1) + this.randomInt(4, 10);
    const start = this.randomInt(90, 160);

    const sequence = [start];
    const differences: number[] = [];
    let step = firstStep;

    while (sequence.length < length) {
      differences.push(step);
      sequence.push(sequence[sequence.length - 1] - step);
      step -= decrease;
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les soustractions sont ${differences.slice(0, 4).join(', ')}... Elles diminuent de ${decrease}.`,
    );
  }

  private createAlternatingAddSubtractSequence(): MathSequencePuzzle {
    const start = this.randomInt(10, 50);
    const addAmount = this.randomInt(5, 16);
    const subtractAmount = this.randomInt(2, 10);
    const length = this.randomInt(7, 9);

    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      sequence.push(sequence.length % 2 === 1 ? previous + addAmount : previous - subtractAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Alterne les opérations : ajoute ${addAmount}, puis soustrais ${subtractAmount}.`,
    );
  }

  private createAlternatingMultiplyAddSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 10);
    const multiplier = this.randomInt(2, 3);
    const addAmount = this.randomInt(3, 12);
    const length = this.randomInt(6, 8);

    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      sequence.push(sequence.length % 2 === 1 ? previous * multiplier : previous + addAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Alterne les opérations : multiplie par ${multiplier}, puis ajoute ${addAmount}.`,
    );
  }

  private createMultiplyThenAddSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 8);
    const multiplier = this.randomInt(2, 3);
    const addAmount = this.randomInt(1, 9);
    const length = this.randomInt(5, 7);

    const sequence = [start];

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] * multiplier + addAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `À chaque étape : multiplie par ${multiplier}, puis ajoute ${addAmount}.`,
    );
  }

  private createMultiplyThenSubtractSequence(): MathSequencePuzzle {
    const start = this.randomInt(4, 12);
    const multiplier = this.randomInt(2, 3);
    const subtractAmount = this.randomInt(1, 8);
    const length = this.randomInt(5, 7);

    const sequence = [start];

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] * multiplier - subtractAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `À chaque étape : multiplie par ${multiplier}, puis soustrais ${subtractAmount}.`,
    );
  }

  private createInterleavedArithmeticSequence(): MathSequencePuzzle {
    const firstStart = this.randomInt(1, 20);
    const secondStart = this.randomInt(10, 40);
    const firstStep = this.randomNonZeroInt(2, 9);
    const secondStep = this.randomNonZeroInt(2, 9);
    const length = 8;

    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      if (index % 2 === 0) {
        return firstStart + firstStep * innerIndex;
      }

      return secondStart + secondStep * innerIndex;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `Observe les positions alternées. Les positions 1, 3, 5... changent de ${firstStep}. Les positions 2, 4, 6... changent de ${secondStep}.`,
    );
  }

  private createInterleavedArithmeticAndGeometricSequence(): MathSequencePuzzle {
    const firstStart = this.randomInt(2, 10);
    const secondStart = this.randomInt(1, 8);
    const firstStep = this.randomInt(3, 10);
    const secondMultiplier = this.randomInt(2, 3);
    const length = 8;

    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      if (index % 2 === 0) {
        return firstStart + firstStep * innerIndex;
      }

      return secondStart * secondMultiplier ** innerIndex;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `Observe les positions alternées. Aux positions 1, 3, 5..., ajoute ${firstStep}. Aux positions 2, 4, 6..., multiplie par ${secondMultiplier}.`,
    );
  }

  private createInterleavedArithmeticAndSquaresSequence(): MathSequencePuzzle {
    const arithmeticStart = this.randomInt(4, 24);
    const arithmeticStep = this.randomNonZeroInt(3, 11);
    const squareStart = this.randomInt(2, 5);
    const squareOffset = this.randomInt(-4, 7);
    const length = 8;

    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      if (index % 2 === 0) {
        return arithmeticStart + arithmeticStep * innerIndex;
      }

      const squareBase = squareStart + innerIndex;

      return squareBase ** 2 + squareOffset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `Les positions alternées suivent deux règles : une suite arithmétique ajoute ${arithmeticStep}, l’autre utilise les carrés de ${squareStart}, ${squareStart + 1}, ${squareStart + 2}... auxquels on ${this.signedAdditionText(squareOffset)}.`,
    );
  }

  private createArithmeticWithPeriodicBoostSequence(): MathSequencePuzzle {
    const start = this.randomInt(8, 45);
    const baseStep = this.randomInt(2, 8);
    const boost = this.randomInt(5, 14);
    const cycleLength = this.getRandomItem([3, 4]);
    const length = this.randomInt(8, 9);
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const stepIndex = sequence.length - 1;
      const step = stepIndex % cycleLength === cycleLength - 1 ? baseStep + boost : baseStep;

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Ajoute surtout ${baseStep}, mais toutes les ${cycleLength} étapes, ajoute aussi ${boost}. Écarts : ${differences.slice(0, 6).join(', ')}...`,
    );
  }

  private createFibonacciLikeSequence(): MathSequencePuzzle {
    const first = this.randomInt(1, 8);
    const second = this.randomInt(2, 12);
    const length = this.randomInt(7, 8);

    const sequence = [first, second];

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] + sequence[sequence.length - 2]);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Chaque nombre est la somme des deux nombres précédents.',
    );
  }

  private createTribonacciLikeSequence(): MathSequencePuzzle {
    const first = this.randomInt(1, 5);
    const second = this.randomInt(2, 6);
    const third = this.randomInt(3, 8);
    const length = 7;

    const sequence = [first, second, third];

    while (sequence.length < length) {
      sequence.push(
        sequence[sequence.length - 1] +
          sequence[sequence.length - 2] +
          sequence[sequence.length - 3],
      );
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Chaque nombre est la somme des trois nombres précédents.',
    );
  }

  private createSquaresSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 5);
    const offset = this.randomInt(-5, 8);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => {
      const number = start + index;
      return number ** 2 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      offset === 0
        ? `Ce sont des nombres carrés à partir de ${start}².`
        : `Ce sont des nombres carrés à partir de ${start}², auxquels on ${this.signedAdditionText(offset)}.`,
    );
  }

  private createCenteredPentagonalNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 4);
    const offset = this.randomInt(-4, 7);
    const length = this.randomInt(6, 8);
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return (5 * n ** 2 - 5 * n + 2) / 2 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour chaque n à partir de ' +
        start +
        ', calcule le nombre pentagonal centré (5n² − 5n + 2) ÷ 2, puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createTriangularNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 5);
    const offset = this.randomInt(-4, 8);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => {
      const number = start + index;
      return (number * (number + 1)) / 2 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      offset === 0
        ? `Ce sont des nombres triangulaires à partir de T${start}.`
        : `Ce sont des nombres triangulaires à partir de T${start}, auxquels on ${this.signedAdditionText(offset)}.`,
    );
  }

  private createPrimeDifferenceSequence(): MathSequencePuzzle {
    const primeSteps = [2, 3, 5, 7, 11, 13, 17];
    const start = this.randomInt(1, 25);
    const length = this.randomInt(6, 8);

    const sequence = [start];
    const usedSteps: number[] = [];

    while (sequence.length < length) {
      const step = primeSteps[sequence.length - 1];
      usedSteps.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les écarts sont des nombres premiers : ${usedSteps.slice(0, 5).join(', ')}...`,
    );
  }

  private createSquareDifferenceSequence(): MathSequencePuzzle {
    const squareSteps = [1, 4, 9, 16, 25, 36, 49];
    const start = this.randomInt(1, 20);
    const length = this.randomInt(6, 8);

    const sequence = [start];
    const usedSteps: number[] = [];

    while (sequence.length < length) {
      const step = squareSteps[sequence.length - 1];
      usedSteps.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les écarts sont des nombres carrés : ${usedSteps.slice(0, 5).join(', ')}...`,
    );
  }

  private createRepeatedDifferenceCycleSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 30);
    const steps = this.getRandomDistinctItems([2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
    const length = 8;

    const sequence = [start];

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] + steps[(sequence.length - 1) % steps.length]);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les écarts se répètent selon ce cycle : ${steps.join(', ')}.`,
    );
  }

  private createDoublePreviousMinusOffsetSequence(): MathSequencePuzzle {
    const start = this.randomInt(3, 20);
    const subtractAmount = this.randomInt(1, 9);
    const length = this.randomInt(6, 8);

    const sequence = [start];

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] * 2 - subtractAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `À chaque étape : double le nombre précédent, puis soustrais ${subtractAmount}.`,
    );
  }

  private createAddIncreasingOddNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 20);
    const firstOdd = this.getRandomItem([1, 3, 5, 7]);
    const length = this.randomInt(6, 8);

    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const step = firstOdd + 2 * (sequence.length - 1);
      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les écarts sont des nombres impairs croissants : ${differences.slice(0, 5).join(', ')}...`,
    );
  }

  private createAddIncreasingEvenNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 20);
    const firstEven = this.getRandomItem([2, 4, 6, 8]);
    const length = this.randomInt(6, 8);

    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const step = firstEven + 2 * (sequence.length - 1);
      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les écarts sont des nombres pairs croissants : ${differences.slice(0, 5).join(', ')}...`,
    );
  }

  private createAlternatingTwoMultipliersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 6);
    const firstMultiplier = this.getRandomItem([2, 3]);
    const secondMultiplier = this.getRandomItem([2, 4]);
    const length = this.randomInt(6, 7);

    const sequence = [start];

    while (sequence.length < length) {
      const multiplier = sequence.length % 2 === 1 ? firstMultiplier : secondMultiplier;

      sequence.push(sequence[sequence.length - 1] * multiplier);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les multiplicateurs alternent : ×${firstMultiplier}, puis ×${secondMultiplier}.`,
    );
  }

  private createPositionMultiplierSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 5);
    const addAmount = this.randomInt(0, 4);
    const length = 6;

    const sequence = [start];

    while (sequence.length < length) {
      const multiplier = sequence.length + 1;
      sequence.push(sequence[sequence.length - 1] * multiplier + addAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      addAmount === 0
        ? 'Multiplie par 2, puis 3, puis 4, puis 5...'
        : `Multiplie par 2, puis 3, puis 4, puis 5... et ajoute ${addAmount} chaque fois.`,
    );
  }

  private createLinearPlusSquareSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 4);
    const multiplier = this.randomInt(2, 6);
    const offset = this.randomInt(-5, 8);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => {
      const number = start + index;
      return number ** 2 + multiplier * number + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `Pour n = ${start}, ${start + 1}, ${start + 2}..., combine n² avec ${multiplier} × n, puis ${this.signedAdditionText(offset)}.`,
    );
  }

  private createPowersOfTwoPlusOffsetSequence(): MathSequencePuzzle {
    const offset = this.randomInt(-5, 10);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => 2 ** (index + 1) + offset);

    return this.createPuzzleFromSequence(
      sequence,
      offset === 0
        ? 'Ce sont des puissances de 2.'
        : `Ce sont des puissances de 2, auxquelles on ${this.signedAdditionText(offset)}.`,
    );
  }

  private createPowersOfThreeMinusOffsetSequence(): MathSequencePuzzle {
    const subtractAmount = this.randomInt(1, 8);
    const length = this.randomInt(5, 6);

    const sequence = Array.from({ length }, (_, index) => 3 ** (index + 1) - subtractAmount);

    return this.createPuzzleFromSequence(
      sequence,
      `Ce sont des puissances de 3, auxquelles on soustrait ${subtractAmount}.`,
    );
  }

  private createNFactorSequence(): MathSequencePuzzle {
    const factor = this.randomInt(3, 9);
    const offset = this.randomInt(-5, 8);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => {
      const n = index + 1;
      return n * factor + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `Pour n = 1, 2, 3..., calcule ${factor} × n, puis ${this.signedAdditionText(offset)}.`,
    );
  }

  private createPreviousPlusPositionSquaredSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 12);
    const length = this.randomInt(6, 8);
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const position = sequence.length;
      const step = position ** 2;
      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Ajoute des écarts carrés : ${differences.slice(0, 5).join(', ')}...`,
    );
  }

  private createPreviousPlusFibonacciDifferenceSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 15);
    const length = 8;
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const step = this.fibonacci(sequence.length + 1);

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Chaque écart est la somme des deux écarts précédents : ' +
        differences.slice(0, 6).join(', ') +
        '...',
    );
  }

  private createAlternatingPrimeAndSquareDifferencesSequence(): MathSequencePuzzle {
    const primes = [2, 3, 5, 7, 11];
    const squares = [1, 4, 9, 16, 25];
    const start = this.randomInt(1, 20);
    const length = 8;
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const stepIndex = Math.floor((sequence.length - 1) / 2);
      const step = sequence.length % 2 === 1 ? primes[stepIndex] : squares[stepIndex];

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les écarts alternent entre nombres premiers et carrés : ${differences.slice(0, 6).join(', ')}...`,
    );
  }

  private createDoubleInterleavedMultiplicationSequence(): MathSequencePuzzle {
    const firstStart = this.randomInt(1, 5);
    const secondStart = this.randomInt(2, 8);
    const firstMultiplier = this.randomInt(2, 3);
    const secondMultiplier = this.randomInt(2, 4);
    const length = 8;

    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      if (index % 2 === 0) {
        return firstStart * firstMultiplier ** innerIndex;
      }

      return secondStart * secondMultiplier ** innerIndex;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `Les positions alternées se multiplient séparément : l’une par ${firstMultiplier}, l’autre par ${secondMultiplier}.`,
    );
  }

  private createTwoPreviousPlusConstantSequence(): MathSequencePuzzle {
    const first = this.randomInt(1, 8);
    const second = this.randomInt(2, 12);
    const addAmount = this.randomInt(1, 8);
    const length = this.randomInt(7, 8);

    const sequence = [first, second];

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] + sequence[sequence.length - 2] + addAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Chaque nombre est la somme des deux nombres précédents, plus ${addAmount}.`,
    );
  }

  private createPreviousDifferenceTimesTwoSequence(): MathSequencePuzzle {
    const first = this.randomInt(20, 50);
    const second = this.randomInt(5, 19);
    const length = 7;

    const sequence = [first, second];

    while (sequence.length < length) {
      sequence.push(Math.abs(sequence[sequence.length - 2] - sequence[sequence.length - 1]) * 2);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Chaque nombre vaut deux fois l’écart entre les deux nombres précédents.',
    );
  }

  private createDescendingHalvesSequence(): MathSequencePuzzle {
    const addAmount = this.randomInt(1, 9);
    const length = 6;
    const sequence = [this.randomInt(150, 450)];

    while (sequence.length < length) {
      sequence.push(Math.floor(sequence[sequence.length - 1] / 2) + addAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `À chaque étape, divise par 2, arrondis vers le bas, puis ajoute ${addAmount}.`,
    );
  }

  private createMultiplyByIncreasingNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 5);
    const firstMultiplier = this.randomInt(2, 4);
    const length = 6;
    const sequence = [start];
    const multipliers: number[] = [];

    while (sequence.length < length) {
      const multiplier = firstMultiplier + sequence.length - 1;
      multipliers.push(multiplier);
      sequence.push(sequence[sequence.length - 1] * multiplier);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Multiplie par des nombres croissants : ${multipliers.join(', ')}...`,
    );
  }

  private createAddThenAddDoubleSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 20);
    const firstStep = this.randomInt(2, 6);
    const length = this.randomInt(6, 8);
    const sequence = [start];
    const differences: number[] = [];
    let step = firstStep;

    while (sequence.length < length) {
      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
      step *= 2;
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les écarts doublent chaque fois : ${differences.slice(0, 5).join(', ')}...`,
    );
  }

  private createNegativeArithmeticSequence(): MathSequencePuzzle {
    const start = this.randomInt(-80, -10);
    const step = this.randomInt(5, 18);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => start + step * index);

    return this.createPuzzleFromSequence(
      sequence,
      `Ajoute ${step} chaque fois. La suite commence sous zéro.`,
    );
  }

  private createAbsoluteBounceSequence(): MathSequencePuzzle {
    const start = this.randomInt(15, 40);
    const subtractAmount = this.randomInt(10, 25);
    const addAmount = this.randomInt(3, 12);
    const length = 7;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      sequence.push(
        sequence.length % 2 === 1 ? Math.abs(previous - subtractAmount) : previous + addAmount,
      );
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Alterne les opérations : soustrais ${subtractAmount} et prends la valeur absolue, puis ajoute ${addAmount}.`,
    );
  }

  private createProductOfPositionSequence(): MathSequencePuzzle {
    const offset = this.randomInt(0, 8);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => {
      const n = index + 1;
      return n * (n + 1) + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      offset === 0
        ? 'Pour chaque position n, calcule n × (n + 1).'
        : `Pour n = 1, 2, 3..., calcule n × (n + 1), puis ${this.signedAdditionText(offset)}.`,
    );
  }

  private createSquareMinusPositionSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 6);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;
      return n ** 2 - n;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `Pour chaque n à partir de ${start}, calcule n² - n.`,
    );
  }

  private createLucasTimesPositionSequence(): MathSequencePuzzle {
    const offset = this.randomInt(-3, 5);
    const length = 7;
    const lucasNumbers = [2, 1];

    while (lucasNumbers.length < length) {
      lucasNumbers.push(
        lucasNumbers[lucasNumbers.length - 1] + lucasNumbers[lucasNumbers.length - 2],
      );
    }

    const sequence = lucasNumbers.map((value, index) => value * (index + 1) + offset);

    return this.createPuzzleFromSequence(
      sequence,
      'Multiplie les nombres de Lucas 2, 1, 3, 4, 7... par leur position, puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createAlternatingSignGrowthSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 8);
    const step = this.randomInt(2, 6);
    const length = this.randomInt(7, 9);

    const sequence = Array.from({ length }, (_, index) => {
      const value = start + step * index;
      return index % 2 === 0 ? value : -value;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `La valeur absolue augmente de ${step} et le signe alterne : positif, négatif, positif...`,
    );
  }

  private createAlternatingGrowingAddSubtractSequence(): MathSequencePuzzle {
    const start = this.randomInt(20, 70);
    const addStart = this.randomInt(4, 9);
    const subtractStart = this.randomInt(2, 7);
    const growth = this.randomInt(2, 5);
    const length = this.randomInt(7, 9);
    const sequence = [start];
    const operations: string[] = [];

    while (sequence.length < length) {
      const operationIndex = sequence.length - 1;
      const previous = sequence[sequence.length - 1];

      if (operationIndex % 2 === 0) {
        const amount = addStart + growth * Math.floor(operationIndex / 2);
        operations.push(`+${amount}`);
        sequence.push(previous + amount);
      } else {
        const amount = subtractStart + growth * Math.floor(operationIndex / 2);
        operations.push(`-${amount}`);
        sequence.push(previous - amount);
      }
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Les opérations alternent et augmentent : ${operations.slice(0, 6).join(', ')}...`,
    );
  }

  private createMultiplyThenAddIncreasingOffsetSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 9);
    const multiplier = this.getRandomItem([2, 3]);
    const firstOffset = this.randomInt(1, 5);
    const offsetGrowth = this.randomInt(2, 5);
    const length = this.randomInt(5, 7);
    const sequence = [start];
    const offsets: number[] = [];

    while (sequence.length < length) {
      const offset = firstOffset + offsetGrowth * (sequence.length - 1);
      offsets.push(offset);
      sequence.push(sequence[sequence.length - 1] * multiplier + offset);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Chaque étape multiplie par ${multiplier}, puis ajoute une valeur croissante : ${offsets.slice(0, 5).join(', ')}...`,
    );
  }

  private createInterleavedFibonacciAndSquaresSequence(): MathSequencePuzzle {
    const firstStart = this.randomInt(1, 5);
    const secondStart = this.randomInt(2, 8);
    const squareOffset = this.randomInt(-3, 6);
    const length = 8;
    const fibonacciValues = [firstStart, secondStart];

    while (fibonacciValues.length < Math.ceil(length / 2)) {
      fibonacciValues.push(
        fibonacciValues[fibonacciValues.length - 1] + fibonacciValues[fibonacciValues.length - 2],
      );
    }

    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      if (index % 2 === 0) {
        return fibonacciValues[innerIndex];
      }

      return (innerIndex + 2) ** 2 + squareOffset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `Lis les positions alternées : dans une suite, chaque nombre est la somme des deux précédents; l’autre utilise des carrés auxquels on ${this.signedAdditionText(squareOffset)}.`,
    );
  }

  private createPreviousTwoDifferencePlusPositionSequence(): MathSequencePuzzle {
    const first = this.randomInt(25, 60);
    const second = this.randomInt(5, 24);
    const length = 7;
    const sequence = [first, second];

    while (sequence.length < length) {
      const position = sequence.length + 1;
      sequence.push(
        Math.abs(sequence[sequence.length - 2] - sequence[sequence.length - 1]) + position,
      );
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Chaque nombre est l’écart entre les deux nombres précédents, plus sa position.',
    );
  }

  private createSecondDifferenceCycleSequence(): MathSequencePuzzle {
    const start = this.randomInt(5, 30);
    const firstDifference = this.randomInt(3, 10);
    const secondDifferenceCycle = this.getRandomDistinctItems([2, 3, 4, 5, 6], 3);
    const length = this.randomInt(7, 9);
    const sequence = [start];
    const differences = [firstDifference];

    while (differences.length < length - 1) {
      const secondDifference =
        secondDifferenceCycle[(differences.length - 1) % secondDifferenceCycle.length];

      differences.push(differences[differences.length - 1] + secondDifference);
    }

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] + differences[sequence.length - 1]);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Observe les écarts, puis les écarts entre ceux-ci. Les écarts de second niveau suivent ce cycle : ${secondDifferenceCycle.join(', ')}.`,
    );
  }

  private createPentagonalNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 4);
    const offset = this.randomInt(-6, 9);
    const length = this.randomInt(6, 8);
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return (n * (3 * n - 1)) / 2 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour n = ' +
        start +
        ', ' +
        (start + 1) +
        ', ' +
        (start + 2) +
        '..., calcule le nombre pentagonal n × (3n − 1) ÷ 2, puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createHexagonalNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 4);
    const offset = this.randomInt(-6, 9);
    const length = this.randomInt(6, 8);
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return n * (2 * n - 1) + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour n = ' +
        start +
        ', ' +
        (start + 1) +
        ', ' +
        (start + 2) +
        '..., calcule le nombre hexagonal n × (2n − 1), puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createCenteredSquareNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 5);
    const offset = this.randomInt(-5, 8);
    const length = this.randomInt(6, 8);
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return n ** 2 + (n - 1) ** 2 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour chaque n à partir de ' +
        start +
        ', additionne n² et (n − 1)², puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createCenteredTriangularNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 5);
    const offset = this.randomInt(-5, 8);
    const length = this.randomInt(6, 8);
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return 1 + (3 * n * (n - 1)) / 2 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour chaque n à partir de ' +
        start +
        ', calcule 1 + 3n(n − 1) ÷ 2, puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createTetrahedralNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 4);
    const offset = this.randomInt(-4, 7);
    const length = this.randomInt(6, 7);
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return (n * (n + 1) * (n + 2)) / 6 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour chaque n à partir de ' +
        start +
        ', calcule le nombre tétraédrique n(n + 1)(n + 2) ÷ 6, puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createSquarePyramidalNumbersSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 3);
    const offset = this.randomInt(-4, 7);
    const length = this.randomInt(6, 7);
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return (n * (n + 1) * (2 * n + 1)) / 6 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Additionne les carrés de 1 à n pour n = ' +
        start +
        ', ' +
        (start + 1) +
        ', ' +
        (start + 2) +
        '..., puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createSquarePlusTriangularSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 4);
    const offset = this.randomInt(-5, 8);
    const length = this.randomInt(6, 8);
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return n ** 2 + (n * (n + 1)) / 2 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour chaque n à partir de ' +
        start +
        ', additionne n² et le nombre triangulaire n(n + 1) ÷ 2, puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createPreviousPlusConsecutiveProductsSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 15);
    const length = this.randomInt(7, 8);
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const n = sequence.length;
      const step = n * (n + 1);

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Les écarts sont les produits de deux nombres consécutifs : ' +
        differences.slice(0, 6).join(', ') +
        '...',
    );
  }

  private createFactorialPlusPositionSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 2);
    const positionFactor = this.randomInt(1, 4);
    const length = 6;
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return this.factorial(n) + positionFactor * n;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour chaque n à partir de ' + start + ', calcule n! puis ajoute ' + positionFactor + ' × n.',
    );
  }

  private createFactorialMinusPowerOfTwoSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 3);
    const length = 6;
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return this.factorial(n) - 2 ** n;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour chaque n à partir de ' + start + ', calcule n! − 2ⁿ.',
    );
  }

  private createCentralBinomialSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 2);
    const offset = this.randomInt(-3, 5);
    const length = 6;
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return this.binomial(2 * n, n) + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Utilise les coefficients binomiaux centraux C(2n, n) pour n à partir de ' +
        start +
        ', puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createCatalanSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 2);
    const offset = this.randomInt(-2, 4);
    const length = 6;
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return this.binomial(2 * n, n) / (n + 1) + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour n à partir de ' +
        start +
        ', divise C(2n, n) par n + 1, puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createFibonacciTimesPositionSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 3);
    const offset = this.randomInt(-3, 5);
    const length = 7;
    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;

      return this.fibonacci(n) * n + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Multiplie chaque nombre de Fibonacci par sa position n, à partir de n = ' +
        start +
        ', puis ' +
        this.signedAdditionText(offset) +
        '.',
    );
  }

  private createReverseAndAddSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([12, 13, 14, 15, 16, 17, 23, 24, 26, 27, 32, 34]);
    const length = 7;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      sequence.push(previous + this.reverseNumber(previous));
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Inverse les chiffres du nombre précédent, puis additionne les deux nombres.',
    );
  }

  private createCollatzSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([19, 23, 25, 27, 31, 33, 35, 37, 41, 43, 45, 47, 51, 53, 55]);
    const length = 9;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      sequence.push(previous % 2 === 0 ? previous / 2 : previous * 3 + 1);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Si le nombre est pair, divise-le par 2. S’il est impair, multiplie-le par 3 et ajoute 1.',
    );
  }

  private createLookAndSaySequence(): MathSequencePuzzle {
    const length = 6;
    const terms = [this.getRandomItem(['1', '11'])];

    while (terms.length < length) {
      terms.push(this.lookAndSay(terms[terms.length - 1]));
    }

    return this.createPuzzleFromSequence(
      terms.map(Number),
      'Lis le terme précédent à voix haute : indique combien de chiffres identiques se suivent.',
    );
  }

  private createDigitSumGrowthSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([14, 17, 23, 29, 38, 47, 56, 68]);
    const length = 8;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      sequence.push(previous + this.sumDigits(previous));
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Additionne les chiffres du nombre précédent, puis ajoute cette somme au nombre.',
    );
  }

  private createDigitSquareSumGrowthSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([12, 13, 16, 18, 23, 26, 34, 37]);
    const length = 7;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const squaredDigitSum = this.digitsOf(previous).reduce(
        (total, digit) => total + digit ** 2,
        0,
      );

      sequence.push(previous + squaredDigitSum);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Élève chaque chiffre du nombre précédent au carré, additionne ces carrés, puis ajoute le résultat au nombre.',
    );
  }

  private createThreeOperationCycleSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 12);
    const addAmount = this.randomInt(3, 8);
    const multiplier = this.randomInt(2, 3);
    const subtractAmount = this.randomInt(2, 7);
    const length = 9;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const operationIndex = (sequence.length - 1) % 3;

      if (operationIndex === 0) {
        sequence.push(previous + addAmount);
      } else if (operationIndex === 1) {
        sequence.push(previous * multiplier);
      } else {
        sequence.push(previous - subtractAmount);
      }
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Répète ce cycle : +' + addAmount + ', ×' + multiplier + ', −' + subtractAmount + '.',
    );
  }

  private createMultiplyAddDivideCycleSequence(): MathSequencePuzzle {
    const start = this.randomInt(3, 15);
    const multiplier = this.randomInt(2, 3);
    const addAmount = multiplier * this.randomInt(2, 6);
    const length = 9;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const operationIndex = (sequence.length - 1) % 3;

      if (operationIndex === 0) {
        sequence.push(previous * multiplier);
      } else if (operationIndex === 1) {
        sequence.push(previous + addAmount);
      } else {
        sequence.push(previous / multiplier);
      }
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Répète ce cycle : ×' + multiplier + ', +' + addAmount + ', ÷' + multiplier + '.',
    );
  }

  private createAlternatingAffineSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 8);
    const addAmount = this.randomInt(1, 5);
    const subtractAmount = this.randomInt(1, 5);
    const length = 7;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const isFirstOperation = sequence.length % 2 === 1;

      sequence.push(isFirstOperation ? previous * 2 + addAmount : previous * 2 - subtractAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Alterne les règles : ×2 puis +' + addAmount + '; ensuite ×2 puis −' + subtractAmount + '.',
    );
  }

  private createAddAddDoubleCycleSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 15);
    const addAmount = this.randomInt(2, 7);
    const length = 9;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const operationIndex = (sequence.length - 1) % 3;

      if (operationIndex === 0) {
        sequence.push(previous + addAmount);
      } else if (operationIndex === 1) {
        sequence.push(previous + 2 * addAmount);
      } else {
        sequence.push(previous * 2);
      }
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Répète ce cycle : +' + addAmount + ', +' + 2 * addAmount + ', puis ×2.',
    );
  }

  private createMultiplySubtractSubtractCycleSequence(): MathSequencePuzzle {
    const start = this.randomInt(20, 40);
    const subtractAmount = this.randomInt(2, 7);
    const length = 9;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const operationIndex = (sequence.length - 1) % 3;

      sequence.push(operationIndex === 0 ? previous * 2 : previous - subtractAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Répète ce cycle : ×2, −' + subtractAmount + ', puis encore −' + subtractAmount + '.',
    );
  }

  private createFourOperationBalanceCycleSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([4, 6, 8, 10, 12, 14]);
    const addAmount = this.getRandomItem([2, 4, 6, 8]);
    const length = 9;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const operationIndex = (sequence.length - 1) % 4;

      if (operationIndex === 0 || operationIndex === 2) {
        sequence.push(previous + addAmount);
      } else if (operationIndex === 1) {
        sequence.push(previous * 2);
      } else {
        sequence.push(previous / 2);
      }
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Répète ce cycle : +' + addAmount + ', ×2, +' + addAmount + ', puis ÷2.',
    );
  }

  private createNegativeMultiplyAddCycleSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 8);
    const addAmount = this.randomInt(5, 12);
    const length = 8;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      sequence.push(sequence.length % 2 === 1 ? previous * -2 : previous + addAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Alterne les opérations : multiplie par −2, puis ajoute ' + addAmount + '.',
    );
  }

  private createGrowingThreeOperationCycleSequence(): MathSequencePuzzle {
    const start = this.randomInt(3, 12);
    const firstAmount = this.randomInt(2, 5);
    const growth = this.randomInt(1, 3);
    const length = 9;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const operationIndex = sequence.length - 1;
      const positionInCycle = operationIndex % 3;
      const amount = firstAmount + growth * Math.floor(operationIndex / 3);

      if (positionInCycle === 0) {
        sequence.push(previous + amount);
      } else if (positionInCycle === 1) {
        sequence.push(previous * 2);
      } else {
        sequence.push(previous - amount);
      }
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Répète +a, ×2, −a. La valeur a commence à ' +
        firstAmount +
        ' et augmente de ' +
        growth +
        ' après chaque cycle.',
    );
  }

  private createPellLikeSequence(): MathSequencePuzzle {
    const first = this.randomInt(1, 3);
    const second = this.randomInt(2, 5);
    const length = 7;
    const sequence = [first, second];

    while (sequence.length < length) {
      sequence.push(2 * sequence[sequence.length - 1] + sequence[sequence.length - 2]);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Double le nombre précédent, puis ajoute le nombre placé juste avant lui.',
    );
  }

  private createJacobsthalLikeSequence(): MathSequencePuzzle {
    const first = this.randomInt(1, 4);
    const second = this.randomInt(2, 6);
    const length = 8;
    const sequence = [first, second];

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] + 2 * sequence[sequence.length - 2]);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Ajoute le nombre précédent au double du nombre placé juste avant lui.',
    );
  }

  private createTwoPreviousMinusConstantSequence(): MathSequencePuzzle {
    const first = this.randomInt(5, 12);
    const second = this.randomInt(9, 18);
    const subtractAmount = this.randomInt(2, 6);
    const length = 8;
    const sequence = [first, second];

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] + sequence[sequence.length - 2] - subtractAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Additionne les deux nombres précédents, puis soustrais ' + subtractAmount + '.',
    );
  }

  private createPreviousPlusThirdBackSequence(): MathSequencePuzzle {
    const sequence = [this.randomInt(1, 6), this.randomInt(3, 9), this.randomInt(5, 12)];
    const length = 8;

    while (sequence.length < length) {
      sequence.push(sequence[sequence.length - 1] + sequence[sequence.length - 3]);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Additionne le nombre précédent et celui situé trois places avant le nouveau terme.',
    );
  }

  private createTwoPreviousPlusPositionSequence(): MathSequencePuzzle {
    const first = this.randomInt(1, 6);
    const second = this.randomInt(3, 9);
    const length = 7;
    const sequence = [first, second];

    while (sequence.length < length) {
      const position = sequence.length + 1;

      sequence.push(sequence[sequence.length - 1] + sequence[sequence.length - 2] + position);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Additionne les deux nombres précédents, puis ajoute la position du nouveau terme.',
    );
  }

  private createAlternatingRecurrenceSequence(): MathSequencePuzzle {
    const first = this.randomInt(2, 7);
    const second = this.randomInt(5, 12);
    const length = 8;
    const sequence = [first, second];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const beforePrevious = sequence[sequence.length - 2];

      sequence.push(
        sequence.length % 2 === 0 ? previous + beforePrevious : 2 * previous - beforePrevious,
      );
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Alterne deux récurrences : additionne les deux termes précédents, puis double le dernier et soustrais l’autre.',
    );
  }

  private createWeightedTwoPreviousMinusConstantSequence(): MathSequencePuzzle {
    const first = this.randomInt(1, 5);
    const second = this.randomInt(3, 8);
    const subtractAmount = this.randomInt(1, 5);
    const length = 7;
    const sequence = [first, second];

    while (sequence.length < length) {
      sequence.push(
        2 * sequence[sequence.length - 1] + sequence[sequence.length - 2] - subtractAmount,
      );
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Double le nombre précédent, ajoute celui placé juste avant, puis soustrais ' +
        subtractAmount +
        '.',
    );
  }

  private createAlternatingDifferenceTransformSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 15);
    const firstDifference = this.randomInt(2, 5);
    const growth = this.randomInt(2, 4);
    const length = 8;
    const sequence = [start];
    const differences: number[] = [];
    let difference = firstDifference;

    while (sequence.length < length) {
      differences.push(difference);
      sequence.push(sequence[sequence.length - 1] + difference);

      difference = differences.length % 2 === 1 ? difference * 2 : difference + growth;
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Observe les écarts entre les termes : double un écart, puis ajoute ' +
        growth +
        ' au suivant, et recommence.',
    );
  }

  private createInterleavedAscendingDescendingSequence(): MathSequencePuzzle {
    const ascendingStart = this.randomInt(1, 20);
    const descendingStart = this.randomInt(70, 120);
    const increase = this.randomInt(3, 9);
    const decrease = this.randomInt(4, 11);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      return index % 2 === 0
        ? ascendingStart + increase * innerIndex
        : descendingStart - decrease * innerIndex;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Lis les positions alternées : une suite monte de ' +
        increase +
        ', l’autre descend de ' +
        decrease +
        '.',
    );
  }

  private createInterleavedTriangularAndGeometricSequence(): MathSequencePuzzle {
    const triangularStart = this.randomInt(2, 4);
    const triangularOffset = this.randomInt(-3, 5);
    const geometricStart = this.randomInt(2, 6);
    const multiplier = this.randomInt(2, 3);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      if (index % 2 === 0) {
        const n = triangularStart + innerIndex;

        return (n * (n + 1)) / 2 + triangularOffset;
      }

      return geometricStart * multiplier ** innerIndex;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Lis les positions alternées : les unes sont triangulaires, les autres sont multipliées par ' +
        multiplier +
        '.',
    );
  }

  private createInterleavedSquaresAndTriangularSequence(): MathSequencePuzzle {
    const squareStart = this.randomInt(2, 4);
    const triangularStart = this.randomInt(2, 4);
    const squareOffset = this.randomNonZeroInt(-5, 5);
    const triangularOffset = this.randomNonZeroInt(-5, 5);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      if (index % 2 === 0) {
        return (squareStart + innerIndex) ** 2 + squareOffset;
      }

      const n = triangularStart + innerIndex;

      return (n * (n + 1)) / 2 + triangularOffset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Lis les positions alternées : les unes suivent des carrés décalés, les autres des nombres triangulaires décalés.',
    );
  }

  private createInterleavedFactorialAndArithmeticSequence(): MathSequencePuzzle {
    const factorialOffset = this.randomInt(-3, 5);
    const arithmeticStart = this.randomInt(10, 30);
    const arithmeticStep = this.randomInt(4, 10);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      return index % 2 === 0
        ? this.factorial(innerIndex + 2) + factorialOffset
        : arithmeticStart + arithmeticStep * innerIndex;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Lis les positions alternées : les unes utilisent 2!, 3!, 4!...; les autres ajoutent ' +
        arithmeticStep +
        '.',
    );
  }

  private createInterleavedPowersAndPronicSequence(): MathSequencePuzzle {
    const powerOffset = this.randomInt(-3, 5);
    const pronicOffset = this.randomInt(-3, 5);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const innerIndex = Math.floor(index / 2);

      if (index % 2 === 0) {
        return 2 ** (innerIndex + 1) + powerOffset;
      }

      const n = innerIndex + 2;

      return n * (n + 1) + pronicOffset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Lis les positions alternées : les unes sont des puissances de 2 décalées; les autres valent n(n + 1).',
    );
  }

  private createDoubleMinusPositionSquaredSequence(): MathSequencePuzzle {
    const start = this.randomInt(12, 30);
    const length = 7;
    const sequence = [start];

    while (sequence.length < length) {
      const position = sequence.length + 1;

      sequence.push(sequence[sequence.length - 1] * 2 - position ** 2);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Double chaque terme, puis soustrais le carré de la position du nouveau terme : 2², 3², 4²...',
    );
  }

  private createNumberAndSquarePairsSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 6);
    const step = this.randomInt(2, 5);
    const offset = this.randomInt(-3, 5);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const base = start + step * Math.floor(index / 2);

      return index % 2 === 0 ? base : base ** 2 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Les termes vont par paires : un nombre, puis son carré auquel on ' +
        this.signedAdditionText(offset) +
        '. Les nombres de départ augmentent de ' +
        step +
        '.',
    );
  }

  private createPowerPlusPositionSequence(): MathSequencePuzzle {
    const base = this.randomInt(2, 3);
    const positionFactor = this.randomInt(1, 4);
    const length = base === 2 ? 7 : 6;
    const sequence = Array.from({ length }, (_, index) => {
      const n = index + 1;

      return base ** n + positionFactor * n;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Pour chaque position n, calcule ' + base + 'ⁿ puis ajoute ' + positionFactor + ' × n.',
    );
  }

  private createFactorialDifferenceSequence(): MathSequencePuzzle {
    const start = this.randomInt(3, 12);
    const length = 7;
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const step = this.factorial(sequence.length);

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Les écarts sont les factoriels successifs : ' + differences.slice(0, 5).join(', ') + '...',
    );
  }

  private createRepeatedGrowingAdditionSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 20);
    const firstStep = this.randomInt(2, 5);
    const growth = this.randomInt(2, 4);
    const length = 8;
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const operationIndex = sequence.length - 1;
      const step = firstStep + growth * Math.floor(operationIndex / 2);

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Chaque addition est utilisée deux fois avant d’augmenter de ' +
        growth +
        ' : ' +
        differences.slice(0, 6).join(', ') +
        '...',
    );
  }

  private createAlternatingGrowingPositiveDifferencesSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 20);
    const smallStep = this.randomInt(2, 5);
    const largeStep = this.randomInt(7, 11);
    const growth = this.randomInt(1, 3);
    const length = 8;
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const operationIndex = sequence.length - 1;
      const cycle = Math.floor(operationIndex / 2);
      const step = (operationIndex % 2 === 0 ? smallStep : largeStep) + growth * cycle;

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Les petits et les grands écarts alternent, puis augmentent de ' +
        growth +
        ' à chaque retour : ' +
        differences.slice(0, 6).join(', ') +
        '...',
    );
  }

  private createRepeatedGrowingSubtractionSequence(): MathSequencePuzzle {
    const start = this.randomInt(180, 300);
    const firstStep = this.randomInt(4, 8);
    const growth = this.randomInt(2, 4);
    const length = 8;
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const operationIndex = sequence.length - 1;
      const step = firstStep + growth * Math.floor(operationIndex / 2);

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] - step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Chaque soustraction est utilisée deux fois avant d’augmenter de ' +
        growth +
        ' : ' +
        differences.slice(0, 6).join(', ') +
        '...',
    );
  }

  private createDifferenceStaircaseSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 20);
    const firstStep = this.randomInt(2, 5);
    const growth = this.randomInt(1, 3);
    const length = 9;
    const sequence = [start];
    const differences: number[] = [];
    let step = firstStep;
    let repetitionTarget = 1;
    let repetitionCount = 0;

    while (sequence.length < length) {
      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
      repetitionCount++;

      if (repetitionCount === repetitionTarget) {
        step += growth;
        repetitionTarget++;
        repetitionCount = 0;
      }
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Ajoute un nombre une fois, le suivant deux fois, puis le suivant trois fois : ' +
        differences.slice(0, 7).join(', ') +
        '...',
    );
  }

  private createSmallThenGrowingLargeDifferenceSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 20);
    const smallStep = this.randomInt(2, 5);
    const firstLargeStep = this.randomInt(7, 11);
    const growth = this.randomInt(2, 4);
    const length = 8;
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const operationIndex = sequence.length - 1;
      const step =
        operationIndex % 2 === 0
          ? smallStep
          : firstLargeStep + growth * Math.floor(operationIndex / 2);

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Alterne toujours +' +
        smallStep +
        ' avec une addition qui augmente de ' +
        growth +
        ' : ' +
        differences.slice(0, 6).join(', ') +
        '...',
    );
  }

  private createGrowingSubtractionSequence(): MathSequencePuzzle {
    const start = this.randomInt(180, 300);
    const firstStep = this.randomInt(3, 7);
    const growth = this.randomInt(2, 4);
    const length = 8;
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const step = firstStep + growth * (sequence.length - 1);

      differences.push(step);
      sequence.push(sequence[sequence.length - 1] - step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Les soustractions augmentent de ' +
        growth +
        ' : ' +
        differences.slice(0, 6).join(', ') +
        '...',
    );
  }

  private createDoubleMinusOneDifferencesSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 15);
    const length = 7;
    const sequence = [start];
    const differences: number[] = [];
    let difference = this.randomInt(2, 5);

    while (sequence.length < length) {
      differences.push(difference);
      sequence.push(sequence[sequence.length - 1] + difference);
      difference = difference * 2 - 1;
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Chaque écart vaut le double du précédent, moins 1 : ' +
        differences.slice(0, 6).join(', ') +
        '...',
    );
  }

  private createAlternatingDifferenceGrowthSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 20);
    const firstDifference = this.randomInt(3, 6);
    const smallGrowth = this.randomInt(1, 2);
    const largeGrowth = this.randomInt(3, 5);
    const length = 8;
    const sequence = [start];
    const differences: number[] = [];
    let difference = firstDifference;

    while (sequence.length < length) {
      differences.push(difference);
      sequence.push(sequence[sequence.length - 1] + difference);
      difference += differences.length % 2 === 1 ? smallGrowth : largeGrowth;
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Les écarts augmentent alternativement de ' +
        smallGrowth +
        ' puis de ' +
        largeGrowth +
        ' : ' +
        differences.slice(0, 6).join(', ') +
        '...',
    );
  }

  private createDoubleMinusGrowingAmountSequence(): MathSequencePuzzle {
    const start = this.randomInt(5, 14);
    const firstSubtractAmount = this.randomInt(1, 3);
    const growth = this.randomInt(1, 2);
    const length = 7;
    const sequence = [start];
    const subtractions: number[] = [];

    while (sequence.length < length) {
      const subtractAmount = firstSubtractAmount + growth * (sequence.length - 1);

      subtractions.push(subtractAmount);
      sequence.push(sequence[sequence.length - 1] * 2 - subtractAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Double le nombre précédent, puis soustrais successivement ' +
        subtractions.slice(0, 5).join(', ') +
        '...',
    );
  }

  private createDoubleThenHalfPlusSequence(): MathSequencePuzzle {
    const start = this.randomInt(3, 12);
    const addAmount = this.randomInt(2, 7);
    const length = 8;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      sequence.push(sequence.length % 2 === 1 ? previous * 2 : previous / 2 + addAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Alterne les règles : double le nombre, puis divise le suivant par 2 et ajoute ' +
        addAmount +
        '.',
    );
  }

  private createTripleThenThirdPlusSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 9);
    const addAmount = this.randomInt(2, 7);
    const length = 8;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      sequence.push(sequence.length % 2 === 1 ? previous * 3 : previous / 3 + addAmount);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Alterne les règles : multiplie par 3, puis divise le suivant par 3 et ajoute ' +
        addAmount +
        '.',
    );
  }

  private createDoubleThenGrowingAdditionSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 9);
    const firstAddAmount = this.randomInt(2, 5);
    const growth = this.randomInt(1, 3);
    const length = 8;
    const sequence = [start];
    let additionCount = 0;

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];

      if (sequence.length % 2 === 1) {
        sequence.push(previous * 2);
      } else {
        const addAmount = firstAddAmount + growth * additionCount;

        sequence.push(previous + addAmount);
        additionCount++;
      }
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Alterne ×2 et une addition. Cette addition commence à ' +
        firstAddAmount +
        ' et augmente de ' +
        growth +
        ' chaque fois.',
    );
  }

  private createNumberAndDoublePairsSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 9);
    const step = this.randomInt(2, 5);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const base = start + step * Math.floor(index / 2);

      return index % 2 === 0 ? base : base * 2;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Les nombres vont par paires : un nombre, puis son double. Le premier nombre de chaque paire augmente de ' +
        step +
        '.',
    );
  }

  private createNumberAndTriplePairsSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 7);
    const step = this.randomInt(2, 5);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const base = start + step * Math.floor(index / 2);

      return index % 2 === 0 ? base : base * 3;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Les nombres vont par paires : un nombre, puis son triple. Le premier nombre de chaque paire augmente de ' +
        step +
        '.',
    );
  }

  private createNumberAndOffsetPairsSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 12);
    const step = this.randomInt(2, 4);
    const pairOffset = this.randomInt(6, 10);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const base = start + step * Math.floor(index / 2);

      return index % 2 === 0 ? base : base + pairOffset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Les nombres vont par paires : ajoute ' +
        pairOffset +
        ' dans chaque paire. Le premier nombre de chaque paire augmente de ' +
        step +
        '.',
    );
  }

  private createNumberAndReversePairsSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([12, 13, 14, 23, 24, 25, 34]);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const base = start + 11 * Math.floor(index / 2);

      return index % 2 === 0 ? base : this.reverseNumber(base);
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Les nombres vont par paires : un nombre à deux chiffres, puis ses chiffres inversés. Le nombre suivant augmente de 11.',
    );
  }

  private createNumberAndHalfPairsSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([20, 24, 28, 32, 36, 40]);
    const step = this.getRandomItem([4, 6, 8, 10]);
    const length = 8;
    const sequence = Array.from({ length }, (_, index) => {
      const base = start + step * Math.floor(index / 2);

      return index % 2 === 0 ? base : base / 2;
    });

    return this.createPuzzleFromSequence(
      sequence,
      'Les nombres vont par paires : un nombre pair, puis sa moitié. Le premier nombre de chaque paire augmente de ' +
        step +
        '.',
    );
  }

  private createLastDigitAdditionSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([12, 13, 14, 16, 17, 21, 23]);
    const length = 8;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const lastDigit = previous % 10;

      sequence.push(previous + lastDigit);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Ajoute chaque fois le dernier chiffre du nombre précédent.',
    );
  }

  private createFirstDigitAdditionSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([28, 38, 47, 58, 68, 78, 87]);
    const length = 8;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const firstDigit = Number(String(Math.abs(previous))[0]);

      sequence.push(previous + firstDigit);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Ajoute chaque fois le premier chiffre du nombre précédent.',
    );
  }

  private createDigitProductAdditionSequence(): MathSequencePuzzle {
    const start = this.getRandomItem([12, 13, 14, 16, 18, 22]);
    const length = 7;
    const sequence = [start];

    while (sequence.length < length) {
      const previous = sequence[sequence.length - 1];
      const digitProduct = this.digitsOf(previous).reduce((product, digit) => product * digit, 1);

      sequence.push(previous + digitProduct);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Multiplie les chiffres du nombre précédent entre eux, puis ajoute le résultat au nombre.',
    );
  }

  private createTwoPreviousSumAlternatingAdjustmentSequence(): MathSequencePuzzle {
    const first = this.randomInt(1, 6);
    const second = this.randomInt(4, 10);
    const addAmount = this.randomInt(2, 5);
    const subtractAmount = this.randomInt(1, 3);
    const length = 8;
    const sequence = [first, second];

    while (sequence.length < length) {
      const previousSum = sequence[sequence.length - 1] + sequence[sequence.length - 2];
      const adjustment = sequence.length % 2 === 0 ? addAmount : -subtractAmount;

      sequence.push(previousSum + adjustment);
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Additionne les deux nombres précédents, puis alterne +' +
        addAmount +
        ' et −' +
        subtractAmount +
        '.',
    );
  }

  private createTwoPreviousDifferencePlusConstantSequence(): MathSequencePuzzle {
    const first = this.randomInt(25, 50);
    const second = this.randomInt(5, 20);
    const addAmount = this.randomInt(5, 12);
    const length = 8;
    const sequence = [first, second];

    while (sequence.length < length) {
      sequence.push(
        Math.abs(sequence[sequence.length - 1] - sequence[sequence.length - 2]) + addAmount,
      );
    }

    return this.createPuzzleFromSequence(
      sequence,
      'Prends l’écart entre les deux nombres précédents, puis ajoute ' + addAmount + '.',
    );
  }

  private createPuzzleFromSequence(sequence: number[], hint: string): MathSequencePuzzle {
    const missingIndex = sequence.length - 1;

    return {
      sequence,
      missingIndex,
      answer: sequence[missingIndex],
      hint,
    };
  }

  private signedAdditionText(value: number): string {
    if (value > 0) {
      return `ajoute ${value}`;
    }

    if (value < 0) {
      return `soustrais ${Math.abs(value)}`;
    }

    return 'n’ajoute rien';
  }

  private factorial(value: number): number {
    let result = 1;

    for (let factor = 2; factor <= value; factor++) {
      result *= factor;
    }

    return result;
  }

  private binomial(total: number, selected: number): number {
    const smallerSelection = Math.min(selected, total - selected);
    let result = 1;

    for (let index = 1; index <= smallerSelection; index++) {
      result = (result * (total - smallerSelection + index)) / index;
    }

    return Math.round(result);
  }

  private fibonacci(position: number): number {
    if (position <= 2) {
      return 1;
    }

    let previous = 1;
    let current = 1;

    for (let index = 3; index <= position; index++) {
      [previous, current] = [current, previous + current];
    }

    return current;
  }

  private reverseNumber(value: number): number {
    return Number(Math.abs(value).toString().split('').reverse().join(''));
  }

  private digitsOf(value: number): number[] {
    return Math.abs(value).toString().split('').map(Number);
  }

  private sumDigits(value: number): number {
    return this.digitsOf(value).reduce((total, digit) => total + digit, 0);
  }

  private lookAndSay(value: string): string {
    let result = '';
    let runLength = 1;

    for (let index = 1; index <= value.length; index++) {
      if (value[index] === value[index - 1]) {
        runLength++;
        continue;
      }

      result += String(runLength) + value[index - 1];
      runLength = 1;
    }

    return result;
  }

  private getRandomDistinctItems<T>(items: T[], count: number): T[] {
    return this.shuffle(items).slice(0, count);
  }

  private randomNonZeroInt(min: number, max: number): number {
    let value = this.randomInt(min, max);

    while (value === 0) {
      value = this.randomInt(min, max);
    }

    return value;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private shuffle<T>(items: T[]): T[] {
    const shuffledItems = [...items];

    for (let index = shuffledItems.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));

      [shuffledItems[index], shuffledItems[swapIndex]] = [
        shuffledItems[swapIndex],
        shuffledItems[index],
      ];
    }

    return shuffledItems;
  }
}

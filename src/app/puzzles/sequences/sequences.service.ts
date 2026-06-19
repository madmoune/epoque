import { Injectable } from '@angular/core';
import { MathSequencePuzzle } from './sequences.model';

type MathTemplate = () => MathSequencePuzzle;

@Injectable({
  providedIn: 'root',
})
export class SequencesService {
  createPuzzle(): MathSequencePuzzle {
    const templates: MathTemplate[] = [
      () => this.createGeometricSequence(),
      () => this.createIncreasingDifferenceSequence(),
      () => this.createDecreasingDifferenceSequence(),
      () => this.createAlternatingAddSubtractSequence(),
      () => this.createAlternatingMultiplyAddSequence(),
      () => this.createMultiplyThenAddSequence(),
      () => this.createMultiplyThenSubtractSequence(),
      () => this.createInterleavedArithmeticSequence(),
      () => this.createInterleavedArithmeticAndGeometricSequence(),
      () => this.createInterleavedArithmeticAndSquaresSequence(),
      () => this.createArithmeticWithPeriodicBoostSequence(),
      () => this.createFibonacciLikeSequence(),
      () => this.createTribonacciLikeSequence(),
      () => this.createSquaresSequence(),
      () => this.createCubesSequence(),
      () => this.createTriangularNumbersSequence(),
      () => this.createPrimeDifferenceSequence(),
      () => this.createSquareDifferenceSequence(),
      () => this.createRepeatedDifferenceCycleSequence(),
      () => this.createDoublePreviousMinusOffsetSequence(),
      () => this.createAddIncreasingOddNumbersSequence(),
      () => this.createAddIncreasingEvenNumbersSequence(),
      () => this.createAlternatingTwoMultipliersSequence(),
      () => this.createPositionMultiplierSequence(),
      () => this.createLinearPlusSquareSequence(),

      // New variety
      () => this.createPowersOfTwoPlusOffsetSequence(),
      () => this.createPowersOfThreeMinusOffsetSequence(),
      () => this.createPreviousPlusPositionSquaredSequence(),
      () => this.createPreviousPlusPositionCubedSequence(),
      () => this.createAlternatingPrimeAndSquareDifferencesSequence(),
      () => this.createDoubleInterleavedMultiplicationSequence(),
      () => this.createTwoPreviousPlusConstantSequence(),
      () => this.createDescendingHalvesSequence(),
      () => this.createMultiplyByIncreasingNumbersSequence(),
      () => this.createAddThenAddDoubleSequence(),
      () => this.createProductOfPositionSequence(),
      () => this.createSquareMinusPositionSequence(),
      () => this.createCubeMinusSquareSequence(),
      () => this.createAlternatingSignGrowthSequence(),
      () => this.createAlternatingGrowingAddSubtractSequence(),
      () => this.createMultiplyThenAddIncreasingOffsetSequence(),
      () => this.createInterleavedFibonacciAndSquaresSequence(),
      () => this.createSecondDifferenceCycleSequence(),
    ];

    return this.getRandomItem(templates)();
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
      `Les positions alternées suivent deux règles : une suite arithmétique ajoute ${arithmeticStep}, l’autre utilise des carrés auxquels on ajoute ${squareOffset}.`,
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
        : `Ce sont des nombres carrés à partir de ${start}², auxquels on ajoute ${offset}.`,
    );
  }

  private createCubesSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 4);
    const offset = this.randomInt(-4, 6);
    const length = this.randomInt(5, 6);

    const sequence = Array.from({ length }, (_, index) => {
      const number = start + index;
      return number ** 3 + offset;
    });

    return this.createPuzzleFromSequence(
      sequence,
      offset === 0
        ? `Ce sont des nombres cubiques à partir de ${start}³.`
        : `Ce sont des nombres cubiques à partir de ${start}³, auxquels on ajoute ${offset}.`,
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
        : `Ce sont des nombres triangulaires à partir de T${start}, auxquels on ajoute ${offset}.`,
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
      `Pour chaque position n, combine n² avec ${multiplier} × n, puis ajoute ${offset}.`,
    );
  }

  private createPowersOfTwoPlusOffsetSequence(): MathSequencePuzzle {
    const offset = this.randomInt(-5, 10);
    const length = this.randomInt(6, 8);

    const sequence = Array.from({ length }, (_, index) => 2 ** (index + 1) + offset);

    return this.createPuzzleFromSequence(
      sequence,
      offset === 0 ? 'Ce sont des puissances de 2.' : `Ce sont des puissances de 2, auxquelles on ajoute ${offset}.`,
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
      `Pour chaque position n, calcule ${factor} × n, puis ajoute ${offset}.`,
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

  private createPreviousPlusPositionCubedSequence(): MathSequencePuzzle {
    const start = this.randomInt(1, 10);
    const length = 6;
    const sequence = [start];
    const differences: number[] = [];

    while (sequence.length < length) {
      const position = sequence.length;
      const step = position ** 3;
      differences.push(step);
      sequence.push(sequence[sequence.length - 1] + step);
    }

    return this.createPuzzleFromSequence(
      sequence,
      `Ajoute des écarts cubiques : ${differences.join(', ')}...`,
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
        : `Pour chaque position n, calcule n × (n + 1), puis ajoute ${offset}.`,
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

  private createCubeMinusSquareSequence(): MathSequencePuzzle {
    const start = this.randomInt(2, 4);
    const length = 5;

    const sequence = Array.from({ length }, (_, index) => {
      const n = start + index;
      return n ** 3 - n ** 2;
    });

    return this.createPuzzleFromSequence(
      sequence,
      `Pour chaque n à partir de ${start}, calcule n³ - n².`,
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
      `Les positions alternées suivent deux règles : des valeurs de type Fibonacci, puis des carrés auxquels on ajoute ${squareOffset}.`,
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

  private createPuzzleFromSequence(sequence: number[], hint: string): MathSequencePuzzle {
    const missingIndex = sequence.length - 1;

    return {
      sequence,
      missingIndex,
      answer: sequence[missingIndex],
      hint,
    };
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

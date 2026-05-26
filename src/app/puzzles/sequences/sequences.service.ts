import { Injectable } from '@angular/core';
import { MathSequencePuzzle } from './sequences.model';

type MathTemplate = () => MathSequencePuzzle;

@Injectable({
    providedIn: 'root',
})
export class SequencesService {
    createPuzzle(): MathSequencePuzzle {
        const templates: MathTemplate[] = [
            () => this.createArithmeticSequence(),
            () => this.createGeometricSequence(),
            () => this.createIncreasingDifferenceSequence(),
            () => this.createDecreasingDifferenceSequence(),
            () => this.createAlternatingAddSubtractSequence(),
            () => this.createAlternatingMultiplyAddSequence(),
            () => this.createMultiplyThenAddSequence(),
            () => this.createMultiplyThenSubtractSequence(),
            () => this.createInterleavedArithmeticSequence(),
            () => this.createInterleavedArithmeticAndGeometricSequence(),
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
            () => this.createNFactorSequence(),
            () => this.createPreviousPlusPositionSquaredSequence(),
            () => this.createPreviousPlusPositionCubedSequence(),
            () => this.createAlternatingPrimeAndSquareDifferencesSequence(),
            () => this.createDoubleInterleavedMultiplicationSequence(),
            () => this.createTwoPreviousPlusConstantSequence(),
            () => this.createPreviousDifferenceTimesTwoSequence(),
            () => this.createDescendingHalvesSequence(),
            () => this.createMultiplyByIncreasingNumbersSequence(),
            () => this.createAddThenAddDoubleSequence(),
            () => this.createNegativeArithmeticSequence(),
            () => this.createAbsoluteBounceSequence(),
            () => this.createProductOfPositionSequence(),
            () => this.createSquareMinusPositionSequence(),
            () => this.createCubeMinusSquareSequence(),
            () => this.createAlternatingSignGrowthSequence(),
        ];

        return this.getRandomItem(templates)();
    }

    private createArithmeticSequence(): MathSequencePuzzle {
        const start = this.randomInt(-20, 40);
        const step = this.randomNonZeroInt(-12, 12);
        const length = this.randomInt(6, 8);

        const sequence = Array.from(
            { length },
            (_, index) => start + step * index,
        );

        return this.createPuzzleFromSequence(
            sequence,
            step > 0
                ? `Add ${step} each time.`
                : `Subtract ${Math.abs(step)} each time.`,
        );
    }

    private createGeometricSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 8);
        const multiplier = this.getRandomItem([2, 3, 4]);
        const length = this.randomInt(5, 7);

        const sequence = Array.from(
            { length },
            (_, index) => start * multiplier ** index,
        );

        return this.createPuzzleFromSequence(
            sequence,
            `Multiply by ${multiplier} each time.`,
        );
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
            `The differences are ${differences.slice(0, 4).join(', ')}... They increase by ${increase}.`,
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
            `The subtractions are ${differences.slice(0, 4).join(', ')}... They decrease by ${decrease}.`,
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

            sequence.push(
                sequence.length % 2 === 1
                    ? previous + addAmount
                    : previous - subtractAmount,
            );
        }

        return this.createPuzzleFromSequence(
            sequence,
            `Alternate operations: add ${addAmount}, then subtract ${subtractAmount}.`,
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

            sequence.push(
                sequence.length % 2 === 1
                    ? previous * multiplier
                    : previous + addAmount,
            );
        }

        return this.createPuzzleFromSequence(
            sequence,
            `Alternate operations: multiply by ${multiplier}, then add ${addAmount}.`,
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
            `Each step: multiply by ${multiplier}, then add ${addAmount}.`,
        );
    }

    private createMultiplyThenSubtractSequence(): MathSequencePuzzle {
        const start = this.randomInt(4, 12);
        const multiplier = this.randomInt(2, 3);
        const subtractAmount = this.randomInt(1, 8);
        const length = this.randomInt(5, 7);

        const sequence = [start];

        while (sequence.length < length) {
            sequence.push(
                sequence[sequence.length - 1] * multiplier - subtractAmount,
            );
        }

        return this.createPuzzleFromSequence(
            sequence,
            `Each step: multiply by ${multiplier}, then subtract ${subtractAmount}.`,
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
            `Look at alternating positions. Positions 1, 3, 5... change by ${firstStep}. Positions 2, 4, 6... change by ${secondStep}.`,
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
            `Look at alternating positions. Positions 1, 3, 5... add ${firstStep}. Positions 2, 4, 6... multiply by ${secondMultiplier}.`,
        );
    }

    private createFibonacciLikeSequence(): MathSequencePuzzle {
        const first = this.randomInt(1, 8);
        const second = this.randomInt(2, 12);
        const length = this.randomInt(7, 8);

        const sequence = [first, second];

        while (sequence.length < length) {
            sequence.push(
                sequence[sequence.length - 1] + sequence[sequence.length - 2],
            );
        }

        return this.createPuzzleFromSequence(
            sequence,
            'Each number is the sum of the two previous numbers.',
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
            'Each number is the sum of the three previous numbers.',
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
                ? `These are square numbers starting at ${start}².`
                : `These are square numbers starting at ${start}², with ${offset} added.`,
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
                ? `These are cube numbers starting at ${start}³.`
                : `These are cube numbers starting at ${start}³, with ${offset} added.`,
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
                ? `These are triangular numbers starting at T${start}.`
                : `These are triangular numbers starting at T${start}, with ${offset} added.`,
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
            `The differences are prime numbers: ${usedSteps.slice(0, 5).join(', ')}...`,
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
            `The differences are square numbers: ${usedSteps.slice(0, 5).join(', ')}...`,
        );
    }

    private createRepeatedDifferenceCycleSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 30);
        const steps = this.getRandomDistinctItems([2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
        const length = 8;

        const sequence = [start];

        while (sequence.length < length) {
            sequence.push(
                sequence[sequence.length - 1] +
                steps[(sequence.length - 1) % steps.length],
            );
        }

        return this.createPuzzleFromSequence(
            sequence,
            `The differences repeat in this cycle: ${steps.join(', ')}.`,
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
            `Each step: double the previous number, then subtract ${subtractAmount}.`,
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
            `The differences are increasing odd numbers: ${differences.slice(0, 5).join(', ')}...`,
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
            `The differences are increasing even numbers: ${differences.slice(0, 5).join(', ')}...`,
        );
    }

    private createAlternatingTwoMultipliersSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 6);
        const firstMultiplier = this.getRandomItem([2, 3]);
        const secondMultiplier = this.getRandomItem([2, 4]);
        const length = this.randomInt(6, 7);

        const sequence = [start];

        while (sequence.length < length) {
            const multiplier =
                sequence.length % 2 === 1 ? firstMultiplier : secondMultiplier;

            sequence.push(sequence[sequence.length - 1] * multiplier);
        }

        return this.createPuzzleFromSequence(
            sequence,
            `The multipliers alternate: ×${firstMultiplier}, then ×${secondMultiplier}.`,
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
                ? 'Multiply by 2, then 3, then 4, then 5...'
                : `Multiply by 2, then 3, then 4, then 5... and add ${addAmount} each time.`,
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
            `For each position n, combine n² with ${multiplier} × n, then add ${offset}.`,
        );
    }

    private createPowersOfTwoPlusOffsetSequence(): MathSequencePuzzle {
        const offset = this.randomInt(-5, 10);
        const length = this.randomInt(6, 8);

        const sequence = Array.from(
            { length },
            (_, index) => 2 ** (index + 1) + offset,
        );

        return this.createPuzzleFromSequence(
            sequence,
            offset === 0
                ? 'These are powers of 2.'
                : `These are powers of 2, with ${offset} added.`,
        );
    }

    private createPowersOfThreeMinusOffsetSequence(): MathSequencePuzzle {
        const subtractAmount = this.randomInt(1, 8);
        const length = this.randomInt(5, 6);

        const sequence = Array.from(
            { length },
            (_, index) => 3 ** (index + 1) - subtractAmount,
        );

        return this.createPuzzleFromSequence(
            sequence,
            `These are powers of 3, with ${subtractAmount} subtracted.`,
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
            `For each position n, calculate ${factor} × n, then add ${offset}.`,
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
            `Add square-number steps: ${differences.slice(0, 5).join(', ')}...`,
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
            `Add cube-number steps: ${differences.join(', ')}...`,
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
            const step =
                sequence.length % 2 === 1 ? primes[stepIndex] : squares[stepIndex];

            differences.push(step);
            sequence.push(sequence[sequence.length - 1] + step);
        }

        return this.createPuzzleFromSequence(
            sequence,
            `The differences alternate between primes and squares: ${differences.slice(0, 6).join(', ')}...`,
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
            `Alternating positions multiply separately: one by ${firstMultiplier}, the other by ${secondMultiplier}.`,
        );
    }

    private createTwoPreviousPlusConstantSequence(): MathSequencePuzzle {
        const first = this.randomInt(1, 8);
        const second = this.randomInt(2, 12);
        const addAmount = this.randomInt(1, 8);
        const length = this.randomInt(7, 8);

        const sequence = [first, second];

        while (sequence.length < length) {
            sequence.push(
                sequence[sequence.length - 1] +
                sequence[sequence.length - 2] +
                addAmount,
            );
        }

        return this.createPuzzleFromSequence(
            sequence,
            `Each number is the sum of the two previous numbers, plus ${addAmount}.`,
        );
    }

    private createPreviousDifferenceTimesTwoSequence(): MathSequencePuzzle {
        const first = this.randomInt(20, 50);
        const second = this.randomInt(5, 19);
        const length = 7;

        const sequence = [first, second];

        while (sequence.length < length) {
            sequence.push(
                Math.abs(sequence[sequence.length - 2] - sequence[sequence.length - 1]) *
                2,
            );
        }

        return this.createPuzzleFromSequence(
            sequence,
            'Each number is twice the difference between the two previous numbers.',
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
            `Each step divides by 2, rounds down, then adds ${addAmount}.`,
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
            `Multiply by increasing numbers: ${multipliers.join(', ')}...`,
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
            `The differences double each time: ${differences.slice(0, 5).join(', ')}...`,
        );
    }

    private createNegativeArithmeticSequence(): MathSequencePuzzle {
        const start = this.randomInt(-80, -10);
        const step = this.randomInt(5, 18);
        const length = this.randomInt(6, 8);

        const sequence = Array.from(
            { length },
            (_, index) => start + step * index,
        );

        return this.createPuzzleFromSequence(
            sequence,
            `Add ${step} each time. The sequence starts below zero.`,
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
                sequence.length % 2 === 1
                    ? Math.abs(previous - subtractAmount)
                    : previous + addAmount,
            );
        }

        return this.createPuzzleFromSequence(
            sequence,
            `Alternate operations: subtract ${subtractAmount} and take the absolute value, then add ${addAmount}.`,
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
                ? 'For each position n, calculate n × (n + 1).'
                : `For each position n, calculate n × (n + 1), then add ${offset}.`,
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
            `For each n starting at ${start}, calculate n² - n.`,
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
            `For each n starting at ${start}, calculate n³ - n².`,
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
            `The absolute value increases by ${step}, and the sign alternates positive, negative, positive...`,
        );
    }

    private createPuzzleFromSequence(
        sequence: number[],
        hint: string,
    ): MathSequencePuzzle {
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
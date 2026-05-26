import { Injectable } from '@angular/core';
import { MathSequencePuzzle } from './sequences.model';

type MathTemplate = () => MathSequencePuzzle;

@Injectable({
    providedIn: 'root',
})
export class SequencesService {
    createPuzzle(): MathSequencePuzzle {
        const templates: MathTemplate[] = [
            () => this.createSecondDifferenceSequence(),
            () => this.createAlternatingOperationsSequence(),
            () => this.createInterleavedSequence(),
            () => this.createMultiplyThenAddSequence(),
            () => this.createCubesSequence(),
            () => this.createFibonacciLikeSequence(),
            () => this.createReverseDifferenceSequence(),
            () => this.createPrimeStepSequence(),
            () => this.createAlternatingAddSubtractSequence(),
            () => this.createDoubleInterleavedSequence(),
            () => this.createTriangularNumbersSequence(),
            () => this.createSquareDifferenceSequence(),
            () => this.createMultiplyMinusSequence(),
            () => this.createAlternatingMultiplyAddSequence(),
            () => this.createPowerPlusLinearSequence(),
            () => this.createRepeatedDifferencePairSequence(),
            () => this.createDescendingMultiplySequence(),
            () => this.createModuloCycleDifferenceSequence(),
        ];

        return this.getRandomItem(templates)();
    }

    private createSecondDifferenceSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 12);
        const firstStep = this.randomInt(2, 7);
        const stepIncrease = this.randomInt(2, 5);

        const sequence = [start];
        let step = firstStep;

        while (sequence.length < 7) {
            sequence.push(sequence[sequence.length - 1] + step);
            step += stepIncrease;
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `Look at the differences between numbers. The difference increases by ${stepIncrease} each time.`,
        );
    }

    private createAlternatingOperationsSequence(): MathSequencePuzzle {
        const start = this.randomInt(3, 12);
        const addAmount = this.randomInt(4, 11);
        const multiplyAmount = this.randomInt(2, 3);

        const sequence = [start];

        while (sequence.length < 7) {
            const previous = sequence[sequence.length - 1];

            if (sequence.length % 2 === 1) {
                sequence.push(previous + addAmount);
            } else {
                sequence.push(previous * multiplyAmount);
            }
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `The pattern alternates: add ${addAmount}, then multiply by ${multiplyAmount}.`,
        );
    }

    private createInterleavedSequence(): MathSequencePuzzle {
        const firstStart = this.randomInt(1, 9);
        const secondStart = this.randomInt(10, 20);
        const firstStep = this.randomInt(2, 6);
        const secondStep = this.randomInt(3, 8);

        const sequence = Array.from({ length: 8 }, (_, index) => {
            if (index % 2 === 0) {
                return firstStart + firstStep * (index / 2);
            }

            return secondStart + secondStep * Math.floor(index / 2);
        });

        return this.createMathPuzzleFromSequence(
            sequence,
            `Odd and even positions follow separate patterns. One goes up by ${firstStep}, the other by ${secondStep}.`,
        );
    }

    private createMultiplyThenAddSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 6);
        const multiplier = this.randomInt(2, 3);
        const addition = this.randomInt(1, 8);

        const sequence = [start];

        while (sequence.length < 6) {
            sequence.push(sequence[sequence.length - 1] * multiplier + addition);
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `Each step multiplies by ${multiplier}, then adds ${addition}.`,
        );
    }

    private createCubesSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 3);
        const addition = this.randomInt(0, 4);

        const sequence = Array.from(
            { length: 6 },
            (_, index) => (start + index) ** 3 + addition,
        );

        return this.createMathPuzzleFromSequence(
            sequence,
            addition === 0
                ? 'These are consecutive cube numbers.'
                : `These are consecutive cube numbers, then ${addition} is added.`,
        );
    }

    private createFibonacciLikeSequence(): MathSequencePuzzle {
        const first = this.randomInt(1, 8);
        const second = this.randomInt(2, 10);
        const sequence = [first, second];

        while (sequence.length < 7) {
            sequence.push(
                sequence[sequence.length - 1] + sequence[sequence.length - 2],
            );
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            'Each number is the sum of the two numbers before it.',
        );
    }

    private createReverseDifferenceSequence(): MathSequencePuzzle {
        const start = this.randomInt(70, 120);
        const firstStep = this.randomInt(18, 30);
        const stepDecrease = this.randomInt(2, 5);

        const sequence = [start];
        let step = firstStep;

        while (sequence.length < 7) {
            sequence.push(sequence[sequence.length - 1] - step);
            step -= stepDecrease;
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `The amount subtracted decreases by ${stepDecrease} each time.`,
        );
    }

    private createPrimeStepSequence(): MathSequencePuzzle {
        const primeSteps = [2, 3, 5, 7, 11, 13, 17];
        const start = this.randomInt(1, 15);
        const sequence = [start];

        for (let index = 0; index < 6; index++) {
            sequence.push(sequence[sequence.length - 1] + primeSteps[index]);
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            'The differences are consecutive prime numbers: 2, 3, 5, 7, 11...',
        );
    }

    private createAlternatingAddSubtractSequence(): MathSequencePuzzle {
        const start = this.randomInt(10, 35);
        const addAmount = this.randomInt(5, 14);
        const subtractAmount = this.randomInt(2, 9);

        const sequence = [start];

        while (sequence.length < 8) {
            const previous = sequence[sequence.length - 1];

            sequence.push(
                sequence.length % 2 === 1
                    ? previous + addAmount
                    : previous - subtractAmount,
            );
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `The pattern alternates: add ${addAmount}, then subtract ${subtractAmount}.`,
        );
    }

    private createDoubleInterleavedSequence(): MathSequencePuzzle {
        const firstStart = this.randomInt(2, 12);
        const secondStart = this.randomInt(3, 15);
        const firstMultiplier = this.randomInt(2, 3);
        const secondStep = this.randomInt(4, 9);

        const sequence = Array.from({ length: 8 }, (_, index) => {
            const innerIndex = Math.floor(index / 2);

            if (index % 2 === 0) {
                return firstStart * firstMultiplier ** innerIndex;
            }

            return secondStart + secondStep * innerIndex;
        });

        return this.createMathPuzzleFromSequence(
            sequence,
            `Even positions multiply by ${firstMultiplier}. Odd positions add ${secondStep}.`,
        );
    }

    private createTriangularNumbersSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 4);
        const offset = this.randomInt(0, 8);

        const sequence = Array.from({ length: 7 }, (_, index) => {
            const n = start + index;
            return (n * (n + 1)) / 2 + offset;
        });

        return this.createMathPuzzleFromSequence(
            sequence,
            offset === 0
                ? 'These are triangular numbers.'
                : `These are triangular numbers with ${offset} added.`,
        );
    }

    private createSquareDifferenceSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 10);
        const squareSteps = [1, 4, 9, 16, 25, 36];

        const sequence = [start];

        for (const step of squareSteps) {
            sequence.push(sequence[sequence.length - 1] + step);
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            'The differences are square numbers: 1, 4, 9, 16...',
        );
    }

    private createMultiplyMinusSequence(): MathSequencePuzzle {
        const start = this.randomInt(3, 9);
        const multiplier = this.randomInt(2, 3);
        const subtractAmount = this.randomInt(1, 6);

        const sequence = [start];

        while (sequence.length < 6) {
            sequence.push(
                sequence[sequence.length - 1] * multiplier - subtractAmount,
            );
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `Each step multiplies by ${multiplier}, then subtracts ${subtractAmount}.`,
        );
    }

    private createAlternatingMultiplyAddSequence(): MathSequencePuzzle {
        const start = this.randomInt(2, 10);
        const firstMultiplier = this.randomInt(2, 3);
        const secondMultiplier = this.randomInt(2, 4);
        const addition = this.randomInt(1, 5);

        const sequence = [start];

        while (sequence.length < 7) {
            const previous = sequence[sequence.length - 1];

            sequence.push(
                sequence.length % 2 === 1
                    ? previous * firstMultiplier + addition
                    : previous * secondMultiplier + addition,
            );
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `The multiplier alternates, but ${addition} is added every time.`,
        );
    }

    private createPowerPlusLinearSequence(): MathSequencePuzzle {
        const exponent = this.getRandomItem([2, 3]);
        const multiplier = this.randomInt(1, 4);
        const offset = this.randomInt(0, 6);
        const start = this.randomInt(1, 3);

        const sequence = Array.from({ length: 6 }, (_, index) => {
            const n = start + index;
            return n ** exponent + multiplier * n + offset;
        });

        return this.createMathPuzzleFromSequence(
            sequence,
            exponent === 2
                ? 'The pattern combines square numbers with a steadily increasing amount.'
                : 'The pattern combines cube numbers with a steadily increasing amount.',
        );
    }

    private createRepeatedDifferencePairSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 20);
        const firstStep = this.randomInt(2, 8);
        const secondStep = this.randomInt(9, 16);

        const sequence = [start];

        while (sequence.length < 8) {
            const step = sequence.length % 2 === 1 ? firstStep : secondStep;
            sequence.push(sequence[sequence.length - 1] + step);
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `The differences alternate between ${firstStep} and ${secondStep}.`,
        );
    }

    private createDescendingMultiplySequence(): MathSequencePuzzle {
        const start = this.randomInt(180, 420);
        const divisor = this.getRandomItem([2, 3]);
        const addition = this.randomInt(1, 8);

        const sequence = [start];

        while (sequence.length < 6) {
            sequence.push(
                Math.floor(sequence[sequence.length - 1] / divisor) + addition,
            );
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `Each step divides by ${divisor}, then adds ${addition}.`,
        );
    }

    private createModuloCycleDifferenceSequence(): MathSequencePuzzle {
        const start = this.randomInt(1, 12);
        const steps = this.getRandomDistinctItems([2, 4, 6, 8, 10, 12], 3);
        const sequence = [start];

        while (sequence.length < 8) {
            sequence.push(
                sequence[sequence.length - 1] +
                steps[(sequence.length - 1) % steps.length],
            );
        }

        return this.createMathPuzzleFromSequence(
            sequence,
            `The differences repeat in a cycle: ${steps.join(', ')}.`,
        );
    }

    private createMathPuzzleFromSequence(
        sequence: number[],
        hint: string,
    ): MathSequencePuzzle {
        const missingIndex = this.randomInt(
            Math.max(3, sequence.length - 4),
            sequence.length - 1,
        );

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
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MemoryGridColor,
  MemoryGridShape,
} from '../../memory-grid/memory-grid.model';

type MastermindColor = Exclude<MemoryGridColor, 'purple'>;

type MastermindPiece = {
  color: MastermindColor;
  shape: MemoryGridShape;
};

type PlayerPiece = {
  color: MastermindColor | null;
  shape: MemoryGridShape | null;
};

type Feedback = {
  placed: number;
  present: number;
};

type GuessResult = {
  pieces: MastermindPiece[];
  colorFeedback: Feedback;
  shapeFeedback: Feedback;
};

type PiecePart = 'color' | 'shape';
type GameMode = 'duo' | 'classic';

const CODE_LENGTH = 4;

@Component({
  selector: 'app-mastermind-page',
  imports: [RouterLink],
  templateUrl: './mastermind.page.html',
  styleUrl: './mastermind.page.scss',
})
export class MastermindPage {
  protected readonly colors: MastermindColor[] = [
    'blue',
    'red',
    'gray',
    'yellow',
    'green',
    'orange',
    'pink',
  ];
  protected readonly shapes: MemoryGridShape[] = [
    'circle',
    'square',
    'rectangle',
    'triangle',
    'losange',
    'pentagon',
    'hexagon',
  ];

  protected readonly mode = signal<GameMode>('classic');
  protected readonly secret = signal<MastermindPiece[]>(this.createSecret());
  protected readonly currentGuess = signal<PlayerPiece[]>(this.createEmptyGuess());
  protected readonly selectedIndex = signal(0);
  protected readonly results = signal<GuessResult[]>([]);

  protected readonly slots = Array.from({ length: CODE_LENGTH }, (_, index) => index);
  protected readonly isClassic = computed(() => this.mode() === 'classic');
  protected readonly isComplete = computed(() =>
    this.currentGuess().every((piece) => piece.color && (this.isClassic() || piece.shape)),
  );
  protected readonly isSolved = computed(() => {
    const latestResult = this.results()[0];

    return Boolean(
      latestResult &&
        latestResult.colorFeedback.placed === CODE_LENGTH &&
        (this.isClassic() || latestResult.shapeFeedback.placed === CODE_LENGTH),
    );
  });

  protected setMode(mode: GameMode): void {
    if (this.mode() === mode) {
      return;
    }

    this.mode.set(mode);
    this.newGame();
  }

  protected selectSlot(index: number): void {
    if (this.isSolved()) {
      return;
    }

    this.selectedIndex.set(index);
  }

  protected selectColor(color: MastermindColor): void {
    this.updateCurrentPiece('color', color);
  }

  protected selectShape(shape: MemoryGridShape): void {
    this.updateCurrentPiece('shape', shape);
  }

  protected submitGuess(): void {
    if (!this.isComplete() || this.isSolved()) {
      return;
    }

    const pieces = this.currentGuess().map((piece) => ({
      color: piece.color!,
      shape: piece.shape ?? 'circle',
    }));

    this.results.update((results) => [
      {
        pieces,
        colorFeedback: this.createFeedback(
          this.secret().map((piece) => piece.color),
          pieces.map((piece) => piece.color),
        ),
        shapeFeedback: this.createFeedback(
          this.secret().map((piece) => piece.shape),
          pieces.map((piece) => piece.shape),
        ),
      },
      ...results,
    ]);
    this.currentGuess.set(this.createEmptyGuess());
    this.selectedIndex.set(0);
  }

  protected clearGuess(): void {
    if (this.isSolved()) {
      return;
    }

    this.currentGuess.set(this.createEmptyGuess());
    this.selectedIndex.set(0);
  }

  protected newGame(): void {
    this.secret.set(this.createSecret());
    this.currentGuess.set(this.createEmptyGuess());
    this.selectedIndex.set(0);
    this.results.set([]);
  }

  protected colorLabel(color: MastermindColor): string {
    const labels: Record<MastermindColor, string> = {
      blue: 'bleu',
      red: 'rouge',
      gray: 'gris',
      yellow: 'jaune',
      green: 'vert',
      orange: 'orange',
      pink: 'rose',
    };

    return labels[color];
  }

  protected shapeLabel(shape: MemoryGridShape): string {
    const labels: Record<MemoryGridShape, string> = {
      circle: 'cercle',
      square: 'carré',
      rectangle: 'rectangle',
      triangle: 'triangle',
      losange: 'losange',
      pentagon: 'pentagone',
      hexagon: 'hexagone',
    };

    return labels[shape];
  }

  private updateCurrentPiece(part: PiecePart, value: MastermindColor | MemoryGridShape): void {
    const selectedIndex = this.selectedIndex();

    this.currentGuess.update((guess) =>
      guess.map((piece, index) =>
        index === selectedIndex
          ? {
              ...piece,
              [part]: value,
            }
          : piece,
      ),
    );

    if (this.isComplete()) {
      this.submitGuess();
      return;
    }

    const guess = this.currentGuess();
    const nextSamePart = Array.from(
      { length: CODE_LENGTH },
      (_, offset) => (selectedIndex + offset + 1) % CODE_LENGTH,
    ).find((index) => !guess[index][part]);

    if (nextSamePart !== undefined) {
      this.selectedIndex.set(nextSamePart);
      return;
    }

    const otherPart: PiecePart = part === 'shape' ? 'color' : 'shape';
    const nextOtherPart = guess.findIndex((piece) => !piece[otherPart]);

    if (nextOtherPart !== -1) {
      this.selectedIndex.set(nextOtherPart);
    }
  }

  private createSecret(): MastermindPiece[] {
    return Array.from({ length: CODE_LENGTH }, () => ({
      color: this.randomItem(this.colors),
      shape: this.randomItem(this.shapes),
    }));
  }

  private createEmptyGuess(): PlayerPiece[] {
    return Array.from({ length: CODE_LENGTH }, () => ({
      color: null,
      shape: null,
    }));
  }

  private createFeedback<T>(answer: T[], guess: T[]): Feedback {
    const placed = guess.filter((value, index) => value === answer[index]).length;
    const answerRemainder = answer.filter((value, index) => value !== guess[index]);
    const guessRemainder = guess.filter((value, index) => value !== answer[index]);
    let present = 0;

    for (const value of guessRemainder) {
      const answerIndex = answerRemainder.indexOf(value);

      if (answerIndex === -1) {
        continue;
      }

      present += 1;
      answerRemainder.splice(answerIndex, 1);
    }

    return { placed, present };
  }

  private randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}

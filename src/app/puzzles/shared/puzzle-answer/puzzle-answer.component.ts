import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type PuzzleAnswerStatus = 'correct' | 'incorrect' | 'partial';

export interface PuzzleAnswerResult {
  status: PuzzleAnswerStatus;
  message?: string;
}

export interface PuzzleAnswerAttempt {
  id: number;
  answer: string;
  result: PuzzleAnswerResult;
}

export type PuzzleAnswerValidator = (answer: string) => PuzzleAnswerResult;
export type PuzzleAnswerValue = string | string[];

export interface PuzzlePartialAnswer {
  answer: string;
  message: string;
}

@Component({
  selector: 'app-puzzle-answer',
  imports: [FormsModule],
  templateUrl: './puzzle-answer.component.html',
  styleUrl: './puzzle-answer.component.scss',
})
export class PuzzleAnswerComponent {
  @Input() answer: PuzzleAnswerValue = [];
  @Input() partials: PuzzlePartialAnswer[] = [];
  @Input() validateAnswer?: PuzzleAnswerValidator;
  @Input() label = 'Réponse';
  @Input() placeholder = '';
  @Input() submitLabel = 'Valider';
  @Input() emptyAnswerMessage = 'Entre une réponse avant de valider.';
  @Input() correctText = 'Correct';
  @Input() incorrectText = 'Incorrect';
  @Input() partialText = 'Partiel';
  @Input() lockOnCorrect = true;
  @Input() clearAfterSubmit = true;

  @Output() answerSubmitted = new EventEmitter<PuzzleAnswerAttempt>();
  @Output() correctAnswer = new EventEmitter<PuzzleAnswerAttempt>();

  protected readonly answerInput = signal('');
  protected readonly attempts = signal<PuzzleAnswerAttempt[]>([]);
  protected readonly formMessage = signal('');
  protected readonly isLocked = computed(
    () =>
      this.lockOnCorrect && this.attempts().some((attempt) => attempt.result.status === 'correct'),
  );

  private nextAttemptId = 1;

  protected updateAnswer(value: string): void {
    this.answerInput.set(value);
    this.formMessage.set('');
  }

  protected submitAnswer(): void {
    if (this.isLocked()) {
      return;
    }

    const answer = this.answerInput().trim();

    if (answer.length === 0) {
      this.formMessage.set(this.emptyAnswerMessage);
      return;
    }

    const attempt: PuzzleAnswerAttempt = {
      id: this.nextAttemptId,
      answer,
      result: this.withDefaultMessage(this.checkAnswer(answer)),
    };

    this.nextAttemptId += 1;
    this.attempts.update((attempts) => [attempt, ...attempts]);
    this.answerSubmitted.emit(attempt);

    if (attempt.result.status === 'correct') {
      this.answerInput.set(answer);
      this.correctAnswer.emit(attempt);
      return;
    }

    if (this.clearAfterSubmit) {
      this.answerInput.set('');
    }
  }

  protected statusText(result: PuzzleAnswerResult): string {
    if (result.status === 'correct') {
      return this.correctText;
    }

    if (result.status === 'partial') {
      return this.partialText;
    }

    return this.incorrectText;
  }

  protected resultMessage(result: PuzzleAnswerResult): string | null {
    const message = result.message?.trim();

    if (!message || message === this.statusText(result)) {
      return null;
    }

    return message;
  }

  private checkAnswer(answer: string): PuzzleAnswerResult {
    if (this.validateAnswer) {
      return this.validateAnswer(answer);
    }

    if (this.matches(answer, this.answer)) {
      return {
        status: 'correct',
        message: this.correctText,
      };
    }

    const partial = this.partials.find((partialAnswer) =>
      this.matches(answer, partialAnswer.answer),
    );

    if (partial) {
      return {
        status: 'partial',
        message: partial.message,
      };
    }

    return {
      status: 'incorrect',
      message: this.incorrectText,
    };
  }

  private matches(answer: string, expectedAnswers: PuzzleAnswerValue): boolean {
    const normalizedAnswer = this.normalize(answer);
    const expectedAnswerList = Array.isArray(expectedAnswers) ? expectedAnswers : [expectedAnswers];

    return expectedAnswerList.some(
      (expectedAnswer) => this.normalize(expectedAnswer) === normalizedAnswer,
    );
  }

  private normalize(value: string): string {
    return value
      .trim()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  }

  private withDefaultMessage(result: PuzzleAnswerResult): PuzzleAnswerResult {
    if (result.message) {
      return result;
    }

    return {
      ...result,
      message: this.statusText(result),
    };
  }
}

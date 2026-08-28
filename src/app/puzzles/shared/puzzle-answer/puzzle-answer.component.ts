import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { PuzzleSuccessPopupComponent } from '../puzzle-success-popup/puzzle-success-popup.component';

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
  imports: [PuzzleSuccessPopupComponent],
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
  @Input() correctText = 'Bonne réponse';
  @Input() incorrectText = 'Mauvaise réponse';
  @Input() partialText = 'Partiel';
  @Input() autoValidate = false;
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
  protected readonly popupAttempt = computed(() => {
    const latestAttempt = this.attempts()[0];

    return latestAttempt && latestAttempt.result.status !== 'incorrect' ? latestAttempt : null;
  });

  protected popupTitle(attempt: PuzzleAnswerAttempt): string {
    return attempt.result.status === 'correct' ? 'Énigme résolue!' : 'Réponse partielle';
  }

  protected popupMessage(attempt: PuzzleAnswerAttempt): string {
    return attempt.result.message ?? this.statusText(attempt.result);
  }

  private nextAttemptId = 1;

  protected updateAnswer(value: string): void {
    this.answerInput.set(value);
    this.formMessage.set('');

    if (this.autoValidate && this.isCompleteAnswer(value)) {
      this.submitAnswer();
    }
  }

  protected submitAnswer(event?: Event): void {
    event?.preventDefault();

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

  private isCompleteAnswer(value: string): boolean {
    const normalizedLength = this.normalize(value).length;

    if (normalizedLength === 0) {
      return false;
    }

    const expectedAnswers = Array.isArray(this.answer) ? this.answer : [this.answer];
    const expectedLengths = [
      ...expectedAnswers.map((answer) => this.normalize(answer).length),
      ...this.partials.map((partial) => this.normalize(partial.answer).length),
    ];

    return expectedLengths.includes(normalizedLength);
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

import { Component, ElementRef, HostListener, ViewChild, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type ArithmeticProblem = {
  expression: string;
  answer: number;
};

@Component({
  selector: 'app-mental-arithmetic-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './mental-arithmetic.page.html',
  styleUrl: './mental-arithmetic.page.scss',
})
export class MentalArithmeticPage {
  @ViewChild('answerField')
  private readonly answerField?: ElementRef<HTMLInputElement>;

  protected readonly problem = signal<ArithmeticProblem>(this.createProblem());
  protected readonly answer = signal('');
  protected readonly isSolved = signal(false);
  protected readonly keyboardVisible = signal(false);
  protected readonly hintLevel = signal(0);
  protected readonly viewportWidth = signal(typeof window === 'undefined' ? 820 : window.innerWidth);
  protected readonly numberKeyboardRows: CustomKeyboardKey[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['-', '0', 'backspace'],
  ];

  protected readonly isCorrect = computed(
    () => this.answer().trim().length > 0 && Number(this.answer()) === this.problem().answer,
  );
  protected readonly displayExpression = computed(() => this.formatExpression(this.problem().expression));
  protected readonly answerHint = computed(() => {
    if (this.hintLevel() === 0) {
      return '';
    }

    const answer = String(this.problem().answer);
    const revealedLength = Math.min(this.hintLevel(), answer.length);

    return answer
      .split('')
      .map((character, index) => (index < revealedLength ? character : '_'))
      .join(' ');
  });
  protected readonly maxHintLevel = computed(() => String(this.problem().answer).length);
  protected readonly equationSize = computed(() => {
    const width = this.viewportWidth();
    const compact = width <= 600;
    const availableWidth = compact ? Math.max(240, width - 52) : Math.min(760, width - 96);
    const weight = this.measureExpressionWeight(this.problem().expression);
    const estimatedCharacterWidth = compact ? 0.6 : 0.56;
    const minimumSize = compact ? 0.68 : 1.35;
    const maximumSize = compact ? 1.28 : 4.2;
    const size = Math.max(
      minimumSize,
      Math.min(maximumSize, availableWidth / (weight * estimatedCharacterWidth * 16)),
    );
    return `${size}rem`;
  });

  protected updateAnswer(value: string): void {
    if (this.isSolved()) {
      return;
    }

    this.answer.set(value.replace(/[^\d-]/g, '').slice(0, 8));
    if (this.isCorrect()) {
      this.isSolved.set(true);
    }
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    if (this.isSolved()) {
      return;
    }

    if (key === 'backspace') {
      this.updateAnswer(this.answer().slice(0, -1));
      this.focusAnswerField();
      return;
    }

    if (key === 'clear' || key === 'space') {
      return;
    }

    if (key === '-') {
      this.updateAnswer(this.answer().startsWith('-') ? this.answer().slice(1) : `-${this.answer()}`);
      this.focusAnswerField();
      return;
    }

    this.updateAnswer(`${this.answer()}${key}`);
    this.focusAnswerField();
  }

  protected showKeyboard(): void {
    if (this.isSolved()) {
      return;
    }

    this.keyboardVisible.set(true);
    window.setTimeout(() => this.answerField?.nativeElement.select());
  }

  protected showHint(): void {
    if (this.isSolved()) {
      return;
    }

    this.hintLevel.update((level) => Math.min(level + 1, this.maxHintLevel()));
  }

  protected nextProblem(): void {
    this.problem.set(this.createProblem());
    this.answer.set('');
    this.isSolved.set(false);
    this.hintLevel.set(0);
    this.focusAnswerField();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (
      target.closest('.answer-input') ||
      target.closest('app-custom-keyboard') ||
      target.closest('app-puzzle-success-popup')
    ) {
      return;
    }

    this.keyboardVisible.set(false);
  }

  @HostListener('window:resize')
  protected updateViewportWidth(): void {
    this.viewportWidth.set(window.innerWidth);
  }

  private createProblem(): ArithmeticProblem {
    const type = this.randomInt(0, 7);

    if (type === 0) {
      const a = this.randomInt(2, 9);
      const b = this.randomInt(3, 14);
      const c = this.randomInt(2, 8);
      const d = this.randomInt(2, 6);
      const e = this.randomInt(4, 30);
      const f = this.randomInt(2, 9);
      const root = this.randomInt(2, 12);
      return {
        expression: `(${a} + ${b}) x ${c} - ${d}^2 + (${e} - ${f}) + sqrt(${root ** 2})`,
        answer: (a + b) * c - d ** 2 + (e - f) + root,
      };
    }

    if (type === 1) {
      const a = this.randomInt(4, 12);
      const b = this.randomInt(2, 9);
      const c = this.randomInt(3, 12);
      const d = this.randomInt(5, 40);
      const e = this.randomInt(2, 20);
      const f = this.randomInt(2, 6);
      const root = this.randomInt(3, 10);
      return {
        expression: `${a}^2 + (${b} x ${c}) - (${d} - ${e}) + sqrt(${root ** 2}) + ${f}`,
        answer: a ** 2 + b * c - (d - e) + root + f,
      };
    }

    if (type === 2) {
      const a = this.randomInt(3, 11);
      const b = this.randomInt(2, 8);
      const c = this.randomInt(2, 9);
      const d = this.randomInt(2, 6);
      const f = this.randomInt(2, 7);
      const e = f * this.randomInt(3, 8);
      const root = this.randomInt(2, 9);
      return {
        expression: `${a} x (${b} + ${c}) - ${d}^2 + (${e} / ${f} x ${f}) - sqrt(${root ** 2})`,
        answer: a * (b + c) - d ** 2 + e - root,
      };
    }

    if (type === 3) {
      const a = this.randomInt(2, 8);
      const b = this.randomInt(2, 9);
      const c = this.randomInt(3, 12);
      const d = this.randomInt(2, 8);
      const e = this.randomInt(4, 24);
      const f = this.randomInt(2, 10);
      const root = this.randomInt(2, 12);
      return {
        expression: `(${a} + ${b})^2 - (${c} x ${d} - ${e}) + sqrt(${root ** 2}) + ${f}`,
        answer: (a + b) ** 2 - (c * d - e) + root + f,
      };
    }

    if (type === 4) {
      const divisor = this.randomInt(2, 5);
      const base = divisor * this.randomInt(2, 4);
      const extra = this.randomInt(2, 8);
      const tail = this.randomInt(3, 9);
      const multiplier = this.randomInt(2, 7);
      const offset = this.randomInt(2, 12);
      const root = this.randomInt(2, 8);
      return {
        expression: `(${base}^2 + ${divisor * extra}) / ${divisor} + (${tail} x ${multiplier} - ${offset}) + sqrt(${root ** 2})`,
        answer: (base ** 2 + divisor * extra) / divisor + (tail * multiplier - offset) + root,
      };
    }

    if (type === 5) {
      const a = this.randomInt(8, 18);
      const b = this.randomInt(2, 9);
      const c = this.randomInt(2, 9);
      const d = this.randomInt(2, 5);
      const e = this.randomInt(3, 12);
      const f = this.randomInt(2, 7);
      const root = this.randomInt(4, 12);
      return {
        expression: `${a}^2 - (${b} + ${c}) x ${d} + (${e} + ${f}^2) - sqrt(${root ** 2})`,
        answer: a ** 2 - (b + c) * d + (e + f ** 2) - root,
      };
    }

    if (type === 6) {
      const quotient = this.randomInt(6, 18);
      const divisor = this.randomInt(2, 9);
      const a = this.randomInt(1, divisor - 1);
      const b = this.randomInt(2, 8);
      const c = this.randomInt(2, 6);
      const d = this.randomInt(2, 9);
      const root = this.randomInt(2, 9);
      return {
        expression: `${quotient * divisor} / (${a} + ${divisor - a}) + ${b}^2 - (${c} + ${d}) + sqrt(${root ** 2})`,
        answer: quotient + b ** 2 - (c + d) + root,
      };
    }

    const a = this.randomInt(2, 7);
    const b = this.randomInt(2, 8);
    const c = this.randomInt(2, 5);
    const d = this.randomInt(4, 14);
    const e = this.randomInt(2, 9);
    const f = this.randomInt(2, 12);
    const root = this.randomInt(3, 11);
    return {
      expression: `(${a} x ${b} + ${c}) x ${d} - ${e}^2 + ${f} + sqrt(${root ** 2})`,
      answer: (a * b + c) * d - e ** 2 + f + root,
    };
  }

  private randomInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  private measureExpressionWeight(expression: string): number {
    return expression.replace(/sqrt\((\d+)\)/g, '√$1').replace(/\^2/g, '²').length;
  }

  private focusAnswerField(): void {
    window.setTimeout(() => this.answerField?.nativeElement.focus());
  }

  private formatExpression(expression: string): string {
    return expression
      .replace(/\(([^()]+)\) \/ (\d+)/g, (_, numerator: string, denominator: string) =>
        this.formatFraction(numerator, denominator),
      )
      .replace(/(\d+) \/ \(([^()]+)\)/g, (_, numerator: string, denominator: string) =>
        this.formatFraction(numerator, denominator),
      )
      .replace(/(\d+) \/ (\d+)/g, (_, numerator: string, denominator: string) =>
        this.formatFraction(numerator, denominator),
      )
      .replace(/sqrt\((\d+)\)/g, (_, radicand: string) => this.formatSquareRoot(radicand))
      .replace(/\^2/g, '<sup>2</sup>');
  }

  private formatFraction(numerator: string, denominator: string): string {
    return `<span class="fraction"><span>${numerator}</span><span>${denominator}</span></span>`;
  }

  private formatSquareRoot(radicand: string): string {
    return `<span class="square-root"><span class="radical">√</span><span class="radicand">${radicand}</span></span>`;
  }
}

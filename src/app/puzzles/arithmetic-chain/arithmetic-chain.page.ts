import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { createArithmeticChain } from './arithmetic-chain.logic';

const frenchNumber = new Intl.NumberFormat('fr-CA');

@Component({
  selector: 'app-arithmetic-chain-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './arithmetic-chain.page.html',
  styleUrl: './arithmetic-chain.page.scss',
})
export class ArithmeticChainPage {
  @ViewChild('answerField')
  private readonly answerField?: ElementRef<HTMLInputElement>;

  private readonly playHistory = inject(PuzzlePlayHistoryService);

  protected readonly chain = signal(createArithmeticChain());
  protected readonly answer = signal('');
  protected readonly incorrect = signal(false);
  protected readonly isSolved = signal(false);
  protected readonly revealedSteps = signal(0);
  protected readonly keyboardVisible = signal(false);
  protected readonly numberKeyboardRows: CustomKeyboardKey[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', 'backspace'],
  ];
  protected readonly canRevealHint = computed(
    () => !this.isSolved() && this.revealedSteps() < this.chain().steps.length - 1,
  );

  protected format(value: number): string {
    return frenchNumber.format(value);
  }

  protected updateAnswer(value: string): void {
    if (this.isSolved()) return;
    this.answer.set(value);
    this.incorrect.set(false);
    this.checkAnswer();
  }

  protected checkAnswer(): void {
    if (this.isSolved()) return;

    const digits = this.answer().replace(/\s/g, '');
    if (!digits) return;
    if (!/^\d+$/.test(digits) || Number(digits) !== this.chain().answer) {
      this.incorrect.set(true);
      return;
    }

    this.incorrect.set(false);
    this.isSolved.set(true);
    this.playHistory.markSolved('/calcul-en-chaine');
  }

  protected showKeyboard(): void {
    if (this.isSolved()) return;
    this.keyboardVisible.set(true);
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    if (this.isSolved()) return;

    if (key === 'backspace') {
      this.updateAnswer(this.answer().slice(0, -1));
    } else if (key !== 'clear' && key !== 'space') {
      this.updateAnswer(`${this.answer()}${key}`.slice(0, 16));
    }

    this.focusAnswerField();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      target.closest('.answer-input') ||
      target.closest('button') ||
      target.closest('app-custom-keyboard') ||
      target.closest('app-puzzle-success-popup')
    ) {
      return;
    }
    this.keyboardVisible.set(false);
  }

  protected revealHint(): void {
    if (this.canRevealHint()) this.revealedSteps.update((count) => count + 1);
  }

  protected restart(): void {
    this.answer.set('');
    this.incorrect.set(false);
    this.isSolved.set(false);
    this.revealedSteps.set(0);
  }

  protected newChain(): void {
    this.chain.set(createArithmeticChain(this.chain().start));
    this.restart();
  }

  private focusAnswerField(): void {
    window.setTimeout(() => this.answerField?.nativeElement.focus());
  }
}

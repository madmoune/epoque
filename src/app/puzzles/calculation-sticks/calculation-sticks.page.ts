import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  createCalculationSticks,
  formatCalculationSticks,
  STICK_LENGTH,
} from './calculation-sticks.logic';

const SYMBOL_NAMES: Record<string, string> = { '+': 'plus', '−': 'moins', '×': 'fois' };

@Component({
  selector: 'app-calculation-sticks-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './calculation-sticks.page.html',
  styleUrl: './calculation-sticks.page.scss',
})
export class CalculationSticksPage {
  @ViewChild('answerField')
  private readonly answerField?: ElementRef<HTMLInputElement>;

  private readonly playHistory = inject(PuzzlePlayHistoryService);

  protected readonly stickLength = STICK_LENGTH;
  protected readonly puzzle = signal(createCalculationSticks());
  protected readonly lifted = signal(0);
  protected readonly answer = signal('');
  protected readonly notice = signal('');
  protected readonly stickHint = signal(false);
  protected readonly calculationHint = signal(false);
  protected readonly solved = signal(false);
  protected readonly keyboardVisible = signal(false);
  protected readonly numberKeyboardRows: CustomKeyboardKey[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', 'backspace'],
  ];
  protected readonly pileEmpty = computed(() => this.lifted() === this.puzzle().sticks.length);
  protected readonly visibleSticks = computed(() =>
    this.puzzle()
      .sticks.slice(this.lifted())
      .sort((first, second) => first.y - second.y || first.x - second.x),
  );
  protected readonly expression = computed(() =>
    formatCalculationSticks(
      this.puzzle()
        .sticks.slice(0, this.lifted())
        .map(({ symbol }) => symbol)
        .join(''),
    ),
  );

  protected label(symbol: string, vertical: boolean): string {
    return `Bâtonnet ${vertical ? 'vertical' : 'horizontal'}, ${SYMBOL_NAMES[symbol] ?? symbol}`;
  }

  protected liftStick(id: number): void {
    if (this.pileEmpty() || this.solved()) return;
    if (id !== this.lifted()) {
      this.notice.set('Soulève d’abord le bâtonnet qui passe au-dessus.');
      return;
    }

    this.lifted.update((count) => count + 1);
    this.stickHint.set(false);
    this.notice.set('');
    if (this.pileEmpty()) this.checkAnswer();
  }

  protected revealHint(): void {
    if (this.solved()) return;
    if (this.pileEmpty()) {
      this.calculationHint.set(true);
    } else {
      this.stickHint.set(true);
      this.notice.set('Le bâtonnet dégagé est entouré.');
    }
  }

  protected updateAnswer(value: string): void {
    if (this.solved()) return;
    this.answer.set(value);
    this.notice.set('');
    if (this.pileEmpty() && value.trim().length >= String(this.puzzle().answer).length) {
      this.checkAnswer();
    }
  }

  protected checkAnswer(): void {
    if (this.solved()) return;
    if (!this.pileEmpty()) {
      this.notice.set('Soulève tous les bâtonnets avant de valider.');
      return;
    }
    const value = this.answer().trim();
    if (value.length < String(this.puzzle().answer).length) return;
    if (!/^\d+$/.test(value) || Number(value) !== this.puzzle().answer) {
      this.notice.set('Essaie encore en commençant par la multiplication.');
      return;
    }

    this.solved.set(true);
    this.notice.set('');
    this.keyboardVisible.set(false);
    this.playHistory.markSolved('/batonnets-de-calcul');
  }

  protected showKeyboard(): void {
    if (this.solved()) return;
    this.keyboardVisible.set(true);
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    if (this.solved()) return;

    if (key === 'backspace') {
      this.updateAnswer(this.answer().slice(0, -1));
    } else if (key !== 'clear' && key !== 'space') {
      this.updateAnswer(`${this.answer()}${key}`.slice(0, 6));
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

  protected restart(): void {
    this.lifted.set(0);
    this.answer.set('');
    this.notice.set('');
    this.stickHint.set(false);
    this.calculationHint.set(false);
    this.solved.set(false);
    this.keyboardVisible.set(false);
  }

  protected newPuzzle(): void {
    this.puzzle.update((previous) => createCalculationSticks(previous));
    this.restart();
  }

  private focusAnswerField(): void {
    window.setTimeout(() => this.answerField?.nativeElement.focus());
  }
}

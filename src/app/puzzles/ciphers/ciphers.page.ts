import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import { CipherPuzzle, CipherType, CiphersService } from './ciphers.service';

@Component({
  selector: 'app-ciphers-page',
  imports: [FormsModule, RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './ciphers.page.html',
  styleUrl: './ciphers.page.scss',
})
export class CiphersPage {
  @ViewChild('answerField')
  private readonly answerField?: ElementRef<HTMLInputElement>;
  private suppressNextSelection = false;

  private readonly router = inject(Router);
  private readonly ciphersService = inject(CiphersService);

  protected readonly cipherOptions = this.ciphersService.cipherOptions;
  protected readonly selectedCipher = signal<CipherType>('caesar');
  protected readonly puzzle = signal<CipherPuzzle | null>(null);
  protected readonly answerInput = signal('');
  protected readonly hintLevel = signal(0);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly keyboardVisible = signal(false);
  protected readonly letterKeyboardRows: CustomKeyboardKey[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
    ['clear'],
  ];
  protected readonly pigpenSquareKeys = [
    [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
    ],
    [
      ['J', 'K', 'L'],
      ['M', 'N', 'O'],
      ['P', 'Q', 'R'],
    ],
  ];
  protected readonly pigpenXKeys = [
    { top: 'S', right: 'T', bottom: 'U', left: 'V', dotted: false },
    { top: 'W', right: 'X', bottom: 'Y', left: 'Z', dotted: true },
  ];
  protected readonly tapCodeGrid = [
    ['A', 'B', 'C', 'D', 'E'],
    ['F', 'G', 'H', 'I/J', 'K'],
    ['L', 'M', 'N', 'O', 'P'],
    ['Q', 'R', 'S', 'T', 'U'],
    ['V', 'W', 'X', 'Y', 'Z'],
  ];

  protected readonly isCorrect = computed(() => {
    const puzzle = this.puzzle();
    return puzzle ? this.ciphersService.isCorrectAnswer(this.answerInput(), puzzle.normalizedAnswer) : false;
  });

  protected readonly cipherLegend = computed(() => this.ciphersService.legendFor(this.selectedCipher()));

  protected readonly hintText = computed(() => {
    const puzzle = this.puzzle();
    if (!puzzle || this.hintLevel() === 0) {
      return '';
    }

    if (this.hintLevel() === 1) {
      return `${puzzle.normalizedAnswer.length} lettres`;
    }

    return `Commence par: ${puzzle.answer.slice(0, Math.min(2, puzzle.answer.length))}`;
  });

  protected pigpenSymbolClass(letter: string): string {
    const normalizedLetter = letter.toLowerCase();
    const baseClass = this.pigpenBaseClasses[normalizedLetter] ?? '';
    const dottedClass = this.pigpenHasDot(normalizedLetter) ? ' dotted' : '';

    return `pigpen-symbol ${baseClass}${dottedClass}`;
  }

  protected pigpenHasDot(letter: string): boolean {
    return /^[j-rw-z]$/.test(letter.toLowerCase());
  }

  protected isBrailleDotActive(letter: string, dot: number): boolean {
    return this.brailleDotsByLetter[letter.toLowerCase()]?.includes(dot) ?? false;
  }

  protected semaphoreArmClassesForLetter(letter: string): string[] {
    return this.semaphoreArmClasses(this.semaphorePositionsByLetter[letter.toLowerCase()] ?? '');
  }

  protected semaphoreArmClasses(symbol: string): string[] {
    return symbol
      .split(',')
      .map((position) => position.trim())
      .filter(Boolean)
      .map((position) => `position-${position}`);
  }

  constructor() {
    void this.loadPuzzle();
  }

  protected chooseCipher(cipher: CipherType): void {
    this.selectedCipher.set(cipher);
    this.nextPuzzle();
  }

  protected chooseRandomCipher(): void {
    const randomCipher = this.randomCipher();
    this.chooseCipher(randomCipher);
  }

  protected updateAnswer(value: string): void {
    this.answerInput.set(value);
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    if (this.isCorrect()) return;

    if (key === 'backspace') {
      this.answerInput.update((answer) => answer.slice(0, -1));
      this.focusAnswerField(false);
      return;
    }

    if (key === 'clear') {
      this.answerInput.set('');
      this.focusAnswerField(false);
      return;
    }

    if (key === 'space') return;

    this.answerInput.update((answer) => `${answer}${key}`);
    this.focusAnswerField(false);
  }

  protected selectInputContent(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.keyboardVisible.set(true);
      if (this.suppressNextSelection) {
        this.suppressNextSelection = false;
        return;
      }
      event.target.select();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      target.closest('.answer-input') ||
      target.closest('app-custom-keyboard') ||
      target.closest('app-puzzle-success-popup')
    ) {
      return;
    }
    this.keyboardVisible.set(false);
  }

  protected showHint(): void {
    this.hintLevel.update((level) => Math.min(level + 1, 2));
  }

  protected nextPuzzle(): void {
    this.puzzle.set(this.ciphersService.createPuzzle(this.selectedCipher()));
    this.answerInput.set('');
    this.hintLevel.set(0);
    this.focusAnswerField(false);
  }

  private async loadPuzzle(): Promise<void> {
    try {
      await this.ciphersService.loadWords();
      if (this.cameFromRandom()) {
        this.selectedCipher.set(this.randomCipher());
      }
      this.nextPuzzle();
    } catch {
      this.loadError.set('Impossible de charger la liste de mots codes.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private focusAnswerField(selectOnFocus = true): void {
    this.suppressNextSelection = !selectOnFocus;
    window.setTimeout(() => this.answerField?.nativeElement.focus());
  }

  private cameFromRandom(): boolean {
    return new URLSearchParams(this.router.url.split('?')[1]?.split('#')[0] ?? '').get('from') === 'random';
  }

  private randomCipher(): CipherType {
    return this.cipherOptions[Math.floor(Math.random() * this.cipherOptions.length)]?.type ?? 'caesar';
  }

  private readonly pigpenBaseClasses: Record<string, string> = {
    a: 'grid right bottom',
    b: 'grid right bottom left',
    c: 'grid bottom left',
    d: 'grid top right bottom',
    e: 'grid top right bottom left',
    f: 'grid top bottom left',
    g: 'grid top right',
    h: 'grid top right left',
    i: 'grid top left',
    j: 'grid right bottom',
    k: 'grid right bottom left',
    l: 'grid bottom left',
    m: 'grid top right bottom',
    n: 'grid top right bottom left',
    o: 'grid top bottom left',
    p: 'grid top right',
    q: 'grid top right left',
    r: 'grid top left',
    s: 'angle angle-top',
    t: 'angle angle-right',
    u: 'angle angle-bottom',
    v: 'angle angle-left',
    w: 'angle angle-top',
    x: 'angle angle-right',
    y: 'angle angle-bottom',
    z: 'angle angle-left',
  };

  private readonly brailleDotsByLetter: Record<string, number[]> = {
    a: [1],
    b: [1, 2],
    c: [1, 4],
    d: [1, 4, 5],
    e: [1, 5],
    f: [1, 2, 4],
    g: [1, 2, 4, 5],
    h: [1, 2, 5],
    i: [2, 4],
    j: [2, 4, 5],
    k: [1, 3],
    l: [1, 2, 3],
    m: [1, 3, 4],
    n: [1, 3, 4, 5],
    o: [1, 3, 5],
    p: [1, 2, 3, 4],
    q: [1, 2, 3, 4, 5],
    r: [1, 2, 3, 5],
    s: [2, 3, 4],
    t: [2, 3, 4, 5],
    u: [1, 3, 6],
    v: [1, 2, 3, 6],
    w: [2, 4, 5, 6],
    x: [1, 3, 4, 6],
    y: [1, 3, 4, 5, 6],
    z: [1, 3, 5, 6],
  };

  private readonly semaphorePositionsByLetter: Record<string, string> = {
    a: '6,7',
    b: '5,7',
    c: '4,7',
    d: '3,7',
    e: '2,7',
    f: '1,7',
    g: '0,7',
    h: '5,6',
    i: '4,6',
    j: '3,6',
    k: '2,6',
    l: '1,6',
    m: '0,6',
    n: '4,5',
    o: '3,5',
    p: '2,5',
    q: '1,5',
    r: '0,5',
    s: '3,4',
    t: '2,4',
    u: '1,4',
    v: '0,4',
    w: '2,3',
    x: '1,3',
    y: '0,3',
    z: '0,2',
  };
}

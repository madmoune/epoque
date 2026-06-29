import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

export type CustomKeyboardKey = string | 'backspace' | 'clear' | 'space';

@Component({
  selector: 'app-custom-keyboard',
  templateUrl: './custom-keyboard.component.html',
  styleUrl: './custom-keyboard.component.scss',
})
export class CustomKeyboardComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly rows = input.required<CustomKeyboardKey[][]>();
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly keyPress = output<CustomKeyboardKey>();

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      window.setTimeout(() => this.keepActiveElementAboveKeyboard(), 0);
    });
  }

  @HostBinding('class.keyboard-visible')
  protected get keyboardVisible(): boolean {
    return this.visible();
  }

  @HostBinding('class.roomy-keyboard')
  protected get roomyKeyboard(): boolean {
    const rows = this.rows();
    const widestRow = Math.max(...rows.map((row) => row.length));

    return rows.length > 0 && widestRow <= 5;
  }

  protected keyLabel(key: CustomKeyboardKey): string {
    if (key === 'backspace') return '⌫';
    if (key === 'clear') return 'Vider';
    if (key === 'space') return 'Espace';
    return key;
  }

  protected keyClass(key: CustomKeyboardKey): string {
    if (key === 'backspace') return 'wide-key';
    if (key === 'clear') return 'wide-key';
    if (key === 'space') return 'space-key';
    return '';
  }

  protected pressKey(key: CustomKeyboardKey): void {
    this.keyPress.emit(key);
    window.setTimeout(() => this.keepActiveElementAboveKeyboard(), 0);
  }

  @HostListener('document:focusin')
  protected handleFocusIn(): void {
    if (!this.visible()) return;
    window.setTimeout(() => this.keepActiveElementAboveKeyboard(), 0);
  }

  @HostListener('window:resize')
  protected handleResize(): void {
    if (!this.visible()) return;
    window.setTimeout(() => this.keepActiveElementAboveKeyboard(), 0);
  }

  private keepActiveElementAboveKeyboard(): void {
    const keyboard = this.elementRef.nativeElement.querySelector<HTMLElement>('.custom-keyboard');
    const activeElement = document.activeElement;

    if (!keyboard || !(activeElement instanceof HTMLElement)) return;
    if (keyboard.contains(activeElement)) return;

    const activeRect = activeElement.getBoundingClientRect();
    const keyboardRect = keyboard.getBoundingClientRect();
    const topMargin = 20;
    const bottomMargin = 20;
    const visibleTop = topMargin;
    const visibleBottom = keyboardRect.top - bottomMargin;
    const visibleHeight = visibleBottom - visibleTop;

    if (visibleHeight <= 0) return;

    const targetTop = visibleTop + Math.max(0, (visibleHeight - activeRect.height) / 2);
    let scrollDelta = 0;

    if (activeRect.bottom > visibleBottom || activeRect.top < visibleTop) {
      scrollDelta = activeRect.top - targetTop;
    }

    if (Math.abs(scrollDelta) > 1) {
      window.scrollBy({ top: scrollDelta, behavior: 'smooth' });
    }
  }
}

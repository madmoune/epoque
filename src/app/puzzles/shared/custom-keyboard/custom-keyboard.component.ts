import { Component, HostBinding, input, output } from '@angular/core';

export type CustomKeyboardKey = string | 'backspace' | 'space';

@Component({
  selector: 'app-custom-keyboard',
  templateUrl: './custom-keyboard.component.html',
  styleUrl: './custom-keyboard.component.scss',
})
export class CustomKeyboardComponent {
  readonly rows = input.required<CustomKeyboardKey[][]>();
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly keyPress = output<CustomKeyboardKey>();

  @HostBinding('class.keyboard-visible')
  protected get keyboardVisible(): boolean {
    return this.visible();
  }

  protected keyLabel(key: CustomKeyboardKey): string {
    if (key === 'backspace') return '⌫';
    if (key === 'space') return 'Espace';
    return key;
  }

  protected keyClass(key: CustomKeyboardKey): string {
    if (key === 'backspace') return 'wide-key';
    if (key === 'space') return 'space-key';
    return '';
  }
}

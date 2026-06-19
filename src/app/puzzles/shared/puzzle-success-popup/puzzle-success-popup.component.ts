import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

export type PuzzlePopupTone = 'success' | 'partial';

@Component({
  selector: 'app-puzzle-success-popup',
  templateUrl: './puzzle-success-popup.component.html',
  styleUrl: './puzzle-success-popup.component.scss',
})
export class PuzzleSuccessPopupComponent {
  @Input({ required: true }) title = '';
  @Input() message = '';
  @Input() answer = '';
  @Input() actionLabel = 'Nouvelle partie';
  @Input() showAction = true;
  @Input() tone: PuzzlePopupTone = 'success';

  @Output() readonly action = new EventEmitter<void>();

  @HostListener('document:keydown.enter', ['$event'])
  protected handleEnter(event: Event): void {
    if (!this.showAction || (event as KeyboardEvent).repeat) {
      return;
    }

    event.preventDefault();
    this.action.emit();
  }
}

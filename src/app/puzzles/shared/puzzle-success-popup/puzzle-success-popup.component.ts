import { Component, EventEmitter, HostListener, inject, Input, Output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

export type PuzzlePopupTone = 'success' | 'partial';

@Component({
  selector: 'app-puzzle-success-popup',
  imports: [RouterLink],
  templateUrl: './puzzle-success-popup.component.html',
  styleUrl: './puzzle-success-popup.component.scss',
})
export class PuzzleSuccessPopupComponent {
  private readonly router = inject(Router);
  protected readonly dismissed = signal(false);

  @Input({ required: true }) title = '';
  @Input() message = '';
  @Input() answer = '';
  @Input() actionLabel = 'Nouvelle partie';
  @Input() showAction = true;
  @Input() tone: PuzzlePopupTone = 'success';

  @Output() readonly action = new EventEmitter<void>();

  protected get menuFragment(): string {
    return this.router.url.split(/[?#]/)[0].replace(/^\/+/, '');
  }

  protected dismissFromBackground(event: Event): void {
    const target = event.target;

    if (target instanceof Element && target.closest('button, a')) {
      return;
    }

    this.dismissed.set(true);
  }

  @HostListener('document:keydown.enter', ['$event'])
  protected handleEnter(event: Event): void {
    if (!this.showAction || (event as KeyboardEvent).repeat) {
      return;
    }

    event.preventDefault();
    this.action.emit();
  }
}

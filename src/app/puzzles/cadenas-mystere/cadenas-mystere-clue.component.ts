import { Component, input, linkedSignal } from '@angular/core';
import { CodeDeductionCluesComponent } from '../code-deduction/code-deduction-clues.component';
import { CadenasMystereDiagramComponent } from './cadenas-mystere-diagram.component';
import { Cell, Clue } from './cadenas-mystere.model';

@Component({
  selector: 'app-cadenas-mystere-clue',
  imports: [CadenasMystereDiagramComponent, CodeDeductionCluesComponent],
  template: `
    @let item = clue();
    @if (item.title) {
      <p class="clue-title">{{ item.title }}</p>
    }
    @switch (item.kind) {
      @case ('text') {
        <div class="text-clue" [class.reading]="item.reading">
          @for (line of item.lines; track $index) {
            <p>{{ line }}</p>
          }
        </div>
      }
      @case ('grid') {
        <div
          class="clue-grid"
          role="group"
          [attr.aria-label]="item.title ?? 'Grille'"
          [style.--columns]="item.columns"
        >
          @for (row of item.rows; track $index; let y = $index) {
            <div class="clue-row">
              @for (cell of row; track $index; let x = $index) {
                @if (cell.markable || cell.choices) {
                  @let mark = marks()[y + ',' + x] ?? 0;
                  @let choice = mark ? cell.choices?.charAt(mark - 1) : '';
                  <button
                    type="button"
                    class="clue-cell"
                    data-board-cell
                    [class.marked]="!cell.choices && mark === 1"
                    [class.crossed]="!cell.choices && mark === 2"
                    [class.has-choice]="!!choice"
                    [attr.data-role]="cell.role"
                    [attr.aria-label]="cellLabel(cell, y, x, mark)"
                    (click)="markCell(cell, y, x)"
                  >
                    @if (choice && cell.text && cell.text !== '?') {
                      <span class="cell-badge" aria-hidden="true">{{ cell.text }}</span>
                    }
                    <span class="cell-value">{{ choice || cell.text }}</span>
                    @if (!cell.choices && !cell.text && mark === 2) {
                      <span class="note-symbol" aria-hidden="true">×</span>
                    }
                    @if (!cell.choices && cell.role === 'filled' && mark === 1) {
                      <span class="note-symbol" aria-hidden="true">✓</span>
                    }
                  </button>
                } @else {
                  <span class="clue-cell" [attr.data-role]="cell.role">{{ cell.text }}</span>
                }
              }
            </div>
          }
        </div>
      }
      @case ('diagram') {
        <app-cadenas-mystere-diagram [drawing]="item" [round]="round()" />
      }
      @case ('code-deduction') {
        <app-code-deduction-clues [clues]="item.clues" [round]="round()" />
      }
    }
  `,
  styleUrl: './cadenas-mystere-clue.component.scss',
})
export class CadenasMystereClueComponent {
  readonly clue = input.required<Clue>();
  readonly round = input.required<number>();
  protected readonly marks = linkedSignal<Partial<Record<string, number>>>(() => {
    this.round();
    this.clue();
    return {};
  });

  protected markCell(cell: Cell, row: number, col: number): void {
    const key = `${row},${col}`;
    const states = cell.choices ? cell.choices.length + 1 : 3;
    this.marks.update((marks) => ({ ...marks, [key]: ((marks[key] ?? 0) + 1) % states }));
  }

  protected cellLabel(cell: Cell, row: number, col: number, mark: number): string {
    const coordinates = `Ligne ${row + 1}, colonne ${col + 1}`;
    const state = cell.choices
      ? mark
        ? `valeur essayée ${cell.choices.charAt(mark - 1)}`
        : 'valeur à compléter'
      : ['sans marque', 'case marquée', 'case barrée'][mark];
    return `${coordinates}, ${cell.text ? cell.text + ', ' : ''}${state}`;
  }
}

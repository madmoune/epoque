import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { MYSTERY_MECHANICS } from './cadenas-mystere.logic';
import { CadenasMysterePage } from './cadenas-mystere.page';
import { cell, choiceCell, diagram, grid } from './cadenas-mystere.model';

describe('Cadenas mystère page', () => {
  const hintButton = '[data-confirm-action="hint"]';
  const method = 'Repère les symboles qui se répètent.';
  const explanation = 'Deux étoiles se répètent dans cette rangée, ce qui donne deux.';
  let fixture: ComponentFixture<CadenasMysterePage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [CadenasMysterePage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    const draw = vi.spyOn(Math, 'random').mockReturnValue(0.405);
    fixture = TestBed.createComponent(CadenasMysterePage);
    draw.mockRestore();
    fixture.componentInstance['puzzle'].set({
      title: 'Mécanique à découvrir',
      solutionHint: method,
      workedExample: { clue: grid([['★', '◆', '★']]), explanation },
      answer: '0522',
      shared: [grid([[cell('', undefined, true)]])],
    });
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function click(selector: string): void {
    root.querySelector<HTMLButtonElement>(selector)!.click();
    fixture.detectChanges();
  }

  function enter(value: string): void {
    const input = root.querySelector<HTMLInputElement>('#mystery-code')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('reveals the name, method and worked example before revealing any code digits', () => {
    expect(root.textContent).not.toContain('Mécanique à découvrir');
    expect(root.textContent).not.toContain(method);
    expect(root.textContent).not.toContain(explanation);
    click(hintButton);
    expect(root.querySelector('.hint-title')?.textContent).toBe('Mécanique à découvrir');
    expect(root.querySelector('.hint-method')).toBeNull();
    expect(root.querySelector('.hint-example')).toBeNull();
    expect(root.querySelector('.revealed-digits')).toBeNull();

    click(hintButton);
    expect(root.querySelector('.hint-method')?.textContent).toBe(method);
    expect(root.querySelector('.hint-example')).toBeNull();
    expect(root.querySelector('.revealed-digits')).toBeNull();

    click(hintButton);
    expect(root.querySelector('.hint-example .clue-grid')?.textContent?.trim()).toBe('★◆★');
    expect(root.querySelector('.hint-explanation')?.textContent).toBe(explanation);
    expect(root.querySelector('.revealed-digits')).toBeNull();

    for (const [index, digits] of ['0···', '05··', '052·', '0522'].entries()) {
      click(hintButton);
      const shown = [...root.querySelectorAll('.revealed-digits strong')]
        .map((digit) => digit.textContent)
        .join('');
      expect(shown).toBe(digits);
      expect(root.querySelector('.hint-method')?.textContent).toBe(method);
      expect(root.querySelector('.hint-explanation')?.textContent).toBe(explanation);
      const button = root.querySelector<HTMLButtonElement>(hintButton);
      expect(button?.disabled).toBe(index === 3);
    }
    expect(root.querySelector<HTMLInputElement>('input')?.value).toBe('');
    enter('0523');
    expect(root.querySelector('.feedback')?.textContent).toContain('Ce code');
    enter('0522');
    expect(root.querySelector('app-puzzle-success-popup')).not.toBeNull();
    expect(markSolved).toHaveBeenCalledWith('/cadenas-mystere');
  });

  it('clears hints, marks and the attempt on restart or on a fresh puzzle', () => {
    click('.clue-cell');
    for (let i = 0; i < 4; i++) click(hintButton);
    enter('12');
    expect(root.querySelector('.clue-cell.marked')).not.toBeNull();
    expect(root.querySelector('.revealed-digits')).not.toBeNull();
    click('[data-confirm-action="restart"]');
    expect(root.querySelector('.clue-cell.marked')).toBeNull();
    expect(root.querySelector('.hint-title')).toBeNull();
    expect(root.querySelector('.hint-method')).toBeNull();
    expect(root.querySelector('.hint-example')).toBeNull();
    expect(root.querySelector('.revealed-digits')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('input')?.value).toBe('');

    click('.clue-cell');
    for (let i = 0; i < 4; i++) click(hintButton);
    const draw = vi.spyOn(Math, 'random').mockReturnValue(0.405);
    click('[data-confirm-action="new-game"]');
    draw.mockRestore();
    expect(fixture.componentInstance['puzzle']().title).not.toBe('Mécanique à découvrir');
    expect(root.querySelector('.hint-title')).toBeNull();
    expect(root.querySelector('.hint-method')).toBeNull();
    expect(root.querySelector('.hint-example')).toBeNull();
    expect(root.querySelector('.revealed-digits')).toBeNull();
    expect(root.querySelector('.clue-cell.marked')).toBeNull();
  });

  it('keeps the target label and the given number visible when taking notes', () => {
    fixture.componentInstance['puzzle'].update((puzzle) => ({
      ...puzzle,
      shared: [grid([[choiceCell('A', '01', 'target'), cell(3, undefined, true)]])],
    }));
    fixture.detectChanges();
    const choice = '[data-role="target"]';
    click(choice);
    expect(root.querySelector(`${choice} .cell-badge`)?.textContent).toBe('A');
    expect(root.querySelector(`${choice} .cell-value`)?.textContent).toBe('0');
    click(choice);
    expect(root.querySelector(`${choice} .cell-value`)?.textContent).toBe('1');
    click(choice);
    expect(root.querySelector(`${choice} .cell-value`)?.textContent).toBe('A');

    const given = '.clue-cell:not([data-role])';
    click(given);
    click(given);
    expect(root.querySelector(`${given}.crossed .cell-value`)?.textContent).toBe('3');
    expect(fixture.componentInstance['puzzle']().answer).toBe('0522');
  });

  it('lets players cross out a digit in every occurrence of a code deduction attempt', () => {
    const { title, generate } = MYSTERY_MECHANICS.find(
      (item) => item.title === 'Déduction de Nombre',
    )!;
    const draw = vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const round = { title, ...generate() };
    draw.mockRestore();
    fixture.componentInstance['puzzle'].set(round);
    fixture.detectChanges();

    expect(root.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(root.querySelectorAll('tbody .digit-toggle')).toHaveLength(20);
    expect(root.querySelector('.hint-panel')).toBeNull();

    const digit = '.digit-toggle[data-digit="0"]';
    const instances = root.querySelectorAll<HTMLButtonElement>(digit);
    expect(instances.length).toBeGreaterThan(1);
    click(digit);
    expect([...instances].map((button) => button.getAttribute('aria-pressed'))).toEqual(
      Array(instances.length).fill('true'),
    );
    click('[data-confirm-action="restart"]');
    expect(root.querySelector(`${digit}.is-excluded`)).toBeNull();

    enter(round.answer);
    expect(root.querySelector('app-puzzle-success-popup')).not.toBeNull();
    expect(markSolved).toHaveBeenCalledWith('/cadenas-mystere');
  });

  it('cycles single and double bridges and clears the drawing on restart', () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    try {
      fixture.componentInstance['puzzle'].update((puzzle) => ({
        ...puzzle,
        shared: [
          {
            ...diagram(90, 70, [], 'Deux îles'),
            edges: [
              { from: [12, 35], to: [78, 35], description: 'Pont entre les îles', double: true },
            ],
          },
        ],
      }));
      fixture.detectChanges();
      const edge = root.querySelector<HTMLButtonElement>('.drawing-edge')!;
      expect(edge.getAttribute('aria-pressed')).toBe('false');
      click('.drawing-edge');
      expect(edge.getAttribute('aria-pressed')).toBe('true');
      expect(edge.classList.contains('double')).toBe(false);
      click('.drawing-edge');
      expect(edge.classList.contains('double')).toBe(true);
      click('.drawing-edge');
      expect(edge.getAttribute('aria-pressed')).toBe('false');
      click('.drawing-edge');
      click('[data-confirm-action="restart"]');
      expect(edge.getAttribute('aria-pressed')).toBe('false');
    } finally {
      canvas.mockRestore();
    }
  });
});

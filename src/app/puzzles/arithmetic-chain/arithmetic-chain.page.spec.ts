import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { ArithmeticChainPage } from './arithmetic-chain.page';

describe('ArithmeticChainPage', () => {
  let fixture: ComponentFixture<ArithmeticChainPage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ArithmeticChainPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ArithmeticChainPage);
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function click(selector: string): void {
    root.querySelector<HTMLButtonElement>(selector)!.click();
    fixture.detectChanges();
  }

  function enterAnswer(value: string): void {
    const input = root.querySelector<HTMLInputElement>('#chain-answer')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('shows the whole chain immediately and reveals intermediate results one by one', () => {
    const page = fixture.componentInstance;
    const chain = page['chain']();
    expect(root.querySelector('.start-value strong')?.textContent).toBe(String(chain.start));
    expect(root.querySelectorAll('.operation-tile')).toHaveLength(9);
    expect(root.querySelectorAll('.step-result')).toHaveLength(0);
    click('[data-confirm-action="hint"]');
    click('[data-confirm-action="hint"]');
    expect(
      [...root.querySelectorAll('.step-result')].map((value) => value.textContent?.trim()),
    ).toEqual(chain.steps.slice(0, 2).map(({ result }) => `Résultat ${page['format'](result)}`));

    click('[data-confirm-action="restart"]');
    expect(page['chain']()).toBe(chain);
    expect(root.querySelectorAll('.step-result')).toHaveLength(0);

    root.querySelectorAll<HTMLButtonElement>('.operation-tile')[3].click();
    fixture.detectChanges();
    expect(
      [...root.querySelectorAll('.step-result')].map((value) => value.textContent?.trim()),
    ).toEqual(chain.steps.slice(0, 4).map(({ result }) => `Résultat ${page['format'](result)}`));

    click('[data-confirm-action="new-game"]');
    expect(page['chain']().start).not.toBe(chain.start);
  });

  it('checks the final integer automatically and records a solved game', () => {
    const page = fixture.componentInstance;
    const answer = page['chain']().answer;
    expect(root.querySelector('button[type="submit"]')).toBeNull();
    const input = root.querySelector<HTMLInputElement>('#chain-answer')!;
    expect(input.inputMode).toBe('none');
    input.focus();
    fixture.detectChanges();
    expect(root.querySelector('.custom-keyboard')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('.custom-keyboard button')!.click();
    fixture.detectChanges();
    expect(input.value).toBe('1');

    enterAnswer(String(answer + 1));
    expect(root.querySelector('.feedback')).not.toBeNull();
    expect(markSolved).not.toHaveBeenCalled();

    enterAnswer(page['format'](answer));
    expect(root.querySelector('.feedback')).toBeNull();
    expect(root.querySelector('app-puzzle-success-popup')?.textContent).toContain('Bonne réponse');
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/calcul-en-chaine');
  });
});

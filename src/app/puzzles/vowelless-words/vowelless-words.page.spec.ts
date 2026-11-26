import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { VowellessWordsPage } from './vowelless-words.page';
import { VowellessWordsService } from './vowelless-words.service';

const ALTERNATIVES = 'mots-sans-voyelles-alternatives.txt';

describe('VowellessWordsPage', () => {
  let http: HttpTestingController;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    markSolved = vi.fn();
    TestBed.configureTestingModule({
      imports: [VowellessWordsPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads one bank for concurrent callers and draws different clues', async () => {
    const words = TestBed.inject(VowellessWordsService);
    const loading = words.loadWords();
    expect(words.loadWords()).toBe(loading);
    http.expectOne('words.txt').flush('porter\nrythme');
    http.expectOne(ALTERNATIVES).flush('partir');
    await loading;
    expect(words.nextPuzzle().key).not.toBe(words.nextPuzzle().key);
    await words.loadWords();
    http.expectNone('words.txt');
  });

  it('reveals vowels progressively, accepts an alternate answer and clears the round', async () => {
    const fixture = TestBed.createComponent(VowellessWordsPage);
    const root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    expect(root.textContent).toContain('Chargement');
    const loading = TestBed.inject(VowellessWordsService).loadWords();
    http.expectOne('words.txt').flush('porter');
    http.expectOne(ALTERNATIVES).flush('partir');
    await loading;
    fixture.detectChanges();
    expect(root.querySelector('.length')?.textContent).toContain('6 lettres');
    expect(root.querySelector('.letters')?.getAttribute('aria-label')).toBe('Consonnes P, R, T, R');

    const hint = root.querySelector<HTMLButtonElement>('[data-confirm-action="hint"]')!;
    hint.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.hint-letters .missing')).toHaveLength(2);
    hint.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.hint-letters .missing')).toHaveLength(1);

    const enter = (value: string) => {
      const input = root.querySelector<HTMLInputElement>('input')!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    expect(root.querySelector('button[type="submit"]')).toBeNull();
    const input = root.querySelector<HTMLInputElement>('#vowelless-answer')!;
    expect(input.inputMode).toBe('none');
    input.focus();
    fixture.detectChanges();
    expect(root.querySelector('.custom-keyboard')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('.custom-keyboard button')!.click();
    fixture.detectChanges();
    expect(input.value).toBe('Q');

    enter('portier');
    expect(root.querySelector('.feedback')?.textContent).toContain('Essaie un autre mot');
    expect(markSolved).not.toHaveBeenCalled();
    enter('PARTIR');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('partir');
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/mots-sans-voyelles');

    root.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(root.querySelector('.hint')).toBeNull();
    expect(root.querySelector<HTMLInputElement>('input')?.value).toBe('');
  });

  it('offers a retry when the bank fails to load', async () => {
    const fixture = TestBed.createComponent(VowellessWordsPage);
    const root = fixture.nativeElement as HTMLElement;
    const words = TestBed.inject(VowellessWordsService);
    const initial = words.loadWords();
    http.expectOne('words.txt').flush('', { status: 503, statusText: 'Unavailable' });
    http.expectOne(ALTERNATIVES).flush('');
    await expect(initial).rejects.toMatchObject({ status: 503 });
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.retry')!.click();
    const retry = words.loadWords();
    http.expectOne('words.txt').flush('rythme');
    http.expectOne(ALTERNATIVES).flush('');
    await retry;
    fixture.detectChanges();
    expect(root.querySelector('.letters')?.getAttribute('aria-label')).toBe('Consonnes R, T, H, M');
  });
});

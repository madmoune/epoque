import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WordLadderService } from './word-ladder.service';
import { WordLadderPage } from './word-ladder.page';

describe('WordLadderPage mobile keyboard', () => {
  it('opens the custom keyboard and enters letters through it', async () => {
    await TestBed.configureTestingModule({
      imports: [WordLadderPage],
      providers: [
        provideRouter([]),
        {
          provide: WordLadderService,
          useValue: {
            loadWords: vi.fn().mockResolvedValue(undefined),
            createPuzzle: vi.fn().mockReturnValue({
              start: 'pain',
              target: 'mats',
              letterCount: 4,
              minimumMoves: 3,
            }),
            normalize: (value: string) => value.toLocaleLowerCase('fr-CA'),
            sameWord: (first: string, second: string) =>
              first.toLocaleLowerCase('fr-CA') === second.toLocaleLowerCase('fr-CA'),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WordLadderPage);
    const page = fixture.componentInstance as any;

    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#word-ladder-answer') as HTMLInputElement;

    expect(input.inputMode).toBe('none');

    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    const keyboard = fixture.nativeElement.querySelector('.custom-keyboard');
    const letterA = [...keyboard.querySelectorAll('button')].find(
      (button: Element) => button.textContent?.trim() === 'A',
    ) as HTMLButtonElement;

    letterA.click();
    fixture.detectChanges();

    expect(page.answerInput()).toBe('A');
    expect(input.value).toBe('A');
  });
});

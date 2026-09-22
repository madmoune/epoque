import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WordLadderService } from './word-ladder.service';
import { WordLadderPage } from './word-ladder.page';

describe('WordLadderPage mobile keyboard', () => {
  it('opens the custom keyboard and enters letters through it', async () => {
    const createPuzzle = vi.fn().mockReturnValue({
      start: 'pains',
      target: 'mains',
      letterCount: 5,
      minimumMoves: 3,
    });

    await TestBed.configureTestingModule({
      imports: [WordLadderPage],
      providers: [
        provideRouter([]),
        {
          provide: WordLadderService,
          useValue: {
            loadWords: vi.fn().mockResolvedValue(undefined),
            createPuzzle,
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

    expect(page.selectedLength()).toBe(5);
    expect(createPuzzle).toHaveBeenCalledWith(5);

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

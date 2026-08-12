import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnagramService } from './anagram.service';
import { AnagramsPage } from './anagram.page';

describe('AnagramsPage letter randomization', () => {
    it('fills an empty response with the new letter order', async () => {
        const scrambleWord = vi
            .fn()
            .mockReturnValueOnce('tahc')
            .mockReturnValueOnce('acht');

        await TestBed.configureTestingModule({
            imports: [AnagramsPage],
            providers: [
                provideRouter([]),
                {
                    provide: AnagramService,
                    useValue: {
                        loadWords: vi.fn().mockResolvedValue(undefined),
                        getRandomWord: vi.fn().mockReturnValue({ answer: 'chat' }),
                        scrambleWord,
                        isCorrectAnswer: vi.fn().mockReturnValue(false),
                    },
                },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(AnagramsPage);
        const page = fixture.componentInstance as any;

        await fixture.whenStable();
        page.randomizeLetterOrder();

        expect(page.scrambledLetters()).toBe('acht');
        expect(page.answerInput()).toBe('acht');
    });

    it('updates an order-based response after the letters are shuffled', async () => {
        const scrambleWord = vi
            .fn()
            .mockReturnValueOnce('tahc')
            .mockReturnValueOnce('acht');

        await TestBed.configureTestingModule({
            imports: [AnagramsPage],
            providers: [
                provideRouter([]),
                {
                    provide: AnagramService,
                    useValue: {
                        loadWords: vi.fn().mockResolvedValue(undefined),
                        getRandomWord: vi.fn().mockReturnValue({ answer: 'chat' }),
                        scrambleWord,
                        isCorrectAnswer: vi.fn().mockReturnValue(false),
                    },
                },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(AnagramsPage);
        const page = fixture.componentInstance as any;

        await fixture.whenStable();
        page.setDragMode();
        page.setAlphabeticalOrder();
        page.randomizeLetterOrder();

        expect(page.scrambledLetters()).toBe('acht');
        expect(page.answerInput()).toBe('acht');
    });

    it('keeps a manually typed response when the letters are shuffled', async () => {
        const scrambleWord = vi
            .fn()
            .mockReturnValueOnce('tahc')
            .mockReturnValueOnce('acht');

        await TestBed.configureTestingModule({
            imports: [AnagramsPage],
            providers: [
                provideRouter([]),
                {
                    provide: AnagramService,
                    useValue: {
                        loadWords: vi.fn().mockResolvedValue(undefined),
                        getRandomWord: vi.fn().mockReturnValue({ answer: 'chat' }),
                        scrambleWord,
                        isCorrectAnswer: vi.fn().mockReturnValue(false),
                    },
                },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(AnagramsPage);
        const page = fixture.componentInstance as any;

        await fixture.whenStable();
        page.updateAnswer('cha');
        page.randomizeLetterOrder();

        expect(page.scrambledLetters()).toBe('acht');
        expect(page.answerInput()).toBe('cha');
    });
});

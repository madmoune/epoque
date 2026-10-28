import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { EpiqueDuelsPage } from './epique-duels.page';

describe('Nim à retrait limité dans Duels', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpiqueDuelsPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { game: 'nim-limite' } } } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([3, 4, 5] as const)('affiche et applique la limite de %i jetons', (maxRemoval) => {
    const fixture = TestBed.createComponent(EpiqueDuelsPage);
    const page = fixture.componentInstance;
    page['mode'].set('local');
    page['nimLimited'].set({ piles: [8, 2, 0], maxRemoval });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const piles = root.querySelectorAll('.nim-limited-board .token-pile');
    const tokens = piles[0].querySelectorAll<HTMLButtonElement>('.token');
    expect(root.querySelector('h1')?.textContent).toBe('Nim — retrait limité');
    expect(root.querySelector('.instruction-pill')?.textContent).toContain(
      `Maximum : ${maxRemoval}`,
    );
    expect(root.querySelectorAll('.nim-limited-section .pile-actions')).toHaveLength(0);
    expect([...tokens].filter((token) => !token.disabled)).toHaveLength(maxRemoval);
    expect(piles[2].textContent).toContain('Pile vide');
    expect(piles[2].querySelectorAll('button')).toHaveLength(0);

    tokens[0].click();
    page['playNimLimitedToken'](0, 0);
    page['playNimLimitedToken'](0, 8);
    page['playNimLimitedToken'](0, 6.5);
    page['playNimLimitedToken'](3, 0);
    expect(page['nimLimited']().piles).toEqual([8, 2, 0]);
    expect(page['turn']()).toBe(1);

    tokens[8 - maxRemoval].click();
    fixture.detectChanges();
    expect(page['nimLimited']()).toEqual({ piles: [8 - maxRemoval, 2, 0], maxRemoval });
    expect(page['turn']()).toBe(2);

    piles[1].querySelector<HTMLButtonElement>('.token')!.click();
    fixture.detectChanges();
    expect(page['nimLimited']().piles).toEqual([8 - maxRemoval, 0, 0]);
    expect(page['turn']()).toBe(1);
  });

  it('termine la partie au dernier jeton et bloque les retraits suivants', () => {
    const fixture = TestBed.createComponent(EpiqueDuelsPage);
    const page = fixture.componentInstance;
    page['mode'].set('local');
    page['nimLimited'].set({ piles: [0, 2, 0], maxRemoval: 3 });
    page['turn'].set(2);

    page['playNimLimitedToken'](1, 0);
    fixture.detectChanges();
    expect(page['winner']()).toBe(2);
    expect(fixture.nativeElement.querySelector('app-puzzle-success-popup')).not.toBeNull();
    expect(page['resultReason']()).toBe('Joueur 2 retire le dernier jeton.');
    page['playNimLimitedToken'](0, 0);
    expect(page['nimLimited']().piles).toEqual([0, 0, 0]);
    expect(page['cpuThinking']()).toBe(false);
  });

  it('fait jouer le CPU dans une seule pile et empêche de jouer pendant son tour', () => {
    const fixture = TestBed.createComponent(EpiqueDuelsPage);
    const page = fixture.componentInstance;
    vi.useFakeTimers();
    page['nimLimited'].set({ piles: [8, 7, 2], maxRemoval: 3 });
    page['playNimLimitedToken'](0, 7);
    fixture.detectChanges();
    const before = [...page['nimLimited']().piles];
    expect(page['cpuThinking']()).toBe(true);
    expect(
      fixture.nativeElement.querySelectorAll('.nim-limited-board button:not(:disabled)'),
    ).toHaveLength(0);
    page['playNimLimitedToken'](1, 6);
    expect(page['nimLimited']().piles).toEqual(before);

    vi.advanceTimersByTime(520);
    const changed = page['nimLimited']().piles.map((pile, index) => before[index] - pile);
    expect(changed.filter((count) => count !== 0)).toHaveLength(1);
    expect(changed.reduce((sum, count) => sum + count, 0)).toBeGreaterThanOrEqual(1);
    expect(changed.reduce((sum, count) => sum + count, 0)).toBeLessThanOrEqual(3);
    expect(page['turn']()).toBe(1);
    expect(page['cpuThinking']()).toBe(false);
  });

  it('renouvelle les piles et la limite en annulant un coup CPU en attente', () => {
    const fixture = TestBed.createComponent(EpiqueDuelsPage);
    const page = fixture.componentInstance;
    vi.useFakeTimers();
    page['nimLimited'].set({ piles: [8, 7, 2], maxRemoval: 3 });
    page['playNimLimitedToken'](0, 7);
    expect(page['cpuThinking']()).toBe(true);
    vi.spyOn(Math, 'random').mockReturnValue(0.999);

    page['newGame']();
    expect(page['nimLimited']()).toEqual({ piles: [12, 12, 12, 12, 12], maxRemoval: 5 });
    vi.advanceTimersByTime(520);
    expect(page['nimLimited']().piles).toEqual([12, 12, 12, 12, 12]);
    expect(page['turn']()).toBe(1);
    expect(page['winner']()).toBeNull();
    expect(page['cpuThinking']()).toBe(false);
  });
});

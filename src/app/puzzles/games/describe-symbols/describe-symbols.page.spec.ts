import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { FirebaseRoomService } from '../../../shared/multiplayer/firebase-room.service';
import { DescribeSymbolsPage } from './describe-symbols.page';
import { SYMBOL_STYLES, SYMBOL_STYLE_IDS } from './describe-symbols.styles';

describe('DescribeSymbolsPage', () => {
  const firebaseRoom = { isConfigured: true, setRoomState: vi.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescribeSymbolsPage],
      providers: [provideRouter([]), { provide: FirebaseRoomService, useValue: firebaseRoom }],
    }).compileComponents();

    let seed = 12345;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    firebaseRoom.setRoomState.mockClear();
  });

  it.each(SYMBOL_STYLE_IDS)('can generate a %s round', (style) => {
    const page = TestBed.createComponent(DescribeSymbolsPage).componentInstance as any;
    vi.mocked(Math.random).mockReturnValue(
      (SYMBOL_STYLE_IDS.indexOf(style) + 0.5) / SYMBOL_STYLE_IDS.length,
    );

    const symbol = page.createSymbol();

    expect(symbol.style).toBe(style);
    expect(SYMBOL_STYLES[style].silhouettes[symbol.silhouette]).toBeDefined();
  });

  it.each(SYMBOL_STYLE_IDS)('creates ten distinct choices in the %s family', (style) => {
    const page = TestBed.createComponent(DescribeSymbolsPage).componentInstance as any;

    for (let round = 0; round < 12; round += 1) {
      const target = {
        ...page.createSymbol(),
        style,
        silhouette: round % SYMBOL_STYLES[style].silhouettes.length,
      };
      const choices = page.createChoiceSet(target);

      expect(choices).toHaveLength(10);
      expect(choices.filter((symbol: any) => symbol.id === target.id)).toEqual([target]);
      expect(new Set(choices.map((symbol: any) => symbol.id)).size).toBe(10);
      expect(choices.every((symbol: any) => symbol.style === style)).toBe(true);
      expect(
        choices.every((symbol: any) => SYMBOL_STYLES[style].silhouettes[symbol.silhouette]),
      ).toBe(true);

      for (let index = 1; index < choices.length; index += 1) {
        for (const previous of choices.slice(0, index)) {
          expect(page.hasDistinctiveDifference(choices[index], previous)).toBe(true);
        }
      }

      if (style !== 'flag') {
        expect(choices.some((symbol: any) => symbol.silhouette !== target.silhouette)).toBe(true);
      }
    }
  });

  it('changes style between consecutive rounds', () => {
    const page = TestBed.createComponent(DescribeSymbolsPage).componentInstance as any;
    let previousStyle = 'flag';

    for (let round = 0; round < 36; round += 1) {
      const target = page.createSymbol(previousStyle);
      expect(target.style).not.toBe(previousStyle);
      previousStyle = target.style;
    }
  });

  it('keeps symbols from older rooms as pavillons', () => {
    const page = TestBed.createComponent(DescribeSymbolsPage).componentInstance as any;
    const legacy = page.createSymbol();
    delete legacy.style;
    delete legacy.silhouette;

    const state = page.normalizeState({ phase: 'describing', target: legacy, choices: [legacy] });

    expect(state.target).toMatchObject({ ...legacy, style: 'flag', silhouette: 0 });
    expect(state.choices[0]).toEqual(state.target);
    expect(page.symbolSilhouette(state.target).details).toBe('');
  });

  it.each(SYMBOL_STYLE_IDS)('renders the %s silhouette for the describer and guessers', (style) => {
    const fixture = TestBed.createComponent(DescribeSymbolsPage);
    const page = fixture.componentInstance as any;
    const symbols = SYMBOL_STYLES[style].silhouettes.map((_, silhouette) => ({
      ...page.createSymbol(),
      style,
      silhouette,
    }));
    page.room.set({
      hostId: 'describer',
      players: {},
      state: {
        phase: 'describing',
        describerId: 'describer',
        target: symbols[0],
        choices: symbols,
      },
    });
    page.playerId.set('guesser');
    fixture.detectChanges();

    const svgs = fixture.nativeElement.querySelectorAll('.choice-grid .describe-symbol');
    expect(svgs.length).toBe(symbols.length);

    svgs.forEach((svg: SVGElement, index: number) => {
      const silhouette = SYMBOL_STYLES[style].silhouettes[index];
      const clip = svg.querySelector('clipPath')!;
      expect(clip.querySelector('path')?.getAttribute('d')).toBe(silhouette.outline);
      expect(clip.querySelector('rect')).toBeNull();
      expect(svg.querySelector('.describe-symbol-border')?.getAttribute('d')).toBe(
        silhouette.outline,
      );
      expect(svg.getAttribute('aria-label')).toBe(SYMBOL_STYLES[style].label);
      expect(svg.querySelector('g[clip-path]')?.getAttribute('clip-path')).toBe(`url(#${clip.id})`);
      if (style !== 'flag') {
        expect(svg.querySelector(`path[d="${silhouette.details}"]`)).not.toBeNull();
      }
    });

    page.playerId.set('describer');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.secret-card clipPath path')?.getAttribute('d'),
    ).toBe(SYMBOL_STYLES[style].silhouettes[0].outline);
    expect(fixture.nativeElement.querySelector('.choice-grid')).toBeNull();
  });

  it('shares the new style and choices when starting a multiplayer round', async () => {
    const page = TestBed.createComponent(DescribeSymbolsPage).componentInstance as any;
    page.roomCode.set('ABC234');
    page.playerId.set('host');
    page.room.set({
      hostId: 'host',
      players: {
        host: { id: 'host', name: 'Host', online: true },
        guest: { id: 'guest', name: 'Guest', online: true },
      },
      state: { phase: 'lobby', describerId: null },
    });

    await page.startRound();

    const [roomCode, state] = firebaseRoom.setRoomState.mock.calls[0];
    expect(roomCode).toBe('ABC234');
    expect(state.phase).toBe('describing');
    expect(state.describerId).toBe('host');
    expect(SYMBOL_STYLE_IDS).toContain(state.target.style);
    expect(state.choices).toHaveLength(10);
    expect(state.choices.every((symbol: any) => symbol.style === state.target.style)).toBe(true);
    expect(state.choices.filter((symbol: any) => symbol.id === state.target.id)).toEqual([
      state.target,
    ]);
  });
});

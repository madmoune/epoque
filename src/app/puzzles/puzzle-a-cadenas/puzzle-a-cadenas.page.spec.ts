import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import {
  FINALE_2_PLAYLIST_ID,
  FINALE_2_PLAYLIST_ROUTES,
  PuzzlePlaylistService,
} from '../../puzzle-playlist.service';
import { PUZZLE_A_CADENAS, type PuzzleACadenasEntry } from './puzzle-a-cadenas.catalog';
import { PuzzleACadenasPage } from './puzzle-a-cadenas.page';

describe('Puzzle à Cadenas display', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzleACadenasPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('does not render a resolution explanation by default', () => {
    const fixture = TestBed.createComponent(PuzzleACadenasPage);
    fixture.componentInstance['selectedPuzzleId'].set('dominos-numeriques');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.puzzle-rule')).toBeNull();
    expect(fixture.nativeElement.querySelector('.display-guide')).toBeNull();
    expect(fixture.nativeElement.querySelector('.puzzle-difficulty')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(
      'La validation se lance automatiquement au quatrième chiffre.',
    );
  });

  it('does not render puzzle titles in the selected header', () => {
    const fixture = TestBed.createComponent(PuzzleACadenasPage);
    fixture.componentInstance['selectedPuzzleId'].set('dominos-numeriques');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.puzzle-heading-copy')).toBeNull();
    expect(fixture.nativeElement.querySelector('.puzzle-title')).toBeNull();
    expect(fixture.nativeElement.querySelector('#selected-puzzle-title')).toBeNull();
    expect(fixture.nativeElement.querySelector('#selected-puzzle').getAttribute('aria-label')).toBe(
      'Puzzle 06',
    );
  });

  it('keeps a trailing movement arrow in the directions puzzle', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;
    const puzzle = PUZZLE_A_CADENAS.find((entry) => entry.id === 'directions-secretes')!;
    const option = page['displayBlocks'](puzzle).find(
      (block) => block.type === 'tokens' && block.label === 'A',
    );

    expect(option).toMatchObject({
      type: 'tokens',
      label: 'A',
      tokens: ['5', ':', '↑', 'puis', '→'],
    });
  });

  it('shows the puzzle rule without exposing the code-reading step', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;
    const puzzle = PUZZLE_A_CADENAS.find((entry) => entry.id === 'symboles-mysterieux')!;

    expect(page['puzzleRule'](puzzle)).toBe(
      'Chaque symbole représente toujours le même chiffre. Déduis la valeur de chaque symbole.',
    );
  });

  it('keeps the extraction cue separate from the Latin-square rule', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;
    const puzzle = PUZZLE_A_CADENAS.find(
      (entry) => entry.id === 'nouveaux-68-carre-quatre-familles',
    )!;

    expect(page['puzzleRule'](puzzle)).toBe(
      'Complète la grille 4 × 4 pour que chaque ligne et chaque colonne contienne 1, 2, 3 et 4 une fois.',
    );
  });

  it('keeps a real explanation but hides direct answer instructions', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;
    const dominos = PUZZLE_A_CADENAS.find((entry) => entry.id === 'dominos-numeriques')!;
    const fleet = PUZZLE_A_CADENAS.find(
      (entry) => entry.id === 'nouveaux-75-flotte-silencieuse',
    )!;
    const directAnswerRule: PuzzleACadenasEntry = {
      ...dominos,
      instructions: 'Le résultat est le nombre de cases noires.',
    };

    expect(page['puzzleRule'](dominos)).toBe(
      'Pour chaque paire, multiplie les deux nombres du premier domino, puis retire le produit du second domino.',
    );
    expect(page['puzzleRule'](fleet)).toBe(
      'Bataille navale sur une grille 4 × 4 : place un bateau de 2 cases et un bateau seul de 1 case. Les nombres L à gauche donnent le total de chaque ligne et les nombres C en haut celui de chaque colonne. Les bateaux ne se touchent pas, même en diagonale.',
    );
    expect(page['puzzleRule'](directAnswerRule)).toBeNull();
  });

  it('renders fleet row and column codes as a readable grid', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;
    const puzzle = PUZZLE_A_CADENAS.find((entry) => entry.id === 'nouveaux-75-flotte-silencieuse')!;
    const fleetBlocks = page['displayBlocks'](puzzle).filter((block) => block.type === 'fleet');

    expect(fleetBlocks).toHaveLength(16);
    expect(fleetBlocks[0]).toMatchObject({
      type: 'fleet',
      label: 'A',
      rowTotals: ['1', '1', '0', '1'],
      columnTotals: ['0', '2', '1', '0'],
      result: '3',
      interactive: false,
      solution: [1, 5, 14],
    });
    expect(page['isFleetExampleSingle'](fleetBlocks[0], 1)).toBe(false);
    expect(page['isFleetExampleSingle'](fleetBlocks[0], 14)).toBe(true);
    expect(fleetBlocks.at(-1)).toMatchObject({
      type: 'fleet',
      label: 'D',
      rowTotals: ['2', '0', '0', '1'],
      columnTotals: ['1', '1', '0', '1'],
      result: '?',
      interactive: true,
      solution: undefined,
    });
  });

  it('keeps example fleet cards compact without explanatory captions', () => {
    const fixture = TestBed.createComponent(PuzzleACadenasPage);
    fixture.componentInstance['selectedPuzzleId'].set('nouveaux-75-flotte-silencieuse');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.fleet-caption')).toHaveLength(4);
    expect(fixture.nativeElement.textContent).not.toContain(
      'Exemple : les deux cases colorées qui se touchent',
    );
  });

  it('allows marking and clearing cells on a fleet target grid', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;

    expect(page['isFleetCellSelected']('nouveaux-75-flotte-silencieuse', 'A', 0)).toBe(false);

    page['toggleFleetCell']('nouveaux-75-flotte-silencieuse', 'A', 0);
    expect(page['isFleetCellSelected']('nouveaux-75-flotte-silencieuse', 'A', 0)).toBe(true);
    expect(page['fleetSelectionCount']('nouveaux-75-flotte-silencieuse', 'A')).toBe(1);

    page['clearFleetSelection']('nouveaux-75-flotte-silencieuse', 'A');
    expect(page['isFleetCellSelected']('nouveaux-75-flotte-silencieuse', 'A', 0)).toBe(false);
  });

  it('classifies diagram data into visual structures', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;
    const hitori = PUZZLE_A_CADENAS.find(
      (entry) => entry.id === 'nouveaux-71-suppression-interdite',
    )!;
    const paths = PUZZLE_A_CADENAS.find((entry) => entry.id === 'nouveaux-48-reseau-peages')!;
    const graph = PUZZLE_A_CADENAS.find((entry) => entry.id === 'nouveaux-49-boucles-independantes')!;
    const nonogram = PUZZLE_A_CADENAS.find((entry) => entry.id === 'nouveaux-67-fenetres-cachees')!;
    const grid = PUZZLE_A_CADENAS.find((entry) => entry.id === 'nouveaux-68-carre-quatre-familles')!;

    expect(page['displayBlocks'](hitori).filter((block) => block.type === 'diagram')[0]).toMatchObject({
      type: 'diagram',
      kind: 'hitori',
      grid: [
        ['2', '4', '3'],
        ['1', '4', '4'],
      ],
      interactive: false,
    });
    expect(page['displayBlocks'](hitori).filter((block) => block.type === 'diagram').at(-1)).toMatchObject({
      type: 'diagram',
      kind: 'hitori',
      interactive: true,
    });
    expect(page['displayBlocks'](paths).find((block) => block.type === 'diagram')).toMatchObject({
      type: 'diagram',
      kind: 'paths',
    });
    expect(page['displayBlocks'](graph).find((block) => block.type === 'diagram')).toMatchObject({
      type: 'diagram',
      kind: 'graph',
    });
    expect(page['displayBlocks'](nonogram).find((block) => block.type === 'nonogram')).toMatchObject({
      type: 'nonogram',
      label: 'A',
      rowClues: ['3', '3', '1', '1'],
      columnClues: ['1', '2', '2', '1·2'],
      result: '2',
    });
    expect(page['displayBlocks'](grid).find((block) => block.type === 'diagram')).toMatchObject({
      type: 'diagram',
      kind: 'grid',
    });
  });

  it('renders graph puzzles as connected drawings', () => {
    const fixture = TestBed.createComponent(PuzzleACadenasPage);
    fixture.componentInstance['selectedPuzzleId'].set('nouveaux-49-boucles-independantes');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.graph-canvas')).toHaveLength(16);
    expect(fixture.nativeElement.querySelectorAll('.graph-node')).toHaveLength(80);
    expect(fixture.nativeElement.querySelectorAll('.graph-edge').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).not.toContain('SOMMETS');
    expect(fixture.nativeElement.textContent).not.toContain('ARÊTES');
  });

  it('allows marking and clearing cells on a Hitori target grid', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;
    const puzzleId = 'nouveaux-71-suppression-interdite';

    expect(page['isHitoriCellSelected'](puzzleId, 'A', 0)).toBe(false);

    page['toggleHitoriCell'](puzzleId, 'A', 0);
    expect(page['isHitoriCellSelected'](puzzleId, 'A', 0)).toBe(true);
    expect(page['hitoriSelectionCount'](puzzleId, 'A')).toBe(1);

    page['clearHitoriSelection'](puzzleId, 'A');
    expect(page['isHitoriCellSelected'](puzzleId, 'A', 0)).toBe(false);
  });

  it('reveals a hint only for an unsolved puzzle', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;
    const puzzleId = 'nouveaux-75-flotte-silencieuse';

    expect(page['isHintVisible'](puzzleId)).toBe(false);

    page['revealHint'](puzzleId);
    expect(page['isHintVisible'](puzzleId)).toBe(true);

    page['solved'].set(new Set([puzzleId, 'nouveaux-74-rectangles-sur-mesure']));
    page['revealHint']('nouveaux-74-rectangles-sur-mesure');
    expect(page['isHintVisible']('nouveaux-74-rectangles-sur-mesure')).toBe(false);
  });

  it('emphasizes a solved puzzle and exposes the next puzzle action', () => {
    const fixture = TestBed.createComponent(PuzzleACadenasPage);
    const page = fixture.componentInstance;
    const solvedId = PUZZLE_A_CADENAS[0].id;

    page['selectedPuzzleId'].set(solvedId);
    page['solved'].set(new Set([solvedId]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.puzzle-content.solved-puzzle')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.solved-banner')?.textContent).toContain(
      'Puzzle résolu',
    );
    expect(fixture.nativeElement.querySelector('.next-puzzle-card')?.textContent).toContain(
      'Prochaine étape',
    );
    expect(fixture.nativeElement.querySelector('.next-button')?.textContent).toContain(
      'Ouvrir le prochain',
    );
  });

  it('renders previous and next navigation above the selected puzzle', () => {
    const fixture = TestBed.createComponent(PuzzleACadenasPage);
    const page = fixture.componentInstance;
    localStorage.removeItem('epique-puzzle-a-cadenas-selected');
    page['selectedPuzzleId'].set(PUZZLE_A_CADENAS[1].id);
    fixture.detectChanges();

    const selectedPuzzle = fixture.nativeElement.querySelector('#selected-puzzle');
    const navigation = selectedPuzzle.querySelector('.puzzle-top-nav');

    expect(selectedPuzzle.firstElementChild?.classList.contains('puzzle-top-nav')).toBe(true);
    expect(navigation.querySelector('.previous')?.textContent).toContain('Puzzle 1');
    expect(navigation.querySelector('.following')?.textContent).toContain('Puzzle 3');
    expect(navigation.querySelector('.puzzle-top-nav-progress')?.textContent).toContain('02');

    navigation.querySelector('.following')?.click();
    expect(page['selectedPuzzleId']()).toBe(PUZZLE_A_CADENAS[2].id);
    localStorage.removeItem('epique-puzzle-a-cadenas-selected');
  });
});

describe('Puzzle à Cadenas in Finale 2', () => {
  const solvedStorageKey = 'epique-puzzle-a-cadenas-solved';
  const progressStorageKey = 'epique-puzzle-playlist-progress';
  const completionStorageKey = 'epique-puzzle-playlist-completed-at-finale-2';
  const index = FINALE_2_PLAYLIST_ROUTES.length - 1;
  const finalUrl = `/puzzle-a-cadenas?from=playlist&playlist=${FINALE_2_PLAYLIST_ID}&playlistIndex=${index}`;
  const completedAt = Date.UTC(2026, 10, 16, 13);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'puzzle-a-cadenas', component: PuzzleACadenasPage }]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved: vi.fn() } },
      ],
    });
    vi.spyOn(Date, 'now').mockReturnValue(completedAt);
  });

  afterEach(() => {
    localStorage.removeItem(solvedStorageKey);
    localStorage.removeItem(progressStorageKey);
    localStorage.removeItem(completionStorageKey);
    vi.restoreAllMocks();
  });

  function saveProgressAtFinale(): void {
    localStorage.setItem(
      progressStorageKey,
      JSON.stringify({
        [FINALE_2_PLAYLIST_ID]: {
          index,
          order: FINALE_2_PLAYLIST_ROUTES.map((_, routeIndex) => routeIndex),
          routes: FINALE_2_PLAYLIST_ROUTES,
        },
      }),
    );
  }

  it('completes the playlist when the last lock is opened', async () => {
    const [lastLock, ...openedLocks] = PUZZLE_A_CADENAS;
    localStorage.setItem(solvedStorageKey, JSON.stringify(openedLocks.map(({ id }) => id)));
    saveProgressAtFinale();

    const harness = await RouterTestingHarness.create(finalUrl);
    const playlists = TestBed.inject(PuzzlePlaylistService);
    const finale = playlists.find(FINALE_2_PLAYLIST_ID)!;
    expect(finale.lastCompletedAt).toBeNull();

    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('.answer-row input')!;
    input.value = lastLock.answer;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    harness.detectChanges();

    expect(playlists.find(finale.id)?.lastCompletedAt).toBe(completedAt);
    expect(playlists.progressFor(finale)).toBeNull();
  });

  it('counts the previously opened collection when an active run reaches it', async () => {
    localStorage.setItem(solvedStorageKey, JSON.stringify(PUZZLE_A_CADENAS.map(({ id }) => id)));
    saveProgressAtFinale();

    await RouterTestingHarness.create(finalUrl);

    const playlists = TestBed.inject(PuzzlePlaylistService);
    const finale = playlists.find(FINALE_2_PLAYLIST_ID)!;
    expect(finale.lastCompletedAt).toBe(completedAt);
    expect(playlists.progressFor(finale)).toBeNull();
  });

  it('preserves the completion date when reopening a finished run', async () => {
    const savedCompletion = completedAt - 60_000;
    localStorage.setItem(solvedStorageKey, JSON.stringify(PUZZLE_A_CADENAS.map(({ id }) => id)));
    localStorage.setItem(completionStorageKey, String(savedCompletion));

    await RouterTestingHarness.create(finalUrl);

    const playlists = TestBed.inject(PuzzlePlaylistService);
    expect(playlists.find(FINALE_2_PLAYLIST_ID)?.lastCompletedAt).toBe(savedCompletion);
  });
});

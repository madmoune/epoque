import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PUZZLE_A_CADENAS } from './puzzle-a-cadenas.catalog';
import { PuzzleACadenasPage } from './puzzle-a-cadenas.page';

describe('Puzzle à Cadenas display', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzleACadenasPage],
      providers: [provideRouter([])],
    }).compileComponents();
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
    expect(page['displayBlocks'](grid).find((block) => block.type === 'diagram')).toMatchObject({
      type: 'diagram',
      kind: 'grid',
    });
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
});

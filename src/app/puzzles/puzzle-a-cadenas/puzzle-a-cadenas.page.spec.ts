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

  it('renders fleet row and column codes as a readable grid', () => {
    const page = TestBed.createComponent(PuzzleACadenasPage).componentInstance;
    const puzzle = PUZZLE_A_CADENAS.find(
      (entry) => entry.id === 'nouveaux-75-flotte-silencieuse',
    )!;
    const fleetBlocks = page['displayBlocks'](puzzle).filter((block) => block.type === 'fleet');

    expect(fleetBlocks).toHaveLength(16);
    expect(fleetBlocks[0]).toMatchObject({
      type: 'fleet',
      label: 'A',
      rowTotals: ['1', '1', '0', '1'],
      columnTotals: ['0', '2', '1', '0'],
      result: '3',
    });
    expect(fleetBlocks.at(-1)).toMatchObject({
      type: 'fleet',
      label: 'D',
      rowTotals: ['2', '0', '0', '1'],
      columnTotals: ['1', '1', '0', '1'],
      result: '?',
    });
  });
});

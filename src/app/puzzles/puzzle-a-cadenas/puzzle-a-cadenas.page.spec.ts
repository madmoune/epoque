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
});

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'anagrams',
    loadComponent: () => import('./puzzles/anagrams/anagram.page').then((m) => m.AnagramsPage),
  },
  {
    path: 'cryptograms',
    loadComponent: () =>
      import('./puzzles/cryptograms/cryptogram.page').then((m) => m.CryptogramsPage),
  },
  {
    path: 'phrases',
    loadComponent: () => import('./puzzles/phrases/phrase.page').then((m) => m.PhrasesPage),
  },
  {
    path: 'memory-grid',
    loadComponent: () =>
      import('./puzzles/memory-grid/memory-grid.page').then((m) => m.MemoryGridPage),
  },
  {
    path: 'jigsaw-grid',
    loadComponent: () =>
      import('./puzzles/jigsaw-grid/jigsaw-grid.page').then((m) => m.JigsawGridPage),
  },
  {
    path: 'jigsaw-blocks',
    loadComponent: () =>
      import('./puzzles/jigsaw-blocks/jigsaw-blocks.page').then((m) => m.PathwaysPage),
  },
  {
    path: 'corner-cube',
    loadComponent: () =>
      import('./puzzles/corner-cube/corner-cube.page').then((m) => m.CornerCubePage),
  },
  {
    path: 'sliding-puzzle',
    loadComponent: () =>
      import('./puzzles/sliding-puzzle/sliding-puzzle.page').then((m) => m.SlidingPuzzlePage),
  },
  {
    path: 'shape-layers',
    loadComponent: () =>
      import('./puzzles/shape-layers/shape-layers.page').then((m) => m.ShapeLayersPage),
  },
  {
    path: 'tangram',
    loadComponent: () => import('./puzzles/tangram/tangram.page').then((m) => m.TangramPage),
  },
  {
    path: 'knights-and-knaves',
    loadComponent: () =>
      import('./puzzles/knights-and-knaves/knights-and-knaves.page').then(
        (m) => m.KnightsAndKnavesPage,
      ),
  },
  {
    path: 'sequences',
    loadComponent: () => import('./puzzles/sequences/sequences.page').then((m) => m.SequencesPage),
  },
  {
    path: 'crossmath',
    loadComponent: () => import('./puzzles/crossmath/crossmath.page').then((m) => m.CrossmathPage),
  },
  {
    path: 'latin-square',
    loadComponent: () =>
      import('./puzzles/latin-square/latin-square.page').then((m) => m.LatinSquarePage),
  },
  {
    path: 'magic-square',
    loadComponent: () =>
      import('./puzzles/magic-square/magic-square.page').then((m) => m.MagicSquarePage),
  },
  {
    path: 'mnemonic',
    loadComponent: () => import('./puzzles/mnemonic/mnemonic.page').then((m) => m.MnemonicPage),
  },
  {
    path: 'dice',
    loadComponent: () => import('./puzzles/dice/dice.page').then((m) => m.DicePage),
  },
  {
    path: 'nim',
    loadComponent: () => import('./puzzles/games/nim/nim.page').then((m) => m.NimPage),
  },
  {
    path: 'mastermind',
    loadComponent: () =>
      import('./puzzles/games/mastermind/mastermind.page').then((m) => m.MastermindPage),
  },
  {
    path: 'tic-tac-toe',
    loadComponent: () =>
      import('./puzzles/games/tic-tac-toe/tic-tac-toe.page').then((m) => m.TicTacToePage),
  },
  {
    path: 'rush-hour',
    loadComponent: () =>
      import('./puzzles/games/rush-hour/rush-hour.page').then((m) => m.RushHourPage),
  },
  {
    path: 'timing-drop',
    loadComponent: () =>
      import('./puzzles/games/timing-drop/timing-drop.page').then((m) => m.TimingDropPage),
  },
  {
    path: 'describe-symbols',
    loadComponent: () =>
      import('./puzzles/games/describe-symbols/describe-symbols.page').then(
        (m) => m.DescribeSymbolsPage,
      ),
  },
  {
    path: 'puzzlehunt/navigation',
    loadComponent: () =>
      import('./puzzles/puzzlehunt/Navigation/navigation.page').then((m) => m.NavigationPuzzlePage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

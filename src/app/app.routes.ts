import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/home/home.page').then((m) => m.HomePage),
    },
    {
        path: 'anagrams',
        loadComponent: () =>
            import('./puzzles/anagrams/anagram.page').then((m) => m.AnagramsPage),
    },
    {
        path: 'cryptograms',
        loadComponent: () =>
            import('./puzzles/cryptograms/cryptogram.page').then(
                (m) => m.CryptogramsPage,
            ),
    },
    {
        path: 'phrases',
        loadComponent: () =>
            import('./puzzles/phrases/phrase.page').then((m) => m.PhrasesPage),
    },
    {
        path: 'memory-grid',
        loadComponent: () =>
            import('./puzzles/memory-grid/memory-grid.page').then(
                (m) => m.MemoryGridPage,
            ),
    },
    {
        path: 'jigsaw-grid',
        loadComponent: () =>
            import('./puzzles/jigsaw-grid/jigsaw-grid.page').then(
                (m) => m.JigsawGridPage,
            ),
    },
    {
        path: 'jigsaw-blocks',
        loadComponent: () =>
            import('./puzzles/jigsaw-blocks/jigsaw-blocks.page').then((m) => m.PathwaysPage),
    },
    {
        path: 'sequences',
        loadComponent: () =>
            import('./puzzles/sequences/sequences.page').then((m) => m.SequencesPage),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
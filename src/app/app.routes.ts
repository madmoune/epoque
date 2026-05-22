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
        path: '**',
        redirectTo: '',
    },
];
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type PuzzleType = {
    title: string;
    description: string;
    route: string;
    isAvailable: boolean;
};

@Component({
    selector: 'app-home-page',
    imports: [RouterLink],
    templateUrl: 'home.page.html',
    styleUrl: 'home.page.scss',
})
export class HomePage {
    protected readonly puzzleTypes: PuzzleType[] = [
        {
            title: 'Anagrammes',
            description: 'Réordonner les lettres pour trouver le mot.',
            route: '/anagrams',
            isAvailable: true,
        },
        {
            title: 'Cryptogrammes',
            description: 'Décoder comme un malade.',
            route: '/cryptograms',
            isAvailable: true,
        },
        {
            title: 'Phrases',
            description: 'Découvrir une lettre à la fois',
            route: '/phrases',
            isAvailable: true,
        },
        {
            title: 'Grille de mémoire',
            description: 'Mémoriser des couleurs et des formes dans une grille.',
            route: '/memory-grid',
            isAvailable: true,
        },
        {
            title: 'Casse-grille',
            description: 'Comme en audition mais personne pour nous voir échouer.',
            route: '/jigsaw-grid',
            isAvailable: true,
        },
        {
            title: 'Casse-bloques',
            description: 'Comme dans la saison 1',
            route: '/jigsaw-blocks',
            isAvailable: true,
        },
    ];
}
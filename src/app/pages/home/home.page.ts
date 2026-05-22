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
    ];
}
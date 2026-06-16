import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleAnswerComponent, PuzzlePartialAnswer } from '../../shared/puzzle-answer';

@Component({
  selector: 'app-navigation-puzzle-page',
  imports: [RouterLink, PuzzleAnswerComponent],
  templateUrl: './navigation.page.html',
  styleUrl: './navigation.page.scss',
})
export class NavigationPuzzlePage {
  protected readonly answer = 'POULIE';
  protected readonly partials: PuzzlePartialAnswer[] = [
    {
      answer: 'TRAJET',
      message: 'Oui, mais quels trajets?',
    },
  ];
}

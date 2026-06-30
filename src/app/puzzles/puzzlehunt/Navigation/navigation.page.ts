import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleAnswerComponent, PuzzlePartialAnswer } from '../../shared/puzzle-answer';
import { PuzzlePlayHistoryService } from '../../../puzzle-play-history.service';

@Component({
  selector: 'app-navigation-puzzle-page',
  imports: [RouterLink, PuzzleAnswerComponent],
  templateUrl: './navigation.page.html',
  styleUrl: './navigation.page.scss',
})
export class NavigationPuzzlePage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);

  protected readonly answer = 'POULIE';
  protected readonly partials: PuzzlePartialAnswer[] = [
    {
      answer: 'TRAJET',
      message: 'Oui, mais quels trajets?',
    },
  ];

  protected markSolved(): void {
    this.playHistory.markSolved('/puzzlehunt/navigation');
  }
}

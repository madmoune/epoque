import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../../puzzle-play-history.service';
import { PuzzleAnswerComponent } from '../../shared/puzzle-answer';
import { CLOCK_LETTER_DEFINITIONS } from './clock-letters.data';

type ClockGameLetter = {
  id: string;
  time: string;
  staticLines: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>;
};

const CLOCK_GAME_WORD = 'AFFLUENT';

@Component({
  selector: 'app-clock-letters-puzzle-page',
  imports: [RouterLink, PuzzleAnswerComponent],
  templateUrl: './clock-letters.page.html',
  styleUrl: './clock-letters.page.scss',
})
export class ClockLettersPuzzlePage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);

  protected readonly answer = CLOCK_GAME_WORD;
  protected readonly letters: ClockGameLetter[] = [...CLOCK_GAME_WORD].map((letter, index) => {
    const definition = CLOCK_LETTER_DEFINITIONS[letter];

    return {
      id: `clock-game-${index}`,
      time: definition.time,
      staticLines: definition.staticLines.map((line, lineIndex) => ({
        id: `clock-game-${index}-static-${lineIndex}`,
        x1: line[0],
        y1: line[1],
        x2: line[2],
        y2: line[3],
      })),
    };
  });

  protected markSolved(): void {
    this.playHistory.markSolved('/puzzlehunt/clock-letters');
  }
}

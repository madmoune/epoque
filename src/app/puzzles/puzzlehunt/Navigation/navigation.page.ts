import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleAnswerComponent, PuzzlePartialAnswer } from '../../shared/puzzle-answer';
import { PuzzlePlayHistoryService } from '../../../puzzle-play-history.service';
import { FirebasePuzzleCatalogService } from '../../../shared/firebase/firebase-puzzle-catalog.service';

const DEFAULT_FLAVOR_TEXT = "Les itinéraires devraient m'indiquer ce dont j'ai besoin pour la suite.";

@Component({
  selector: 'app-navigation-puzzle-page',
  imports: [RouterLink, PuzzleAnswerComponent],
  templateUrl: './navigation.page.html',
  styleUrl: './navigation.page.scss',
})
export class NavigationPuzzlePage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly firebaseCatalog = inject(FirebasePuzzleCatalogService);
  protected readonly flavorText = signal(DEFAULT_FLAVOR_TEXT);

  constructor() {
    void this.loadFlavorText();
  }

  protected readonly answer = 'POULIE';
  protected readonly partials: PuzzlePartialAnswer[] = [
    {
      answer: 'TRAJET',
      message: 'Oui, mais que représente ces trajets?',
    },
  ];

  protected markSolved(): void {
    this.playHistory.markSolved('/puzzlehunt/navigation');
  }

  private async loadFlavorText(): Promise<void> {
    if (!this.firebaseCatalog.isConfigured) {
      return;
    }

    try {
      const overrides = await this.firebaseCatalog.loadStatuses();
      const savedFlavorText = overrides.variantDescriptions['navigation']?.['navigation-main'];
      if (savedFlavorText !== undefined) {
        this.flavorText.set(savedFlavorText);
      }
    } catch {
      // Keep the built-in text when Firebase is unavailable.
    }
  }
}

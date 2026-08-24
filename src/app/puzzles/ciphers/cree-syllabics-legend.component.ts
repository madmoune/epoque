import { Component, inject } from '@angular/core';
import { CreeSyllabicsAudioService } from './cree-syllabics-audio.service';
import {
  CREE_CONSONANT_SOUNDS,
  CREE_FINALS,
  CREE_SYLLABIC_COLUMNS,
  CREE_SYLLABIC_ROWS,
  CREE_VOWEL_SOUNDS,
} from './cree-syllabics.data';

@Component({
  selector: 'app-cree-syllabics-legend',
  templateUrl: './cree-syllabics-legend.component.html',
  styleUrl: './cree-syllabics-legend.component.scss',
})
export class CreeSyllabicsLegendComponent {
  private readonly audio = inject(CreeSyllabicsAudioService);

  protected readonly columns = CREE_SYLLABIC_COLUMNS;
  protected readonly rows = CREE_SYLLABIC_ROWS;
  protected readonly finals = CREE_FINALS;
  protected readonly vowels = CREE_VOWEL_SOUNDS;
  protected readonly consonants = CREE_CONSONANT_SOUNDS;
  protected readonly activeSound = this.audio.activeSound;
  protected readonly soundError = this.audio.error;

  protected playSound(audioKey: string): void {
    void this.audio.play(audioKey);
  }
}

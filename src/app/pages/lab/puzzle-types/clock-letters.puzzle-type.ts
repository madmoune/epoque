import { PuzzleType } from '../lab.model';

export class ClockLettersPuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'clock-letters',
      name: 'Lettres horaires',
      state: 'pending',
      playRoute: '/puzzlehunt/clock-letters',
      description:
        'Décode des mots en combinant des traits fixes, un cercle et les aiguilles d’une heure.',
      answerFormat: 'Mot composé des lettres possibles.',
      clueFormat: 'Plusieurs combinaisons de traits et d’horloges forment un mot.',
      createdAt: '2026-07-14',
      updatedAt: '2026-07-14',
      variants: [
        {
          id: 'clock-letters-main',
          name: 'Mots horaires',
          state: 'pending',
          description:
            'Chaque combinaison contient un à trois traits fixes, un cercle vide et une heure. Les aiguilles et les traits forment une lettre.',
          examples: [
            {
              id: 'clock-letters-example-1',
              name: 'Mot horaire 1',
              description: 'Un premier mot composé avec les lettres horaires.',
            },
            {
              id: 'clock-letters-example-2',
              name: 'Mot horaire 2',
              description: 'Un deuxième mot composé avec les lettres horaires.',
            },
            {
              id: 'clock-letters-example-3',
              name: 'Mot horaire 3',
              description: 'Un troisième mot composé avec les lettres horaires.',
            },
          ],
        },
      ],
    });
  }
}

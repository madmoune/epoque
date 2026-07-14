import { PuzzleType } from '../lab.model';

export class NavigationPuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'navigation',
      name: 'Navigation',
      state: 'pending',
      description: 'Les itinéraires devraient m’indiquer ce dont j’ai besoin pour la suite.',
      answerFormat: 'Mot de six lettres.',
      clueFormat: 'Une carte de navigation accompagnée d’un mot à trouver.',
      playRoute: '/puzzlehunt/navigation',
      createdAt: '2026-07-14',
      updatedAt: '2026-07-14',
      variants: [
        {
          id: 'navigation-main',
          name: 'Navigation',
          state: 'pending',
          description: 'Les itinéraires devraient m’indiquer ce dont j’ai besoin pour la suite.',
          examples: [
            {
              id: 'navigation-map',
              name: 'Carte de navigation',
              description: 'Trouve ton chemin à l’aide de cette carte.',
            },
          ],
          exampleCount: 1,
          partialAnswers: [
            {
              answer: 'TRAJET',
              message: 'Oui, mais quels trajets?',
            },
          ],
        },
      ],
    });
  }
}

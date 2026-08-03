import { PuzzleType } from '../lab.model';

export type SegmentPhraseDefinition = {
  id: string;
  definition: string;
  answer: string;
};

export const SEGMENT_PHRASE_DEFINITIONS: SegmentPhraseDefinition[] = [
  {
    id: 'sable',
    definition: 'Coulée sableuse issue blocs usés',
    answer: 'SABLE',
  },
  {
    id: 'pelle',
    definition: 'Pioche solide pousse boue sableuse',
    answer: 'PELLE',
  },
  {
    id: 'poche',
    definition: 'Sacoche souple cousue sous blouse',
    answer: 'POCHE',
  },
  {
    id: 'salle',
    definition: 'Espace accessible clos paisible public',
    answer: 'SALLE',
  },
  {
    id: 'buche',
    definition: 'Bouleau feuillu séché découpé solide',
    answer: 'BUCHE',
  },
  {
    id: 'fable',
    definition: 'Dialogue cocasse déguisé sous sagesse',
    answer: 'FABLE',
  },
  {
    id: 'sauce',
    definition: 'Coulée épaisse acidulée salée délicieuse',
    answer: 'SAUCE',
  },
  {
    id: 'place',
    definition: 'Espace public paisible clos accessible',
    answer: 'PLACE',
  },
];

export class SegmentPhrasePuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'segment-phrase',
      name: 'Lettres à segments manquants',
      state: 'pending',
      playRoute: '/play/segment-phrase',
      description:
        'Une définition est affichée en lettres numériques incomplètes. Les segments manquants de chaque mot forment une lettre de la réponse.',
      answerFormat: 'Un mot formé d’une lettre par mot de la définition.',
      clueFormat:
        'Réunis les segments manquants de chaque mot pour révéler une lettre.',
      createdAt: '2026-07-29',
      updatedAt: '2026-07-29',
      variants: [
        {
          id: 'segment-phrase-main',
          name: 'Définitions lumineuses',
          state: 'pending',
          description: 'Une phrase lumineuse à déchiffrer attentivement.',
          examples: SEGMENT_PHRASE_DEFINITIONS.map((definition) => ({
            id: `segment-phrase-example-${definition.id}`,
            name: definition.answer,
            description: definition.definition,
          })),
        },
      ],
    });
  }
}

import { PuzzleType } from '../lab.model';

export type SegmentPhraseDefinition = {
  id: string;
  definition: string;
  answer: string;
  answerWordIndexes: number[];
};

export const SEGMENT_PHRASE_DEFINITIONS: SegmentPhraseDefinition[] = [
  {
    id: 'soleil',
    definition: 'Il chauffe la paisible plage sableuse, sèche le sable puis se couche.',
    answer: 'SOLEIL',
    answerWordIndexes: [1, 3, 4, 5, 6, 11],
  },
  {
    id: 'pluie',
    definition:
      'Eau douce du ciel, elle glisse, se déplace, coule puis éclabousse la plage sableuse.',
    answer: 'PLUIE',
    answerWordIndexes: [5, 7, 10, 12, 13],
  },
  {
    id: 'hibou',
    definition: 'Oiseau paisible du bois, il hulule seul sous la falaise isolée.',
    answer: 'HIBOU',
    answerWordIndexes: [0, 1, 5, 9, 10],
  },
  {
    id: 'fusee',
    definition:
      'Elle décolle du sol, file au-dessus de la foule ébahie, puis se déplace sous le ciel paisible.',
    answer: 'FUSEE',
    answerWordIndexes: [1, 5, 9, 12, 16],
  },
  {
    id: 'ecole',
    definition: 'Lieu public où la classe calcule, copie puis joue sous le soleil.',
    answer: 'ECOLE',
    answerWordIndexes: [1, 4, 5, 6, 11],
  },
  {
    id: 'douche',
    definition:
      "L'eau chaude coule, se déplace, apaise la peau, chasse la boue sableuse puis la laisse souple.",
    answer: 'DOUCHE',
    answerWordIndexes: [1, 4, 5, 8, 11, 14],
  },
  {
    id: 'poche',
    definition:
      'Sacoche souple, épaisse, cousue à la blouse, elle accueille des clés ou des pièces.',
    answer: 'POCHE',
    answerWordIndexes: [0, 2, 3, 6, 8],
  },
  {
    id: 'pelle',
    definition: 'Elle pousse la boue épaisse puis déplace le sable déposé.',
    answer: 'PELLE',
    answerWordIndexes: [1, 4, 6, 8, 9],
  },
  {
    id: 'cable',
    definition: 'Fil souple, déplaçable, solide, il passe de poulie à poulie.',
    answer: 'CABLE',
    answerWordIndexes: [1, 2, 3, 5, 7],
  },
  {
    id: 'place',
    definition: 'Espace public paisible, il accueille beaucoup de passage sous le soleil.',
    answer: 'PLACE',
    answerWordIndexes: [0, 1, 2, 4, 7],
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
      answerFormat: 'Un mot formé par les mots qui ont des segments manquants.',
      clueFormat:
        'Réunis les segments manquants des mots incomplets; les autres mots restent lisibles.',
      createdAt: '2026-07-29',
      updatedAt: '2026-08-03',
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

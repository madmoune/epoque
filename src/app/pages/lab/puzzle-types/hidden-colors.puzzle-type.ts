import { PuzzleType } from '../lab.model';

export type HiddenColorDirection = 'left' | 'right';

export type HiddenColorDefinition = {
  id: string;
  definition: string;
  answer: string;
  color: string;
  colorLabel: string;
  colorHex: string;
  colorStart: number;
  colorLength: number;
  direction: HiddenColorDirection;
  extractedSlotIndex: number;
  extractedLetter: string;
};

export const HIDDEN_COLOR_DEFINITIONS: HiddenColorDefinition[] = [
  {
    id: 'infrarouge',
    definition: 'Rayonnement invisible, souvent associé à la chaleur, utilisé par certains capteurs.',
    answer: 'INFRAROUGE',
    color: 'ROUGE',
    colorLabel: 'rouge',
    colorHex: '#ef4444',
    colorStart: 5,
    colorLength: 5,
    direction: 'right',
    extractedSlotIndex: 1,
    extractedLetter: 'N',
  },
  {
    id: 'manoir',
    definition: 'Grande demeure de campagne, traditionnellement associée à un seigneur ou du spaghetti.',
    answer: 'MANOIR',
    color: 'NOIR',
    colorLabel: 'noir',
    colorHex: '#111827',
    colorStart: 2,
    colorLength: 4,
    direction: 'right',
    extractedSlotIndex: 1,
    extractedLetter: 'A',
  },
  {
    id: 'tableur',
    definition: 'Microsoft Excel, par exemple.',
    answer: 'TABLEUR',
    color: 'BLEU',
    colorLabel: 'bleu',
    colorHex: '#2563eb',
    colorStart: 2,
    colorLength: 4,
    direction: 'right',
    extractedSlotIndex: 0,
    extractedLetter: 'T',
  },
  {
    id: 'entrevue',
    definition: "Conversation avec un employeur dans le cadre d'une embauche.",
    answer: 'ENTREVUE',
    color: 'VERT',
    colorLabel: 'vert',
    colorHex: '#16a34a',
    colorStart: 2,
    colorLength: 4,
    direction: 'left',
    extractedSlotIndex: 2,
    extractedLetter: 'U',
  },
  {
    id: 'tresor',
    definition: 'Richesses cachées par des pirates et recherchées sur une carte.',
    answer: 'TRESOR',
    color: 'ROSE',
    colorLabel: 'rose',
    colorHex: '#ec4899',
    colorStart: 2,
    colorLength: 4,
    direction: 'left',
    extractedSlotIndex: 1,
    extractedLetter: 'R',
  },
  {
    id: 'ressemblance',
    definition: 'Similitude entre deux personnes ou deux choses.',
    answer: 'RESSEMBLANCE',
    color: 'BLANC',
    colorLabel: 'blanc',
    colorHex: '#f8fafc',
    colorStart: 6,
    colorLength: 5,
    direction: 'right',
    extractedSlotIndex: 1,
    extractedLetter: 'E',
  },
];

export class HiddenColorsPuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'hidden-colors',
      name: 'Mots en couleurs',
      state: 'pending',
      playRoute: '/play/hidden-colors',
      description:
        'Complète six mots dont une couleur est remplacée par un triangle orienté. Les carrés donnent une lettre de la réponse finale.',
      answerFormat: 'Réponse finale de 6 lettres.',
      clueFormat: 'Une définition, des lettres à compléter et un triangle coloré par ligne.',
      createdAt: '2026-08-14',
      updatedAt: '2026-08-14',
      variants: [
        {
          id: 'hidden-colors-main',
          name: 'Triangles colorés',
          state: 'pending',
          description:
            'Écris les lettres autour du triangle dans chaque réponse, puis reporte une lettre dans le carré d’extraction.',
          examples: [
            {
              id: 'hidden-colors-example',
              name: 'Les couleurs cachées',
              description: 'Six définitions à compléter avec des triangles orientés.',
            },
          ],
          exampleCount: 0,
        },
      ],
    });
  }
}

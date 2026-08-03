import { PuzzleType } from '../lab.model';

export const COLOR_CHAIN_WORDS = [
  'COURANT',
  'SENTIER',
  'CAMPING',
  'PAYSAGE',
  'MARCHER',
  'GRIMPER',
  'COURAGE',
  'PARTAGE',
  'BARRAGE',
  'TERRAIN',
  'SOUFFLE',
] as const;

export const COLOR_CHAIN_CHALLENGE_WORD = 'MONTAGNE';

export class ColorChainPuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'color-chain',
      name: 'Chaîne de couleurs',
      state: 'pending',
      playRoute: '/play/color-chain',
      description:
        'Suis les couleurs dans une grille de 3 × 3 pour révéler un mot de plein air.',
      answerFormat: 'Mot de moins de neuf lettres, lu en suivant la chaîne.',
      clueFormat:
        'La couleur du fond d’une lettre indique la couleur de la prochaine lettre à trouver.',
      createdAt: '2026-07-29',
      updatedAt: '2026-07-29',
      variants: [
        {
          id: 'color-chain-main',
          name: 'Chaîne 3 × 3',
          state: 'pending',
          description:
            'Chaque case possède un fond coloré et chaque lettre est écrite dans une autre couleur. Les lettres qui ne font pas partie du parcours servent de leurres.',
          examples: [
            {
              id: 'color-chain-example-1',
              name: 'Parcours plein air',
              description: 'Une grille de couleurs avec des lettres leurres.',
            },
            {
              id: 'color-chain-example-2',
              name: 'Parcours nautique',
              description: 'Le mot caché appartient au vocabulaire du plein air.',
            },
            {
              id: 'color-chain-example-3',
              name: 'Parcours québécois',
              description: 'Une nouvelle disposition de la grille 3 × 3.',
            },
          ],
        },
      ],
    });
  }
}

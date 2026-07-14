import { PuzzleType } from '../lab.model';

export class GeometricShapesPuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'geometric-shapes',
      name: 'Formes géométriques',
      state: 'pending',
      description:
        'Le joueur déduit une combinaison en observant des formes géométriques et leurs propriétés dans une figure.',
      answerFormat:
        'Code numérique à quatre chiffres, chaque chiffre correspondant à une propriété comptée.',
      clueFormat:
        'Série de figures exemples accompagnées de leur code, suivie d’une figure à résoudre sans code.',
      createdAt: '2026-07-14',
      updatedAt: '2026-07-14',
      variants: [
        {
          id: '2-1-triangles-by-orientation',
          name: '2.1 Triangles selon leur orientation',
          state: 'pending',
          description:
            'La combinaison compte successivement les triangles pointant vers le haut, le bas, la gauche et la droite.',
          examples: [
            {
              id: '2-1-example-orientations',
              name: 'Exemple des orientations',
              description: 'Les quatre directions de triangle sont représentées dans la figure.',
            },
            {
              id: '2-1-example-mixed-orientations',
              name: 'Exemple des directions mélangées',
              description: 'Plusieurs triangles peuvent partager la même orientation.',
            },
            {
              id: '2-1-example-all-orientations',
              name: 'Exemple des quatre orientations',
              description: 'Les triangles vers le haut, le bas, la gauche et la droite sont présents.',
            },
          ],
        },
        {
          id: '2-2-triangles-by-size',
          name: '2.2 Triangles selon leur taille',
          state: 'pending',
          description:
            'La combinaison compte successivement les petits, les moyens, les grands triangles, puis le nombre total de triangles.',
          examples: [
            {
              id: '2-2-example-sizes',
              name: 'Exemple des tailles',
              description: 'Les trois tailles de triangle sont visibles et le dernier chiffre donne leur total.',
            },
            {
              id: '2-2-example-size-mix',
              name: 'Exemple des tailles mélangées',
              description: 'Une même taille peut apparaître plusieurs fois.',
            },
            {
              id: '2-2-example-all-sizes',
              name: 'Exemple des trois tailles',
              description: 'Les petits, moyens et grands triangles sont présents.',
            },
          ],
        },
        {
          id: '2-3-closed-shape-types',
          name: '2.3 Types de formes fermées',
          state: 'pending',
          description:
            'La combinaison compte successivement les carrés, les rectangles, les losanges et les triangles.',
          examples: [
            {
              id: '2-3-example-shape-types',
              name: 'Exemple des formes fermées',
              description: 'Les quatre types de formes fermées sont présents.',
            },
            {
              id: '2-3-example-repeated-types',
              name: 'Exemple des formes répétées',
              description: 'Certains types de formes apparaissent plusieurs fois.',
            },
            {
              id: '2-3-example-all-shape-types',
              name: 'Exemple des quatre types',
              description: 'Les carrés, rectangles, losanges et triangles sont représentés.',
            },
          ],
        },
        {
          id: '2-4-rectangles-by-width',
          name: '2.4 Rectangles selon leurs dimensions',
          state: 'pending',
          description:
            'La combinaison compte les rectangles dont la largeur mesure 1, 2, 3 et 4 cases.',
          examples: [
            {
              id: '2-4-example-widths',
              name: 'Exemple des largeurs',
              description: 'Les quatre largeurs de rectangle sont représentées sur la grille.',
            },
            {
              id: '2-4-example-wide-rectangles',
              name: 'Exemple des rectangles larges',
              description: 'Les rectangles peuvent occuper plusieurs cases en largeur.',
            },
            {
              id: '2-4-example-all-widths',
              name: 'Exemple des quatre largeurs',
              description: 'Les largeurs de 1, 2, 3 et 4 cases sont présentes.',
            },
          ],
        },
        {
          id: '2-5-regions-by-area',
          name: '2.5 Régions selon leur aire',
          state: 'pending',
          description:
            'La combinaison compte les régions fermées contenant 1, 2, 3 et 4 cases.',
          examples: [
            {
              id: '2-5-example-areas',
              name: 'Exemple des aires',
              description: 'Les régions de une à quatre cases sont présentes.',
            },
            {
              id: '2-5-example-large-regions',
              name: 'Exemple des grandes régions',
              description: 'Les régions peuvent être horizontales ou carrées.',
            },
            {
              id: '2-5-example-all-areas',
              name: 'Exemple des quatre aires',
              description: 'Les régions de 1, 2, 3 et 4 cases sont représentées.',
            },
          ],
        },
      ],
    });
  }
}

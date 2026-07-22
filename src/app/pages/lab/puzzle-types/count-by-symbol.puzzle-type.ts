import { PuzzleType } from '../lab.model';

export class CountBySymbolPuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'count-by-symbol',
      name: 'Segments',
      state: 'pending',
      playRoute: '/play/count-by-symbol',
      description:
        'Le joueur déduit une combinaison en comptant des éléments visuels précis dans une figure selon une légende donnée. L’ordre des quatre premiers chiffres est mélangé à chaque partie et se déduit grâce aux exemples.',
      answerFormat:
        'Code numérique à quatre chiffres, chaque chiffre correspondant à une quantité comptée.',
      clueFormat:
        'Série de figures exemples accompagnées de leur code, suivie d’une figure à résoudre sans code.',
      createdAt: '2026-07-14',
      updatedAt: '2026-07-14',
      variants: [
        {
          id: '1-1-segments-by-orientation',
          name: '1.1 Segments par orientation',
          state: 'pending',
          description:
            'La combinaison compte successivement les segments horizontaux, verticaux, diagonaux montants et diagonaux descendants. Un X compte comme une diagonale de chaque sens.',
          examples: [
            {
              id: '1-1-example-orientations',
              name: 'Exemple des orientations',
              description:
                'Un même dessin contient plusieurs orientations de segments. Le code permet d’associer chaque chiffre à une orientation.',
            },
            {
              id: '1-1-example-crossings',
              name: 'Exemple des croisements',
              description:
                'Les croisements et les X montrent que chaque segment diagonal se compte selon son propre sens.',
            },
            {
              id: '1-1-example-balanced-orientations',
              name: 'Exemple équilibré des orientations',
              description: 'Les quatre orientations sont présentes au moins une fois.',
            },
          ],
        },
        {
          id: '1-2-continuous-lines-by-orientation',
          name: '1.2 Lignes continues par orientation',
          state: 'pending',
          description:
            'La combinaison compte successivement les lignes continues horizontales, verticales, diagonales montantes et diagonales descendantes. Plusieurs segments alignés et joints comptent comme une seule ligne.',
          examples: [
            {
              id: '1-2-example-separated-lines',
              name: 'Exemple des lignes séparées',
              description:
                'Des segments de même orientation sont séparés afin de montrer qu’ils correspondent à plusieurs lignes continues.',
            },
            {
              id: '1-2-example-joined-lines',
              name: 'Exemple des lignes jointes',
              description:
                'Des segments alignés et joints forment une seule ligne, même si elle traverse plusieurs cases.',
            },
            {
              id: '1-2-example-mixed-lines',
              name: 'Exemple des lignes mélangées',
              description: 'Chaque orientation de ligne apparaît dans le réseau.',
            },
          ],
        },
        {
          id: '1-3-segments-by-length',
          name: '1.3 Segments selon leur longueur',
          state: 'pending',
          description:
            'La combinaison compte les segments de longueur 1, 2, 3 et 4 unités, sans tenir compte de leur orientation.',
          examples: [
            {
              id: '1-3-example-lengths',
              name: 'Exemple des longueurs',
              description: 'Les quatre longueurs apparaissent dans des orientations variées.',
            },
            {
              id: '1-3-example-long-segments',
              name: 'Exemple des grands segments',
              description: 'Les segments longs peuvent traverser plusieurs cases.',
            },
            {
              id: '1-3-example-complete-lengths',
              name: 'Exemple des quatre longueurs',
              description: 'Les longueurs 1, 2, 3 et 4 sont toutes représentées.',
            },
          ],
        },
        {
          id: '1-4-cell-content',
          name: '1.4 Contenu des cases',
          state: 'pending',
          description:
            'La combinaison compte successivement les cases vides, avec une diagonale montante, avec une diagonale descendante et avec un X.',
          examples: [
            {
              id: '1-4-example-cell-content',
              name: 'Exemple du contenu des cases',
              description: 'Chaque case contient zéro, une diagonale ou un X.',
            },
            {
              id: '1-4-example-crossed-cells',
              name: 'Exemple des cases croisées',
              description:
                'Les X permettent de distinguer les deux diagonales présentes dans une même case.',
            },
            {
              id: '1-4-example-all-cell-contents',
              name: 'Exemple de tous les contenus',
              description: 'Les cases vides, simples et croisées sont toutes représentées.',
            },
          ],
        },
        {
          id: '1-5-internal-lines-per-cell',
          name: '1.5 Nombre de traits internes par case',
          state: 'pending',
          description:
            'La combinaison compte les cases contenant zéro, un, deux ou trois traits internes. Les traits internes ne touchent pas le bord de leur case.',
          examples: [
            {
              id: '1-5-example-internal-lines',
              name: 'Exemple des traits internes',
              description: 'Chaque case présente un nombre différent de traits internes.',
            },
            {
              id: '1-5-example-mixed-cells',
              name: 'Exemple des cases mixtes',
              description:
                'Les traits horizontaux, verticaux et diagonaux peuvent être combinés dans une case.',
            },
            {
              id: '1-5-example-all-line-counts',
              name: 'Exemple de tous les nombres de traits',
              description: 'Les cases contenant zéro, un, deux et trois traits sont présentes.',
            },
          ],
        },
        {
          id: '1-6-cells-by-sides',
          name: '1.6 Cases selon le nombre de côtés présents',
          state: 'pending',
          description:
            'La combinaison compte les cases possédant exactement un, deux, trois ou quatre côtés tracés. Les diagonales ne sont pas des côtés.',
          examples: [
            {
              id: '1-6-example-cell-sides',
              name: 'Exemple des côtés des cases',
              description:
                'Les côtés partagés entre deux cases ne sont comptés qu’une fois dans le dessin.',
            },
            {
              id: '1-6-example-complete-cells',
              name: 'Exemple des cases complètes',
              description:
                'Certaines cases ont un contour complet tandis que d’autres sont partiellement tracées.',
            },
            {
              id: '1-6-example-all-side-counts',
              name: 'Exemple de tous les nombres de côtés',
              description: 'Les cases avec un, deux, trois et quatre côtés sont représentées.',
            },
          ],
        },
        {
          id: '1-7-visible-outer-borders',
          name: '1.7 Bords extérieurs visibles',
          state: 'pending',
          description:
            'Le cadre est divisé en trois portions par côté, une par case. Comptez les portions occupées par un trait sur le contour, dans l’ordre haut, droite, bas et gauche. Les diagonales et les traits à l’intérieur de la figure ne comptent pas.',
          examples: [
            {
              id: '1-7-example-outer-borders',
              name: 'Exemple des bords extérieurs',
              description:
                'Les portions visibles sont réparties sur les quatre côtés de la figure.',
            },
            {
              id: '1-7-example-border-portions',
              name: 'Exemple des portions exposées',
              description: 'Un même côté peut contenir plusieurs portions exposées.',
            },
            {
              id: '1-7-example-all-outer-sides',
              name: 'Exemple des quatre côtés',
              description: 'Les portions occupées apparaissent sur les quatre côtés du cadre.',
            },
          ],
        },
        {
          id: '1-8-quadrant-occupation',
          name: '1.8 Occupation des quadrants',
          state: 'pending',
          description:
            'La combinaison compte les cases occupées dans les quadrants supérieur gauche, supérieur droit, inférieur gauche et inférieur droit. La figure utilise une grille 4×4.',
          examples: [
            {
              id: '1-8-example-quadrants',
              name: 'Exemple des quadrants',
              description:
                'Les cases occupées sont réparties dans les quatre quadrants de la grille.',
            },
            {
              id: '1-8-example-occupation',
              name: 'Exemple de répartition',
              description: 'Chaque quadrant peut contenir un nombre différent de cases occupées.',
            },
            {
              id: '1-8-example-all-quadrants',
              name: 'Exemple des quatre quadrants',
              description: 'Les quatre quadrants contiennent chacun au moins une case occupée.',
            },
          ],
        },
      ],
    });
  }
}

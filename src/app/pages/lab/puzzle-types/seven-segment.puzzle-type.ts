import { PuzzleType } from '../lab.model';

export class SevenSegmentPuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'seven-segment',
      name: 'Afficheurs à sept segments',
      state: 'pending',
      description:
        'Le joueur observe des chiffres d’afficheur à sept segments et déduit une transformation, une correction ou un parcours.',
      answerFormat:
        'Code numérique à quatre chiffres, déduit à partir des segments allumés.',
      clueFormat:
        'Figures exemples accompagnées de leur code, suivies d’un afficheur à résoudre.',
      variants: [
        {
          id: '3-1-broken-segment',
          name: '3.1 Segments inversés',
          state: 'pending',
          description:
            'Les deux mêmes segments sont inversés sur tous les chiffres. Inversez-les partout, puis lisez le code corrigé.',
          examples: [
            { id: '3-1-example-broken-a', name: 'Deux segments inversés A', description: 'Les deux segments fautifs sont communs à tous les afficheurs.' },
            { id: '3-1-example-broken-b', name: 'Deux segments inversés B', description: 'Les segments allumés et éteints sont intervertis avant la lecture.' },
            { id: '3-1-example-broken-c', name: 'Deux segments inversés C', description: 'Le code montre les chiffres après correction.' },
          ],
        },
        {
          id: '3-3-move-one-segment',
          name: '3.2 Déplacer un segment',
          state: 'pending',
          description:
            'Déplacez exactement un segment allumé pour que tous les afficheurs deviennent des chiffres valides et forment le plus grand nombre possible.',
          examples: [
            { id: '3-3-example-move-a', name: 'Un déplacement simple', description: 'Un segment passe d’un chiffre à un autre.' },
            { id: '3-3-example-move-b', name: 'Le plus grand nombre', description: 'La condition impose le résultat numérique maximal.' },
            { id: '3-3-example-move-c', name: 'Tous les chiffres valides', description: 'Le résultat final ne contient que des chiffres valides.' },
          ],
        },
        {
          id: '3-4-segment-sequence',
          name: '3.3 Suite de segments',
          state: 'pending',
          description:
            'Chaque terme ajoute ou retire des segments selon une règle qui se répète. Trouvez le chiffre manquant à la fin de la suite.',
          examples: [
            { id: '3-4-example-sequence-a', name: 'Suite alternante', description: 'Les ajouts et les retraits alternent.' },
            { id: '3-4-example-sequence-b', name: 'Suite par ajout', description: 'La même transformation se répète à chaque terme.' },
            { id: '3-4-example-sequence-c', name: 'Terme manquant', description: 'Le dernier afficheur doit être complété.' },
          ],
        },
        {
          id: '3-5-minimum-transition-cost',
          name: '3.4 Coût minimal de transition',
          state: 'pending',
          description:
            'Chaque segment allumé ou éteint coûte un point. Trouvez l’ordre de chiffres dont le coût total est minimal.',
          examples: [
            { id: '3-5-example-cost-a', name: 'Coût entre chiffres', description: 'Comparez le nombre de segments qui changent.' },
            { id: '3-5-example-cost-b', name: 'Ordre optimal', description: 'Le code donne le parcours au coût le plus bas.' },
            { id: '3-5-example-cost-c', name: 'Route la moins chère', description: 'Plusieurs ordres sont possibles, un seul est minimal.' },
          ],
        },
        {
          id: '3-6-superimposed-digits',
          name: '3.5 Chiffres superposés',
          state: 'pending',
          description:
            'Deux chiffres sont superposés : un segment est allumé si au moins un des deux chiffres l’utilise. Retrouvez les deux chiffres cachés.',
          examples: [
            { id: '3-6-example-superimposed-a', name: 'Superposition simple', description: 'La forme finale combine deux chiffres valides.' },
            { id: '3-6-example-superimposed-b', name: 'Double superposition', description: 'Deux afficheurs combinés doivent être décomposés.' },
            { id: '3-6-example-superimposed-c', name: 'Paires cachées', description: 'Les deux paires de chiffres sont retrouvées.' },
          ],
        },
        {
          id: '3-7-common-segments',
          name: '3.6 Segments communs',
          state: 'pending',
          description:
            'La forme visible ne garde que les segments partagés par deux chiffres. Utilisez cette intersection pour retrouver les paires.',
          examples: [
            { id: '3-7-example-common-a', name: 'Intersection visible', description: 'Seuls les segments communs restent allumés.' },
            { id: '3-7-example-common-b', name: 'Paires avec indice', description: 'Un chiffre connu aide à retrouver son partenaire.' },
            { id: '3-7-example-common-c', name: 'Deux intersections', description: 'Les deux paires doivent être identifiées.' },
          ],
        },
        {
          id: '3-8-segment-algebra',
          name: '3.7 Algèbre des segments',
          state: 'pending',
          description:
            'Chaque position de segment vaut un nombre. Utilisez les équations des exemples pour calculer la valeur du dernier chiffre.',
          examples: [
            { id: '3-8-example-algebra-a', name: 'Équations de segments', description: 'Les totaux permettent de déterminer les valeurs.' },
            { id: '3-8-example-algebra-b', name: 'Valeur cachée', description: 'Une combinaison de segments donne le chiffre final.' },
            { id: '3-8-example-algebra-c', name: 'Système complet', description: 'Les sept positions sont contraintes par plusieurs équations.' },
          ],
        },
        {
          id: '3-9-segment-frequency-map',
          name: '3.8 Carte de fréquence',
          state: 'pending',
          description:
            'Les fréquences des sept positions sont données pour tout le code. Reconstituez les chiffres en utilisant les indices supplémentaires.',
          examples: [
            { id: '3-9-example-frequency-a', name: 'Fréquences simples', description: 'Chaque ligne indique combien de fois un segment apparaît.' },
            { id: '3-9-example-frequency-b', name: 'Code sans répétition', description: 'Les indices réduisent les codes compatibles.' },
            { id: '3-9-example-frequency-c', name: 'Carte complète', description: 'Les sept fréquences sont nécessaires.' },
          ],
        },
        {
          id: '3-10-segment-path',
          name: '3.9 Parcours de segments',
          state: 'pending',
          description:
            'Reliez deux chiffres seulement si leurs motifs diffèrent du nombre de segments indiqué, puis lisez le parcours valide.',
          examples: [
            { id: '3-10-example-path-a', name: 'Chemin de distance 1', description: 'Chaque mouvement change exactement un segment.' },
            { id: '3-10-example-path-b', name: 'Nœuds et route', description: 'Le parcours passe par des chiffres voisins.' },
            { id: '3-10-example-path-c', name: 'Parcours complet', description: 'Le code suit la route de départ à l’arrivée.' },
          ],
        },
      ],
    });
  }
}

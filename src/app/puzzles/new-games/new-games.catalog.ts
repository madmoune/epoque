export type NewGameId =
  | 'cryptarithms'
  | 'skyscrapers'
  | 'kakuro'
  | 'sumplete'
  | 'word-fit'
  | 'drop-quote';

export const NEW_GAMES = [
  {
    id: 'cryptarithms',
    title: 'Cryptarithmes courts',
    description: 'Remplace chaque lettre par un chiffre pour rendre l’addition correcte.',
    tag: 'Chiffres',
    rule: 'Une lettre représente toujours le même chiffre. Deux lettres différentes ont des chiffres différents, et un nombre ne commence jamais par zéro.',
  },
  {
    id: 'skyscrapers',
    title: 'Gratte-ciel',
    description: 'Place les hauteurs des tours en respectant les vues depuis les bords.',
    tag: 'Logique',
    rule: 'Place les hauteurs de 1 à 4 une seule fois par ligne et par colonne. Un indice indique combien de tours sont visibles depuis ce côté : une grande tour cache les plus petites derrière elle.',
  },
  {
    id: 'kakuro',
    title: 'Mini-Kakuro',
    description: 'Croise les sommes horizontales et verticales pour remplir la grille.',
    tag: 'Chiffres',
    rule: 'Remplis les cases blanches avec les chiffres de 1 à 9. Chaque groupe doit donner la somme indiquée, sans répéter un chiffre dans ce groupe. → indique une somme horizontale, ↓ une somme verticale.',
  },
  {
    id: 'sumplete',
    title: 'Sommes à barrer',
    description: 'Barre les nombres en trop pour obtenir les totaux de chaque ligne et colonne.',
    tag: 'Chiffres',
    rule: 'Clique sur un nombre pour le barrer, puis reclique pour le garder. Les nombres conservés doivent donner le total demandé à droite de chaque ligne et en bas de chaque colonne.',
  },
  {
    id: 'word-fit',
    title: 'Mots à caser',
    description: 'Place tous les mots dans une grille en utilisant leurs lettres communes.',
    tag: 'Lettres',
    rule: 'Choisis un emplacement, puis un mot de la bonne longueur. Utilise chaque mot une seule fois ; les lettres doivent être identiques aux croisements. Clique de nouveau sur une case pour changer de direction.',
  },
  {
    id: 'drop-quote',
    title: 'Lettres tombées',
    description: 'Fais retomber les lettres dans leur colonne pour retrouver une phrase.',
    tag: 'Lettres',
    rule: 'Choisis une case, puis une lettre de la réserve située au-dessus de sa colonne. Les lettres restent dans leur colonne. Les espaces sont déjà placés ; les accents sont retirés.',
  },
] as const satisfies readonly {
  id: NewGameId;
  title: string;
  description: string;
  tag: string;
  rule: string;
}[];

export const NEW_GAME_ROUTES = NEW_GAMES.map((game) => `/${game.id}`);

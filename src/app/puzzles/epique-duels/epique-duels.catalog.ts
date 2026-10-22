export type EpiqueGameId = 'wythoff' | 'nim-emission' | 'isola' | 'domineering' | 'sim' | 'hex';

export type EpiqueGameDefinition = {
  id: EpiqueGameId;
  title: string;
  kicker: string;
  description: string;
  objective: string;
  rules: string[];
  tag: string;
};

export const EPIQUE_DUELS: EpiqueGameDefinition[] = [
  {
    id: 'wythoff',
    title: 'Wythoff',
    kicker: 'Stratégie mathématique',
    description: 'Vide les deux piles en trouvant les positions gagnantes.',
    objective: 'Retirer le dernier jeton pour gagner.',
    rules: [
      'Le plateau commence avec deux piles de 5 à 15 jetons.',
      'À ton tour, clique sur un jeton : ce jeton et tous ceux placés après lui sont retirés de cette pile.',
      'Tu peux aussi retirer le même nombre de jetons dans les deux piles grâce aux boutons sous le plateau.',
      'Tu dois retirer au moins un jeton. Le joueur qui retire le dernier jeton gagne.',
    ],
    tag: 'Calcul',
  },
  {
    id: 'nim-emission',
    title: 'Nim — émission',
    kicker: 'Jeu télévisé',
    description: 'Retire les drapeaux avec la règle surprise de la manche.',
    objective: 'Suivre la règle révélée : prendre le dernier drapeau, ou être celui qui ne le prend pas.',
    rules: [
      'La partie commence avec une seule pile de 18 à 25 drapeaux, tirée au sort.',
      'Le maximum autorisé par tour est tiré au sort : 3, 4 ou 5 drapeaux. Tu peux toujours en retirer au moins 1.',
      'La règle de la manche est révélée au début : prendre le dernier drapeau fait gagner, ou prendre le dernier drapeau fait perdre.',
      'Clique sur l’un des derniers drapeaux autorisés ou utilise les boutons de retrait sous la pile.',
    ],
    tag: 'Drapeaux',
  },
  {
    id: 'isola',
    title: 'Isolation',
    kicker: 'Déplacement et blocage',
    description: 'Déplace ton pion puis coupe une case pour enfermer l’adversaire.',
    objective: 'Être le dernier joueur capable de déplacer son pion.',
    rules: [
      'Chaque joueur possède un pion sur une grille de 5 × 5.',
      'Déplace ton pion d’une case dans l’une des huit directions, diagonales comprises.',
      'Après le déplacement, retire définitivement une case libre, n’importe où sur le plateau.',
      'Une case retirée ou occupée ne peut plus être utilisée. Un joueur sans déplacement légal perd.',
    ],
    tag: 'Blocage',
  },
  {
    id: 'domineering',
    title: 'Domineering',
    kicker: 'Placement stratégique',
    description: 'Occupe l’espace avec des dominos horizontaux ou verticaux.',
    objective: 'Jouer le dernier domino légal.',
    rules: [
      'La partie se joue sur une grille de 5 × 5 cases.',
      'Le joueur 1 pose uniquement des dominos horizontaux; le joueur 2 pose uniquement des dominos verticaux.',
      'Clique une première case puis la case voisine pour placer un domino. Les dominos ne peuvent pas se chevaucher.',
      'Le joueur qui ne peut plus placer son domino perd.',
    ],
    tag: 'Placement',
  },
  {
    id: 'sim',
    title: 'Sim',
    kicker: 'Pièges géométriques',
    description: 'Relie les points sans être le premier à fermer un triangle.',
    objective: 'Éviter de former un triangle entièrement de ta couleur.',
    rules: [
      'Six points sont disposés en cercle et chaque paire de points peut être reliée une seule fois.',
      'À ton tour, choisis une arête libre. Les lignes peuvent se croiser.',
      'Les intersections ne créent pas de nouveaux points.',
      'Si ton coup ferme un triangle dont les trois arêtes sont de ta couleur, tu perds immédiatement.',
    ],
    tag: 'Logique',
  },
  {
    id: 'hex',
    title: 'Hex',
    kicker: 'Connexion de chemins',
    description: 'Construis une chaîne continue avant que l’autre couleur ne traverse le plateau.',
    objective: 'Relier ses deux côtés opposés avant l’adversaire.',
    rules: [
      'Le plateau est une grille de 5 × 5 cases hexagonales.',
      'Rouge doit relier le haut et le bas; bleu doit relier la gauche et la droite.',
      'À ton tour, pose un jeton sur une case vide. Les jetons restent en place.',
      'Seules les cases qui partagent un côté sont connectées. Le premier chemin continu gagne.',
    ],
    tag: 'Chemin',
  },
];

export const EPIQUE_DUEL_ROUTES = EPIQUE_DUELS.map((game) => `/${game.id}`);

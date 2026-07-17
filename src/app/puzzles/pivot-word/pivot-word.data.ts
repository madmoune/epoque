export type PivotWordLink = {
  clue: string;
  expression: string;
};

export type PivotWordPuzzle = {
  answer: string;
  acceptedAnswers?: readonly string[];
  definition: string;
  links: readonly PivotWordLink[];
};

export const PIVOT_WORD_PUZZLES: readonly PivotWordPuzzle[] = [
  {
    answer: 'plume',
    definition: 'Élément léger qui couvre le corps d’un oiseau.',
    links: [
      { clue: 'poids', expression: 'poids plume' },
      { clue: 'oreiller', expression: 'oreiller de plumes' },
      { clue: 'porte', expression: 'porte-plume' },
    ],
  },
  {
    answer: 'terre',
    definition: 'Sol où poussent les plantes; aussi notre planète.',
    links: [
      { clue: 'pomme', expression: 'pomme de terre' },
      { clue: 'ferme', expression: 'terre ferme' },
      { clue: 'ver', expression: 'ver de terre' },
    ],
  },
  {
    answer: 'feuille',
    definition: 'Partie plate d’une plante ou mince support d’écriture.',
    links: [
      { clue: 'mille', expression: 'mille-feuille' },
      { clue: 'papier', expression: 'feuille de papier' },
      { clue: 'morte', expression: 'feuille morte' },
    ],
  },
  {
    answer: 'glace',
    definition: 'Eau passée à l’état solide.',
    links: [
      { clue: 'brise', expression: 'brise-glace' },
      { clue: 'noire', expression: 'glace noire' },
      { clue: 'poche', expression: 'poche de glace' },
    ],
  },
  {
    answer: 'garde',
    definition: 'Action de protéger ou personne chargée de surveiller.',
    links: [
      { clue: 'fou', expression: 'garde-fou' },
      { clue: 'corps', expression: 'garde du corps' },
      { clue: 'avant', expression: 'avant-garde' },
    ],
  },
  {
    answer: 'point',
    definition: 'Très petite marque ou position précise.',
    links: [
      { clue: 'vue', expression: 'point de vue' },
      { clue: 'final', expression: 'point final' },
      { clue: 'mise', expression: 'mise au point' },
    ],
  },
  {
    answer: 'carte',
    definition: 'Support plat portant des informations ou permettant un accès.',
    links: [
      { clue: 'blanche', expression: 'carte blanche' },
      { clue: 'mère', expression: 'carte mère' },
      { clue: 'visite', expression: 'carte de visite' },
    ],
  },
  {
    answer: 'clé',
    acceptedAnswers: ['clef'],
    definition: 'Objet ou principe qui permet d’ouvrir ou de comprendre.',
    links: [
      { clue: 'mot', expression: 'mot-clé' },
      { clue: 'voûte', expression: 'clé de voûte' },
      { clue: 'USB', expression: 'clé USB' },
    ],
  },
  {
    answer: 'tête',
    definition: 'Partie supérieure du corps qui contient le cerveau.',
    links: [
      { clue: 'casse', expression: 'casse-tête' },
      { clue: 'série', expression: 'tête de série' },
      { clue: 'queue', expression: 'tête-à-queue' },
    ],
  },
  {
    answer: 'main',
    definition: 'Partie du corps située au bout du bras.',
    links: [
      { clue: 'coup', expression: 'coup de main' },
      { clue: 'courante', expression: 'main courante' },
      { clue: 'œuvre', expression: 'main-d’œuvre' },
    ],
  },
  {
    answer: 'banc',
    definition: 'Siège allongé pouvant accueillir plusieurs personnes.',
    links: [
      { clue: 'sable', expression: 'banc de sable' },
      { clue: 'essai', expression: 'banc d’essai' },
      { clue: 'public', expression: 'banc public' },
    ],
  },
  {
    answer: 'arc',
    definition: 'Courbe ou arme qui lance des flèches.',
    links: [
      { clue: 'ciel', expression: 'arc-en-ciel' },
      { clue: 'triomphe', expression: 'arc de triomphe' },
      { clue: 'électrique', expression: 'arc électrique' },
    ],
  },
  {
    answer: 'champ',
    definition: 'Étendue délimitée, réelle ou abstraite.',
    links: [
      { clue: 'bataille', expression: 'champ de bataille' },
      { clue: 'hors', expression: 'hors-champ' },
      { clue: 'libre', expression: 'champ libre' },
    ],
  },
  {
    answer: 'chaîne',
    definition: 'Suite d’éléments reliés entre eux.',
    links: [
      { clue: 'alimentaire', expression: 'chaîne alimentaire' },
      { clue: 'montagnes', expression: 'chaîne de montagnes' },
      { clue: 'travail', expression: 'travail à la chaîne' },
    ],
  },
  {
    answer: 'course',
    definition: 'Déplacement rapide ou compétition de vitesse.',
    links: [
      { clue: 'montre', expression: 'course contre la montre' },
      { clue: 'orientation', expression: 'course d’orientation' },
      { clue: 'voiture', expression: 'voiture de course' },
    ],
  },
  {
    answer: 'ligne',
    definition: 'Trace continue ou suite alignée de points.',
    links: [
      { clue: 'arrivée', expression: 'ligne d’arrivée' },
      { clue: 'droite', expression: 'ligne droite' },
      { clue: 'hors', expression: 'hors ligne' },
    ],
  },
  {
    answer: 'piste',
    definition: 'Voie aménagée ou trace à suivre.',
    links: [
      { clue: 'cyclable', expression: 'piste cyclable' },
      { clue: 'danse', expression: 'piste de danse' },
      { clue: 'hors', expression: 'hors-piste' },
    ],
  },
  {
    answer: 'eau',
    definition: 'Liquide transparent essentiel à la vie.',
    links: [
      { clue: 'vive', expression: 'eau vive' },
      { clue: 'plan', expression: 'plan d’eau' },
      { clue: 'source', expression: 'eau de source' },
    ],
  },
  {
    answer: 'feu',
    definition: 'Combustion produisant chaleur et lumière.',
    links: [
      { clue: 'vert', expression: 'feu vert' },
      { clue: 'coupe', expression: 'coupe-feu' },
      { clue: 'camp', expression: 'feu de camp' },
    ],
  },
  {
    answer: 'bois',
    definition: 'Matière des arbres ou terrain couvert d’arbres.',
    links: [
      { clue: 'sous', expression: 'sous-bois' },
      { clue: 'mort', expression: 'bois mort' },
      { clue: 'langue', expression: 'langue de bois' },
    ],
  },
  {
    answer: 'vent',
    definition: 'Déplacement naturel de l’air.',
    links: [
      { clue: 'coupe', expression: 'coupe-vent' },
      { clue: 'arrière', expression: 'vent arrière' },
      { clue: 'coup', expression: 'coup de vent' },
    ],
  },
  {
    answer: 'air',
    definition: 'Mélange gazeux que nous respirons.',
    links: [
      { clue: 'plein', expression: 'plein air' },
      { clue: 'famille', expression: 'air de famille' },
      { clue: 'courant', expression: 'courant d’air' },
    ],
  },
  {
    answer: 'mer',
    definition: 'Grande étendue d’eau salée.',
    links: [
      { clue: 'bord', expression: 'bord de mer' },
      { clue: 'mal', expression: 'mal de mer' },
      { clue: 'intérieure', expression: 'mer intérieure' },
    ],
  },
  {
    answer: 'chemin',
    definition: 'Voie permettant d’aller d’un lieu à un autre.',
    links: [
      { clue: 'fer', expression: 'chemin de fer' },
      { clue: 'traverse', expression: 'chemin de traverse' },
      { clue: 'faisant', expression: 'chemin faisant' },
    ],
  },
  {
    answer: 'route',
    definition: 'Voie aménagée pour circuler.',
    links: [
      { clue: 'feuille', expression: 'feuille de route' },
      { clue: 'nationale', expression: 'route nationale' },
      { clue: 'soie', expression: 'route de la soie' },
    ],
  },
  {
    answer: 'pont',
    definition: 'Construction permettant de franchir un obstacle.',
    links: [
      { clue: 'levis', expression: 'pont-levis' },
      { clue: 'aérien', expression: 'pont aérien' },
      { clue: 'tête', expression: 'tête de pont' },
    ],
  },
  {
    answer: 'passe',
    definition: 'Action de transmettre ou passage étroit.',
    links: [
      { clue: 'partout', expression: 'passe-partout' },
      { clue: 'mot', expression: 'mot de passe' },
      { clue: 'temps', expression: 'passe-temps' },
    ],
  },
  {
    answer: 'porte',
    definition: 'Ouverture mobile donnant accès à un lieu.',
    links: [
      { clue: 'monnaie', expression: 'porte-monnaie' },
      { clue: 'ouverte', expression: 'porte ouverte' },
      { clue: 'faux', expression: 'porte-à-faux' },
    ],
  },
  {
    answer: 'tour',
    definition: 'Mouvement circulaire, trajet ou exploit remarquable.',
    links: [
      { clue: 'piste', expression: 'tour de piste' },
      { clue: 'force', expression: 'tour de force' },
      { clue: 'demi', expression: 'demi-tour' },
    ],
  },
  {
    answer: 'fil',
    definition: 'Brin long et fin servant à relier ou conduire.',
    links: [
      { clue: 'conducteur', expression: 'fil conducteur' },
      { clue: 'coup', expression: 'coup de fil' },
      { clue: 'eau', expression: 'au fil de l’eau' },
    ],
  },
  {
    answer: 'plan',
    definition: 'Représentation, organisation ou niveau de cadrage.',
    links: [
      { clue: 'B', expression: 'plan B' },
      { clue: 'gros', expression: 'gros plan' },
      { clue: 'eau', expression: 'plan d’eau' },
    ],
  },
  {
    answer: 'jour',
    definition: 'Période éclairée entre le lever et le coucher du soleil.',
    links: [
      { clue: 'mise', expression: 'mise à jour' },
      { clue: 'férié', expression: 'jour férié' },
      { clue: 'abat', expression: 'abat-jour' },
    ],
  },
  {
    answer: 'nuit',
    definition: 'Période d’obscurité entre le soir et le matin.',
    links: [
      { clue: 'blanche', expression: 'nuit blanche' },
      { clue: 'bonnet', expression: 'bonnet de nuit' },
      { clue: 'oiseau', expression: 'oiseau de nuit' },
    ],
  },
  {
    answer: 'temps',
    definition: 'Durée ou moment dans lequel se déroulent les événements.',
    links: [
      { clue: 'passe', expression: 'passe-temps' },
      { clue: 'mort', expression: 'temps mort' },
      { clue: 'gain', expression: 'gain de temps' },
    ],
  },
  {
    answer: 'heure',
    definition: 'Unité de temps égale à soixante minutes.',
    links: [
      { clue: 'pointe', expression: 'heure de pointe' },
      { clue: 'quart', expression: 'quart d’heure' },
      { clue: 'locale', expression: 'heure locale' },
    ],
  },
  {
    answer: 'monde',
    definition: 'Ensemble de la Terre, de ses habitants ou d’un milieu.',
    links: [
      { clue: 'tour', expression: 'tour du monde' },
      { clue: 'fin', expression: 'fin du monde' },
      { clue: 'beau', expression: 'beau monde' },
    ],
  },
  {
    answer: 'langue',
    definition: 'Organe de la bouche ou système de communication.',
    links: [
      { clue: 'maternelle', expression: 'langue maternelle' },
      { clue: 'bois', expression: 'langue de bois' },
      { clue: 'mauvaise', expression: 'mauvaise langue' },
    ],
  },
  {
    answer: 'mot',
    definition: 'Unité de langue porteuse de sens.',
    links: [
      { clue: 'passe', expression: 'mot de passe' },
      { clue: 'clé', expression: 'mot-clé' },
      { clue: 'dernier', expression: 'dernier mot' },
    ],
  },
  {
    answer: 'lettre',
    definition: 'Signe alphabétique ou message écrit.',
    links: [
      { clue: 'ouverte', expression: 'lettre ouverte' },
      { clue: 'boîte', expression: 'boîte aux lettres' },
      { clue: 'morte', expression: 'lettre morte' },
    ],
  },
  {
    answer: 'livre',
    definition: 'Ouvrage formé de pages reliées.',
    links: [
      { clue: 'poche', expression: 'livre de poche' },
      { clue: 'blanc', expression: 'livre blanc' },
      { clue: 'sterling', expression: 'livre sterling' },
    ],
  },
  {
    answer: 'page',
    definition: 'Face d’une feuille dans un ouvrage.',
    links: [
      { clue: 'blanche', expression: 'page blanche' },
      { clue: 'tourne', expression: 'tourne-page' },
      { clue: 'mise', expression: 'mise en page' },
    ],
  },
  {
    answer: 'note',
    definition: 'Courte indication écrite ou son musical.',
    links: [
      { clue: 'service', expression: 'note de service' },
      { clue: 'fausse', expression: 'fausse note' },
      { clue: 'prise', expression: 'prise de notes' },
    ],
  },
  {
    answer: 'sens',
    definition: 'Signification, direction ou faculté de perception.',
    links: [
      { clue: 'unique', expression: 'sens unique' },
      { clue: 'bon', expression: 'bon sens' },
      { clue: 'contre', expression: 'contresens' },
    ],
  },
  {
    answer: 'esprit',
    definition: 'Faculté de penser ou disposition mentale.',
    links: [
      { clue: 'équipe', expression: 'esprit d’équipe' },
      { clue: 'bel', expression: 'bel esprit' },
      { clue: 'mot', expression: 'mot d’esprit' },
    ],
  },
  {
    answer: 'idée',
    definition: 'Représentation ou conception formée par l’esprit.',
    links: [
      { clue: 'reçue', expression: 'idée reçue' },
      { clue: 'boîte', expression: 'boîte à idées' },
      { clue: 'fixe', expression: 'idée fixe' },
    ],
  },
  {
    answer: 'mémoire',
    definition: 'Capacité de conserver et rappeler des informations.',
    links: [
      { clue: 'trou', expression: 'trou de mémoire' },
      { clue: 'vive', expression: 'mémoire vive' },
      { clue: 'devoir', expression: 'devoir de mémoire' },
    ],
  },
  {
    answer: 'parole',
    definition: 'Expression orale de la pensée.',
    links: [
      { clue: 'prise', expression: 'prise de parole' },
      { clue: 'honneur', expression: 'parole d’honneur' },
      { clue: 'porte', expression: 'porte-parole' },
    ],
  },
  {
    answer: 'voix',
    definition: 'Son produit par une personne qui parle ou chante.',
    links: [
      { clue: 'off', expression: 'voix off' },
      { clue: 'porte', expression: 'porte-voix' },
      { clue: 'vive', expression: 'de vive voix' },
    ],
  },
  {
    answer: 'jeu',
    definition: 'Activité avec règles pratiquée pour se divertir.',
    links: [
      { clue: 'piste', expression: 'jeu de piste' },
      { clue: 'hors', expression: 'hors-jeu' },
      { clue: 'rôle', expression: 'jeu de rôle' },
    ],
  },
  {
    answer: 'règle',
    definition: 'Principe à respecter ou instrument de mesure rectiligne.',
    links: [
      { clue: 'jeu', expression: 'règle du jeu' },
      { clue: 'or', expression: 'règle d’or' },
      { clue: 'générale', expression: 'règle générale' },
    ],
  },
  {
    answer: 'numéro',
    definition: 'Identifiant composé de chiffres ou rang dans une série.',
    links: [
      { clue: 'série', expression: 'numéro de série' },
      { clue: 'mauvais', expression: 'mauvais numéro' },
      { clue: 'vert', expression: 'numéro vert' },
    ],
  },
  {
    answer: 'code',
    definition: 'Ensemble de signes ou de règles permettant de communiquer.',
    links: [
      { clue: 'postal', expression: 'code postal' },
      { clue: 'source', expression: 'code source' },
      { clue: 'conduite', expression: 'code de conduite' },
    ],
  },
  {
    answer: 'marque',
    definition: 'Signe distinctif laissé ou associé à un produit.',
    links: [
      { clue: 'page', expression: 'marque-page' },
      { clue: 'déposée', expression: 'marque déposée' },
      { clue: 'image', expression: 'image de marque' },
    ],
  },
  {
    answer: 'école',
    definition: 'Établissement d’enseignement ou courant de pensée.',
    links: [
      { clue: 'buissonnière', expression: 'école buissonnière' },
      { clue: 'cas', expression: 'cas d’école' },
      { clue: 'pensée', expression: 'école de pensée' },
    ],
  },
  {
    answer: 'concours',
    definition: 'Compétition entre candidats ou rencontre fortuite de faits.',
    links: [
      { clue: 'circonstances', expression: 'concours de circonstances' },
      { clue: 'jeu', expression: 'jeu-concours' },
      { clue: 'hors', expression: 'hors concours' },
    ],
  },
  {
    answer: 'épreuve',
    definition: 'Test, difficulté ou partie d’une compétition.',
    links: [
      { clue: 'mise', expression: 'mise à l’épreuve' },
      { clue: 'force', expression: 'épreuve de force' },
      { clue: 'écrite', expression: 'épreuve écrite' },
    ],
  },
  {
    answer: 'force',
    definition: 'Capacité d’agir, de résister ou de produire un mouvement.',
    links: [
      { clue: 'majeure', expression: 'force majeure' },
      { clue: 'tour', expression: 'tour de force' },
      { clue: 'rapport', expression: 'rapport de force' },
    ],
  },
  {
    answer: 'record',
    definition: 'Meilleure performance officiellement constatée.',
    links: [
      { clue: 'monde', expression: 'record du monde' },
      { clue: 'battre', expression: 'battre un record' },
      { clue: 'temps', expression: 'temps record' },
    ],
  },
  {
    answer: 'départ',
    definition: 'Moment ou point où l’on commence à partir.',
    links: [
      { clue: 'faux', expression: 'faux départ' },
      { clue: 'ligne', expression: 'ligne de départ' },
      { clue: 'point', expression: 'point de départ' },
    ],
  },
  {
    answer: 'équipe',
    definition: 'Groupe de personnes réunies pour un objectif commun.',
    links: [
      { clue: 'esprit', expression: 'esprit d’équipe' },
      { clue: 'chef', expression: 'chef d’équipe' },
      { clue: 'nationale', expression: 'équipe nationale' },
    ],
  },
  {
    answer: 'racine',
    definition: 'Partie souterraine d’une plante ou origine d’un élément.',
    links: [
      { clue: 'carrée', expression: 'racine carrée' },
      { clue: 'mot', expression: 'mot-racine' },
      { clue: 'prendre', expression: 'prendre racine' },
    ],
  },
  {
    answer: 'source',
    definition: 'Point d’origine d’une eau ou d’une information.',
    links: [
      { clue: 'code', expression: 'code source' },
      { clue: 'eau', expression: 'source d’eau' },
      { clue: 'sûre', expression: 'source sûre' },
    ],
  },
  {
    answer: 'courant',
    definition: 'Mouvement continu d’un fluide, d’une charge ou d’idées.',
    links: [
      { clue: 'air', expression: 'courant d’air' },
      { clue: 'compte', expression: 'compte courant' },
      { clue: 'alternatif', expression: 'courant alternatif' },
    ],
  },
  {
    answer: 'étoile',
    definition: 'Astre lumineux visible dans le ciel nocturne.',
    links: [
      { clue: 'filante', expression: 'étoile filante' },
      { clue: 'mer', expression: 'étoile de mer' },
      { clue: 'danseur', expression: 'danseur étoile' },
    ],
  },
  {
    answer: 'lune',
    definition: 'Satellite naturel de la Terre.',
    links: [
      { clue: 'pleine', expression: 'pleine lune' },
      { clue: 'miel', expression: 'lune de miel' },
      { clue: 'clair', expression: 'clair de lune' },
    ],
  },
  {
    answer: 'soleil',
    definition: 'Étoile au centre de notre système planétaire.',
    links: [
      { clue: 'coup', expression: 'coup de soleil' },
      { clue: 'coucher', expression: 'coucher de soleil' },
      { clue: 'pare', expression: 'pare-soleil' },
    ],
  },
  {
    answer: 'ciel',
    definition: 'Espace visible au-dessus de nos têtes.',
    links: [
      { clue: 'arc', expression: 'arc-en-ciel' },
      { clue: 'ouvert', expression: 'ciel ouvert' },
      { clue: 'gratte', expression: 'gratte-ciel' },
    ],
  },
  {
    answer: 'neige',
    definition: 'Précipitation formée de cristaux de glace.',
    links: [
      { clue: 'boule', expression: 'boule de neige' },
      { clue: 'chasse', expression: 'chasse-neige' },
      { clue: 'éternelle', expression: 'neige éternelle' },
    ],
  },
  {
    answer: 'pierre',
    definition: 'Morceau de roche dur et solide.',
    links: [
      { clue: 'précieuse', expression: 'pierre précieuse' },
      { clue: 'âge', expression: 'âge de pierre' },
      { clue: 'angulaire', expression: 'pierre angulaire' },
    ],
  },
  {
    answer: 'sable',
    definition: 'Ensemble de très petits grains minéraux.',
    links: [
      { clue: 'château', expression: 'château de sable' },
      { clue: 'grain', expression: 'grain de sable' },
      { clue: 'bac', expression: 'bac à sable' },
    ],
  },
  {
    answer: 'fleur',
    definition: 'Partie colorée d’une plante qui porte ses organes reproducteurs.',
    links: [
      { clue: 'pot', expression: 'pot de fleurs' },
      { clue: 'sel', expression: 'fleur de sel' },
      { clue: 'fine', expression: 'fine fleur' },
    ],
  },
  {
    answer: 'pomme',
    definition: 'Fruit rond du pommier.',
    links: [
      { clue: 'terre', expression: 'pomme de terre' },
      { clue: 'Adam', expression: 'pomme d’Adam' },
      { clue: 'pin', expression: 'pomme de pin' },
    ],
  },
  {
    answer: 'grain',
    definition: 'Très petite particule ou semence de certaines plantes.',
    links: [
      { clue: 'sable', expression: 'grain de sable' },
      { clue: 'gros', expression: 'gros grain' },
      { clue: 'beauté', expression: 'grain de beauté' },
    ],
  },
  {
    answer: 'café',
    definition: 'Boisson préparée à partir de graines torréfiées.',
    links: [
      { clue: 'pause', expression: 'pause-café' },
      { clue: 'lait', expression: 'café au lait' },
      { clue: 'grain', expression: 'grain de café' },
    ],
  },
  {
    answer: 'table',
    definition: 'Meuble à surface plane soutenue par des pieds.',
    links: [
      { clue: 'ronde', expression: 'table ronde' },
      { clue: 'matières', expression: 'table des matières' },
      { clue: 'dessous', expression: 'dessous-de-table' },
    ],
  },
  {
    answer: 'boîte',
    definition: 'Récipient rigide muni ou non d’un couvercle.',
    links: [
      { clue: 'noire', expression: 'boîte noire' },
      { clue: 'outils', expression: 'boîte à outils' },
      { clue: 'nuit', expression: 'boîte de nuit' },
    ],
  },
  {
    answer: 'poche',
    definition: 'Petit compartiment cousu ou cavité fermée.',
    links: [
      { clue: 'livre', expression: 'livre de poche' },
      { clue: 'argent', expression: 'argent de poche' },
      { clue: 'air', expression: 'poche d’air' },
    ],
  },
  {
    answer: 'sac',
    definition: 'Contenant souple servant à transporter.',
    links: [
      { clue: 'dos', expression: 'sac à dos' },
      { clue: 'cul', expression: 'cul-de-sac' },
      { clue: 'couchage', expression: 'sac de couchage' },
    ],
  },
  {
    answer: 'carré',
    definition: 'Figure à quatre côtés égaux et quatre angles droits.',
    links: [
      { clue: 'magique', expression: 'carré magique' },
      { clue: 'VIP', expression: 'carré VIP' },
      { clue: 'as', expression: 'carré d’as' },
    ],
  },
  {
    answer: 'angle',
    definition: 'Figure formée par deux lignes qui se rencontrent.',
    links: [
      { clue: 'droit', expression: 'angle droit' },
      { clue: 'grand', expression: 'grand angle' },
      { clue: 'mort', expression: 'angle mort' },
    ],
  },
];

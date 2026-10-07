export type SymbolStyle =
  | 'flag'
  | 'leaf'
  | 'flower'
  | 'tree'
  | 'mountain'
  | 'ball'
  | 'butterfly'
  | 'bird'
  | 'fish'
  | 'mushroom'
  | 'shell'
  | 'cactus'
  | 'drop'
  | 'cloud'
  | 'racket'
  | 'trophy';

type SymbolSilhouette = {
  outline: string;
  details: string;
};

type SymbolStyleDefinition = {
  label: string;
  emblemCenter: [number, number];
  emblemScale: number;
  silhouettes: SymbolSilhouette[];
};

const ROUND_BALL = 'M90 11 A49 49 0 1 1 90 109 A49 49 0 1 1 90 11 Z';

function flowerSilhouette(petals: number): SymbolSilhouette {
  const petalRadius = petals === 5 ? 20 : petals === 6 ? 17 : 14;
  const centerRadius = 50 - petalRadius;
  const petalAngle = (Math.PI * 2) / petals;
  const points = Array.from({ length: 120 }, (_, index) => {
    const turn = (index / 120) * Math.PI * 2;
    const angle = turn - Math.PI / 2;
    const offset = ((turn + petalAngle / 2) % petalAngle) - petalAngle / 2;
    // Follow the outside of overlapping round petals around a filled center.
    const radius =
      centerRadius * Math.cos(offset) +
      Math.sqrt(petalRadius ** 2 - (centerRadius * Math.sin(offset)) ** 2);
    return [90 + Math.cos(angle) * radius * 1.15, 60 + Math.sin(angle) * radius];
  });

  return {
    outline:
      points
        .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
        .join(' ') + ' Z',
    details: 'M106 60 A16 16 0 1 1 74 60 A16 16 0 1 1 106 60 Z',
  };
}

export const SYMBOL_STYLE_IDS: SymbolStyle[] = [
  'flag',
  'leaf',
  'flower',
  'tree',
  'mountain',
  'ball',
  'butterfly',
  'bird',
  'fish',
  'mushroom',
  'shell',
  'cactus',
  'drop',
  'cloud',
  'racket',
  'trophy',
];

export const SYMBOL_STYLES: Record<SymbolStyle, SymbolStyleDefinition> = {
  flag: {
    label: 'Pavillon',
    emblemCenter: [90, 60],
    emblemScale: 1,
    silhouettes: [
      {
        outline: 'M16 8 H164 Q172 8 172 16 V104 Q172 112 164 112 H16 Q8 112 8 104 V16 Q8 8 16 8 Z',
        details: '',
      },
    ],
  },
  leaf: {
    label: 'Feuille',
    emblemCenter: [90, 60],
    emblemScale: 0.78,
    silhouettes: [
      {
        outline: 'M30 98 C24 51 69 15 151 12 C149 66 111 101 36 100 L25 111 L20 106 Z',
        details:
          'M29 103 L137 24 M54 79 L48 56 M74 63 L70 38 M94 48 L111 49 M54 79 L85 83 M74 63 L112 68',
      },
      {
        outline:
          'M86 111 L87 89 L55 96 L60 80 L26 59 L48 56 L39 31 L67 42 L70 19 L82 29 L90 8 L99 29 L111 20 L114 42 L143 31 L134 56 L156 59 L121 80 L126 96 L94 89 L94 111 Z',
        details: 'M90 104 V27 M90 74 L54 48 M90 74 L128 48 M90 85 L59 87 M90 85 L122 87',
      },
      {
        outline:
          'M86 111 V96 C64 104 48 90 58 78 C36 75 39 56 57 54 C43 38 56 24 74 31 C70 15 83 8 90 9 C106 8 113 20 106 31 C125 22 139 40 123 54 C143 58 143 77 122 80 C132 96 113 103 94 96 V111 Z',
        details:
          'M90 105 V24 M90 48 L72 38 M90 48 L109 38 M90 68 L59 62 M90 68 L121 62 M90 87 L70 82 M90 87 L110 83',
      },
    ],
  },
  flower: {
    label: 'Fleur',
    emblemCenter: [90, 60],
    emblemScale: 0.75,
    silhouettes: [flowerSilhouette(5), flowerSilhouette(6), flowerSilhouette(8)],
  },
  tree: {
    label: 'Arbre',
    emblemCenter: [90, 68],
    emblemScale: 0.65,
    silhouettes: [
      {
        outline:
          'M90 9 L115 38 H106 L132 65 H118 L151 98 H99 V111 H81 V98 H29 L62 65 H48 L74 38 H65 Z',
        details: 'M90 106 V34 M90 62 L73 51 M90 62 L107 51 M90 86 L64 74 M90 86 L116 74',
      },
      {
        outline:
          'M81 111 V91 C65 98 49 86 49 74 C29 78 20 59 31 47 C27 29 42 18 58 24 C69 8 91 8 103 20 C124 9 146 23 143 42 C162 49 161 72 144 80 C139 95 113 97 99 88 V111 Z',
        details: 'M90 106 V49 M90 81 L61 62 M90 81 L119 61 M90 64 L75 42 M90 64 L108 39',
      },
      {
        outline:
          'M90 9 C78 19 76 31 71 34 C56 39 54 54 58 63 C45 76 52 95 80 96 V111 H100 V96 C127 95 135 76 122 63 C127 52 121 40 109 34 C104 28 102 19 90 9 Z',
        details: 'M90 106 V30 M90 57 L76 46 M90 57 L104 46 M90 81 L68 69 M90 81 L112 69',
      },
    ],
  },
  mountain: {
    label: 'Montagne',
    emblemCenter: [90, 84],
    emblemScale: 0.55,
    silhouettes: [
      {
        outline: 'M12 108 L83 14 Q90 6 97 14 L168 108 Z',
        details: 'M65 42 L80 49 L90 36 L103 50 L116 43 M90 36 L90 106',
      },
      {
        outline: 'M12 108 L61 18 L100 73 L125 34 L168 108 Z',
        details: 'M46 45 L61 51 L74 37 M114 53 L127 60 L137 54 M61 51 L91 106',
      },
      {
        outline: 'M12 108 L47 54 L66 76 L91 13 L120 65 L139 39 L168 108 Z',
        details: 'M35 73 L48 80 L56 69 M79 43 L91 50 L104 39 M130 62 L141 69 L151 67',
      },
    ],
  },
  ball: {
    label: 'Ballon',
    emblemCenter: [90, 60],
    emblemScale: 0.8,
    silhouettes: [
      {
        outline: ROUND_BALL,
        details:
          'M90 44 L105 55 L99 73 H81 L75 55 Z M90 44 V11 M105 55 L135 37 M99 73 L120 100 M81 73 L60 100 M75 55 L45 37',
      },
      {
        outline: ROUND_BALL,
        details: 'M41 60 H139 M90 11 V109 M56 26 C102 43 102 77 56 94 M124 26 C78 43 78 77 124 94',
      },
      {
        outline: 'M16 60 C40 -3 140 -3 164 60 C140 123 40 123 16 60 Z',
        details:
          'M24 60 H156 M70 50 V70 M80 48 V72 M90 48 V72 M100 48 V72 M110 50 V70 M42 29 C58 46 58 74 42 91 M138 29 C122 46 122 74 138 91',
      },
    ],
  },
  butterfly: {
    label: 'Papillon',
    emblemCenter: [90, 62],
    emblemScale: 0.6,
    silhouettes: [
      {
        outline:
          'M86 48 C75 17 45 8 29 22 C13 37 28 58 60 64 C33 62 21 81 31 97 C43 113 69 102 84 77 L87 106 H93 L96 77 C111 102 137 113 149 97 C159 81 147 62 120 64 C152 58 167 37 151 22 C135 8 105 17 94 48 V29 Q90 21 86 29 Z',
        details:
          'M90 32 V99 M80 55 C63 27 40 25 35 35 C33 45 53 58 75 62 M100 55 C117 27 140 25 145 35 C147 45 127 58 105 62 M77 77 C62 74 47 78 46 89 M103 77 C118 74 133 78 134 89',
      },
      {
        outline:
          'M85 49 L59 14 L17 21 L27 49 L62 67 L25 74 L41 104 L66 96 L84 76 L87 106 H93 L96 76 L114 96 L139 104 L155 74 L118 67 L153 49 L163 21 L121 14 L95 49 L94 28 Q90 22 86 28 Z',
        details:
          'M90 33 V98 M77 55 L51 28 L31 30 M103 55 L129 28 L149 30 M72 76 L43 84 L47 94 M108 76 L137 84 L133 94',
      },
      {
        outline:
          'M85 50 C72 22 44 14 19 18 C21 40 30 57 57 65 C42 69 34 81 40 92 L30 109 L49 102 C64 104 79 91 86 75 L88 103 H92 L94 75 C101 91 116 104 131 102 L150 109 L140 92 C146 81 138 69 123 65 C150 57 159 40 161 18 C136 14 108 22 95 50 L94 28 Q90 20 86 28 Z',
        details:
          'M90 31 V97 M77 55 C63 36 46 29 31 28 M103 55 C117 36 134 29 149 28 M79 74 C60 73 49 82 49 93 M101 74 C120 73 131 82 131 93',
      },
    ],
  },
  bird: {
    label: 'Oiseau',
    emblemCenter: [90, 66],
    emblemScale: 0.6,
    silhouettes: [
      {
        outline:
          'M27 83 L46 62 C47 43 64 32 84 40 L95 24 Q112 10 129 24 L135 33 L157 39 L136 46 C137 72 119 90 98 93 L98 108 H86 L86 94 L72 89 L58 109 L47 106 L56 82 Z',
        details:
          'M117 32 A3 3 0 1 1 111 32 A3 3 0 1 1 117 32 Z M66 55 Q96 48 112 70 Q91 85 70 74 M57 70 L40 83 M91 95 V105',
      },
      {
        outline:
          'M81 45 V34 Q81 20 95 20 Q107 20 109 30 L130 34 L109 40 L105 48 C124 23 147 16 168 22 L146 43 H163 L131 64 L148 66 L107 81 V104 L90 91 L73 104 V81 L32 66 L49 64 L17 43 H34 L12 22 C36 16 62 23 81 45 Z',
        details:
          'M82 59 L41 31 M98 59 L139 31 M70 65 L45 53 M110 65 L135 53 M90 67 V85 M102 29 A2 2 0 1 1 98 29 A2 2 0 1 1 102 29 Z',
      },
      {
        outline:
          'M18 60 L49 67 C55 52 75 46 94 51 L98 33 C99 18 120 13 129 27 L134 35 L160 43 L134 49 L131 66 C129 85 111 99 79 98 C57 98 36 85 29 76 Z',
        details:
          'M122 30 A3 3 0 1 1 116 30 A3 3 0 1 1 122 30 Z M59 68 Q86 55 111 72 Q88 91 62 81 M100 36 L103 57 M134 42 H151',
      },
    ],
  },
  fish: {
    label: 'Poisson',
    emblemCenter: [100, 60],
    emblemScale: 0.55,
    silhouettes: [
      {
        outline:
          'M43 60 C59 22 119 15 153 52 L169 60 L153 68 C119 105 59 98 43 60 L16 88 L23 60 L16 32 Z',
        details:
          'M142 51 A3 3 0 1 1 136 51 A3 3 0 1 1 142 51 Z M126 38 Q114 60 126 82 M70 44 L93 60 L70 76 M23 60 H40',
      },
      {
        outline:
          'M42 60 C58 42 78 38 97 40 L110 16 L121 42 C141 43 154 49 168 60 C154 74 142 82 121 80 L109 103 L97 81 C77 83 58 77 42 60 L13 85 L24 60 L13 35 Z',
        details:
          'M148 55 A3 3 0 1 1 142 55 A3 3 0 1 1 148 55 Z M132 47 Q123 60 132 75 M59 60 H113 M100 38 L111 30 M101 83 L109 94',
      },
      {
        outline:
          'M41 60 L76 16 Q83 10 90 19 L104 28 Q129 32 153 52 L169 60 L153 68 Q129 88 104 92 L90 101 Q83 111 76 104 L41 60 L14 82 L20 60 L14 38 Z',
        details:
          'M142 52 A3 3 0 1 1 136 52 A3 3 0 1 1 142 52 Z M125 38 Q113 60 125 82 M79 29 V91 M96 36 V86 M21 60 H36',
      },
    ],
  },
  mushroom: {
    label: 'Champignon',
    emblemCenter: [90, 47],
    emblemScale: 0.6,
    silhouettes: [
      {
        outline:
          'M17 64 C22 30 50 12 90 12 C130 12 158 30 163 64 Q138 73 111 68 L118 103 Q120 112 107 112 H73 Q60 112 62 103 L69 68 Q42 73 17 64 Z',
        details:
          'M22 63 Q90 52 158 63 M54 35 A5 5 0 1 1 44 35 A5 5 0 1 1 54 35 Z M134 39 A6 6 0 1 1 122 39 A6 6 0 1 1 134 39 Z M82 75 L78 103 M101 75 L105 103',
      },
      {
        outline:
          'M14 62 Q28 29 65 14 Q90 5 115 14 Q152 29 166 62 Q143 78 112 69 L108 99 L117 108 Q90 115 63 108 L72 99 L68 69 Q37 78 14 62 Z',
        details:
          'M20 64 Q90 77 160 64 M61 31 A5 5 0 1 1 51 31 A5 5 0 1 1 61 31 Z M132 42 A7 7 0 1 1 118 42 A7 7 0 1 1 132 42 Z M85 17 A4 4 0 1 1 77 17 A4 4 0 1 1 85 17 Z M74 83 Q90 90 108 83 M90 91 V104',
      },
      {
        outline:
          'M19 27 Q40 16 62 29 Q90 11 118 29 Q140 16 161 27 Q156 63 116 75 L105 111 H75 L64 75 Q24 63 19 27 Z',
        details:
          'M27 30 Q51 42 72 30 Q90 41 109 30 Q132 42 153 30 M42 45 L78 77 M138 45 L102 77 M67 46 L85 85 M113 46 L95 85 M90 85 V105',
      },
    ],
  },
  shell: {
    label: 'Coquillage',
    emblemCenter: [90, 64],
    emblemScale: 0.65,
    silhouettes: [
      {
        outline:
          'M65 105 C59 100 43 101 41 88 C21 87 17 68 28 58 C20 40 36 23 51 26 C57 7 78 8 90 19 C102 8 123 7 129 26 C144 23 160 40 152 58 C163 68 159 87 139 88 C137 101 121 100 115 105 L109 112 H71 Z',
        details:
          'M90 103 V27 M81 100 L58 31 M73 96 L34 59 M99 100 L122 31 M107 96 L146 59 M67 103 Q90 91 113 103',
      },
      {
        outline:
          'M18 98 L52 69 C48 39 68 14 95 14 C127 14 150 37 152 64 C154 88 137 105 111 107 L82 99 L66 109 L55 95 Z',
        details:
          'M61 77 C47 48 77 21 106 31 C137 41 141 83 113 94 C91 103 69 89 73 65 C76 45 105 45 111 60 C117 73 105 86 92 77 Q85 72 93 66 M31 95 L56 81',
      },
      {
        outline:
          'M94 9 L112 35 Q132 40 125 61 Q143 81 126 99 Q112 112 87 111 L64 109 L56 97 Q46 80 58 67 Q50 46 68 37 L78 19 Z',
        details:
          'M77 32 Q96 43 113 34 M63 51 Q90 64 124 50 M59 73 Q89 88 127 72 M65 94 Q90 102 119 94 M95 46 Q78 49 83 62 Q90 71 99 64',
      },
    ],
  },
  cactus: {
    label: 'Cactus',
    emblemCenter: [90, 68],
    emblemScale: 0.5,
    silhouettes: [
      {
        outline:
          'M71 110 V78 H49 Q30 78 30 60 V39 Q30 26 43 26 Q56 26 56 39 V53 H71 V29 Q71 10 90 10 Q109 10 109 29 V65 H124 V46 Q124 33 137 33 Q150 33 150 46 V72 Q150 91 131 91 H109 V110 Z',
        details: 'M90 24 V104 M79 38 V66 M101 45 V76 M43 40 V60 H67 M137 47 V74 H113 M66 105 H114',
      },
      {
        outline:
          'M68 110 V82 H47 Q31 82 31 66 V56 Q17 51 19 35 Q21 19 37 20 Q54 22 54 40 Q54 48 48 53 V63 H68 V47 Q55 35 59 21 Q63 8 79 10 Q95 11 98 27 Q102 40 90 48 V56 H110 V43 Q104 36 105 26 Q107 12 121 12 Q137 12 140 27 Q143 39 133 47 V64 Q133 80 115 80 H94 V110 Z',
        details:
          'M81 52 V104 M78 18 V36 M29 31 L44 40 M35 53 V68 H63 M122 20 V35 M117 50 V67 H98 M62 105 H101',
      },
      {
        outline: 'M64 110 Q44 94 44 68 C44 43 64 16 90 16 C116 16 136 43 136 68 Q136 94 116 110 Z',
        details:
          'M90 23 V104 M75 27 C58 50 58 82 73 104 M105 27 C122 50 122 82 107 104 M48 59 H57 M123 59 H132 M51 82 H60 M120 82 H129 M85 40 H95 M85 88 H95',
      },
    ],
  },
  drop: {
    label: 'Goutte',
    emblemCenter: [90, 72],
    emblemScale: 0.6,
    silhouettes: [
      {
        outline: 'M90 9 C79 26 51 47 51 74 A39 39 0 0 0 129 74 C129 47 101 26 90 9 Z',
        details: 'M79 41 Q63 57 65 77 M70 89 Q80 101 96 99',
      },
      {
        outline: 'M147 12 C113 15 61 24 41 56 C21 88 48 113 79 105 C113 96 128 59 147 12 Z',
        details: 'M114 29 Q74 39 55 65 M49 78 Q48 93 65 94',
      },
      {
        outline:
          'M90 10 C80 31 55 46 52 67 C29 66 15 79 24 91 C34 103 54 96 63 93 C64 114 89 116 97 103 C113 117 137 106 133 92 C155 100 171 82 155 73 C145 66 135 65 128 69 C126 48 102 31 90 10 Z',
        details:
          'M77 43 Q66 54 65 65 M40 80 Q50 75 60 81 M121 82 Q139 72 148 81 M72 96 Q90 85 108 96',
      },
    ],
  },
  cloud: {
    label: 'Nuage',
    emblemCenter: [90, 64],
    emblemScale: 0.8,
    silhouettes: [
      {
        outline:
          'M40 96 C18 95 10 70 29 56 C20 35 39 17 58 27 C70 8 98 8 109 28 C132 17 153 32 151 51 C172 61 170 88 151 97 Z',
        details: 'M29 62 Q41 51 53 63 M64 32 Q79 22 91 31 M129 40 Q139 39 143 49 M48 84 H136',
      },
      {
        outline:
          'M33 91 C14 92 8 67 25 58 C24 42 44 32 56 42 C63 23 88 22 99 39 C119 20 147 30 147 50 C167 50 177 73 159 88 Q150 94 135 92 Z',
        details: 'M28 63 Q40 55 51 66 M66 47 Q82 36 96 49 M116 45 Q132 36 141 50 M47 80 H134',
      },
      {
        outline:
          'M35 85 C14 84 11 60 28 50 C27 32 49 21 63 31 C70 9 100 7 112 30 C137 15 159 34 154 53 C175 64 165 85 146 85 H105 L96 95 H112 L82 112 L86 95 H72 L82 85 Z',
        details:
          'M30 57 Q45 46 58 57 M73 30 Q88 19 101 31 M130 39 Q145 38 147 51 M48 74 H135 M87 92 L99 86',
      },
    ],
  },
  racket: {
    label: 'Raquette',
    emblemCenter: [87, 47],
    emblemScale: 0.6,
    silhouettes: [
      {
        outline:
          'M80 10 C104 7 123 23 126 45 C129 63 115 77 103 83 L120 107 Q123 112 116 114 L105 115 L88 89 C69 88 50 73 47 54 C43 32 57 14 80 10 Z',
        details:
          'M82 21 C100 18 115 30 116 46 C118 62 105 77 89 77 C72 77 58 66 57 52 C54 37 64 25 82 21 Z M72 27 L83 74 M86 22 L99 73 M100 26 L111 62 M58 40 L113 27 M57 54 L118 40 M63 67 L115 53 M96 93 L107 88 M101 101 L113 95',
      },
      {
        outline:
          'M87 10 C112 10 133 29 133 51 C133 71 116 87 100 90 V110 H80 V90 C59 86 45 70 45 49 C45 27 63 10 87 10 Z',
        details: 'M85 23 C105 20 119 35 119 51 Q119 68 104 78 M80 87 H99 M86 96 H94 M86 103 H94',
      },
      {
        outline:
          'M87 10 C106 10 120 24 120 43 C120 60 110 73 97 77 V105 Q97 113 90 113 Q83 113 83 105 V77 C67 73 57 60 57 43 C57 25 70 10 87 10 Z',
        details:
          'M88 20 C102 20 110 30 110 43 C110 57 102 66 89 67 C76 67 67 57 67 43 C67 30 75 20 88 20 Z M78 24 V64 M89 21 V67 M100 24 V63 M68 34 H109 M67 46 H110 M71 58 H105 M85 94 H95 M85 102 H95',
      },
    ],
  },
  trophy: {
    label: 'Trophée',
    emblemCenter: [90, 48],
    emblemScale: 0.65,
    silhouettes: [
      {
        outline:
          'M50 12 H130 V27 H157 V45 C157 64 139 77 113 78 Q107 88 97 91 V102 H119 V112 H61 V102 H83 V91 Q73 88 67 78 C41 77 23 64 23 45 V27 H50 Z',
        details:
          'M53 26 V48 Q53 78 90 84 Q127 78 127 48 V26 M48 37 H34 V46 Q34 61 56 67 M132 37 H146 V46 Q146 61 124 67 M85 93 H95 M66 106 H114',
      },
      {
        outline:
          'M45 14 H135 L129 56 Q125 80 101 88 V102 H121 V112 H59 V102 H79 V88 Q55 80 51 56 Z',
        details: 'M52 26 H128 M60 37 L63 56 Q66 72 81 77 M85 91 H95 M65 106 H115',
      },
      {
        outline:
          'M52 12 H128 L132 31 H159 L151 62 L119 79 L98 91 V102 H121 V112 H59 V102 H82 V91 L61 79 L29 62 L21 31 H48 Z',
        details:
          'M58 27 L64 67 L90 82 L116 67 L122 27 M48 41 H34 L39 56 L58 67 M132 41 H146 L141 56 L122 67 M85 93 H95 M64 106 H116',
      },
    ],
  },
};

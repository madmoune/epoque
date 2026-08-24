export type CreeSyllabicCell = {
  glyph: string;
  reading: string;
  audioKey: string;
  isFinal?: boolean;
};

export type CreeSyllabicRow = {
  label: string;
  cells: readonly (CreeSyllabicCell | null)[];
};

export type CreeFinal = CreeSyllabicCell & {
  label: string;
  isFinal: true;
};

export type CreeSoundGuideItem = {
  label: string;
  ipa: string;
  approximation: string;
  audioKey: string;
  secondary?: boolean;
};

export type CreeEncodedToken = CreeSyllabicCell;

export type CreeEncodedWord = {
  roman: string;
  tokens: CreeEncodedToken[];
};

// Relative to the document base so the sounds also work under a sub-path
// deployment such as the project's GitHub Pages URL.
export const EAST_CREE_AUDIO_BASE_URL = 'assets/cree-syllabics';

export const CREE_SYLLABIC_COLUMNS = [
  { label: 'e', sound: '/e/' },
  { label: 'we', sound: '/we/' },
  { label: 'i', sound: '/ɪ ~ ə/' },
  { label: 'ii', sound: '/i/' },
  { label: 'u', sound: '/ʊ/' },
  { label: 'uu', sound: '/u/' },
  { label: 'a', sound: '/ə ~ ɪ/' },
  { label: 'aa', sound: '/a/' },
  { label: 'waa', sound: '/ɔ/' },
] as const;

const GLYPHS_BY_READING: Readonly<Record<string, string>> = {
  e: 'ᐁ',
  i: 'ᐃ',
  ii: 'ᐄ',
  u: 'ᐅ',
  uu: 'ᐆ',
  a: 'ᐊ',
  aa: 'ᐋ',
  we: 'ᐌ',
  wi: 'ᐎ',
  wii: 'ᐐ',
  wu: 'ᐒ',
  wuu: 'ᐔ',
  wa: 'ᐗ',
  waa: 'ᐙ',
  pe: 'ᐯ',
  pwe: 'ᐺ',
  pi: 'ᐱ',
  pii: 'ᐲ',
  pu: 'ᐳ',
  puu: 'ᐴ',
  pa: 'ᐸ',
  paa: 'ᐹ',
  pwaa: 'ᑆ',
  te: 'ᑌ',
  twe: 'ᑗ',
  ti: 'ᑎ',
  tii: 'ᑏ',
  tu: 'ᑐ',
  tuu: 'ᑑ',
  ta: 'ᑕ',
  taa: 'ᑖ',
  twaa: 'ᑣ',
  ke: 'ᑫ',
  kwe: 'ᑴ',
  ki: 'ᑭ',
  kii: 'ᑮ',
  ku: 'ᑯ',
  kuu: 'ᑰ',
  ka: 'ᑲ',
  kaa: 'ᑳ',
  kwaa: 'ᒀ',
  che: 'ᒉ',
  chwe: 'ᒒ',
  chi: 'ᒋ',
  chii: 'ᒌ',
  chu: 'ᒍ',
  chuu: 'ᒎ',
  cha: 'ᒐ',
  chaa: 'ᒑ',
  chwaa: 'ᒞ',
  me: 'ᒣ',
  mwe: 'ᒬ',
  mi: 'ᒥ',
  mii: 'ᒦ',
  mu: 'ᒧ',
  muu: 'ᒨ',
  ma: 'ᒪ',
  maa: 'ᒫ',
  mwaa: 'ᒸ',
  ne: 'ᓀ',
  nwe: 'ᓉ',
  ni: 'ᓂ',
  nii: 'ᓃ',
  nu: 'ᓄ',
  nuu: 'ᓅ',
  na: 'ᓇ',
  naa: 'ᓈ',
  nwaa: 'ᓍ',
  le: 'ᓓ',
  lwe: 'ᓜ',
  li: 'ᓕ',
  lii: 'ᓖ',
  lu: 'ᓗ',
  luu: 'ᓘ',
  la: 'ᓚ',
  laa: 'ᓛ',
  lwaa: 'ᓨ',
  se: 'ᓭ',
  swe: 'ᓶ',
  si: 'ᓯ',
  sii: 'ᓰ',
  su: 'ᓱ',
  suu: 'ᓲ',
  sa: 'ᓴ',
  saa: 'ᓵ',
  swaa: 'ᔂ',
  she: 'ᔐ',
  shwe: 'ᔗ',
  shi: 'ᔑ',
  shii: 'ᔒ',
  shu: 'ᔓ',
  shuu: 'ᔔ',
  sha: 'ᔕ',
  shaa: 'ᔖ',
  shwaa: 'ᔣ',
  ye: 'ᔦ',
  ywe: 'ᔯ',
  yi: 'ᔨ',
  yii: 'ᔩ',
  yu: 'ᔪ',
  yuu: 'ᔫ',
  ya: 'ᔭ',
  yaa: 'ᔮ',
  ywaa: 'ᔻ',
  re: 'ᕃ',
  rwe: 'ᐧᕂ',
  ri: 'ᕆ',
  rii: 'ᕇ',
  ru: 'ᕈ',
  ruu: 'ᕉ',
  ra: 'ᕋ',
  raa: 'ᕌ',
  rwaa: 'ᕎ',
  ve: 'ᕓ',
  vwe: 'ᐧᕓ',
  vi: 'ᕕ',
  vii: 'ᕖ',
  vu: 'ᕗ',
  vuu: 'ᕘ',
  va: 'ᕙ',
  vaa: 'ᕚ',
  vwaa: 'ᕛ',
  the: 'ᕞ',
  thwe: 'ᐧᕞ',
  thi: 'ᕠ',
  thii: 'ᕢ',
  thu: 'ᕤ',
  thuu: 'ᕥ',
  tha: 'ᕦ',
  thaa: 'ᕧ',
  thwaa: 'ᕨ',
};

const FINAL_GLYPHS: Readonly<Record<string, string>> = {
  w: 'ᐤ',
  h: 'ᐦ',
  p: 'ᑉ',
  t: 'ᑦ',
  k: 'ᒃ',
  kw: 'ᒄ',
  ch: 'ᒡ',
  m: 'ᒻ',
  mw: 'ᒽ',
  n: 'ᓐ',
  l: 'ᓪ',
  s: 'ᔅ',
  sh: 'ᔥ',
  y: 'ᔾ',
  r: 'ᕐ',
  v: 'ᕝ',
  th: 'ᕪ',
};

function syllabicCell(reading: string): CreeSyllabicCell {
  return {
    glyph: GLYPHS_BY_READING[reading],
    reading,
    audioKey: reading,
  };
}

function consonantRow(label: string, prefix: string): CreeSyllabicRow {
  return {
    label,
    cells: ['e', 'we', 'i', 'ii', 'u', 'uu', 'a', 'aa', 'waa'].map((ending) =>
      syllabicCell(`${prefix}${ending}`),
    ),
  };
}

export const CREE_SYLLABIC_ROWS: readonly CreeSyllabicRow[] = [
  {
    label: 'Voyelle',
    cells: [
      syllabicCell('e'),
      null,
      syllabicCell('i'),
      syllabicCell('ii'),
      syllabicCell('u'),
      syllabicCell('uu'),
      syllabicCell('a'),
      syllabicCell('aa'),
      null,
    ],
  },
  {
    label: 'W',
    cells: [
      null,
      syllabicCell('we'),
      syllabicCell('wi'),
      syllabicCell('wii'),
      syllabicCell('wu'),
      syllabicCell('wuu'),
      syllabicCell('wa'),
      null,
      syllabicCell('waa'),
    ],
  },
  consonantRow('P', 'p'),
  consonantRow('T', 't'),
  consonantRow('K', 'k'),
  consonantRow('CH', 'ch'),
  consonantRow('M', 'm'),
  consonantRow('N', 'n'),
  consonantRow('L', 'l'),
  consonantRow('S', 's'),
  consonantRow('SH', 'sh'),
  consonantRow('Y', 'y'),
  consonantRow('R', 'r'),
  consonantRow('V / F / PH', 'v'),
  consonantRow('TH', 'th'),
];

function finalCell(label: string, key: string, audioKey = key): CreeFinal {
  return {
    label,
    glyph: FINAL_GLYPHS[key],
    reading: key,
    audioKey,
    isFinal: true,
  };
}

export const CREE_FINALS: readonly CreeFinal[] = [
  finalCell('U / W', 'w', 'u'),
  finalCell('H', 'h'),
  finalCell('P', 'p'),
  finalCell('T', 't'),
  finalCell('K', 'k'),
  finalCell('KW', 'kw'),
  finalCell('CH', 'ch'),
  finalCell('M', 'm'),
  finalCell('MW', 'mw'),
  finalCell('N', 'n'),
  finalCell('L', 'l'),
  finalCell('S', 's'),
  finalCell('SH', 'sh'),
  finalCell('Y', 'y'),
  finalCell('R', 'r'),
  finalCell('V / F / PH', 'v'),
  finalCell('TH', 'th'),
];

/** Every syllabic cell that can be used for one-symbol practice. */
export const CREE_LEARNING_SYMBOLS: readonly CreeSyllabicCell[] = [
  ...CREE_SYLLABIC_ROWS.flatMap((row) =>
    row.cells.filter((cell): cell is CreeSyllabicCell => cell !== null),
  ),
  ...CREE_FINALS,
];

export const CREE_VOWEL_SOUNDS: readonly CreeSoundGuideItem[] = [
  { label: 'E', ipa: '/e/', approximation: 'comme « é » dans été (cri du Sud)', audioKey: 'e' },
  { label: 'II', ipa: '/i ~ iː/', approximation: 'comme « i » dans ici', audioKey: 'ii' },
  {
    label: 'I',
    ipa: '/ɪ ~ ɨ ~ ə/',
    approximation: 'un i bref ou un son central, selon le mot',
    audioKey: 'i',
  },
  { label: 'UU', ipa: '/u ~ uː/', approximation: 'comme « ou » dans roue', audioKey: 'uu' },
  {
    label: 'U',
    ipa: '/ʊ/',
    approximation: 'un « ou » bref et relâché',
    audioKey: 'u',
  },
  { label: 'AA', ipa: '/a ~ aː/', approximation: 'comme « a » dans papa', audioKey: 'aa' },
  {
    label: 'A',
    ipa: '/ɪ ~ ɛ ~ ɨ ~ ə ~ ʌ/',
    approximation: 'voyelle brève variable, souvent proche de « e »',
    audioKey: 'a',
  },
  {
    label: 'WAA',
    ipa: '/ɔ ~ ɔː ~ ɒ/',
    approximation: 'comme « o » dans porte; parfois précédé d’un léger w',
    audioKey: 'waa',
  },
];

export const CREE_CONSONANT_SOUNDS: readonly CreeSoundGuideItem[] = [
  { label: 'P', ipa: '/p ~ b ~ pʰ/', approximation: 'p, parfois proche de b', audioKey: 'p' },
  { label: 'T', ipa: '/t ~ d ~ tʰ/', approximation: 't, parfois proche de d', audioKey: 't' },
  { label: 'K', ipa: '/k ~ g ~ kʰ/', approximation: 'k, parfois proche de g', audioKey: 'k' },
  {
    label: 'CH',
    ipa: '/tʃ ~ dʒ ~ ts ~ dz/',
    approximation: '« tch », avec des variantes selon le dialecte',
    audioKey: 'ch',
  },
  { label: 'S', ipa: '/s/', approximation: 'comme « s » dans sac', audioKey: 's' },
  { label: 'SH', ipa: '/ʃ/', approximation: 'comme « ch » dans chat', audioKey: 'sh' },
  { label: 'H', ipa: '/h/', approximation: 'h expiré', audioKey: 'h' },
  { label: 'M', ipa: '/m/', approximation: 'comme « m » dans mot', audioKey: 'm' },
  { label: 'N', ipa: '/n/', approximation: 'comme « n » dans nord', audioKey: 'n' },
  { label: 'W', ipa: '/w/', approximation: 'comme « oua » dans ouate', audioKey: 'u' },
  { label: 'Y', ipa: '/j/', approximation: 'comme « y » dans yeux', audioKey: 'y' },
  {
    label: 'L',
    ipa: '/l/',
    approximation: 'série complémentaire employée dans certaines variétés',
    audioKey: 'l',
    secondary: true,
  },
  {
    label: 'R',
    ipa: '/r/',
    approximation: 'série complémentaire employée dans certaines variétés',
    audioKey: 'r',
    secondary: true,
  },
  {
    label: 'V / F / PH',
    ipa: '/v ~ f/',
    approximation: 'série rare, surtout pour les emprunts',
    audioKey: 'v',
    secondary: true,
  },
  {
    label: 'TH',
    ipa: '/θ ~ ð/',
    approximation: 'série rare, surtout pour les emprunts',
    audioKey: 'th',
    secondary: true,
  },
];

type CreeSegment = { kind: 'consonant'; value: string } | { kind: 'vowel'; value: string };

const VOWEL_PLACEHOLDERS: Readonly<Record<string, string>> = {
  E: 'e',
  I: 'ii',
  U: 'uu',
  O: 'waa',
  A: 'aa',
  a: 'a',
  i: 'i',
  u: 'u',
};

const CONSONANT_PLACEHOLDERS: Readonly<Record<string, string>> = {
  C: 'ch',
  S: 'sh',
  Y: 'y',
  p: 'p',
  t: 't',
  k: 'k',
  m: 'm',
  n: 'n',
  s: 's',
  l: 'l',
  r: 'r',
  v: 'v',
  f: 'f',
  w: 'w',
};

/**
 * Produit une transcription sonore jouable avec l'inventaire du cri oriental du Sud.
 * Il ne s'agit pas d'une traduction sémantique du mot français.
 */
export function encodeFrenchWordAsEasternCree(word: string): CreeEncodedWord {
  const segments = frenchSoundSegments(word);
  const tokens: CreeEncodedToken[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    if (segment.kind === 'vowel') {
      tokens.push(syllabicCell(segment.value));
      continue;
    }

    const nextSegment = segments[index + 1];
    if (nextSegment?.kind === 'vowel') {
      const glyphPrefix = segment.value === 'f' ? 'v' : segment.value;
      const glyphReading = `${glyphPrefix}${nextSegment.value}`;
      const glyph = GLYPHS_BY_READING[glyphReading];

      if (glyph) {
        const reading = `${segment.value}${nextSegment.value}`;
        tokens.push({ glyph, reading, audioKey: glyphReading });
        index += 1;
        continue;
      }
    }

    const glyphKey = segment.value === 'f' ? 'v' : segment.value;
    const glyph = FINAL_GLYPHS[glyphKey];
    if (glyph) {
      tokens.push({
        glyph,
        reading: segment.value,
        audioKey: glyphKey === 'w' ? 'u' : glyphKey,
        isFinal: true,
      });
    }
  }

  return {
    roman: tokens.map((token) => token.reading).join('·'),
    tokens,
  };
}

export function encodeFrenchTextAsEasternCree(value: string): string {
  return value.replace(/[A-Za-zÀ-ÖØ-öø-ÿŒœÆæ]+/g, (word) =>
    encodeFrenchWordAsEasternCree(word)
      .tokens.map((token) => token.glyph)
      .join(''),
  );
}

function frenchSoundSegments(word: string): CreeSegment[] {
  let sounds = word
    .trim()
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ÿ/g, 'y')
    .replace(/[^a-zàâäçéèêëîïôöùûüÿ]/g, '');

  // Les marques de pluriel et plusieurs consonnes finales françaises sont muettes.
  sounds = sounds.replace(/[sxz]$/u, '').replace(/[dgt]$/u, '');

  // Les majuscules servent de jetons internes et empêchent les digrammes déjà reconnus
  // d'être transformés une seconde fois.
  sounds = sounds
    .replace(/illon/g, 'IYon')
    .replace(/aill/g, 'aY')
    .replace(/eill/g, 'eY')
    .replace(/ouill/g, 'ouY')
    .replace(/(?:tch|dj)/g, 'C')
    .replace(/(?:sch|sh|ch)/g, 'S')
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/gn/g, 'nY')
    .replace(/tion/g, 'sion')
    .replace(/gu(?=[eéèêëiîïy])/g, 'k')
    .replace(/qu/g, 'k')
    .replace(/c(?=[eéèêëiîïy])/g, 's')
    .replace(/g(?=[eéèêëiîïy])/g, 'S')
    .replace(/j/g, 'S')
    .replace(/ç/g, 's')
    .replace(/x/g, 'ks')
    .replace(/q/g, 'k')
    .replace(/c/g, 'k')
    .replace(/g/g, 'k')
    .replace(/z/g, 's')
    .replace(/b/g, 'p')
    .replace(/d/g, 't')
    .replace(/h/g, '')
    .replace(/y(?=[aeiouàâäéèêëîïôöùûü])/g, 'Y')
    .replace(/y/g, 'I')
    .replace(/([ptkmnslrvf])\1+/g, '$1');

  sounds = sounds
    .replace(/(?:er|ez)$/g, 'E')
    .replace(/et$/g, 'E')
    .replace(/ien(?=$|[^a-zàâäéèêëîïôöùûü])/g, 'YEn')
    .replace(/oin(?=$|[^a-zàâäéèêëîïôöùûü])/g, 'wEn')
    .replace(/ion(?=$|[^a-zàâäéèêëîïôöùûü])/g, 'YOn')
    .replace(/(?:ain|ein|aim|eim)(?=$|[^a-zàâäéèêëîïôöùûü])/g, 'En')
    .replace(/(?:an|en|am|em)(?=$|[^a-zàâäéèêëîïôöùûü])/g, 'An')
    .replace(/(?:on|om)(?=$|[^a-zàâäéèêëîïôöùûü])/g, 'On')
    .replace(/(?:un|um)(?=$|[^a-zàâäéèêëîïôöùûü])/g, 'un')
    .replace(/e$/g, '')
    .replace(/i(?=[èê])/g, 'Y')
    .replace(/(?:eau|au)/g, 'O')
    .replace(/(?:oeu|eu)/g, 'u')
    .replace(/ou/g, 'U')
    .replace(/oi/g, 'wa')
    .replace(/(?:ai|ei)/g, 'E')
    .replace(/[éèêë]/g, 'E')
    .replace(/[iîï]/g, 'I')
    .replace(/[oôö]/g, 'O')
    .replace(/[aàâä]/g, 'A')
    .replace(/[uùûü]/g, 'u')
    .replace(/e/g, 'a');

  return [...sounds].flatMap<CreeSegment>((sound) => {
    const vowel = VOWEL_PLACEHOLDERS[sound];
    if (vowel) {
      return [{ kind: 'vowel', value: vowel }];
    }

    const consonant = CONSONANT_PLACEHOLDERS[sound];
    return consonant ? [{ kind: 'consonant', value: consonant }] : [];
  });
}

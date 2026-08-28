import { PuzzleType } from '../lab.model';

export type SyllabicRotationConsonant = 's' | 'n' | 't' | 'r' | 'ch';
export type SyllabicRotationVowel = 'e' | 'a' | 'o' | 'u';
export type SyllabicRotationAngle = 0 | 90 | 180 | 270;
export type SyllabicRotationSymbol = 'glyph-1' | 'glyph-2' | 'glyph-3' | 'glyph-4' | 'glyph-5';

export const SYLLABIC_ROTATION_CONSONANTS: readonly SyllabicRotationConsonant[] = [
  's',
  'n',
  't',
  'r',
  'ch',
];

export const SYLLABIC_ROTATION_VOWELS: readonly SyllabicRotationVowel[] = ['e', 'a', 'o', 'u'];

export type SyllabicRotationSyllable = {
  consonant: SyllabicRotationConsonant;
  vowel: SyllabicRotationVowel;
  symbol: SyllabicRotationSymbol;
  rotation: SyllabicRotationAngle;
};

export type SyllabicRotationWord = {
  id: string;
  word: string;
  syllables: readonly SyllabicRotationSyllable[];
};

export type SyllabicRotationSelection = {
  examples: readonly SyllabicRotationWord[];
  challenge: SyllabicRotationWord;
};

export type SyllabicRotationMapping = {
  consonantSymbols: Readonly<Record<SyllabicRotationConsonant, SyllabicRotationSymbol>>;
  vowelRotations: Readonly<Record<SyllabicRotationVowel, SyllabicRotationAngle>>;
};

const DEFAULT_SYMBOL_BY_CONSONANT: Record<SyllabicRotationConsonant, SyllabicRotationSymbol> = {
  s: 'glyph-1',
  n: 'glyph-2',
  t: 'glyph-3',
  r: 'glyph-4',
  ch: 'glyph-5',
};

const DEFAULT_ROTATION_BY_VOWEL: Record<SyllabicRotationVowel, SyllabicRotationAngle> = {
  e: 0,
  a: 90,
  o: 180,
  u: 270,
};

const SYLLABIC_ROTATION_SYMBOLS: readonly SyllabicRotationSymbol[] = [
  'glyph-1',
  'glyph-2',
  'glyph-3',
  'glyph-4',
  'glyph-5',
];

const SYLLABIC_ROTATION_ANGLES: readonly SyllabicRotationAngle[] = [0, 90, 180, 270];

const SOURCE_WORD_PATTERN = /^(?:(?:ch|[sntr])[aeou]){3}$/;

export function parseSyllabicRotationWord(rawWord: string): SyllabicRotationWord | undefined {
  const sourceWord = rawWord.trim();
  const normalizedWord = normalizeSyllabicSourceWord(sourceWord);

  if (!sourceWord || !SOURCE_WORD_PATTERN.test(normalizedWord)) {
    return undefined;
  }

  const syllables: SyllabicRotationSyllable[] = [];
  let offset = 0;

  for (let index = 0; index < 3; index += 1) {
    const consonant = normalizedWord.startsWith('ch', offset)
      ? 'ch'
      : normalizedWord[offset] as SyllabicRotationConsonant;
    offset += consonant === 'ch' ? 2 : 1;

    const vowel = normalizedWord[offset] as SyllabicRotationVowel;
    offset += 1;
    syllables.push(syllable(consonant, vowel));
  }

  return {
    id: normalizedWord,
    word: sourceWord.toLocaleUpperCase('fr-CA'),
    syllables,
  };
}

export function selectSyllabicRotationWords(
  candidates: readonly SyllabicRotationWord[],
  random: () => number,
): SyllabicRotationSelection | undefined {
  const uniqueCandidates = [
    ...new Map(candidates.map((candidate) => [candidate.id, candidate])).values(),
  ];

  if (uniqueCandidates.length < 4) {
    return undefined;
  }

  const completeExampleSets: SyllabicRotationWord[][] = [];

  for (let firstIndex = 0; firstIndex < uniqueCandidates.length - 2; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < uniqueCandidates.length - 1;
      secondIndex += 1
    ) {
      for (
        let thirdIndex = secondIndex + 1;
        thirdIndex < uniqueCandidates.length;
        thirdIndex += 1
      ) {
        const exampleSet = [
          uniqueCandidates[firstIndex],
          uniqueCandidates[secondIndex],
          uniqueCandidates[thirdIndex],
        ];

        if (coversSyllabicRotationInventory(exampleSet)) {
          completeExampleSets.push(exampleSet);
        }
      }
    }
  }

  if (completeExampleSets.length === 0) {
    return undefined;
  }

  const examples = shuffleMappingValues(
    completeExampleSets[Math.floor(random() * completeExampleSets.length)],
    random,
  );
  const exampleIds = new Set(examples.map((example) => example.id));
  const challengeCandidates = uniqueCandidates.filter((candidate) => !exampleIds.has(candidate.id));

  if (challengeCandidates.length === 0) {
    return undefined;
  }

  return {
    examples,
    challenge: challengeCandidates[Math.floor(random() * challengeCandidates.length)],
  };
}

function normalizeSyllabicSourceWord(word: string): string {
  return [...word.normalize('NFD')]
    .filter((character) => (character.codePointAt(0) ?? 0) < 768)
    .join('')
    .toLocaleLowerCase('fr-FR');
}

function coversSyllabicRotationInventory(words: readonly SyllabicRotationWord[]): boolean {
  const consonants = new Set(
    words.flatMap((word) => word.syllables.map(({ consonant }) => consonant)),
  );
  const vowels = new Set(words.flatMap((word) => word.syllables.map(({ vowel }) => vowel)));

  return (
    SYLLABIC_ROTATION_CONSONANTS.every((consonant) => consonants.has(consonant)) &&
    SYLLABIC_ROTATION_VOWELS.every((vowel) => vowels.has(vowel))
  );
}

export function createSyllabicRotationMapping(random: () => number): SyllabicRotationMapping {
  const symbols = shuffleMappingValues(SYLLABIC_ROTATION_SYMBOLS, random);
  const rotations = shuffleMappingValues(SYLLABIC_ROTATION_ANGLES, random);

  return {
    consonantSymbols: {
      s: symbols[0],
      n: symbols[1],
      t: symbols[2],
      r: symbols[3],
      ch: symbols[4],
    },
    vowelRotations: {
      e: rotations[0],
      a: rotations[1],
      o: rotations[2],
      u: rotations[3],
    },
  };
}

export function applySyllabicRotationMapping(
  word: SyllabicRotationWord,
  mapping: SyllabicRotationMapping,
): SyllabicRotationWord {
  return {
    ...word,
    syllables: word.syllables.map((syllable) => ({
      ...syllable,
      symbol: mapping.consonantSymbols[syllable.consonant],
      rotation: mapping.vowelRotations[syllable.vowel],
    })),
  };
}

function shuffleMappingValues<T>(items: readonly T[], random: () => number): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function syllable(
  consonant: SyllabicRotationConsonant,
  vowel: SyllabicRotationVowel,
): SyllabicRotationSyllable {
  return {
    consonant,
    vowel,
    symbol: DEFAULT_SYMBOL_BY_CONSONANT[consonant],
    rotation: DEFAULT_ROTATION_BY_VOWEL[vowel],
  };
}

export const SYLLABIC_ROTATION_EXAMPLES: readonly SyllabicRotationWord[] = [
  {
    id: 'chuchota',
    word: 'CHUCHOTA',
    syllables: [syllable('ch', 'u'), syllable('ch', 'o'), syllable('t', 'a')],
  },
  {
    id: 'sonate',
    word: 'SONATE',
    syllables: [syllable('s', 'o'), syllable('n', 'a'), syllable('t', 'e')],
  },
  {
    id: 'retenu',
    word: 'RETENU',
    syllables: [syllable('r', 'e'), syllable('t', 'e'), syllable('n', 'u')],
  },
];

export const SYLLABIC_ROTATION_CHALLENGE: SyllabicRotationWord = {
  id: 'satura',
  word: 'SATURA',
  syllables: [syllable('s', 'a'), syllable('t', 'u'), syllable('r', 'a')],
};

export class SyllabicRotationPuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'syllabic-rotation',
      name: 'Syllabes tournantes',
      state: 'pending',
      playRoute: '/play/syllabic-rotation',
      description:
        'Déduis un alphabet syllabique inventé à partir de trois mots connus, puis lis le mot final.',
      answerFormat: 'Un mot français de trois syllabes.',
      clueFormat:
        'Trois mots codés en trois signes; cinq formes et quatre orientations à comparer.',
      createdAt: '2026-08-27',
      updatedAt: '2026-08-27',
      variants: [
        {
          id: 'syllabic-rotation-main',
          name: 'Formes et rotations',
          state: 'pending',
          description:
            'Compare les mots connus : une même forme peut changer d’orientation. Chaque syllabe utilise une voyelle écrite directement.',
          examples: SYLLABIC_ROTATION_EXAMPLES.map((_, index) => ({
            id: `syllabic-rotation-example-${index + 1}`,
            name: `Exemple ${index + 1}`,
            description: 'Mot connu de trois syllabes simples.',
          })),
        },
      ],
    });
  }
}

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORD_LENGTHS = [4, 5];

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, '..');
export const DEFAULT_OUTPUT_DIRECTORY = path.join(PROJECT_ROOT, 'public');
export const DEFAULT_MINIMUM_FREQUENCY = 0.5;
export const DEFAULT_GRAMMALECTE_MINIMUM_INDEX = 5;
export const DEFAULT_MORPHALOU_SOURCE = path.join(
  PROJECT_ROOT,
  'public',
  'morphalou-4-5.txt',
);
export const DEFAULT_GRAMMALECTE_SOURCE = path.join(
  PROJECT_ROOT,
  'public',
  'grammalecte-4-5.txt',
);

const WORD_PATTERN = /^\p{Script=Latin}+$/u;
const ABBREVIATION_VALUES = new Set([
  'abr',
  'abbr',
  'abbreviation',
  'abreviation',
  'sigle',
  'acronyme',
  'symbole',
]);
const GRAMMALECTE_EXCLUDED_TAGS = new Set([
  'npr',
  'patr',
  'titr',
  'pfx',
  'sfx',
  'ponc',
  'sign',
  'div',
  'err',
]);
const GRAMMALECTE_EXCLUDED_NOTES = new Set(['sig', 'symb']);

export function parseLexiqueTsv(text, options = {}) {
  const lines = text.split(/\r?\n/);
  const headerLine = lines.shift();

  if (!headerLine || !headerLine.includes('\t')) {
    throw new Error('Le fichier Lexique doit commencer par un en-tête TSV valide.');
  }

  const headers = headerLine.split('\t').map((header) => header.replace(/^\uFEFF/u, ''));
  const wordColumn = findWordColumn(headers);

  if (wordColumn === -1) {
    throw new Error(
      'Impossible de trouver la colonne du mot. Colonnes attendues : ortho ou 1_Mot.',
    );
  }

  const categoryColumns = findColumns(headers, /^(cgram|gram|pos|categorie|category)$/u);
  const numberColumns = findColumns(headers, /^(nombre|number)$/u);
  const lemmaColumns = findColumns(headers, /^(islem|lemme|lemma)$/u);
  const frequencyColumn = findFrequencyColumn(headers);
  const minimumFrequency = options.minimumFrequency ?? DEFAULT_MINIMUM_FREQUENCY;
  const allowedWords = options.allowedWords ?? null;

  if (!Number.isFinite(minimumFrequency) || minimumFrequency < 0) {
    throw new Error('Le seuil de fréquence doit être un nombre positif ou nul.');
  }

  const wordsByLength = new Map(WORD_LENGTHS.map((length) => [length, new Set()]));

  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }

    const cells = line.split('\t');
    const rawWord = (cells[wordColumn] ?? '').trim();

    if (
      !rawWord ||
      containsAbbreviationMetadata(cells, categoryColumns) ||
      isUppercaseEntry(rawWord) ||
      isBelowFrequency(cells, frequencyColumn, minimumFrequency) ||
      (options.excludePlurals && containsPluralMetadata(cells, numberColumns)) ||
      (options.lemmasOnly && !containsLemmaMetadata(cells, lemmaColumns))
    ) {
      continue;
    }

    const word = rawWord.normalize('NFC').toLocaleLowerCase('fr-FR');

    if (!WORD_PATTERN.test(word)) {
      continue;
    }

    if (allowedWords && !allowedWords.has(word)) {
      continue;
    }

    const length = [...word].length;

    if (!wordsByLength.has(length)) {
      continue;
    }

    wordsByLength.get(length).add(word);
  }

  const sortedWordsByLength = new Map();
  const frenchCollator = new Intl.Collator('fr-FR', { sensitivity: 'variant' });

  for (const length of WORD_LENGTHS) {
    const words = [...(wordsByLength.get(length) ?? [])];

    words.sort((first, second) => frenchCollator.compare(first, second));
    sortedWordsByLength.set(length, words);
  }

  if (WORD_LENGTHS.every((length) => sortedWordsByLength.get(length).length === 0)) {
    throw new Error('Aucun mot de 4 ou 5 lettres valide n’a été trouvé dans le fichier Lexique.');
  }

  return sortedWordsByLength;
}

export function parseMorphalouWordList(text) {
  return parsePlainWordList(text, 'Morphalou');
}

export function parseGrammalecteWordList(text) {
  return parsePlainWordList(text, 'Grammalecte');
}

export function parseGrammalecteLexique(
  text,
  minimumFrequencyIndex = DEFAULT_GRAMMALECTE_MINIMUM_INDEX,
) {
  const words = new Set();

  for (const line of text.split(/\r?\n/u)) {
    if (!/^\d+\t\d+\t/u.test(line)) {
      continue;
    }

    const cells = line.split('\t');
    const tags = (cells[4] ?? '').trim().split(/\s+/u);
    const notes = (cells[7] ?? '').trim().split(/\s+/u);
    const frequencyIndex = Number((cells[19] ?? '').trim());

    if (
      !Number.isFinite(frequencyIndex) ||
      frequencyIndex < minimumFrequencyIndex ||
      GRAMMALECTE_EXCLUDED_TAGS.has(tags[0]) ||
      notes.some((note) => GRAMMALECTE_EXCLUDED_NOTES.has(note))
    ) {
      continue;
    }

    addWord(words, cells[2] ?? '');
  }

  if (words.size === 0) {
    throw new Error('Aucun mot de 4 ou 5 lettres valide n’a été trouvé dans Grammalecte.');
  }

  return words;
}

export function mergeWordLists(...wordSets) {
  const words = new Set();

  for (const wordSet of wordSets) {
    for (const word of wordSet) {
      words.add(word);
    }
  }

  if (words.size === 0) {
    throw new Error('Aucun mot de 4 ou 5 lettres valide n’a été trouvé dans les sources.');
  }

  return words;
}

export async function generateWordLists(
  sourcePath,
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
  options = {},
) {
  const morphalouSourcePath = options.morphalouSourcePath ?? DEFAULT_MORPHALOU_SOURCE;
  const grammalecteSourcePath =
    options.grammalecteSourcePath ?? DEFAULT_GRAMMALECTE_SOURCE;
  const [sourceText, morphalouText, grammalecteText] = await Promise.all([
    readSource(sourcePath),
    readSource(morphalouSourcePath),
    readSource(grammalecteSourcePath),
  ]);
  const wordsFromLexique = parseLexiqueTsv(sourceText, {
    ...options,
    allowedWords: parseMorphalouWordList(morphalouText),
  });
  const wordsByLength = groupWordsByLength(
    mergeWordLists(
      ...WORD_LENGTHS.map((length) => new Set(wordsFromLexique.get(length) ?? [])),
      parseGrammalecteWordList(grammalecteText),
    ),
  );

  await mkdir(outputDirectory, { recursive: true });

  const counts = new Map();

  for (const length of WORD_LENGTHS) {
    const words = wordsByLength.get(length) ?? [];
    const outputPath = path.join(outputDirectory, 'words-' + length + '.txt');
    const output = words.length > 0 ? words.join('\n') + '\n' : '';

    await writeFile(outputPath, output, 'utf8');
    counts.set(length, words.length);
  }

  return counts;
}

export function resolveDefaultSource() {
  const candidates = [
    path.join(PROJECT_ROOT, 'public', 'Lexique400.tsv'),
    path.join(PROJECT_ROOT, 'public', 'Lexique4.tsv'),
  ];

  return candidates.find((candidate) => fileExists(candidate)) ?? candidates[0];
}

export function resolveDefaultMorphalouSource() {
  return DEFAULT_MORPHALOU_SOURCE;
}

export function resolveDefaultGrammalecteSource() {
  return DEFAULT_GRAMMALECTE_SOURCE;
}

export function parseCliArguments(args) {
  const options = {
    excludePlurals: false,
    lemmasOnly: false,
    minimumFrequency: DEFAULT_MINIMUM_FREQUENCY,
    morphalouSourcePath: resolveDefaultMorphalouSource(),
    grammalecteSourcePath: resolveDefaultGrammalecteSource(),
  };
  let sourcePath = null;
  let outputDirectory = DEFAULT_OUTPUT_DIRECTORY;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--exclude-plurals') {
      options.excludePlurals = true;
      continue;
    }

    if (argument === '--lemmas-only') {
      options.lemmasOnly = true;
      continue;
    }

    if (argument === '--min-frequency') {
      const value = args[index + 1];

      if (value === undefined) {
        throw new Error('L’option --min-frequency doit être suivie d’un nombre.');
      }

      options.minimumFrequency = parseMinimumFrequency(value);
      index += 1;
      continue;
    }

    if (argument === '--morphalou-source') {
      const value = args[index + 1];

      if (value === undefined) {
        throw new Error('L’option --morphalou-source doit être suivie d’un chemin.');
      }

      options.morphalouSourcePath = path.resolve(value);
      index += 1;
      continue;
    }

    if (argument.startsWith('--min-frequency=')) {
      options.minimumFrequency = parseMinimumFrequency(argument.slice('--min-frequency='.length));
      continue;
    }

    if (argument === '--grammalecte-source') {
      const value = args[index + 1];

      if (value === undefined) {
        throw new Error('L’option --grammalecte-source doit être suivie d’un chemin.');
      }

      options.grammalecteSourcePath = path.resolve(value);
      index += 1;
      continue;
    }

    if (argument === '--output-dir') {
      const value = args[index + 1];

      if (value === undefined) {
        throw new Error('L’option --output-dir doit être suivie d’un chemin.');
      }

      outputDirectory = path.resolve(value);
      index += 1;
      continue;
    }

    if (argument.startsWith('--')) {
      throw new Error('Option inconnue : ' + argument);
    }

    if (sourcePath !== null) {
      throw new Error('Un seul chemin de fichier TSV peut être fourni.');
    }

    sourcePath = path.resolve(argument);
  }

  return {
    sourcePath: sourcePath ?? resolveDefaultSource(),
    outputDirectory,
    options,
  };
}

function findWordColumn(headers) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const preferredNames = ['ortho', 'orthographe', 'mot'];

  return normalizedHeaders.findIndex((header) => preferredNames.includes(header));
}

function findColumns(headers, pattern) {
  return headers
    .map((header, index) => ({ header: normalizeHeader(header), index }))
    .filter(({ header }) => pattern.test(header))
    .map(({ index }) => index);
}

function findFrequencyColumn(headers) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const preferredNames = ['freqmot', 'freqortho', 'freqlemme', 'frequencyortho'];

  return preferredNames
    .map((name) => normalizedHeaders.indexOf(name))
    .find((index) => index >= 0) ?? -1;
}

function normalizeHeader(header) {
  return header
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/^\d+[_\s-]*/u, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '');
}

function normalizeMetadata(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr-FR')
    .trim();
}

function containsAbbreviationMetadata(cells, categoryColumns) {
  return categoryColumns.some((column) =>
    ABBREVIATION_VALUES.has(normalizeMetadata(cells[column] ?? '')),
  );
}

function containsPluralMetadata(cells, numberColumns) {
  return numberColumns.some((column) =>
    ['p', 'pluriel', 'plural'].includes(normalizeMetadata(cells[column] ?? '')),
  );
}

function containsLemmaMetadata(cells, lemmaColumns) {
  return lemmaColumns.some((column) =>
    ['1', 'oui', 'yes', 'true'].includes(normalizeMetadata(cells[column] ?? '')),
  );
}

function isBelowFrequency(cells, frequencyColumn, minimumFrequency) {
  if (frequencyColumn < 0) return false;

  const frequency = Number((cells[frequencyColumn] ?? '').trim().replace(',', '.'));

  return !Number.isFinite(frequency) || frequency < minimumFrequency;
}

function parsePlainWordList(text, sourceName) {
  const words = new Set();

  for (const line of text.split(/\r?\n/u)) {
    addWord(words, line);
  }

  if (words.size === 0) {
    throw new Error(`Aucun mot de 4 ou 5 lettres valide n’a été trouvé dans ${sourceName}.`);
  }

  return words;
}

function addWord(words, rawWord) {
  const normalizedRawWord = rawWord.trim().normalize('NFC');

  if (!normalizedRawWord || isUppercaseEntry(normalizedRawWord)) {
    return;
  }

  const word = normalizedRawWord.toLocaleLowerCase('fr-FR');

  if (!WORD_PATTERN.test(word)) {
    return;
  }

  if (WORD_LENGTHS.includes([...word].length)) {
    words.add(word);
  }
}

function groupWordsByLength(words) {
  const wordsByLength = new Map(WORD_LENGTHS.map((length) => [length, []]));
  const frenchCollator = new Intl.Collator('fr-FR', { sensitivity: 'variant' });

  for (const word of words) {
    wordsByLength.get([...word].length)?.push(word);
  }

  for (const length of WORD_LENGTHS) {
    wordsByLength.get(length)?.sort((first, second) => frenchCollator.compare(first, second));
  }

  return wordsByLength;
}

function isUppercaseEntry(word) {
  return word !== word.toLocaleLowerCase('fr-FR');
}

function parseMinimumFrequency(value) {
  const minimumFrequency = Number(value.replace(',', '.'));

  if (!Number.isFinite(minimumFrequency) || minimumFrequency < 0) {
    throw new Error('Le seuil de fréquence doit être un nombre positif ou nul.');
  }

  return minimumFrequency;
}

async function readSource(sourcePath) {
  try {
    return await readFile(sourcePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error('Fichier source introuvable : ' + sourcePath);
    }

    throw new Error(
      'Impossible de lire le fichier source ' +
        sourcePath +
        ' : ' +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

function fileExists(filePath) {
  return existsSync(filePath);
}

async function main() {
  try {
    const { sourcePath, outputDirectory, options } = parseCliArguments(process.argv.slice(2));
    const counts = await generateWordLists(sourcePath, outputDirectory, options);

    for (const length of WORD_LENGTHS) {
      console.log(length + ' lettres : ' + counts.get(length) + ' mots générés.');
    }
  } catch (error) {
    console.error(
      'Génération des listes impossible : ' +
        (error instanceof Error ? error.message : String(error)),
    );
    process.exitCode = 1;
  }
}

const invokedScript = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedScript === fileURLToPath(import.meta.url)) {
  await main();
}

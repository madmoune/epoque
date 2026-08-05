import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORD_LENGTHS = [4, 5];

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, '..');
export const DEFAULT_OUTPUT_DIRECTORY = path.join(PROJECT_ROOT, 'public');
export const DEFAULT_MINIMUM_FREQUENCY = 1;

const WORD_PATTERN = /^\p{Letter}+$/u;
const ABBREVIATION_VALUES = new Set([
  'abr',
  'abbr',
  'abbreviation',
  'abreviation',
  'sigle',
  'acronyme',
  'symbole',
]);

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

export async function generateWordLists(
  sourcePath,
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
  options = {},
) {
  const sourceText = await readSource(sourcePath);
  const wordsByLength = parseLexiqueTsv(sourceText, options);

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

export function parseCliArguments(args) {
  const options = {
    excludePlurals: false,
    lemmasOnly: false,
    minimumFrequency: DEFAULT_MINIMUM_FREQUENCY,
  };
  let sourcePath = null;

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

    if (argument.startsWith('--min-frequency=')) {
      options.minimumFrequency = parseMinimumFrequency(argument.slice('--min-frequency='.length));
      continue;
    }

    if (argument.startsWith('--')) {
      throw new Error('Option inconnue : ' + argument);
    }

    if (sourcePath !== null) {
      throw new Error('Un seul chemin de fichier TSV peut être fourni.');
    }

    sourcePath = argument;
  }

  return {
    sourcePath: sourcePath ? path.resolve(sourcePath) : resolveDefaultSource(),
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
  const preferredNames = ['freqortho', 'freqmot', 'freqlemme', 'frequencyortho'];

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
      throw new Error('Fichier Lexique introuvable : ' + sourcePath);
    }

    throw new Error(
      'Impossible de lire le fichier Lexique ' +
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
    const { sourcePath, options } = parseCliArguments(process.argv.slice(2));
    const counts = await generateWordLists(sourcePath, DEFAULT_OUTPUT_DIRECTORY, options);

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

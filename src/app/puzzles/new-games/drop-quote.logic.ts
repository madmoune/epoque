import { range } from './random';

export interface DropQuotePuzzle {
  phrase: string;
  width: number;
  rows: string[];
  columns: string[][];
  solution: Record<number, string>;
}

const DROP_QUOTE_WIDTH = 12;

export function normalizeDropQuotePhrase(phrase: string): string {
  return phrase
    .replace(/[Œœ]/g, 'OE')
    .replace(/[Ææ]/g, 'AE')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function wrapDropQuote(phrase: string): string[] {
  const text = normalizeDropQuotePhrase(phrase);
  const words = text.split(' ');
  if (!/[A-Z]/.test(text) || words.some((word) => word.length > DROP_QUOTE_WIDTH)) {
    return [];
  }

  const rows: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && line.length + word.length + 1 > DROP_QUOTE_WIDTH) {
      rows.push(line.padEnd(DROP_QUOTE_WIDTH, ' '));
      line = word;
    } else line += (line ? ' ' : '') + word;
  }
  if (line) rows.push(line.padEnd(DROP_QUOTE_WIDTH, ' '));
  return rows;
}

export function parseDropQuotePhrases(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/\r?\n/)
    .map((phrase) => phrase.trim().replace(/\s+/g, ' '))
    .filter((phrase) => {
      const normalized = normalizeDropQuotePhrase(phrase);
      const rows = wrapDropQuote(phrase);
      if (rows.length < 5 || rows.length > 7 || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

export function createDropQuote(phrase: string): DropQuotePuzzle {
  const rows = wrapDropQuote(phrase);
  if (rows.length === 0) throw new Error('The phrase does not fit the Dropquote grid.');
  const width = DROP_QUOTE_WIDTH;
  const solution = Object.fromEntries(
    rows.flatMap((row, r) =>
      [...row].flatMap((letter, c) => (/^[A-Z]$/.test(letter) ? [[r * width + c, letter]] : [])),
    ),
  );
  const columns = range(width).map((col) =>
    rows
      .map((row) => row[col])
      .filter((letter) => /^[A-Z]$/.test(letter))
      .sort(),
  );
  return { phrase, width, rows, columns, solution };
}

export function remainingDropLetters(
  puzzle: DropQuotePuzzle,
  values: Record<number, string>,
): string[][] {
  const remaining = puzzle.columns.map((column) => [...column]);
  for (const [cell, letter] of Object.entries(values)) {
    const column = remaining[Number(cell) % puzzle.width];
    const index = column.indexOf(letter);
    if (index !== -1) column.splice(index, 1);
  }
  return remaining;
}

export function isDropQuoteSolved(
  puzzle: DropQuotePuzzle,
  values: Record<number, string>,
): boolean {
  return Object.entries(puzzle.solution).every(([cell, letter]) => values[Number(cell)] === letter);
}

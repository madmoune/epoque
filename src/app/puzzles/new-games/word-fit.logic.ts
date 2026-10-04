import { shuffle } from './random';

export interface WordSlot {
  cells: number[];
  direction: 'across' | 'down';
  number: number;
}

export interface WordFitPuzzle {
  width: number;
  height: number;
  slots: WordSlot[];
  words: string[];
  solution: string[];
  givens: Record<number, string>;
}

export function parseWordFitWords(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/\r?\n/)
        .map((word) =>
          word
            .trim()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toUpperCase()
            .replace(/Œ/g, 'OE')
            .replace(/Æ/g, 'AE'),
        )
        .filter((word) => /^[A-Z]{3,12}$/.test(word)),
    ),
  ];
}

interface Placement {
  word: string;
  row: number;
  col: number;
  vertical: boolean;
}

function makeGrid(placements: Placement[]): Map<string, { letter: string; directions: number }> {
  const cells = new Map<string, { letter: string; directions: number }>();
  for (const placement of placements) {
    [...placement.word].forEach((letter, i) => {
      const key = `${placement.row + (placement.vertical ? i : 0)},${placement.col + (placement.vertical ? 0 : i)}`;
      const previous = cells.get(key);
      cells.set(key, {
        letter,
        directions: (previous?.directions ?? 0) | (placement.vertical ? 2 : 1),
      });
    });
  }
  return cells;
}

function validPlacement(placement: Placement, grid: ReturnType<typeof makeGrid>): boolean {
  const { word, row, col, vertical } = placement;
  const direction = vertical ? 2 : 1;
  const at = (r: number, c: number) => grid.get(`${r},${c}`);
  if (
    at(row - (vertical ? 1 : 0), col - (vertical ? 0 : 1)) ||
    at(row + (vertical ? word.length : 0), col + (vertical ? 0 : word.length))
  )
    return false;
  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + (vertical ? i : 0);
    const c = col + (vertical ? 0 : i);
    const existing = at(r, c);
    if (existing) {
      if (existing.letter !== word[i] || existing.directions & direction) return false;
      crossings++;
    } else if (
      at(r + (vertical ? 0 : 1), c + (vertical ? 1 : 0)) ||
      at(r - (vertical ? 0 : 1), c - (vertical ? 1 : 0))
    )
      return false;
  }
  if (!crossings) return false;
  const coordinates = [...grid.keys()].map((key) => key.split(',').map(Number));
  const rows = [...coordinates.map(([r]) => r), row, row + (vertical ? word.length - 1 : 0)];
  const cols = [...coordinates.map(([, c]) => c), col, col + (vertical ? 0 : word.length - 1)];
  return Math.max(...rows) - Math.min(...rows) < 12 && Math.max(...cols) - Math.min(...cols) < 12;
}

export function wordFitLetters(
  puzzle: WordFitPuzzle,
  assignments: Record<number, string>,
): Record<number, string> {
  const letters: Record<number, string> = {};
  for (const [slot, word] of Object.entries(assignments)) {
    puzzle.slots[Number(slot)]?.cells.forEach((cell, i) => {
      letters[cell] = word[i];
    });
  }
  return letters;
}

export function canPlaceWord(
  puzzle: WordFitPuzzle,
  assignments: Record<number, string>,
  slot: number,
  word: string,
): boolean {
  const target = puzzle.slots[slot];
  if (!target || !puzzle.words.includes(word) || target.cells.length !== word.length) return false;
  if (puzzle.givens[slot] !== undefined && puzzle.givens[slot] !== word) return false;
  if (
    Object.entries(assignments).some(([other, value]) => Number(other) !== slot && value === word)
  )
    return false;
  const others = { ...assignments };
  delete others[slot];
  const letters = wordFitLetters(puzzle, others);
  return target.cells.every((cell, i) => letters[cell] === undefined || letters[cell] === word[i]);
}

export function solveWordFit(puzzle: WordFitPuzzle, limit = 2): Record<number, string>[] {
  const assignments = { ...puzzle.givens };
  const solutions: Record<number, string>[] = [];
  const visit = (): void => {
    if (solutions.length >= limit) return;
    let bestSlot: number | undefined;
    let bestWords: string[] = [];
    for (let slot = 0; slot < puzzle.slots.length; slot++) {
      if (assignments[slot] !== undefined) continue;
      const words = puzzle.words.filter((word) => canPlaceWord(puzzle, assignments, slot, word));
      if (!words.length) return;
      if (bestSlot === undefined || words.length < bestWords.length) {
        bestSlot = slot;
        bestWords = words;
      }
    }
    if (bestSlot === undefined) {
      solutions.push({ ...assignments });
      return;
    }
    for (const word of bestWords) {
      assignments[bestSlot] = word;
      visit();
      delete assignments[bestSlot];
      if (solutions.length >= limit) return;
    }
  };
  visit();
  return solutions;
}

export function createWordFit(words: readonly string[]): WordFitPuzzle {
  if (words.length < 8) throw new Error('La liste doit contenir au moins huit mots à caser.');
  for (let attempt = 0; attempt < 30; attempt++) {
    const puzzle = createWordFitCandidate(words);
    if (puzzle) return puzzle;
  }
  throw new Error('Impossible de créer une grille avec cette liste de mots.');
}

function createWordFitCandidate(words: readonly string[]): WordFitPuzzle | null {
  const ordered = shuffle(words);
  const seed = ordered.find((word) => word.length >= 6) ?? ordered[0];
  const placements: Placement[] = [{ word: seed, row: 0, col: 0, vertical: false }];
  // Several passes let a new branch make previously impossible words fit.
  for (let pass = 0; pass < 4 && placements.length < 10; pass++) {
    for (const word of ordered) {
      if (placements.some((placement) => placement.word === word)) continue;
      const grid = makeGrid(placements);
      const candidates: Placement[] = [];
      for (const [key, cell] of shuffle([...grid.entries()])) {
        const [r, c] = key.split(',').map(Number);
        for (let i = 0; i < word.length; i++) {
          if (word[i] !== cell.letter) continue;
          for (const vertical of [false, true]) {
            const candidate = {
              word,
              row: r - (vertical ? i : 0),
              col: c - (vertical ? 0 : i),
              vertical,
            };
            if (validPlacement(candidate, grid)) candidates.push(candidate);
          }
        }
      }
      if (candidates.length) placements.push(shuffle(candidates)[0]);
      if (placements.length === 10) break;
    }
  }
  if (placements.length < 8) return null;
  placements.sort(
    (a, b) => a.row - b.row || a.col - b.col || Number(a.vertical) - Number(b.vertical),
  );
  const grid = makeGrid(placements);
  const coordinates = [...grid.keys()].map((key) => key.split(',').map(Number));
  const minRow = Math.min(...coordinates.map(([row]) => row));
  const minCol = Math.min(...coordinates.map(([, col]) => col));
  const width = Math.max(...coordinates.map(([, col]) => col)) - minCol + 1;
  const height = Math.max(...coordinates.map(([row]) => row)) - minRow + 1;
  const starts = [
    ...new Set(placements.map((p) => (p.row - minRow) * width + p.col - minCol)),
  ].sort((a, b) => a - b);
  const puzzle: WordFitPuzzle = {
    width,
    height,
    slots: placements.map((p) => ({
      cells: [...p.word].map(
        (_, i) =>
          (p.row - minRow + (p.vertical ? i : 0)) * width + p.col - minCol + (p.vertical ? 0 : i),
      ),
      direction: p.vertical ? 'down' : 'across',
      number: starts.indexOf((p.row - minRow) * width + p.col - minCol) + 1,
    })),
    solution: placements.map((p) => p.word),
    words: placements.map((p) => p.word).sort((a, b) => a.length - b.length || a.localeCompare(b)),
    givens: {},
  };
  for (;;) {
    const candidates = solveWordFit(puzzle);
    if (candidates.length === 1) return puzzle;
    const slot = shuffle(puzzle.slots.map((_, i) => i)).find((i) =>
      candidates.some((candidate) => candidate[i] !== puzzle.solution[i]),
    );
    if (slot === undefined) throw new Error('Mots à caser sans solution');
    puzzle.givens[slot] = puzzle.solution[slot];
  }
}

export function isWordFitSolved(
  puzzle: WordFitPuzzle,
  assignments: Record<number, string>,
): boolean {
  return puzzle.slots.every(
    (_, slot) =>
      assignments[slot] !== undefined && canPlaceWord(puzzle, assignments, slot, assignments[slot]),
  );
}

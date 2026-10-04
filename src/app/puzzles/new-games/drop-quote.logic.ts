import { range, shuffle } from './random';

export interface DropQuotePuzzle {
  phrase: string;
  clue: string;
  width: number;
  rows: string[];
  columns: string[][];
  solution: Record<number, string>;
}

// Original short sentences: no obscure references, names or quotations to know.
export const DROP_PHRASES = [
  ['Un bon indice transforme le doute en certitude', 'Résoudre une énigme'],
  ['La patience ouvre des portes que la force ferme', 'Prendre son temps'],
  ['Chaque petit effort nous rapproche de la victoire', 'Progresser'],
  ['Un regard neuf trouve parfois la bonne réponse', 'Changer de perspective'],
  ['Les idées voyagent plus vite que les trains', 'Imaginer'],
  ['Le silence aide parfois à entendre ses idées', 'Réfléchir'],
  ['La lumière du matin dessine des ombres nouvelles', 'Au lever du jour'],
  ['Les meilleurs chemins commencent par un premier pas', 'Se lancer'],
  ['Une question simple peut ouvrir un grand débat', 'Discuter'],
  ['Un ami partage aussi bien les rires que les doutes', 'L’amitié'],
  ['Le vent raconte aux arbres des histoires sans fin', 'Dans la forêt'],
  ['Une bonne équipe écoute avant de prendre une décision', 'Coopérer'],
  ['La curiosité transforme chaque détail en petite découverte', 'Observer'],
  ['Les mots bien choisis rendent les idées plus claires', 'Bien expliquer'],
  ['Une pause permet souvent de repartir du bon pied', 'Reprendre son souffle'],
  ['Le courage grandit chaque fois que nous essayons', 'Oser'],
  ['Les vagues effacent nos traces mais gardent nos souvenirs', 'Au bord de la mer'],
  ['La meilleure piste se cache parfois sous nos yeux', 'Faire attention'],
  ['Le sourire revient quand les amis ouvrent la porte', 'Se retrouver'],
  ['Les chiffres deviennent simples quand on trouve leur logique', 'Faire des calculs'],
] as const;

export function createDropQuote(previousPhrase?: string): DropQuotePuzzle {
  const [phrase, clue] = shuffle(DROP_PHRASES.filter(([text]) => text !== previousPhrase))[0];
  const text = phrase
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
  const width = 12;
  const rows: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + word.length + 1 > width) {
      rows.push(line.padEnd(width, ' '));
      line = word;
    } else line += (line ? ' ' : '') + word;
  }
  if (line) rows.push(line.padEnd(width, ' '));
  const solution = Object.fromEntries(
    rows.flatMap((row, r) =>
      [...row].flatMap((letter, c) => (letter === ' ' ? [] : [[r * width + c, letter]])),
    ),
  );
  const columns = range(width).map((col) =>
    shuffle(rows.map((row) => row[col]).filter((letter) => letter !== ' ')),
  );
  return { phrase, clue, width, rows, columns, solution };
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

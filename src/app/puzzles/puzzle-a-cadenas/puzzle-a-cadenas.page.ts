import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { AppStorageService } from '../../shared/storage/app-storage.service';
import {
  PUZZLE_A_CADENAS,
  PUZZLE_A_CADENAS_GRID_EXAMPLE_RESULTS,
  PuzzleACadenasEntry,
} from './puzzle-a-cadenas.catalog';

const SOLVED_STORAGE_KEY = 'epique-puzzle-a-cadenas-solved';
const SELECTED_STORAGE_KEY = 'epique-puzzle-a-cadenas-selected';

type DisplayBlock =
  | { type: 'heading'; text: string }
  | { type: 'line'; text: string }
  | { type: 'grid'; label: string; rows: string[]; result?: string }
  | { type: 'number-grids'; grids: NumberGrid[] }
  | { type: 'symbol-grids'; grids: SymbolGrid[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'tokens'; label?: string; tokens: string[]; result?: string }
  | { type: 'diagram'; label?: string; lines: string[]; result?: string }
  | {
      type: 'shape';
      label?: string;
      grid?: string[][];
      row?: string[];
      extraRow?: string[];
      operator?: string;
      result: string;
    }
  | {
      type: 'cube-net';
      label: string;
      top: string;
      row: string[];
      bottom: string;
      query: string;
      result: string;
    }
  | { type: 'rotation'; label: string; before: string[]; after: string[]; result: string }
  | {
      type: 'domino';
      label?: string;
      left: [string, string];
      right: [string, string];
      result: string;
    }
  | { type: 'signals'; tokens: string[]; result: string };

type NumberGrid = {
  label?: string;
  rows: string[][];
};

type SymbolGrid = {
  label?: string;
  rows: string[];
  result?: string;
};

@Component({
  selector: 'app-puzzle-a-cadenas-page',
  imports: [RouterLink],
  templateUrl: './puzzle-a-cadenas.page.html',
  styleUrl: './puzzle-a-cadenas.page.scss',
})
export class PuzzleACadenasPage {
  protected readonly puzzles = PUZZLE_A_CADENAS;

  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly storage = inject(AppStorageService);
  protected readonly attempts = signal<Record<string, string>>({});
  protected readonly solved = signal<Set<string>>(this.readSolved());
  protected readonly visibleHints = signal<Set<string>>(new Set());
  protected readonly feedback = signal<Record<string, string>>({});
  protected readonly selectedPuzzleId = signal(this.readSelectedPuzzleId());
  protected readonly selectedPuzzle = computed(
    () => this.puzzles.find((puzzle) => puzzle.id === this.selectedPuzzleId()) ?? this.puzzles[0],
  );
  protected readonly nextUnsolvedPuzzle = computed(() => {
    const currentIndex = this.puzzles.findIndex((puzzle) => puzzle.id === this.selectedPuzzleId());
    const followingPuzzles =
      currentIndex >= 0
        ? [...this.puzzles.slice(currentIndex + 1), ...this.puzzles.slice(0, currentIndex)]
        : [...this.puzzles];

    return followingPuzzles.find((puzzle) => !this.isSolved(puzzle.id)) ?? null;
  });
  protected readonly completedCount = computed(
    () => this.puzzles.filter((puzzle) => this.isSolved(puzzle.id)).length,
  );

  constructor() {
    this.storage.changes$.subscribe((change) => {
      if (change.source !== 'remote') {
        return;
      }

      if (change.key === SOLVED_STORAGE_KEY) {
        this.solved.set(this.readSolved());
      }

      if (change.key === SELECTED_STORAGE_KEY) {
        this.selectedPuzzleId.set(this.readSelectedPuzzleId());
      }
    });

    if (this.solved().size === this.puzzles.length) {
      this.playHistory.markSolved('/puzzle-a-cadenas');
    }
  }

  protected selectPuzzle(id: string): void {
    if (!this.puzzles.some((puzzle) => puzzle.id === id)) {
      return;
    }

    this.selectedPuzzleId.set(id);
    this.storage.set(SELECTED_STORAGE_KEY, id);
    this.scrollToSelectedPuzzle();
  }

  protected goToNextUnsolved(): void {
    const nextPuzzle = this.nextUnsolvedPuzzle();

    if (nextPuzzle) {
      this.selectPuzzle(nextPuzzle.id);
    }
  }

  protected updateAttempt(id: string, value: string): void {
    if (this.isSolved(id)) {
      return;
    }

    const attempt = value.replace(/\D/g, '').slice(0, 4);

    this.attempts.update((attempts) => ({ ...attempts, [id]: attempt }));
    this.feedback.update((feedback) => ({ ...feedback, [id]: '' }));

    if (attempt.length === 4) {
      const puzzle = this.puzzles.find((entry) => entry.id === id);

      if (puzzle) {
        this.checkPuzzle(puzzle);
      }
    }
  }

  protected checkPuzzle(puzzle: PuzzleACadenasEntry): void {
    const attempt = this.attemptFor(puzzle.id);

    if (attempt.length !== 4) {
      this.setFeedback(puzzle.id, 'Entre un code de quatre chiffres.');
      return;
    }

    if (attempt !== puzzle.answer) {
      this.setFeedback(puzzle.id, 'Ce code ne correspond pas à cette logique.');
      return;
    }

    const nextSolved = new Set(this.solved());
    nextSolved.add(puzzle.id);
    this.solved.set(nextSolved);
    this.writeSolved(nextSolved);
    this.setFeedback(puzzle.id, 'Cadenas ouvert !');

    if (nextSolved.size === this.puzzles.length) {
      this.playHistory.markSolved('/puzzle-a-cadenas');
    }
  }

  protected isSolved(id: string): boolean {
    return this.solved().has(id);
  }

  protected revealHint(id: string): void {
    if (!this.puzzles.some((puzzle) => puzzle.id === id) || this.isSolved(id)) {
      return;
    }

    this.visibleHints.update((hints) => new Set([...hints, id]));
  }

  protected isHintVisible(id: string): boolean {
    return this.visibleHints().has(id);
  }

  protected attemptFor(id: string): string {
    return this.attempts()[id] ?? '';
  }

  protected feedbackFor(id: string): string {
    return this.feedback()[id] ?? '';
  }

  protected displayBlocks(puzzle: PuzzleACadenasEntry): DisplayBlock[] {
    const lines = puzzle.display.split('\n');
    const blocks: DisplayBlock[] = [];

    for (let index = 0; index < lines.length; index += 1) {
      const text = lines[index]?.trim() ?? '';

      if (!text) {
        continue;
      }

      if (text === 'Exemples' || text === 'À résoudre') {
        blocks.push({ type: 'heading', text });
        continue;
      }

      const diagram = this.parseDiagram(lines, index);

      if (diagram) {
        blocks.push(diagram.block);
        index = diagram.endIndex;
        continue;
      }

      const cubeNet = this.parseCubeNet(lines, index);

      if (cubeNet) {
        blocks.push(cubeNet.block);
        index = cubeNet.endIndex;
        continue;
      }

      const rotation = this.parseRotation(lines, index);

      if (rotation) {
        blocks.push(rotation.block);
        index = rotation.endIndex;
        continue;
      }

      const shape = this.parseShape(lines, index);

      if (shape) {
        blocks.push(shape.block);
        index = shape.endIndex;
        continue;
      }

      const labelledNumberGrids = this.parseNumberGrids(lines, index + 1, text);
      const labelledSymbolGrids = this.parseSymbolGrids(lines, index + 1, text);

      if (this.isDisplayLabelLine(text) && labelledNumberGrids) {
        blocks.push(labelledNumberGrids.block);
        index = labelledNumberGrids.endIndex;
        continue;
      }

      if (this.isDisplayLabelLine(text) && labelledSymbolGrids) {
        blocks.push(labelledSymbolGrids.block);
        index = labelledSymbolGrids.endIndex;
        continue;
      }

      const numberGrids = this.parseNumberGrids(lines, index);

      if (numberGrids) {
        blocks.push(numberGrids.block);
        index = numberGrids.endIndex;
        continue;
      }

      const symbolGrids = this.parseSymbolGrids(lines, index);

      if (symbolGrids) {
        blocks.push(symbolGrids.block);
        index = symbolGrids.endIndex;
        continue;
      }

      const table = this.parseTable(lines, index);

      if (table) {
        blocks.push(table.block);
        index = table.endIndex;
        continue;
      }

      const domino = this.parseDomino(text);

      if (domino) {
        blocks.push(domino);
        continue;
      }

      if (/^(?:Exemple \d+|[ABCD])$/.test(text)) {
        const rows = lines.slice(index + 1, index + 4).map((row) => row.trim());

        if (rows.length === 3 && rows.every((row) => /^[■·]+$/.test(row))) {
          blocks.push({
            type: 'grid',
            label: text,
            rows,
            result: this.gridExampleResult(puzzle.id, text),
          });
          index += 3;
          continue;
        }
      }

      const signalMatch = text.match(/[■●·|]/g);
      const separatorIndex = text.search(/[→=]/);

      if (signalMatch && signalMatch.length >= 4 && separatorIndex >= 0) {
        blocks.push({
          type: 'signals',
          tokens: signalMatch,
          result: text.slice(separatorIndex + 1).trim(),
        });
        continue;
      }

      const tokenLine = this.parseTokenLine(text);

      if (tokenLine) {
        blocks.push(tokenLine);
        continue;
      }

      blocks.push({ type: 'line', text });
    }

    return blocks;
  }

  protected gridCells(row: string): string[] {
    return [...row];
  }

  protected isFilledGridCell(cell: string): boolean {
    return ['■', '●', '#'].includes(cell);
  }

  protected gridCellLabel(cell: string): string {
    return this.isFilledGridCell(cell) || ['·', '.'].includes(cell) ? '' : cell;
  }

  protected gridLabels(labelLine: string | undefined, count: number): string[] {
    const labels = labelLine?.match(/(?:Exemple\s+\d+|\b[A-D]\b)/g) ?? [];

    if (labels.length === count) {
      return labels;
    }

    return count > 1 ? Array.from({ length: count }, (_, index) => `Exemple ${index + 1}`) : [];
  }

  private gridExampleResult(puzzleId: string, label: string): string | undefined {
    const match = label.match(/^Exemple (\d+)$/);

    if (!match) {
      return undefined;
    }

    return PUZZLE_A_CADENAS_GRID_EXAMPLE_RESULTS[puzzleId]?.[Number(match[1]) - 1];
  }

  private isDisplayLabelLine(text: string): boolean {
    return /^(?:Exemple \d+|[ABCD](?:\s+[ABCD]){0,3})$/.test(text);
  }

  private parseNumberGrids(
    lines: string[],
    startIndex: number,
    labelLine?: string,
  ): { block: Extract<DisplayBlock, { type: 'number-grids' }>; endIndex: number } | null {
    const topLine = lines[startIndex]?.trim() ?? '';

    if (!topLine.includes('┌')) {
      return null;
    }

    const bottomOffset = lines.slice(startIndex + 1).findIndex((line) => line.includes('└'));

    if (bottomOffset < 0) {
      return null;
    }

    const endIndex = startIndex + 1 + bottomOffset;
    const rowValues = lines
      .slice(startIndex + 1, endIndex)
      .filter((line) => line.includes('│'))
      .map((line) => [...line.matchAll(/\?|\d+/g)].map((match) => match[0]))
      .filter((values) => values.length > 0);
    const gridCount = (topLine.match(/┌/g) ?? []).length;

    if (
      gridCount === 0 ||
      rowValues.length === 0 ||
      rowValues.some((values) => values.length !== rowValues[0].length) ||
      rowValues[0].length % gridCount !== 0
    ) {
      return null;
    }

    const columns = rowValues[0].length / gridCount;
    const labels = this.gridLabels(labelLine, gridCount);
    const grids = Array.from({ length: gridCount }, (_, gridIndex) => ({
      label: labels[gridIndex],
      rows: rowValues.map((values) => values.slice(gridIndex * columns, (gridIndex + 1) * columns)),
    }));

    return { block: { type: 'number-grids', grids }, endIndex };
  }

  private parseSymbolGrids(
    lines: string[],
    startIndex: number,
    labelLine?: string,
  ): { block: Extract<DisplayBlock, { type: 'symbol-grids' }>; endIndex: number } | null {
    const firstRow = this.splitSymbolGridRow(lines[startIndex]);

    if (firstRow.length < 2) {
      return null;
    }

    const rows = [firstRow];
    let endIndex = startIndex;

    while (endIndex + 1 < lines.length) {
      const nextRow = this.splitSymbolGridRow(lines[endIndex + 1]);

      if (nextRow.length !== firstRow.length) {
        break;
      }

      rows.push(nextRow);
      endIndex += 1;
    }

    if (rows.length < 2) {
      return null;
    }

    const resultValues = [...(lines[endIndex + 1] ?? '').matchAll(/\?|\d+/g)].map(
      (match) => match[0],
    );
    const hasResults = resultValues.length === firstRow.length;

    if (hasResults) {
      endIndex += 1;
    }

    const labels = this.gridLabels(labelLine, firstRow.length);
    const grids = firstRow.map((_, gridIndex) => ({
      label: labels[gridIndex],
      rows: rows.map((row) => row[gridIndex]),
      result: hasResults ? resultValues[gridIndex] : undefined,
    }));

    return { block: { type: 'symbol-grids', grids }, endIndex };
  }

  private splitSymbolGridRow(line: string | undefined): string[] {
    const parts = (line ?? '')
      .trim()
      .split(/\s{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.length >= 2 && parts.every((part) => /^[■●·○#\.XOSE\/\\_|]+$/.test(part))
      ? parts
      : [];
  }

  private parseTable(
    lines: string[],
    startIndex: number,
  ): { block: Extract<DisplayBlock, { type: 'table' }>; endIndex: number } | null {
    const headers = (lines[startIndex] ?? '')
      .trim()
      .split(/\s{2,}/)
      .map((header) => header.trim())
      .filter(Boolean);

    if (headers.length < 2 || !headers[0].toLowerCase().includes('essai')) {
      return null;
    }

    const rows: string[][] = [];
    let endIndex = startIndex;

    while (endIndex + 1 < lines.length) {
      const values = (lines[endIndex + 1] ?? '')
        .trim()
        .split(/\s{2,}/)
        .map((value) => value.trim())
        .filter(Boolean);

      if (values.length !== headers.length || !/^\d+$/.test(values[0])) {
        break;
      }

      rows.push(values);
      endIndex += 1;
    }

    return rows.length > 0 ? { block: { type: 'table', headers, rows }, endIndex } : null;
  }

  private parseCubeNet(
    lines: string[],
    startIndex: number,
  ): { block: Extract<DisplayBlock, { type: 'cube-net' }>; endIndex: number } | null {
    const label = lines[startIndex]?.trim() ?? '';

    if (!/^(?:Exemple \d+|[ABCD])$/.test(label)) {
      return null;
    }

    const top = lines[startIndex + 1]?.trim() ?? '';
    const row = lines[startIndex + 2]?.trim().split(/\s+/) ?? [];
    const bottom = lines[startIndex + 3]?.trim() ?? '';
    const queryLine = lines[startIndex + 4]?.trim() ?? '';
    const queryMatch = queryLine.match(/^(.+?)\s+→\s*([?\d])$/);

    if (!/^\d$/.test(top) || row.length !== 4 || !row.every((value) => /^\d$/.test(value))) {
      return null;
    }

    if (!/^\d$/.test(bottom) || !queryMatch) {
      return null;
    }

    return {
      block: {
        type: 'cube-net',
        label,
        top,
        row,
        bottom,
        query: queryMatch[1],
        result: queryMatch[2],
      },
      endIndex: startIndex + 4,
    };
  }

  private parseRotation(
    lines: string[],
    startIndex: number,
  ): { block: Extract<DisplayBlock, { type: 'rotation' }>; endIndex: number } | null {
    const label = lines[startIndex]?.trim() ?? '';

    if (!/^(?:Exemple \d+|[ABCD])$/.test(label)) {
      return null;
    }

    const before = lines.slice(startIndex + 1, startIndex + 3).map((line) => line.trim());
    const after = lines.slice(startIndex + 4, startIndex + 6).map((line) => line.trim());
    const result = lines[startIndex + 6]?.trim().match(/^→\s*([?\d])$/)?.[1];

    if (
      before.length !== 2 ||
      after.length !== 2 ||
      !before.every((row) => /^[■●·.#]+$/.test(row)) ||
      !after.every((row) => /^[■●·.#]+$/.test(row)) ||
      lines[startIndex + 3]?.trim() !== '→' ||
      !result
    ) {
      return null;
    }

    return { block: { type: 'rotation', label, before, after, result }, endIndex: startIndex + 6 };
  }

  private parseTokenLine(text: string): Extract<DisplayBlock, { type: 'tokens' }> | null {
    const match = text.match(/^(?:(Exemple \d+|[ABCD])\s+)?(.+?)\s+→\s*(.*)$/);

    if (!match || !match[2].trim()) {
      return null;
    }

    const result = match[3].trim();
    const tokenText = result ? match[2].trim() : `${match[2].trim()} →`;
    const tokens = tokenText.split(/\s+/).filter(Boolean);

    return {
      type: 'tokens',
      label: match[1],
      tokens,
      result: result || undefined,
    };
  }

  private parseDiagram(
    lines: string[],
    startIndex: number,
  ): { block: Extract<DisplayBlock, { type: 'diagram' }>; endIndex: number } | null {
    const marker = lines[startIndex]?.trim().match(/^@diagram(?:\s+(.+))?$/);

    if (!marker) {
      return null;
    }

    const resultOffset = lines
      .slice(startIndex + 1)
      .findIndex((line) => /^@result(?:\s+.*)?$/.test(line.trim()));

    if (resultOffset < 0) {
      return null;
    }

    const resultIndex = startIndex + 1 + resultOffset;
    const result = lines[resultIndex]?.trim().replace(/^@result\s*/, '') ?? '';
    const diagramLines = lines.slice(startIndex + 1, resultIndex).map((line) => line.trimEnd());

    if (diagramLines.length === 0) {
      return null;
    }

    return {
      block: {
        type: 'diagram',
        label: marker[1]?.trim() || undefined,
        lines: diagramLines,
        result: result || undefined,
      },
      endIndex: resultIndex,
    };
  }

  private parseShape(
    lines: string[],
    startIndex: number,
  ): { block: Extract<DisplayBlock, { type: 'shape' }>; endIndex: number } | null {
    const text = lines[startIndex]?.trim() ?? '';
    const rowMatch = text.match(/^(?:(A|B|C|D)\s+)?(□(?:\s+□)*)\s+→\s+([?\d])$/);

    if (rowMatch) {
      return {
        block: {
          type: 'shape',
          label: rowMatch[1],
          row: rowMatch[2].split(/\s+/).map(() => ''),
          result: rowMatch[3],
        },
        endIndex: startIndex,
      };
    }

    const boxMatch = text.match(
      /^(?:(A|B|C|D)\s+)?┌─┬─┐(?:\s+\+\s+(□(?:\s+□)*))?(?:\s+→\s+([?\d]))?$/,
    );

    const middleLine = lines[startIndex + 1]?.trim() ?? '';
    const hasValidMiddleLine = middleLine === '├─┼─┤' || /^├─┼─┤\s+→\s+[?\d]$/.test(middleLine);

    if (!boxMatch || !hasValidMiddleLine || lines[startIndex + 2]?.trim() !== '└─┴─┘') {
      return null;
    }

    const middleResult = middleLine.match(/^├─┼─┤\s+→\s+([?\d])$/)?.[1];
    const result = boxMatch[3] ?? middleResult;

    if (!result) {
      return null;
    }

    return {
      block: {
        type: 'shape',
        label: boxMatch[1],
        grid: [
          ['', ''],
          ['', ''],
        ],
        extraRow: boxMatch[2] ? boxMatch[2].split(/\s+/).map(() => '') : undefined,
        operator: boxMatch[2] ? '+' : undefined,
        result,
      },
      endIndex: startIndex + 2,
    };
  }

  private parseDomino(text: string): Extract<DisplayBlock, { type: 'domino' }> | null {
    const match = text.match(/^(?:(A|B|C|D)\s+)?\((\d)│(\d)\)\s*−\s*\((\d)│(\d)\)\s*=\s*([?\d]+)$/);

    if (!match) {
      return null;
    }

    return {
      type: 'domino',
      label: match[1],
      left: [match[2], match[3]],
      right: [match[4], match[5]],
      result: match[6],
    };
  }

  protected puzzleNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected puzzleLabel(index: number): string {
    return `Puzzle ${index + 1}`;
  }

  private scrollToSelectedPuzzle(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById('selected-puzzle')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  private setFeedback(id: string, message: string): void {
    this.feedback.update((feedback) => ({ ...feedback, [id]: message }));
  }

  private readSolved(): Set<string> {
    try {
      const stored = this.storage.get(SOLVED_STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as unknown) : [];

      if (!Array.isArray(parsed)) {
        return new Set();
      }

      return new Set(
        parsed.filter(
          (id): id is string =>
            typeof id === 'string' && this.puzzles.some((puzzle) => puzzle.id === id),
        ),
      );
    } catch {
      return new Set();
    }
  }

  private writeSolved(solved: Set<string>): void {
    this.storage.set(SOLVED_STORAGE_KEY, JSON.stringify([...solved]));
  }

  private readSelectedPuzzleId(): string {
    const stored = this.storage.get(SELECTED_STORAGE_KEY);

    return stored && this.puzzles.some((puzzle) => puzzle.id === stored)
      ? stored
      : (this.puzzles[0]?.id ?? '');
  }
}

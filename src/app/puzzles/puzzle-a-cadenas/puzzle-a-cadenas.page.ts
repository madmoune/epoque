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
  | {
      type: 'fleet';
      label?: string;
      rowTotals: string[];
      columnTotals: string[];
      result: string;
      interactive: boolean;
      solution?: number[];
    }
  | { type: 'tokens'; label?: string; tokens: string[]; result?: string }
  | {
      type: 'diagram';
      label?: string;
      lines: string[];
      result?: string;
      kind: DiagramKind;
      grid?: string[][];
      paths?: DiagramPath[];
      graph?: DiagramGraph;
      intervals?: DiagramInterval[];
      sequence?: string[][];
      interactive?: boolean;
    }
  | {
      type: 'nonogram';
      label?: string;
      rowClues: string[];
      columnClues: string[];
      result: string;
    }
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

type DiagramKind = 'grid' | 'hitori' | 'paths' | 'graph' | 'intervals' | 'sequence' | 'lines';

type DiagramPath = {
  nodes: string[];
  weights: string[];
};

type DiagramGraph = {
  vertices: string[];
  edges: string[];
};

type DiagramInterval = {
  label: string;
  start: number;
  end: number;
};

type GraphPoint = {
  x: number;
  y: number;
};

type GraphEdgePoints = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

@Component({
  selector: 'app-puzzle-a-cadenas-page',
  imports: [RouterLink],
  templateUrl: './puzzle-a-cadenas.page.html',
  styleUrl: './puzzle-a-cadenas.page.scss',
})
export class PuzzleACadenasPage {
  protected readonly puzzles = PUZZLE_A_CADENAS;
  protected readonly fleetCells = [0, 1, 2, 3] as const;

  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly storage = inject(AppStorageService);
  protected readonly attempts = signal<Record<string, string>>({});
  protected readonly solved = signal<Set<string>>(this.readSolved());
  protected readonly fleetSelections = signal<Record<string, number[]>>({});
  protected readonly hitoriSelections = signal<Record<string, number[]>>({});
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

  protected fleetCellIndex(rowIndex: number, columnIndex: number): number {
    return rowIndex * 4 + columnIndex;
  }

  protected isFleetExampleCellOccupied(
    block: Extract<DisplayBlock, { type: 'fleet' }>,
    index: number,
  ): boolean {
    return block.solution?.includes(index) ?? false;
  }

  protected isFleetExampleSingle(
    block: Extract<DisplayBlock, { type: 'fleet' }>,
    index: number,
  ): boolean {
    if (!block.solution?.includes(index)) {
      return false;
    }

    return !block.solution.some(
      (other) => other !== index && this.fleetCellsTouch(index, other),
    );
  }

  protected isFleetCellSelected(
    puzzleId: string,
    label: string | undefined,
    index: number,
  ): boolean {
    return (
      this.fleetSelections()[this.fleetSelectionKey(puzzleId, label)]?.includes(index) ?? false
    );
  }

  protected fleetSelectionCount(puzzleId: string, label: string | undefined): number {
    return this.fleetSelections()[this.fleetSelectionKey(puzzleId, label)]?.length ?? 0;
  }

  protected toggleFleetCell(puzzleId: string, label: string | undefined, index: number): void {
    const key = this.fleetSelectionKey(puzzleId, label);

    this.fleetSelections.update((selections) => {
      const selected = new Set(selections[key] ?? []);

      if (selected.has(index)) {
        selected.delete(index);
      } else {
        selected.add(index);
      }

      return {
        ...selections,
        [key]: [...selected].sort((left, right) => left - right),
      };
    });
  }

  protected clearFleetSelection(puzzleId: string, label: string | undefined): void {
    const key = this.fleetSelectionKey(puzzleId, label);

    this.fleetSelections.update((selections) => {
      const next = { ...selections };
      delete next[key];
      return next;
    });
  }

  protected isHitoriCellSelected(
    puzzleId: string,
    label: string | undefined,
    index: number,
  ): boolean {
    return this.hitoriSelections()[this.hitoriSelectionKey(puzzleId, label)]?.includes(index) ?? false;
  }

  protected hitoriSelectionCount(puzzleId: string, label: string | undefined): number {
    return this.hitoriSelections()[this.hitoriSelectionKey(puzzleId, label)]?.length ?? 0;
  }

  protected toggleHitoriCell(puzzleId: string, label: string | undefined, index: number): void {
    const key = this.hitoriSelectionKey(puzzleId, label);

    this.hitoriSelections.update((selections) => {
      const selected = new Set(selections[key] ?? []);

      if (selected.has(index)) {
        selected.delete(index);
      } else {
        selected.add(index);
      }

      return {
        ...selections,
        [key]: [...selected].sort((left, right) => left - right),
      };
    });
  }

  protected clearHitoriSelection(puzzleId: string, label: string | undefined): void {
    const key = this.hitoriSelectionKey(puzzleId, label);

    this.hitoriSelections.update((selections) => {
      const next = { ...selections };
      delete next[key];
      return next;
    });
  }

  protected diagramCellIndex(rowIndex: number, columnIndex: number, columnCount: number): number {
    return rowIndex * columnCount + columnIndex;
  }

  protected intervalStartOffset(intervals: DiagramInterval[], start: number): number {
    const minimum = Math.min(...intervals.map((interval) => interval.start));
    const maximum = Math.max(...intervals.map((interval) => interval.end));
    const span = Math.max(maximum - minimum, 1);

    return ((start - minimum) / span) * 100;
  }

  protected intervalSpanWidth(intervals: DiagramInterval[], start: number, end: number): number {
    const minimum = Math.min(...intervals.map((interval) => interval.start));
    const maximum = Math.max(...intervals.map((interval) => interval.end));
    const span = Math.max(maximum - minimum, 1);

    return Math.max(((end - start) / span) * 100, 4);
  }

  protected graphNodePosition(vertices: string[], vertex: string): GraphPoint {
    const index = Math.max(vertices.indexOf(vertex), 0);
    const count = Math.max(vertices.length, 1);
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;

    return {
      x: 160 + Math.cos(angle) * 105,
      y: 110 + Math.sin(angle) * 75,
    };
  }

  protected graphEdgePoints(vertices: string[], edge: string): GraphEdgePoints {
    const [from, to] = edge.split(/\s*[–—-]\s*/);
    const start = this.graphNodePosition(vertices, from ?? '');
    const end = this.graphNodePosition(vertices, to ?? '');

    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  }

  protected displayBlocks(puzzle: PuzzleACadenasEntry): DisplayBlock[] {
    const lines = puzzle.display.split('\n');
    const blocks: DisplayBlock[] = [];

    for (let index = 0; index < lines.length; index += 1) {
      const text = lines[index]?.trim() ?? '';

      if (!text) {
        continue;
      }

      if (
        text === 'Exemples' ||
        text === 'À résoudre' ||
        text === 'Indices' ||
        text === 'Ordre du code' ||
        text === 'Grille de référence'
      ) {
        blocks.push({ type: 'heading', text });
        continue;
      }

      const diagram = this.parseDiagram(lines, index, puzzle.id);

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

      const fleet = this.parseFleetLine(text);

      if (fleet) {
        blocks.push(fleet);
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

      const nonogram = this.parseNonogramLine(text);

      if (nonogram) {
        blocks.push(nonogram);
        continue;
      }

      const signalMatch = text.match(/[■●·|]/g);
      const separatorIndex = text.search(/[→=]/);
      const isNonogramLine = /^(?:(?:Exemple \d+|[ABCD])\s+)?L:/.test(text);

      if (!isNonogramLine && signalMatch && signalMatch.length >= 4 && separatorIndex >= 0) {
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

  private parseNonogramLine(text: string): Extract<DisplayBlock, { type: 'nonogram' }> | null {
    const match = text.match(
      /^(?:(Exemple \d+|[ABCD])\s+)?L:(.+?)\s+·\s+C:(.+?)\s+→\s*([?\d])$/,
    );

    if (!match) {
      return null;
    }

    const rowClues = match[2].split(',').map((clue) => clue.trim());
    const columnClues = match[3].split(',').map((clue) => clue.trim());

    if (
      rowClues.length !== 4 ||
      columnClues.length !== 4 ||
      rowClues.some((clue) => !clue) ||
      columnClues.some((clue) => !clue)
    ) {
      return null;
    }

    return {
      type: 'nonogram',
      label: match[1],
      rowClues,
      columnClues,
      result: match[4],
    };
  }

  protected formatNonogramClue(clue: string): string {
    return clue.replaceAll('·', ' · ');
  }

  private parseFleetLine(text: string): Extract<DisplayBlock, { type: 'fleet' }> | null {
    const match = text.match(
      /^(?:(Exemple \d+|[ABCD])\s+)?L:([0-9]+(?:,[0-9]+){3})\s+C:([0-9]+(?:,[0-9]+){3})\s+→\s*([?\d])$/,
    );

    if (!match) {
      return null;
    }

    const result = match[4];

    return {
      type: 'fleet',
      label: match[1],
      rowTotals: match[2].split(','),
      columnTotals: match[3].split(','),
      result,
      interactive: result === '?',
      solution:
        result === '?'
          ? undefined
          : this.solveFleet(match[2].split(','), match[3].split(','), Number(result)),
    };
  }

  private solveFleet(
    rowTotals: string[],
    columnTotals: string[],
    isolatedColumn: number,
  ): number[] | undefined {
    const expectedRows = rowTotals.map(Number);
    const expectedColumns = columnTotals.map(Number);

    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const first = this.fleetCellIndex(row, column);
        const neighbours = [
          [row, column + 1],
          [row + 1, column],
        ] as const;

        for (const [secondRow, secondColumn] of neighbours) {
          if (secondRow >= 4 || secondColumn >= 4) {
            continue;
          }

          const second = this.fleetCellIndex(secondRow, secondColumn);

          for (let singleRow = 0; singleRow < 4; singleRow += 1) {
            for (let singleColumn = 0; singleColumn < 4; singleColumn += 1) {
              if (singleColumn + 1 !== isolatedColumn) {
                continue;
              }

              const single = this.fleetCellIndex(singleRow, singleColumn);

              if (
                single === first ||
                single === second ||
                this.fleetCellsTouch(single, first) ||
                this.fleetCellsTouch(single, second)
              ) {
                continue;
              }

              const actualRows = [0, 0, 0, 0];
              const actualColumns = [0, 0, 0, 0];

              for (const cell of [first, second, single]) {
                const cellRow = Math.floor(cell / 4);
                const cellColumn = cell % 4;
                actualRows[cellRow] += 1;
                actualColumns[cellColumn] += 1;
              }

              if (
                actualRows.every((value, index) => value === expectedRows[index]) &&
                actualColumns.every((value, index) => value === expectedColumns[index])
              ) {
                return [first, second, single].sort((left, right) => left - right);
              }
            }
          }
        }
      }
    }

    return undefined;
  }

  private fleetCellsTouch(first: number, second: number): boolean {
    const firstRow = Math.floor(first / 4);
    const firstColumn = first % 4;
    const secondRow = Math.floor(second / 4);
    const secondColumn = second % 4;

    return Math.abs(firstRow - secondRow) <= 1 && Math.abs(firstColumn - secondColumn) <= 1;
  }

  private fleetSelectionKey(puzzleId: string, label: string | undefined): string {
    return `${puzzleId}:${label ?? ''}`;
  }

  private hitoriSelectionKey(puzzleId: string, label: string | undefined): string {
    return `${puzzleId}:${label ?? ''}`;
  }

  private parseDiagram(
    lines: string[],
    startIndex: number,
    puzzleId: string,
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
        ...this.classifyDiagram(diagramLines, result, puzzleId),
      },
      endIndex: resultIndex,
    };
  }

  private classifyDiagram(
    lines: string[],
    result: string,
    puzzleId: string,
  ): {
    kind: DiagramKind;
    grid?: string[][];
    paths?: DiagramPath[];
    graph?: DiagramGraph;
    intervals?: DiagramInterval[];
    sequence?: string[][];
    interactive?: boolean;
  } {
    const grid = this.parseLooseGrid(lines);

    if (grid) {
      return {
        kind: puzzleId === 'nouveaux-71-suppression-interdite' ? 'hitori' : 'grid',
        grid,
        interactive: puzzleId === 'nouveaux-71-suppression-interdite' && result === '?',
      };
    }

    const graph = this.parseGraph(lines);

    if (graph) {
      return { kind: 'graph', graph };
    }

    const paths = this.parseWeightedPaths(lines);

    if (paths) {
      return { kind: 'paths', paths };
    }

    const intervals = this.parseIntervals(lines);

    if (intervals) {
      return { kind: 'intervals', intervals };
    }

    const sequence = this.parseSequence(lines);

    if (sequence) {
      return { kind: 'sequence', sequence };
    }

    return { kind: 'lines' };
  }

  private parseLooseGrid(lines: string[]): string[][] | null {
    const spacedRows = lines.map((line) => line.trim().split(/\s+/).filter(Boolean));
    const spacedColumnCount = spacedRows[0]?.length ?? 0;

    if (
      spacedColumnCount >= 2 &&
      spacedRows.every(
        (row) => row.length === spacedColumnCount && row.every((cell) => this.isDiagramGridToken(cell)),
      )
    ) {
      return spacedRows;
    }

    const compactRows = lines.map((line) => [...line.trim()]);
    const compactColumnCount = compactRows[0]?.length ?? 0;

    if (
      compactColumnCount >= 2 &&
      compactRows.every(
        (row) =>
          row.length === compactColumnCount && row.every((cell) => this.isDiagramGridToken(cell)),
      )
    ) {
      return compactRows;
    }

    return null;
  }

  private isDiagramGridToken(value: string): boolean {
    return /^[?0-9A-Za-z·.#oOxX■●○□▣▤▱▲△◆◇◯◉▪▫◦▁▂▃▄▅▆▇]+$/.test(value);
  }

  private parseGraph(lines: string[]): DiagramGraph | null {
    const verticesLine = lines.find((line) => /^Sommets\s*:/i.test(line.trim()));
    const edgesLine = lines.find((line) => /^Arêtes\s*:/i.test(line.trim()));

    if (!verticesLine || !edgesLine) {
      return null;
    }

    const vertices = verticesLine
      .replace(/^Sommets\s*:\s*/i, '')
      .split(/\s+/)
      .filter(Boolean);
    const edges = edgesLine
      .replace(/^Arêtes\s*:\s*/i, '')
      .split(/\s*·\s*/)
      .map((edge) => edge.trim())
      .filter(Boolean);

    return vertices.length > 0 && edges.length > 0 ? { vertices, edges } : null;
  }

  private parseWeightedPaths(lines: string[]): DiagramPath[] | null {
    if (!lines.every((line) => /^[A-Z]/.test(line.trim()) && /─{2,}\d+─{2,}/.test(line))) {
      return null;
    }

    const paths = lines.map((line) => {
      const tokens = [...line.matchAll(/[A-Z]|\d+/g)].map((match) => match[0]);
      return {
        nodes: tokens.filter((token) => /^[A-Z]$/.test(token)),
        weights: tokens.filter((token) => /^\d+$/.test(token)),
      };
    });

    return paths.every((path) => path.nodes.length >= 2 && path.weights.length > 0) ? paths : null;
  }

  private parseIntervals(lines: string[]): DiagramInterval[] | null {
    const intervals = lines.map((line) =>
      line
        .trim()
        .match(/^(\d+)\s*:\s*\[\s*(-?\d+)\s*;\s*(-?\d+)\s*\]$/),
    );

    if (intervals.some((match) => !match)) {
      return null;
    }

    return intervals.map((match) => ({
      label: match![1],
      start: Number(match![2]),
      end: Number(match![3]),
    }));
  }

  private parseSequence(lines: string[]): string[][] | null {
    if (!lines.some((line) => line.includes('→'))) {
      return null;
    }

    return lines.map((line) =>
      line
        .split('→')
        .map((stage) => stage.trim())
        .filter(Boolean),
    );
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

  protected puzzleRule(puzzle: PuzzleACadenasEntry): string | null {
    const rule = [
      /,\s*puis\s+lis(?:\s+le)?\s+(?:code[^.]*|A\s+à\s+D|les\s+quatre\s+cases\s+finales|la\s+chaise[^.]*|le\s+chiffre[^.]*|la\s+case[^.]*)\.?$/i,
      /\s+(?:,?\s*)?(?:puis\s+)?lis\s+(?:le\s+)?(?:code[^.]*|A\s+à\s+D|les\s+quatre\s+cases\s+finales|la\s+chaise[^.]*|le\s+chiffre[^.]*|la\s+case[^.]*|la\s+position[^.]*|la\s+valeur[^.]*|la\s+face[^.]*|le\s+reste[^.]*|bas\s+à\s+droite[^.]*|x\s+modulo[^.]*)\.?$/i,
      /,\s*puis\s+lis-le\s+directement\.?$/i,
      /;\s*son\s+numéro\s+constitue\s+la\s+réponse\.?$/i,
      /\s*(?:Pour\s+chaque\s+grille,\s*)?(?:Le|La)\s+[^.!?]*(?:est|constitue|donne|forme)\s+(?:le|la)\s+(?:chiffre|code|réponse|résultat|numéro|colonne|position|valeur)\b[^.!?]*[.!?]?$/i,
      /\s+(?:Le|La)\s+(?:résultat|code|chiffre|nombre|réponse)\b[^.!?]*[.!?]?$/i,
      /\s+(?:,\s*)?(?:puis\s+)?(?:garde|retiens|conserve)\s+(?:seulement\s+)?[^.!?]*(?:chiffre|unité|longueur|position|valeur|résultat|réponse)[^.!?]*[.!?]?$/i,
    ].reduce((value, pattern) => value.replace(pattern, ''), puzzle.instructions.trim());

    const cleanedRule = rule.trim();

    if (
      !cleanedRule ||
      /^(?:Le\s+code|Le\s+résultat|La\s+réponse|Le\s+chiffre\s+à\s+extraire|Lis\s+(?:le\s+)?(?:la\s+case|la\s+position|la\s+valeur|le\s+reste|la\s+face|bas\s+à\s+droite|x\s+modulo)|Garde\s+(?:le|la)\s+)/i.test(
        cleanedRule,
      )
    ) {
      return null;
    }

    return /[.!?]$/.test(cleanedRule) ? cleanedRule : `${cleanedRule}.`;
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

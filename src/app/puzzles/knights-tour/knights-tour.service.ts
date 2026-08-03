import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecentRandomPicker } from '../shared/recent-random-picker';

export type KnightTourPosition = {
  row: number;
  col: number;
};

export type KnightTourCell = KnightTourPosition & {
  letter: string;
  blocked: boolean;
};

export type KnightTourPuzzle = {
  size: number;
  grid: KnightTourCell[][];
  path: KnightTourPosition[];
  word: string;
  normalizedWord: string;
};

export type ClassicKnightTourPuzzle = {
  size: number;
  path: KnightTourPosition[];
};

type CandidateWord = {
  answer: string;
  normalizedAnswer: string;
};

type Direction = KnightTourPosition;

@Injectable({
  providedIn: 'root',
})
export class KnightsTourService {
  private readonly http = inject(HttpClient);
  private readonly recentWords = new RecentRandomPicker<CandidateWord>(30);
  private readonly size = 7;
  private readonly minimumWordLength = 6;
  private readonly maximumWordLength = 9;
  private readonly decoyCellCount = 20;
  private readonly minimumAvailableMoveCount = 2;
  private readonly minimumOpenCellCount = 32;
  private readonly maximumGenerationAttempts = 500;
  private readonly knightDirections: Direction[] = [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 },
  ];

  private words: CandidateWord[] = [];

  async loadWords(): Promise<void> {
    if (this.words.length > 0) {
      return;
    }

    const text = await firstValueFrom(
      this.http.get('words.txt', {
        responseType: 'text',
      }),
    );

    const wordsByKey = new Map<string, CandidateWord>();

    for (const answer of text
      .split(/\r?\n/)
      .map((word) => word.trim())
      .filter(Boolean)) {
      const normalizedAnswer = this.normalize(answer);

      if (
        !/^[A-Z]+$/.test(normalizedAnswer) ||
        normalizedAnswer.length < this.minimumWordLength ||
        normalizedAnswer.length > this.maximumWordLength ||
        wordsByKey.has(normalizedAnswer)
      ) {
        continue;
      }

      wordsByKey.set(normalizedAnswer, {
        answer,
        normalizedAnswer,
      });
    }

    if (wordsByKey.size === 0) {
      throw new Error('The knight tour word list is empty.');
    }

    this.words = [...wordsByKey.values()];
  }

  createPuzzle(): KnightTourPuzzle {
    if (this.words.length === 0) {
      throw new Error('Knight tour words have not been loaded yet.');
    }

    for (let attempt = 0; attempt < this.maximumGenerationAttempts; attempt += 1) {
      const word = this.recentWords.pick(this.words, (candidate) => candidate.normalizedAnswer);
      const path = this.createPath(word.normalizedAnswer.length);

      if (!path) {
        continue;
      }

      const puzzle = this.createPuzzleCandidate(word, path);

      if (puzzle) {
        return puzzle;
      }
    }

    throw new Error('Unable to create a knight tour puzzle.');
  }

  createClassicPuzzle(size: number): ClassicKnightTourPuzzle {
    if (![5, 6, 7, 8, 9].includes(size)) {
      throw new Error('Classic knight tour grids must be between 5 and 9 squares.');
    }

    const targetLength = size * size;

    for (let attempt = 0; attempt < 200; attempt += 1) {
      for (const start of this.shuffle(this.allPositions(size))) {
        const path = this.createGreedyClassicPath(start, size, targetLength);

        if (path) {
          return { size, path };
        }
      }
    }

    throw new Error('Unable to create a classic knight tour.');
  }

  normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase();
  }

  getLegalMoves(
    puzzle: KnightTourPuzzle,
    path: readonly KnightTourPosition[],
  ): KnightTourPosition[] {
    const currentPosition = path.at(-1);

    if (!currentPosition) {
      return [];
    }

    const visitedKeys = new Set(path.map((position) => this.positionKey(position)));

    return this.getKnightMoves(currentPosition).filter(
      (position) =>
        !visitedKeys.has(this.positionKey(position)) &&
        !puzzle.grid[position.row][position.col].blocked,
    );
  }

  getClassicLegalMoves(
    puzzle: ClassicKnightTourPuzzle,
    path: readonly KnightTourPosition[],
  ): KnightTourPosition[] {
    const currentPosition = path.at(-1);

    if (!currentPosition) {
      return [];
    }

    const visitedKeys = new Set(path.map((position) => this.positionKey(position)));

    return this.getKnightMoves(currentPosition, puzzle.size).filter(
      (position) => !visitedKeys.has(this.positionKey(position)),
    );
  }

  isKnightMove(first: KnightTourPosition, second: KnightTourPosition): boolean {
    const rowDistance = Math.abs(first.row - second.row);
    const columnDistance = Math.abs(first.col - second.col);

    return (
      (rowDistance === 2 && columnDistance === 1) || (rowDistance === 1 && columnDistance === 2)
    );
  }

  isCorrectNextMove(
    puzzle: KnightTourPuzzle,
    path: readonly KnightTourPosition[],
    candidate: KnightTourPosition,
  ): boolean {
    const expectedPosition = puzzle.path[path.length];

    return expectedPosition !== undefined && this.samePosition(expectedPosition, candidate);
  }

  isSolutionPath(
    puzzle: { path: readonly KnightTourPosition[] },
    path: readonly KnightTourPosition[],
  ): boolean {
    return (
      path.length === puzzle.path.length &&
      path.every((position, index) => this.samePosition(position, puzzle.path[index]))
    );
  }

  positionKey(position: KnightTourPosition): string {
    return `${position.row}:${position.col}`;
  }

  positionsForSize(size: number): KnightTourPosition[] {
    return this.allPositions(size);
  }

  private createPuzzleCandidate(
    word: CandidateWord,
    path: KnightTourPosition[],
  ): KnightTourPuzzle | null {
    const requiredDecoyPositions = this.getRequiredDecoyPositions(path);

    if (!requiredDecoyPositions) {
      return null;
    }

    const openKeys = this.createOpenKeys(path, requiredDecoyPositions);

    if (!openKeys) {
      return null;
    }

    const grid = Array.from({ length: this.size }, (_, row) =>
      Array.from({ length: this.size }, (_, col) => {
        const isOpen = openKeys.has(this.positionKey({ row, col }));

        return {
          row,
          col,
          letter: isOpen ? this.randomLetter() : '',
          blocked: !isOpen,
        };
      }),
    );

    path.forEach((position, index) => {
      grid[position.row][position.col].letter = word.normalizedAnswer[index];
    });

    const puzzle: KnightTourPuzzle = {
      size: this.size,
      grid,
      path,
      word: word.answer,
      normalizedWord: word.normalizedAnswer,
    };

    if (
      this.countMatchingPaths(puzzle, 2) !== 1 ||
      !this.hasEnoughOptionsAtEveryStep(puzzle) ||
      !this.hasEnoughOpenMovesForEveryCell(puzzle) ||
      !this.hasDecoyMove(puzzle)
    ) {
      return null;
    }

    return puzzle;
  }

  private createOpenKeys(
    path: readonly KnightTourPosition[],
    requiredDecoyPositions: readonly KnightTourPosition[],
  ): Set<string> | null {
    const protectedKeys = new Set([
      ...path.map((position) => this.positionKey(position)),
      ...requiredDecoyPositions.map((position) => this.positionKey(position)),
    ]);
    const targetOpenCellCount = Math.max(
      this.minimumOpenCellCount,
      path.length + this.decoyCellCount,
    );
    const allPositions = this.allPositions();
    let bestOpenKeys: Set<string> | null = null;

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const openKeys = new Set(allPositions.map((position) => this.positionKey(position)));

      while (openKeys.size > targetOpenCellCount) {
        const removablePosition = this.shuffle(allPositions)
          .filter(
            (position) =>
              openKeys.has(this.positionKey(position)) &&
              !protectedKeys.has(this.positionKey(position)),
          )
          .find((position) => this.canRemoveOpenPosition(position, openKeys));

        if (!removablePosition) {
          break;
        }

        openKeys.delete(this.positionKey(removablePosition));
      }

      if (!bestOpenKeys || openKeys.size < bestOpenKeys.size) {
        bestOpenKeys = openKeys;
      }

      if (openKeys.size <= targetOpenCellCount) {
        return openKeys;
      }
    }

    return bestOpenKeys;
  }

  private canRemoveOpenPosition(position: KnightTourPosition, openKeys: Set<string>): boolean {
    const removedKey = this.positionKey(position);

    return this.getKnightMoves(position)
      .filter((neighbor) => openKeys.has(this.positionKey(neighbor)))
      .every((neighbor) => {
        const neighborKey = this.positionKey(neighbor);

        return (
          this.getKnightMoves(neighbor).filter(
            (candidate) =>
              this.positionKey(candidate) !== removedKey &&
              openKeys.has(this.positionKey(candidate)),
          ).length >= this.minimumAvailableMoveCount
        );
      });
  }

  private getRequiredDecoyPositions(
    path: readonly KnightTourPosition[],
  ): KnightTourPosition[] | null {
    const pathKeys = new Set(path.map((position) => this.positionKey(position)));
    const requiredDecoys = new Map<string, KnightTourPosition>();

    for (let index = 0; index < path.length - 1; index += 1) {
      const currentPosition = path[index];

      if (!currentPosition) {
        return null;
      }

      const visitedKeys = new Set(
        path.slice(0, index + 1).map((position) => this.positionKey(position)),
      );
      const candidates = this.getKnightMoves(currentPosition).filter(
        (position) => !visitedKeys.has(this.positionKey(position)),
      );

      if (candidates.length < this.minimumAvailableMoveCount) {
        return null;
      }

      const availableKeys = new Set(
        candidates
          .filter(
            (position) =>
              pathKeys.has(this.positionKey(position)) ||
              requiredDecoys.has(this.positionKey(position)),
          )
          .map((position) => this.positionKey(position)),
      );

      for (const candidate of this.shuffle(candidates)) {
        if (availableKeys.size >= this.minimumAvailableMoveCount) {
          break;
        }

        const candidateKey = this.positionKey(candidate);

        if (pathKeys.has(candidateKey) || requiredDecoys.has(candidateKey)) {
          continue;
        }

        requiredDecoys.set(candidateKey, candidate);
        availableKeys.add(candidateKey);
      }

      if (availableKeys.size < this.minimumAvailableMoveCount) {
        return null;
      }
    }

    return [...requiredDecoys.values()];
  }

  private hasEnoughOptionsAtEveryStep(puzzle: KnightTourPuzzle): boolean {
    return puzzle.path.slice(0, -1).every((_position, index) => {
      const currentPath = puzzle.path.slice(0, index + 1);

      return this.getLegalMoves(puzzle, currentPath).length >= this.minimumAvailableMoveCount;
    });
  }

  private hasEnoughOpenMovesForEveryCell(puzzle: KnightTourPuzzle): boolean {
    return puzzle.grid.flat().every((cell) => {
      if (cell.blocked) {
        return true;
      }

      const openMoves = this.getKnightMoves(cell).filter(
        (position) => !puzzle.grid[position.row][position.col].blocked,
      );

      return openMoves.length >= this.minimumAvailableMoveCount;
    });
  }

  private createPath(length: number): KnightTourPosition[] | null {
    const starts = this.shuffle(this.allPositions());

    for (const start of starts) {
      const path = [start];
      const visitedKeys = new Set([this.positionKey(start)]);

      if (this.extendPath(path, visitedKeys, length)) {
        return path;
      }
    }

    return null;
  }

  private createGreedyClassicPath(
    start: KnightTourPosition,
    boardSize: number,
    targetLength: number,
  ): KnightTourPosition[] | null {
    const path = [start];
    const visitedKeys = new Set([this.positionKey(start)]);

    while (path.length < targetLength) {
      const currentPosition = path.at(-1);

      if (!currentPosition) {
        return null;
      }

      const candidates = this.getKnightMoves(currentPosition, boardSize).filter(
        (position) => !visitedKeys.has(this.positionKey(position)),
      );

      if (candidates.length === 0) {
        return null;
      }

      const minimumDegree = Math.min(
        ...candidates.map((position) => this.unvisitedMoveCount(position, visitedKeys, boardSize)),
      );
      const bestCandidates = this.shuffle(candidates).filter(
        (position) => this.unvisitedMoveCount(position, visitedKeys, boardSize) === minimumDegree,
      );
      const nextPosition = bestCandidates[0];

      if (!nextPosition) {
        return null;
      }

      path.push(nextPosition);
      visitedKeys.add(this.positionKey(nextPosition));
    }

    return path;
  }

  private extendPath(
    path: KnightTourPosition[],
    visitedKeys: Set<string>,
    targetLength: number,
    boardSize = this.size,
  ): boolean {
    if (path.length === targetLength) {
      return true;
    }

    const currentPosition = path.at(-1);

    if (!currentPosition) {
      return false;
    }

    const candidates = this.shuffle(this.getKnightMoves(currentPosition, boardSize))
      .filter((position) => !visitedKeys.has(this.positionKey(position)))
      .sort(
        (first, second) =>
          this.unvisitedMoveCount(first, visitedKeys, boardSize) -
          this.unvisitedMoveCount(second, visitedKeys, boardSize),
      );

    for (const candidate of candidates) {
      const candidateKey = this.positionKey(candidate);
      path.push(candidate);
      visitedKeys.add(candidateKey);

      if (this.extendPath(path, visitedKeys, targetLength, boardSize)) {
        return true;
      }

      path.pop();
      visitedKeys.delete(candidateKey);
    }

    return false;
  }

  private getKnightMoves(
    position: KnightTourPosition,
    boardSize = this.size,
  ): KnightTourPosition[] {
    return this.knightDirections
      .map((direction) => ({
        row: position.row + direction.row,
        col: position.col + direction.col,
      }))
      .filter((candidate) => this.isInside(candidate, boardSize));
  }

  private unvisitedMoveCount(
    position: KnightTourPosition,
    visitedKeys: Set<string>,
    boardSize = this.size,
  ): number {
    return this.getKnightMoves(position, boardSize).filter(
      (candidate) => !visitedKeys.has(this.positionKey(candidate)),
    ).length;
  }

  private countMatchingPaths(puzzle: KnightTourPuzzle, limit: number): number {
    const target = puzzle.normalizedWord;
    const start = puzzle.path[0];

    if (!start || puzzle.grid[start.row][start.col].letter !== target[0]) {
      return 0;
    }

    const visitedKeys = new Set([this.positionKey(start)]);

    const countFrom = (current: KnightTourPosition, letterIndex: number): number => {
      if (letterIndex === target.length - 1) {
        return 1;
      }

      let count = 0;
      const expectedLetter = target[letterIndex + 1];

      for (const candidate of this.getKnightMoves(current)) {
        const candidateKey = this.positionKey(candidate);

        if (
          visitedKeys.has(candidateKey) ||
          puzzle.grid[candidate.row][candidate.col].blocked ||
          puzzle.grid[candidate.row][candidate.col].letter !== expectedLetter
        ) {
          continue;
        }

        visitedKeys.add(candidateKey);
        count += countFrom(candidate, letterIndex + 1);
        visitedKeys.delete(candidateKey);

        if (count >= limit) {
          return count;
        }
      }

      return count;
    };

    return countFrom(start, 0);
  }

  private hasDecoyMove(puzzle: KnightTourPuzzle): boolean {
    return puzzle.path.some((position, index) => {
      const solutionNextPosition = puzzle.path[index + 1];
      const visitedKeys = new Set(
        puzzle.path.slice(0, index + 1).map((visitedPosition) => this.positionKey(visitedPosition)),
      );

      return this.getKnightMoves(position).some((candidate) => {
        const candidateKey = this.positionKey(candidate);

        return (
          !visitedKeys.has(candidateKey) &&
          !puzzle.grid[candidate.row][candidate.col].blocked &&
          (!solutionNextPosition || !this.samePosition(candidate, solutionNextPosition))
        );
      });
    });
  }

  private samePosition(first: KnightTourPosition, second: KnightTourPosition): boolean {
    return first.row === second.row && first.col === second.col;
  }

  private allPositions(boardSize = this.size): KnightTourPosition[] {
    return Array.from({ length: boardSize * boardSize }, (_, index) => ({
      row: Math.floor(index / boardSize),
      col: index % boardSize,
    }));
  }

  private isInside(position: KnightTourPosition, boardSize = this.size): boolean {
    return (
      position.row >= 0 && position.col >= 0 && position.row < boardSize && position.col < boardSize
    );
  }

  private randomLetter(): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    return alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  private shuffle<T>(items: readonly T[]): T[] {
    const shuffledItems = [...items];

    for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledItems[index], shuffledItems[swapIndex]] = [
        shuffledItems[swapIndex],
        shuffledItems[index],
      ];
    }

    return shuffledItems;
  }
}

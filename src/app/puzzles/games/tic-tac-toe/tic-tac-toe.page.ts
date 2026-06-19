import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../../shared/puzzle-success-popup/puzzle-success-popup.component';

type Mark = 'X' | 'O';
type Cell = Mark | null;
type Player = 'human' | 'cpu';

type Move = {
  from: number;
  to: number;
};

const STARTING_BOARD: Cell[] = ['X', 'O', 'X', null, null, null, 'O', 'X', 'O'];
const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

@Component({
  selector: 'app-tic-tac-toe-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './tic-tac-toe.page.html',
  styleUrl: './tic-tac-toe.page.scss',
})
export class TicTacToePage {
  protected readonly cells = Array.from({ length: 9 }, (_, index) => index);
  protected readonly board = signal<Cell[]>([...STARTING_BOARD]);
  protected readonly turn = signal<Player>(this.randomPlayer());
  protected readonly winner = signal<Player | null>(null);
  protected readonly selectedCell = signal<number | null>(null);
  protected readonly cpuThinking = signal(false);

  protected readonly isHumanTurn = computed(
    () => this.turn() === 'human' && !this.winner() && !this.cpuThinking(),
  );
  protected readonly statusText = computed(() => {
    if (this.winner() === 'human') return 'Tes trois X sont alignés.';
    if (this.winner() === 'cpu') return 'Le CPU a aligné ses trois O.';
    if (this.cpuThinking()) return 'Le CPU réfléchit…';
    if (this.selectedCell() !== null) return 'Choisis une case vide.';
    return 'À toi de jouer : choisis un X.';
  });

  constructor() {
    this.prepareTurn();
  }

  protected newGame(): void {
    this.board.set([...STARTING_BOARD]);
    this.turn.set(this.randomPlayer());
    this.winner.set(null);
    this.selectedCell.set(null);
    this.cpuThinking.set(false);
    this.prepareTurn();
  }

  protected playCell(index: number): void {
    if (!this.isHumanTurn()) return;

    const value = this.board()[index];

    if (value === 'X') {
      this.selectedCell.set(this.selectedCell() === index ? null : index);
      return;
    }

    const from = this.selectedCell();
    if (value !== null || from === null) return;

    this.makeMove({ from, to: index }, 'human');
  }

  protected cellLabel(index: number): string {
    const value = this.board()[index];
    if (value === 'X') return `Case ${index + 1}, ton pion X`;
    if (value === 'O') return `Case ${index + 1}, pion O du CPU`;
    return `Case ${index + 1}, vide`;
  }

  protected isDestination(index: number): boolean {
    return this.isHumanTurn() && this.selectedCell() !== null && this.board()[index] === null;
  }

  private prepareTurn(): void {
    if (this.turn() !== 'cpu' || this.winner()) return;

    this.cpuThinking.set(true);
    window.setTimeout(() => this.playCpuMove(), 650);
  }

  private playCpuMove(): void {
    if (this.turn() !== 'cpu' || this.winner()) return;

    const moves = this.legalMoves(this.board(), 'O');
    const scoreCache = new Map<string, number>();
    const ranked = moves
      .map((move) => ({ move, score: this.scoreMove(this.board(), move, scoreCache) }))
      .sort((a, b) => b.score - a.score);
    const bestScore = ranked[0]?.score;
    const bestMoves = ranked.filter(({ score }) => score === bestScore);
    const mistakes = ranked.filter(({ score }) => score < bestScore);
    const shouldMistake = mistakes.length > 0 && Math.random() < 1 / 20;
    const choices = shouldMistake ? mistakes : bestMoves;
    const choice = choices[Math.floor(Math.random() * choices.length)];

    this.cpuThinking.set(false);
    if (choice) this.makeMove(choice.move, 'cpu');
  }

  private makeMove(move: Move, player: Player): void {
    const mark: Mark = player === 'human' ? 'X' : 'O';
    const nextBoard = this.applyMove(this.board(), move, mark);

    this.board.set(nextBoard);
    this.selectedCell.set(null);

    if (this.hasWon(nextBoard, mark)) {
      this.winner.set(player);
      return;
    }

    this.turn.set(player === 'human' ? 'cpu' : 'human');
    this.prepareTurn();
  }

  private scoreMove(board: Cell[], move: Move, scoreCache: Map<string, number>): number {
    const next = this.applyMove(board, move, 'O');
    if (this.hasWon(next, 'O')) return 10_000;

    const humanWins = this.legalMoves(next, 'X').filter((humanMove) =>
      this.hasWon(this.applyMove(next, humanMove, 'X'), 'X'),
    ).length;
    const cpuThreats = this.countWinningMoves(next, 'O');

    return this.minimax(next, 'X', 7, scoreCache) - humanWins * 2_000 + cpuThreats * 120;
  }

  private minimax(
    board: Cell[],
    mark: Mark,
    depth: number,
    scoreCache: Map<string, number>,
  ): number {
    if (depth === 0) return this.evaluate(board);

    const key = `${board.map((cell) => cell ?? '-').join('')}:${mark}:${depth}`;
    const cachedScore = scoreCache.get(key);
    if (cachedScore !== undefined) return cachedScore;

    const moves = this.legalMoves(board, mark);
    const scores = moves.map((move) => {
      const next = this.applyMove(board, move, mark);
      if (this.hasWon(next, mark)) return mark === 'O' ? 5_000 + depth : -5_000 - depth;
      return this.minimax(next, mark === 'O' ? 'X' : 'O', depth - 1, scoreCache);
    });

    const score = mark === 'O' ? Math.max(...scores) : Math.min(...scores);
    scoreCache.set(key, score);
    return score;
  }

  private evaluate(board: Cell[]): number {
    return this.countWinningMoves(board, 'O') * 80 - this.countWinningMoves(board, 'X') * 100;
  }

  private countWinningMoves(board: Cell[], mark: Mark): number {
    return this.legalMoves(board, mark).filter((move) =>
      this.hasWon(this.applyMove(board, move, mark), mark),
    ).length;
  }

  private legalMoves(board: Cell[], mark: Mark): Move[] {
    const pieces = board.flatMap((cell, index) => (cell === mark ? [index] : []));
    const emptyCells = board.flatMap((cell, index) => (cell === null ? [index] : []));
    return pieces.flatMap((from) => emptyCells.map((to) => ({ from, to })));
  }

  private applyMove(board: Cell[], move: Move, mark: Mark): Cell[] {
    const next = [...board];
    next[move.from] = null;
    next[move.to] = mark;
    return next;
  }

  private hasWon(board: Cell[], mark: Mark): boolean {
    return WINNING_LINES.some((line) => line.every((index) => board[index] === mark));
  }

  private randomPlayer(): Player {
    return Math.random() < 0.5 ? 'human' : 'cpu';
  }
}

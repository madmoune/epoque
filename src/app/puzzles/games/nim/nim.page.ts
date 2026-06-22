import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../../shared/puzzle-success-popup/puzzle-success-popup.component';

type Player = 'human' | 'cpu';
type NimMode = 'game' | 'xor-challenge';
type ChallengeResult = 'success' | 'failure' | null;

type NimMove = {
  pileIndex: number;
  removeCount: number;
};

type PendingRemoval = NimMove & {
  player: Player;
};

@Component({
  selector: 'app-nim-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './nim.page.html',
  styleUrl: './nim.page.scss',
})
export class NimPage {
  protected readonly mode = signal<NimMode>('game');
  protected readonly piles = signal<number[]>(this.createPiles());
  protected readonly turn = signal<Player>(this.randomPlayer());
  protected readonly winner = signal<Player | null>(null);
  protected readonly hintVisible = signal(false);
  protected readonly lastMove = signal<string>('La partie commence.');
  protected readonly cpuThinking = signal(false);
  protected readonly pendingRemoval = signal<PendingRemoval | null>(null);
  protected readonly challengeResult = signal<ChallengeResult>(null);

  protected readonly nimSum = computed(() => this.calculateNimSum(this.piles()));
  protected readonly binaryWidth = computed(() =>
    Math.max(1, ...this.piles(), this.nimSum()).toString(2).length,
  );
  protected readonly binaryRows = computed(() =>
    this.piles().map((size) => ({
      size,
      binary: this.toBinary(size),
    })),
  );
  protected readonly nimSumBinary = computed(() => this.toBinary(this.nimSum()));
  protected readonly isHumanTurn = computed(
    () =>
      this.turn() === 'human' &&
      !this.winner() &&
      !this.challengeResult() &&
      !this.pendingRemoval(),
  );
  protected readonly bestMove = computed(() => this.findBestMove(this.piles()));
  protected readonly statusText = computed(() => {
    if (this.mode() === 'xor-challenge') {
      if (this.challengeResult() === 'success') return 'XOR ramené à zéro.';
      if (this.challengeResult() === 'failure') return 'La tentative est terminée.';
      if (this.pendingRemoval()) return 'Vérification du coup...';
      return 'Trouve le coup qui ramène le XOR à zéro.';
    }
    const winner = this.winner();

    if (winner === 'human') {
      return 'Partie terminée.';
    }

    if (winner === 'cpu') {
      return 'Partie terminée.';
    }

    if (this.cpuThinking()) {
      return 'Le CPU réfléchit...';
    }

    if (this.pendingRemoval()) {
      return this.pendingRemoval()?.player === 'human'
        ? 'Les pierres sont retirées...'
        : 'Le CPU retire des pierres...';
    }

    return this.turn() === 'human' ? 'À toi de jouer.' : 'Tour du CPU.';
  });
  protected readonly resultTitle = computed(() => {
    if (this.challengeResult() === 'success') return 'Bon coup!';
    if (this.challengeResult() === 'failure') return 'XOR non nul';
    const winner = this.winner();

    if (winner === 'human') {
      return 'Victoire!';
    }

    if (winner === 'cpu') {
      return 'Défaite';
    }

    return '';
  });
  protected readonly resultText = computed(() => {
    if (this.challengeResult() === 'success') {
      return 'Ce retrait ramène exactement la somme XOR à zéro.';
    }
    if (this.challengeResult() === 'failure') {
      return `Ce retrait laisse un XOR de ${this.nimSum()}. Essaie une nouvelle grille.`;
    }
    const winner = this.winner();

    if (winner === 'human') {
      return 'Tu as pris la dernière pierre et remporté la partie.';
    }

    if (winner === 'cpu') {
      return 'Le CPU a pris la dernière pierre. Il remporte cette manche.';
    }

    return '';
  });
  protected readonly hintText = computed(() => {
    const move = this.bestMove();

    if (!move) {
      return 'Aucun coup gagnant forcé ici. Retire peu et attends une erreur du CPU.';
    }

    const currentSize = this.piles()[move.pileIndex];
    const targetSize = currentSize - move.removeCount;

    return `Dans le tas de ${currentSize} pierres, retire ${move.removeCount} pierre${move.removeCount > 1 ? 's' : ''} pour en laisser ${targetSize}.`;
  });
  protected readonly hintFormula = computed(() => {
    const move = this.bestMove();

    if (!move) {
      return null;
    }

    const currentSize = this.piles()[move.pileIndex];
    const targetSize = currentSize - move.removeCount;

    return `${currentSize} XOR ${this.nimSum()} = ${targetSize}`;
  });

  constructor() {
    this.prepareTurn();
  }

  protected newGame(): void {
    const piles =
      this.mode() === 'xor-challenge' ? this.createChallengePiles() : this.createPiles();
    const starter: Player = this.mode() === 'xor-challenge' ? 'human' : this.randomPlayer();

    this.piles.set(piles);
    this.turn.set(starter);
    this.winner.set(null);
    this.hintVisible.set(false);
    this.cpuThinking.set(false);
    this.pendingRemoval.set(null);
    this.challengeResult.set(null);
    this.lastMove.set(
      this.mode() === 'xor-challenge'
        ? 'Tu as une seule tentative.'
        : starter === 'human'
          ? 'Tu commences.'
          : 'Le CPU commence.',
    );
    this.prepareTurn();
  }

  protected setMode(mode: NimMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.newGame();
  }

  protected playStone(pileIndex: number, stoneIndex: number, event?: Event): void {
    event?.preventDefault();

    if (!this.isHumanTurn() || this.piles()[pileIndex] <= 0) {
      return;
    }

    this.animateMove(
      {
        pileIndex,
        removeCount: this.piles()[pileIndex] - stoneIndex,
      },
      'human',
    );
  }

  protected showHint(): void {
    this.hintVisible.set(true);
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  protected stonesFor(pile: number): number[] {
    return Array.from({ length: pile }, (_, index) => index);
  }

  protected isHintStone(pileIndex: number, stoneIndex: number): boolean {
    const move = this.bestMove();

    return (
      this.hintVisible() &&
      Boolean(move) &&
      move?.pileIndex === pileIndex &&
      stoneIndex === this.piles()[pileIndex] - move.removeCount
    );
  }

  protected isRemovingStone(pileIndex: number, stoneIndex: number): boolean {
    const removal = this.pendingRemoval();

    if (!removal || removal.pileIndex !== pileIndex) {
      return false;
    }

    return stoneIndex >= this.piles()[pileIndex] - removal.removeCount;
  }

  private prepareTurn(): void {
    if (this.mode() === 'xor-challenge' || this.turn() !== 'cpu' || this.winner()) {
      return;
    }

    this.cpuThinking.set(true);

    window.setTimeout(() => {
      this.playCpuMove();
    }, 650);
  }

  private playCpuMove(): void {
    if (this.turn() !== 'cpu' || this.winner()) {
      return;
    }

    const bestMove = this.findBestMove(this.piles());
    const shouldMakeMistake = Boolean(bestMove) && Math.random() < 0.1;
    const move =
      shouldMakeMistake
        ? this.findMistakeMove(this.piles(), bestMove) ?? bestMove
        : bestMove ?? this.findRandomMove(this.piles());

    this.cpuThinking.set(false);

    if (!move) {
      return;
    }

    this.animateMove(move, 'cpu', shouldMakeMistake);
  }

  private animateMove(move: NimMove, player: Player, wasCpuMistake = false): void {
    if (this.pendingRemoval()) {
      return;
    }

    this.pendingRemoval.set({ ...move, player });

    window.setTimeout(() => {
      this.applyMove(move, player, wasCpuMistake);
      this.pendingRemoval.set(null);
    }, 900);
  }

  private applyMove(move: NimMove, player: Player, wasCpuMistake = false): void {
    const nextPiles = this.piles().map((pile, index) =>
      index === move.pileIndex ? pile - move.removeCount : pile,
    );

    this.piles.set(nextPiles);
    this.hintVisible.set(false);
    this.lastMove.set(this.describeMove(move, player, wasCpuMistake));

    if (this.mode() === 'xor-challenge') {
      const result: ChallengeResult = this.calculateNimSum(nextPiles) === 0 ? 'success' : 'failure';
      this.challengeResult.set(result);
      this.lastMove.set(
        result === 'success'
          ? 'Excellent: ton coup produit un XOR de 0.'
          : `Ce coup produit un XOR de ${this.calculateNimSum(nextPiles)}.`,
      );
      return;
    }

    if (nextPiles.every((pile) => pile === 0)) {
      this.winner.set(player);
      return;
    }

    this.turn.set(player === 'human' ? 'cpu' : 'human');
    this.prepareTurn();
  }

  private describeMove(move: NimMove, player: Player, wasCpuMistake: boolean): string {
    const actor = player === 'human' ? 'Tu as retiré' : 'Le CPU a retiré';
    const suffix = wasCpuMistake ? ' Il a laissé une ouverture.' : '';

    return `${actor} ${move.removeCount} pierre${move.removeCount > 1 ? 's' : ''}.${suffix}`;
  }

  private findBestMove(piles: number[]): NimMove | null {
    const nimSum = this.calculateNimSum(piles);

    if (nimSum === 0) {
      return null;
    }

    for (let pileIndex = 0; pileIndex < piles.length; pileIndex += 1) {
      const targetSize = piles[pileIndex] ^ nimSum;

      if (targetSize < piles[pileIndex]) {
        return {
          pileIndex,
          removeCount: piles[pileIndex] - targetSize,
        };
      }
    }

    return null;
  }

  private findMistakeMove(piles: number[], bestMove: NimMove | null): NimMove | null {
    const moves = this.findLegalMoves(piles).filter((move) => {
      if (
        bestMove &&
        move.pileIndex === bestMove.pileIndex &&
        move.removeCount === bestMove.removeCount
      ) {
        return false;
      }

      const nextPiles = piles.map((pile, index) =>
        index === move.pileIndex ? pile - move.removeCount : pile,
      );

      return nextPiles.some((pile) => pile > 0) && this.calculateNimSum(nextPiles) !== 0;
    });

    return moves.length > 0 ? moves[this.randomInt(0, moves.length - 1)] : null;
  }

  private findRandomMove(piles: number[]): NimMove | null {
    const moves = this.findLegalMoves(piles);

    return moves.length > 0 ? moves[this.randomInt(0, moves.length - 1)] : null;
  }

  private findLegalMoves(piles: number[]): NimMove[] {
    return piles.flatMap((pile, pileIndex) =>
      Array.from({ length: pile }, (_, index) => ({
        pileIndex,
        removeCount: pile - index,
      })),
    );
  }

  private calculateNimSum(piles: number[]): number {
    return piles.reduce((nimSum, pile) => nimSum ^ pile, 0);
  }

  private toBinary(value: number): string {
    return value.toString(2).padStart(this.binaryWidth(), '0');
  }

  private createPiles(): number[] {
    const pileCount = this.randomInt(3, 5);

    return Array.from({ length: pileCount }, () => this.randomInt(4, 12));
  }

  private createChallengePiles(): number[] {
    let piles = this.createPiles();
    while (this.calculateNimSum(piles) === 0) piles = this.createPiles();
    return piles;
  }

  private randomPlayer(): Player {
    return Math.random() < 0.5 ? 'human' : 'cpu';
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

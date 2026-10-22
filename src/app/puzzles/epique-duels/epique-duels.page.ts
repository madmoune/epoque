import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BOARD_CELLS,
  DominoMove,
  IsolaMove,
  IsolaState,
  NimEmissionMove,
  NimEmissionState,
  Player,
  SIM_EDGES,
  SIM_POINTS,
  SimEdge,
  applyDomineeringMove,
  applyIsolaMove,
  applyNimEmissionMove,
  applyWythoffMove,
  cellColumn,
  cellRow,
  chooseDomineeringMove,
  chooseHexCell,
  chooseIsolaMove,
  chooseNimEmissionMove,
  chooseSimEdge,
  chooseWythoffMove,
  domineeringMoves,
  hexAdjacentCells,
  hexHasConnection,
  isolaMovableCells,
  isolaMoves,
  nimEmissionMoves,
  otherPlayer,
  simHasTriangle,
  wythoffMoves,
} from './epique-duels.logic';
import { EPIQUE_DUELS, EpiqueGameId } from './epique-duels.catalog';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type DuelMode = 'cpu' | 'local';
type IsolaStep = 'move' | 'block';

type DominoBoard = {
  owners: (0 | Player)[];
};

const WYTHOFF_PRESETS: Array<[number, number]> = [
  [7, 10],
  [8, 13],
  [10, 14],
  [12, 9],
];

function createIsolaState(): IsolaState {
  return {
    blocked: Array.from({ length: BOARD_CELLS.length }, () => false),
    positions: { 1: 10, 2: 14 },
  };
}

function createSimEdges(): SimEdge[] {
  return SIM_EDGES.map((edge) => ({ ...edge, owner: 0 as const }));
}

function createHexCells(): (0 | Player)[] {
  return Array.from({ length: BOARD_CELLS.length }, () => 0 as 0 | Player);
}

@Component({
  selector: 'app-epique-duels-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './epique-duels.page.html',
  styleUrl: './epique-duels.page.scss',
})
export class EpiqueDuelsPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private cpuTimer: number | null = null;
  private gameSerial = 0;
  private round = 0;

  protected readonly id = this.route.snapshot.data['game'] as EpiqueGameId;
  protected readonly game = EPIQUE_DUELS.find((candidate) => candidate.id === this.id)!;
  protected readonly allGames = EPIQUE_DUELS;
  protected readonly boardCells = BOARD_CELLS;
  protected readonly pileIndices = [0, 1];
  protected readonly simPoints = SIM_POINTS;
  protected readonly simEdges = SIM_EDGES;

  protected readonly mode = signal<DuelMode>('cpu');
  protected readonly turn = signal<Player>(1);
  protected readonly winner = signal<Player | null>(null);
  protected readonly resultReason = signal('');
  protected readonly cpuThinking = signal(false);

  protected readonly wythoff = signal<[number, number]>([7, 10]);
  protected readonly nimEmission = signal<NimEmissionState>({
    flags: 20,
    maxRemoval: 3,
    lastFlagLoses: false,
  });
  protected readonly isola = signal<IsolaState>(createIsolaState());
  protected readonly isolaStep = signal<IsolaStep>('move');
  protected readonly selectedIsolaDestination = signal<number | null>(null);
  protected readonly domineering = signal<DominoBoard>({
    owners: Array.from({ length: BOARD_CELLS.length }, () => 0 as 0 | Player),
  });
  protected readonly selectedDominoCell = signal<number | null>(null);
  protected readonly sim = signal<SimEdge[]>(createSimEdges());
  protected readonly hex = signal<(0 | Player)[]>(createHexCells());

  constructor() {
    this.startGame();
  }

  ngOnDestroy(): void {
    this.clearCpuTimer();
  }

  protected setMode(mode: DuelMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.startGame();
  }

  protected newGame(): void {
    this.startGame();
  }

  protected playerLabel(player: Player): string {
    if (player === 1) return 'Joueur 1';
    return this.mode() === 'cpu' ? 'CPU' : 'Joueur 2';
  }

  protected playerShortLabel(player: Player): string {
    return player === 1 ? 'J1' : this.mode() === 'cpu' ? 'CPU' : 'J2';
  }

  protected isHumanTurn(): boolean {
    return !this.winner() && !this.cpuThinking() && (this.mode() === 'local' || this.turn() === 1);
  }

  protected statusText(): string {
    if (this.winner()) return `${this.playerLabel(this.winner()!)} remporte la partie.`;
    if (this.cpuThinking()) return 'Le CPU réfléchit…';
    if (this.id === 'isola' && this.isolaStep() === 'block') {
      return `${this.playerLabel(this.turn())} choisit la case à retirer.`;
    }
    return `Au tour de ${this.playerLabel(this.turn())}.`;
  }

  protected resultTitle(): string {
    return this.winner() === 1 ? 'Victoire !' : 'Partie perdue';
  }

  protected resultText(): string {
    return this.resultReason() || `${this.playerLabel(this.winner() ?? 1)} a gagné.`;
  }

  protected cellLabel(cell: number): string {
    return `ligne ${cellRow(cell) + 1}, colonne ${cellColumn(cell) + 1}`;
  }

  protected isolaCellAriaLabel(cell: number): string {
    const label = this.cellLabel(cell);
    const player = this.isolaPositionPlayer(cell);

    if (this.isolaCellBlocked(cell)) return `${label}, case supprimée`;
    if (this.selectedIsolaDestination() === cell) return `${label}, destination sélectionnée`;
    if (player && !this.isolaCellIsPreviewOrigin(cell)) {
      return `${label}, pion ${this.playerShortLabel(player)}`;
    }
    if (this.isolaStep() === 'move' && this.isolaCellSelectable(cell)) {
      return `${label}, déplacement possible`;
    }
    if (this.isolaStep() === 'block' && this.isolaCellSelectable(cell)) {
      return `${label}, case à supprimer`;
    }
    return `${label}, case indisponible`;
  }

  protected cellRow(cell: number): number {
    return cellRow(cell);
  }

  protected cellColumn(cell: number): number {
    return cellColumn(cell);
  }

  protected otherPlayer(player: Player): Player {
    return otherPlayer(player);
  }

  protected gameLink(id: EpiqueGameId): string {
    return `/${id}`;
  }

  protected gameIsActive(id: EpiqueGameId): boolean {
    return this.id === id;
  }

  protected tokenIndexes(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index);
  }

  protected playWythoffToken(pileIndex: number, tokenIndex: number): void {
    const pile = this.wythoff()[pileIndex] ?? 0;
    const removeCount = pile - tokenIndex;
    if (removeCount > 0) this.playWythoff(pileIndex, removeCount);
  }

  protected wythoffBothMoves(): number[] {
    const count = Math.min(this.wythoff()[0], this.wythoff()[1]);
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  protected playWythoff(pileIndex: number, removeCount: number, both = false): void {
    if (!this.isHumanTurn() || this.id !== 'wythoff') return;
    const piles = this.wythoff();
    const move = wythoffMoves(piles).find(
      (candidate) =>
        candidate.pileIndex === pileIndex &&
        candidate.removeCount === removeCount &&
        candidate.both === both,
    );
    if (!move) return;
    this.applyWythoff(move, this.turn());
  }

  protected playWythoffBoth(removeCount: number): void {
    this.playWythoff(0, removeCount, true);
  }

  protected nimEmissionMoveCounts(): number[] {
    return nimEmissionMoves(this.nimEmission()).map((move) => move.removeCount);
  }

  protected nimEmissionFlagSelectable(flagIndex: number): boolean {
    const removeCount = this.nimEmission().flags - flagIndex;
    return (
      this.isHumanTurn() &&
      this.id === 'nim-emission' &&
      removeCount >= 1 &&
      removeCount <= this.nimEmission().maxRemoval
    );
  }

  protected nimEmissionFlagLabel(flagIndex: number): string {
    const removeCount = this.nimEmission().flags - flagIndex;
    if (removeCount > this.nimEmission().maxRemoval) {
      return `Retirer ${removeCount} drapeaux : maximum de ${this.nimEmission().maxRemoval}`;
    }
    return `Retirer ${removeCount} drapeau${removeCount > 1 ? 'x' : ''}`;
  }

  protected nimEmissionRuleText(): string {
    return this.nimEmission().lastFlagLoses
      ? 'Ne pas prendre le dernier drapeau'
      : 'Prendre le dernier drapeau';
  }

  protected nimEmissionRuleHelp(): string {
    return this.nimEmission().lastFlagLoses
      ? 'Le joueur qui prend le dernier drapeau perd la manche.'
      : 'Le joueur qui prend le dernier drapeau gagne la manche.';
  }

  protected playNimEmissionFlag(flagIndex: number): void {
    const removeCount = this.nimEmission().flags - flagIndex;
    this.playNimEmission(removeCount);
  }

  protected playNimEmission(removeCount: number): void {
    if (!this.isHumanTurn() || this.id !== 'nim-emission') return;
    const move = nimEmissionMoves(this.nimEmission()).find(
      (candidate) => candidate.removeCount === removeCount,
    );
    if (!move) return;
    this.applyNimEmission(move, this.turn());
  }

  protected isolaPositionPlayer(cell: number): Player | null {
    const positions = this.isola().positions;
    if (positions[1] === cell) return 1;
    if (positions[2] === cell) return 2;
    return null;
  }

  protected isolaCellBlocked(cell: number): boolean {
    return this.isola().blocked[cell] ?? false;
  }

  protected isolaCellIsPreviewOrigin(cell: number): boolean {
    return (
      this.isolaStep() === 'block' &&
      this.selectedIsolaDestination() !== null &&
      this.isolaPositionPlayer(cell) === this.turn()
    );
  }

  protected isolaCellSelectable(cell: number): boolean {
    if (!this.isHumanTurn() || this.id !== 'isola') return false;
    const state = this.isola();
    if (this.isolaStep() === 'move') return isolaMovableCells(state, this.turn()).includes(cell);
    return (
      !state.blocked[cell] &&
      cell !== this.selectedIsolaDestination() &&
      cell !== state.positions[otherPlayer(this.turn())]
    );
  }

  protected playIsolaCell(cell: number): void {
    if (!this.isHumanTurn() || this.id !== 'isola') return;
    const state = this.isola();
    const player = this.turn();
    if (this.isolaStep() === 'move') {
      if (isolaMovableCells(state, player).includes(cell)) {
        this.selectedIsolaDestination.set(cell);
        this.isolaStep.set('block');
      }
      return;
    }

    if (cell === this.selectedIsolaDestination()) {
      this.isolaStep.set('move');
      this.selectedIsolaDestination.set(null);
      return;
    }
    if (
      this.selectedIsolaDestination() !== null &&
      !state.blocked[cell] &&
      cell !== state.positions[otherPlayer(player)]
    ) {
      this.applyIsola(
        { to: this.selectedIsolaDestination()!, block: cell },
        player,
      );
    }
  }

  protected dominoOwner(cell: number): 0 | Player {
    return this.domineering().owners[cell] ?? 0;
  }

  protected dominoLabel(cell: number): string {
    return this.dominoOwner(cell) === 1 ? this.playerShortLabel(1) : this.playerShortLabel(2);
  }

  protected dominoCellSelectable(cell: number): boolean {
    if (!this.isHumanTurn() || this.id !== 'domineering') return false;
    if (this.dominoOwner(cell) !== 0) return false;
    return domineeringMoves(this.dominoOccupied(), this.turn()).some((move) =>
      move.cells.includes(cell),
    );
  }

  protected dominoCellHighlighted(cell: number): boolean {
    const selected = this.selectedDominoCell();
    if (selected === null || !this.isHumanTurn()) return false;
    return domineeringMoves(this.dominoOccupied(), this.turn()).some(
      (move) => move.cells.includes(selected) && move.cells.includes(cell) && selected !== cell,
    );
  }

  protected playDominoCell(cell: number): void {
    if (!this.isHumanTurn() || this.id !== 'domineering' || this.dominoOwner(cell) !== 0) return;
    const moves = domineeringMoves(this.dominoOccupied(), this.turn());
    const selected = this.selectedDominoCell();
    if (selected !== null) {
      const move = moves.find(
        (candidate) =>
          candidate.cells.includes(selected) &&
          candidate.cells.includes(cell) &&
          selected !== cell,
      );
      if (move) {
        this.applyDomino(move, this.turn());
        return;
      }
    }
    this.selectedDominoCell.set(moves.some((move) => move.cells.includes(cell)) ? cell : null);
  }

  protected simEdgeOwner(index: number): 0 | Player {
    return this.sim()[index]?.owner ?? 0;
  }

  protected simEdgeLabel(index: number): string {
    const edge = this.simEdges[index];
    return `Relier le point ${edge.a + 1} au point ${edge.b + 1}`;
  }

  protected simEdgeClass(index: number): string {
    const owner = this.simEdgeOwner(index);
    return owner === 1 ? 'sim-line-player-one' : owner === 2 ? 'sim-line-player-two' : 'sim-line-free';
  }

  protected simPoint(index: number): { x: number; y: number } {
    return this.simPoints[index];
  }

  protected playSimEdge(index: number): void {
    if (!this.isHumanTurn() || this.id !== 'sim' || this.simEdgeOwner(index) !== 0) return;
    this.applySimEdge(index, this.turn());
  }

  protected hexOwner(cell: number): 0 | Player {
    return this.hex()[cell] ?? 0;
  }

  protected hexCellSelectable(cell: number): boolean {
    return this.isHumanTurn() && this.id === 'hex' && this.hexOwner(cell) === 0;
  }

  protected hexCellLabel(cell: number): string {
    const owner = this.hexOwner(cell);
    const color = owner === 1 ? 'rouge' : owner === 2 ? 'bleu' : 'vide';
    return `${this.cellLabel(cell)}, ${color}`;
  }

  protected playHexCell(cell: number): void {
    if (!this.hexCellSelectable(cell)) return;
    this.applyHexCell(cell, this.turn());
  }

  protected canCancelSelection(): boolean {
    return (
      (this.id === 'isola' && this.isolaStep() === 'block') ||
      (this.id === 'domineering' && this.selectedDominoCell() !== null)
    );
  }

  protected cancelSelection(): void {
    this.isolaStep.set('move');
    this.selectedIsolaDestination.set(null);
    this.selectedDominoCell.set(null);
  }

  protected isHexConnectionPreview(player: Player): boolean {
    return hexHasConnection(this.hex(), player);
  }

  private startGame(): void {
    this.clearCpuTimer();
    this.gameSerial += 1;
    this.round += 1;
    this.turn.set(1);
    this.winner.set(null);
    this.resultReason.set('');
    this.cpuThinking.set(false);
    this.isola.set(createIsolaState());
    this.isolaStep.set('move');
    this.selectedIsolaDestination.set(null);
    this.domineering.set({
      owners: Array.from({ length: BOARD_CELLS.length }, () => 0 as 0 | Player),
    });
    this.selectedDominoCell.set(null);
    this.sim.set(createSimEdges());
    this.hex.set(createHexCells());
    this.wythoff.set([...WYTHOFF_PRESETS[(this.round - 1) % WYTHOFF_PRESETS.length]]);
    this.nimEmission.set({
      flags: this.randomInt(18, 25),
      maxRemoval: [3, 4, 5][this.randomInt(0, 2)] as NimEmissionState['maxRemoval'],
      lastFlagLoses: this.randomInt(0, 1) === 1,
    });
  }

  private isCpuTurn(): boolean {
    return this.mode() === 'cpu' && this.turn() === 2 && !this.winner();
  }

  private scheduleCpu(): void {
    if (!this.isCpuTurn() || this.cpuThinking()) return;
    const serial = this.gameSerial;
    this.cpuThinking.set(true);
    this.cpuTimer = window.setTimeout(() => {
      this.cpuTimer = null;
      if (serial !== this.gameSerial || !this.isCpuTurn()) return;
      this.cpuThinking.set(false);
      this.playCpuTurn();
    }, 520);
  }

  private clearCpuTimer(): void {
    if (this.cpuTimer !== null) window.clearTimeout(this.cpuTimer);
    this.cpuTimer = null;
  }

  private playCpuTurn(): void {
    if (!this.isCpuTurn()) return;
    const player: Player = 2;
    switch (this.id) {
      case 'wythoff': {
        const move = chooseWythoffMove(this.wythoff());
        if (move) this.applyWythoff(move, player);
        return;
      }
      case 'nim-emission': {
        const move = chooseNimEmissionMove(this.nimEmission());
        if (move) this.applyNimEmission(move, player);
        return;
      }
      case 'isola': {
        const move = chooseIsolaMove(this.isola(), player);
        if (move) this.applyIsola(move, player);
        else this.finish(1, 'Le pion du CPU ne peut plus se déplacer.');
        return;
      }
      case 'domineering': {
        const move = chooseDomineeringMove(this.dominoOccupied(), player);
        if (move) this.applyDomino(move, player);
        else this.finish(1, 'Le CPU ne peut plus placer de domino vertical.');
        return;
      }
      case 'sim': {
        const index = chooseSimEdge(this.sim(), player);
        if (index !== null) this.applySimEdge(index, player);
        return;
      }
      case 'hex': {
        const cell = chooseHexCell(this.hex(), player);
        if (cell !== null) this.applyHexCell(cell, player);
        return;
      }
    }
  }

  private applyWythoff(move: { pileIndex: 0 | 1; removeCount: number; both: boolean }, player: Player): void {
    const next = applyWythoffMove(this.wythoff(), move);
    this.wythoff.set(next);
    if (next[0] === 0 && next[1] === 0) {
      this.finish(player, `${this.playerLabel(player)} retire le dernier jeton.`);
      return;
    }
    this.advanceTurn(player);
    this.scheduleCpu();
  }

  private applyNimEmission(move: NimEmissionMove, player: Player): void {
    const before = this.nimEmission();
    const next = applyNimEmissionMove(before, move);
    this.nimEmission.set(next);

    if (next.flags === 0) {
      const winner = before.lastFlagLoses ? otherPlayer(player) : player;
      const reason = before.lastFlagLoses
        ? `${this.playerLabel(player)} prend le dernier drapeau et perd la manche.`
        : `${this.playerLabel(player)} prend le dernier drapeau et gagne la manche.`;
      this.finish(winner, reason);
      return;
    }

    this.advanceTurn(player);
    this.scheduleCpu();
  }

  private applyIsola(move: IsolaMove, player: Player): void {
    const next = applyIsolaMove(this.isola(), player, move);
    this.isola.set(next);
    this.isolaStep.set('move');
    this.selectedIsolaDestination.set(null);
    this.advanceTurn(player);
    if (this.winner()) return;
    if (isolaMovableCells(next, otherPlayer(player)).length === 0) {
      this.finish(player, `${this.playerLabel(otherPlayer(player))} est complètement bloqué.`);
      return;
    }
    this.scheduleCpu();
  }

  private applyDomino(move: DominoMove, player: Player): void {
    const nextOwners = [...this.domineering().owners];
    nextOwners[move.cells[0]] = player;
    nextOwners[move.cells[1]] = player;
    this.domineering.set({ owners: nextOwners });
    this.selectedDominoCell.set(null);
    this.advanceTurn(player);
    if (domineeringMoves(nextOwners.map((owner) => owner !== 0), otherPlayer(player)).length === 0) {
      this.finish(player, `${this.playerLabel(otherPlayer(player))} ne peut plus poser de domino.`);
      return;
    }
    this.scheduleCpu();
  }

  private applySimEdge(index: number, player: Player): void {
    const next = this.sim().map((edge, edgeIndex) =>
      edgeIndex === index ? { ...edge, owner: player as 0 | Player } : edge,
    );
    this.sim.set(next);
    if (simHasTriangle(next, player)) {
      this.finish(otherPlayer(player), `${this.playerLabel(player)} a fermé un triangle de sa couleur.`);
      return;
    }
    this.advanceTurn(player);
    if (next.every((edge) => edge.owner !== 0)) {
      this.finish(otherPlayer(player), 'La dernière arête a départagé la manche.');
      return;
    }
    this.scheduleCpu();
  }

  private applyHexCell(cell: number, player: Player): void {
    const next = [...this.hex()] as (0 | Player)[];
    if (next[cell] !== 0) return;
    next[cell] = player;
    this.hex.set(next);
    if (hexHasConnection(next, player)) {
      this.finish(player, `${this.playerLabel(player)} relie ses deux côtés.`);
      return;
    }
    this.advanceTurn(player);
    if (next.every((owner) => owner !== 0)) {
      this.finish(player, `${this.playerLabel(player)} prend la dernière case.`);
      return;
    }
    this.scheduleCpu();
  }

  private advanceTurn(player: Player): void {
    this.turn.set(otherPlayer(player));
  }

  private finish(player: Player, reason: string): void {
    this.clearCpuTimer();
    this.cpuThinking.set(false);
    this.winner.set(player);
    this.resultReason.set(reason);
  }

  private dominoOccupied(): boolean[] {
    return this.domineering().owners.map((owner) => owner !== 0);
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

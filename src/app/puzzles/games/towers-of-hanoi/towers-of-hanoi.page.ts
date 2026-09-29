import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../../shared/puzzle-success-popup/puzzle-success-popup.component';

type RodState = number[][];

type HanoiMove = {
  source: number;
  target: number;
  disk: number;
};

@Component({
  selector: 'app-towers-of-hanoi-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './towers-of-hanoi.page.html',
  styleUrl: './towers-of-hanoi.page.scss',
})
export class TowersOfHanoiPage {
  protected readonly rodNames = ['A', 'B', 'C'];
  protected readonly diskColors = [
    '#ef8354',
    '#e4b363',
    '#7bc8a4',
    '#62c6b1',
    '#6daedb',
    '#9580c9',
    '#d27ca7',
  ];

  private readonly initialPuzzle = this.createPuzzle();
  protected readonly diskCount = signal(this.initialPuzzle.diskCount);
  protected readonly startRod = signal(this.initialPuzzle.startRod);
  protected readonly targetRod = signal(this.initialPuzzle.targetRod);
  protected readonly rods = signal<RodState>(
    this.createRods(this.initialPuzzle.diskCount, this.initialPuzzle.startRod),
  );
  protected readonly selectedRod = signal<number | null>(null);
  protected readonly moves = signal(0);
  protected readonly history = signal<RodState[]>([]);
  protected readonly hintVisible = signal(false);
  protected readonly notice = signal('Choisis une tour de départ.');

  protected readonly minimumMoves = computed(() => 2 ** this.diskCount() - 1);
  protected readonly hintMove = computed(() =>
    this.findHint(this.rods(), this.targetRod(), this.diskCount()),
  );
  protected readonly hintText = computed(() => {
    const move = this.hintMove();

    return move
      ? `Déplace l’anneau ${move.disk} de la tour ${this.rodNames[move.source]} vers la tour ${this.rodNames[move.target]}.`
      : 'La tour est déjà complète.';
  });
  protected readonly isSolved = computed(() => {
    const target = this.rods()[this.targetRod()];
    const count = this.diskCount();

    return target.length === count && target.every((disk, index) => disk === count - index);
  });
  protected readonly scoreLabel = computed(() => {
    if (!this.isSolved()) {
      return `${this.moves()} coup${this.moves() === 1 ? '' : 's'}`;
    }

    const difference = this.moves() - this.minimumMoves();

    return difference === 0
      ? 'Résolution parfaite'
      : `${difference} coup${difference === 1 ? '' : 's'} de plus que l’optimal`;
  });

  protected selectRod(rodIndex: number): void {
    if (this.isSolved()) {
      return;
    }

    this.hintVisible.set(false);
    const currentSelection = this.selectedRod();

    if (currentSelection === null) {
      const disk = this.topDisk(this.rods()[rodIndex]);

      if (disk === null) {
        this.notice.set('Cette tour est vide. Choisis une tour qui contient un disque.');
        return;
      }

      this.selectedRod.set(rodIndex);
      this.notice.set(`Disque ${disk} sélectionné. Choisis la tour où tu veux le poser.`);
      return;
    }

    if (currentSelection === rodIndex) {
      this.selectedRod.set(null);
      this.notice.set('Sélection annulée. Choisis une tour de départ.');
      return;
    }

    this.moveDisk(currentSelection, rodIndex);
  }

  protected undoMove(): void {
    const previousState = this.history().at(-1);

    if (!previousState || this.isSolved()) {
      return;
    }

    this.rods.set(this.cloneRods(previousState));
    this.history.update((history) => history.slice(0, -1));
    this.moves.update((moves) => Math.max(0, moves - 1));
    this.selectedRod.set(null);
    this.hintVisible.set(false);
    this.notice.set('Dernier coup annulé.');
  }

  protected restartGame(): void {
    this.rods.set(this.createRods(this.diskCount(), this.startRod()));
    this.selectedRod.set(null);
    this.moves.set(0);
    this.history.set([]);
    this.hintVisible.set(false);
    this.notice.set('Même défi recommencé. Choisis une tour de départ.');
  }

  protected newGame(): void {
    const puzzle = this.createPuzzle();

    this.diskCount.set(puzzle.diskCount);
    this.startRod.set(puzzle.startRod);
    this.targetRod.set(puzzle.targetRod);
    this.rods.set(this.createRods(puzzle.diskCount, puzzle.startRod));
    this.selectedRod.set(null);
    this.moves.set(0);
    this.history.set([]);
    this.hintVisible.set(false);
    this.notice.set('Choisis une tour de départ.');
  }

  protected showHint(): void {
    if (this.isSolved()) {
      return;
    }

    this.hintVisible.set(true);
    this.notice.set(this.hintText());
  }

  protected diskWidth(disk: number): number {
    return 34 + (disk / this.diskCount()) * 60;
  }

  protected diskColor(disk: number): string {
    return this.diskColors[disk - 1] ?? this.diskColors[0];
  }

  protected towerLabel(rodIndex: number): string {
    const rod = this.rods()[rodIndex];
    const disk = this.topDisk(rod);
    const roles = [
      rodIndex === this.startRod() ? ' Départ.' : '',
      rodIndex === this.targetRod() ? ' Tour cible.' : '',
      this.selectedRod() === rodIndex ? ' Tour sélectionnée.' : '',
    ].join('');

    return `Tour ${this.rodNames[rodIndex]} : ${rod.length} anneau${rod.length === 1 ? '' : 'x'}.${roles}${
      disk === null ? '' : ` Anneau supérieur : ${disk}.`
    }`;
  }

  protected isStartRod(rodIndex: number): boolean {
    return this.startRod() === rodIndex;
  }

  protected isTargetRod(rodIndex: number): boolean {
    return this.targetRod() === rodIndex;
  }

  protected isTopDisk(rod: number[], disk: number): boolean {
    return this.topDisk(rod) === disk;
  }

  private moveDisk(sourceIndex: number, targetIndex: number): void {
    const currentRods = this.rods();
    const source = currentRods[sourceIndex];
    const target = currentRods[targetIndex];
    const disk = this.topDisk(source);

    if (disk === null) {
      this.selectedRod.set(null);
      return;
    }

    const targetDisk = this.topDisk(target);

    if (targetDisk !== null && targetDisk < disk) {
      this.notice.set(
        `Coup impossible : le disque ${disk} ne peut pas recouvrir le disque ${targetDisk}.`,
      );
      return;
    }

    this.history.update((history) => [...history, this.cloneRods(currentRods)]);
    this.rods.set(
      currentRods.map((rod, index) => {
        if (index === sourceIndex) {
          return rod.slice(0, -1);
        }

        return index === targetIndex ? [...rod, disk] : [...rod];
      }),
    );
    this.moves.update((moves) => moves + 1);
    this.selectedRod.set(null);
    this.hintVisible.set(false);
    this.notice.set(
      this.isSolved()
        ? 'Toutes les pièces sont arrivées sur la tour d’arrivée.'
        : 'Bon déplacement. Choisis une tour de départ.',
    );
  }

  private createPuzzle(): { diskCount: number; startRod: number; targetRod: number } {
    const diskCount = this.randomInt(4, 5);
    const startRod = this.randomInt(0, 2);
    const targetCandidates = [0, 1, 2].filter((rodIndex) => rodIndex !== startRod);
    const targetRod = targetCandidates[this.randomInt(0, targetCandidates.length - 1)];

    return { diskCount, startRod, targetRod };
  }

  private createRods(count: number, startRod: number): RodState {
    return [0, 1, 2].map((rodIndex) =>
      rodIndex === startRod ? Array.from({ length: count }, (_, index) => count - index) : [],
    );
  }

  private cloneRods(rods: RodState): RodState {
    return rods.map((rod) => [...rod]);
  }

  private findHint(rods: RodState, targetRod: number, diskCount: number): HanoiMove | null {
    if (this.isSolvedState(rods, targetRod, diskCount)) {
      return null;
    }

    const queue: Array<{ rods: RodState; firstMove: HanoiMove | null }> = [
      { rods: this.cloneRods(rods), firstMove: null },
    ];
    const visited = new Set([this.encodeRods(rods)]);
    let queueIndex = 0;

    while (queueIndex < queue.length) {
      const current = queue[queueIndex++];

      for (let source = 0; source < 3; source += 1) {
        const disk = this.topDisk(current.rods[source]);

        if (disk === null) {
          continue;
        }

        for (let target = 0; target < 3; target += 1) {
          if (source === target) {
            continue;
          }

          const targetDisk = this.topDisk(current.rods[target]);

          if (targetDisk !== null && targetDisk < disk) {
            continue;
          }

          const nextRods = this.applyMove(current.rods, source, target, disk);
          const firstMove = current.firstMove ?? { source, target, disk };

          if (this.isSolvedState(nextRods, targetRod, diskCount)) {
            return firstMove;
          }

          const key = this.encodeRods(nextRods);

          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ rods: nextRods, firstMove });
          }
        }
      }
    }

    return null;
  }

  private applyMove(rods: RodState, source: number, target: number, disk: number): RodState {
    return rods.map((rod, index) => {
      if (index === source) {
        return rod.slice(0, -1);
      }

      return index === target ? [...rod, disk] : [...rod];
    });
  }

  private encodeRods(rods: RodState): string {
    return rods.map((rod) => rod.join(',')).join('|');
  }

  private isSolvedState(rods: RodState, targetRod: number, diskCount: number): boolean {
    const target = rods[targetRod];

    return target.length === diskCount && target.every((disk, index) => disk === diskCount - index);
  }

  private topDisk(rod: number[]): number | null {
    return rod.length > 0 ? rod[rod.length - 1] : null;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

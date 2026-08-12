import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  ClassicKnightTourPuzzle,
  KnightTourCell,
  KnightTourPosition,
  KnightTourPuzzle,
  KnightsTourService,
} from './knights-tour.service';

type KnightTourMode = 'word' | 'classic';

@Component({
  selector: 'app-knights-tour-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './knights-tour.page.html',
  styleUrl: './knights-tour.page.scss',
})
export class KnightsTourPage {
  private readonly knightsTourService = inject(KnightsTourService);

  protected readonly mode = signal<KnightTourMode>('word');
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly puzzle = signal<KnightTourPuzzle | null>(null);
  protected readonly path = signal<KnightTourPosition[]>([]);
  protected readonly hintedPosition = signal<KnightTourPosition | null>(null);
  protected readonly classicGridSizes = [5, 6, 7, 8, 9] as const;
  protected readonly classicSize = signal(5);
  protected readonly classicPuzzle = signal<ClassicKnightTourPuzzle | null>(null);
  protected readonly classicPath = signal<KnightTourPosition[]>([]);
  protected readonly classicHintedPosition = signal<KnightTourPosition | null>(null);
  protected readonly classicLoadError = signal<string | null>(null);
  protected readonly message = signal('Pars de la case marquée et cherche le bon mouvement.');

  protected readonly currentWord = computed(() => {
    const puzzle = this.puzzle();

    if (!puzzle) {
      return '';
    }

    return this.path()
      .map((position) => puzzle.grid[position.row][position.col].letter)
      .join('');
  });

  protected readonly progressSlots = computed<(string | null)[]>(() => {
    const puzzle = this.puzzle();
    const path = this.path();

    if (!puzzle) {
      return [];
    }

    return Array.from({ length: puzzle.normalizedWord.length }, (_, index) => {
      const position = path[index];

      return position ? puzzle.grid[position.row][position.col].letter : null;
    });
  });

  protected readonly pathIndexByKey = computed(() => this.pathIndexMap(this.path()));

  protected readonly legalNextKeys = computed(() => {
    const puzzle = this.puzzle();

    if (!puzzle || this.isSolved()) {
      return new Set<string>();
    }

    if (this.path().length === 0) {
      return new Set([this.cellKey(puzzle.path[0])]);
    }

    if (this.path().length >= puzzle.normalizedWord.length) {
      return new Set<string>();
    }

    return new Set(
      this.knightsTourService
        .getLegalMoves(puzzle, this.path())
        .map((position) => this.cellKey(position)),
    );
  });

  protected readonly nextPosition = computed<KnightTourPosition | null>(() => {
    const puzzle = this.puzzle();

    return puzzle?.path[this.path().length] ?? null;
  });

  protected readonly isSolved = computed(() => {
    const puzzle = this.puzzle();

    return Boolean(puzzle) && this.knightsTourService.isSolutionPath(puzzle!, this.path());
  });

  protected readonly remainingMoveCount = computed(() => {
    const puzzle = this.puzzle();

    return puzzle ? Math.max(0, puzzle.normalizedWord.length - this.path().length) : 0;
  });

  protected readonly classicBoardPositions = computed(() => {
    const puzzle = this.classicPuzzle();

    return puzzle ? this.knightsTourService.positionsForSize(puzzle.size) : [];
  });

  protected readonly classicPathIndexByKey = computed(() => this.pathIndexMap(this.classicPath()));

  protected readonly classicLegalNextKeys = computed(() => {
    const puzzle = this.classicPuzzle();

    if (!puzzle || this.classicIsSolved()) {
      return new Set<string>();
    }

    if (this.classicPath().length === 0) {
      return new Set(this.classicBoardPositions().map((position) => this.cellKey(position)));
    }

    if (this.classicPath().length >= puzzle.size * puzzle.size) {
      return new Set<string>();
    }

    return new Set(
      this.knightsTourService
        .getClassicLegalMoves(puzzle, this.classicPath())
        .map((position) => this.cellKey(position)),
    );
  });

  protected readonly classicNextPosition = computed<KnightTourPosition | null>(() => {
    const puzzle = this.classicPuzzle();

    return puzzle?.path[this.classicPath().length] ?? null;
  });

  protected readonly classicIsSolved = computed(() => {
    const puzzle = this.classicPuzzle();
    const path = this.classicPath();

    if (!puzzle || path.length !== puzzle.size * puzzle.size) {
      return false;
    }

    const pathKeys = new Set(path.map((position) => this.cellKey(position)));

    return (
      pathKeys.size === path.length &&
      path.every(
        (position, index) =>
          index === 0 || this.knightsTourService.isKnightMove(path[index - 1], position),
      )
    );
  });

  protected readonly classicRemainingMoveCount = computed(() => {
    const puzzle = this.classicPuzzle();

    return puzzle ? Math.max(0, puzzle.size * puzzle.size - this.classicPath().length) : 0;
  });

  constructor() {
    void this.loadPuzzle();
  }

  protected switchMode(mode: KnightTourMode): void {
    if (this.mode() === mode) {
      if (mode === 'classic' && !this.classicPuzzle()) {
        this.newClassicPuzzle();
      }

      return;
    }

    this.mode.set(mode);

    if (mode === 'classic') {
      if (!this.classicPuzzle()) {
        this.newClassicPuzzle();
      } else {
        this.message.set('Choisis la case de départ de ton choix.');
      }

      return;
    }

    this.message.set('Pars de la case marquée et cherche le bon mouvement.');
  }

  protected selectClassicSize(size: number): void {
    if (
      !this.classicGridSizes.some((gridSize) => gridSize === size) ||
      this.classicSize() === size
    ) {
      return;
    }

    this.classicSize.set(size);
    this.newClassicPuzzle();
  }

  protected selectCell(cell: KnightTourCell): void {
    const puzzle = this.puzzle();

    if (!puzzle || cell.blocked || this.isSolved()) {
      return;
    }

    const currentPath = this.path();
    const currentPosition = currentPath.at(-1);
    const candidate = { row: cell.row, col: cell.col };
    const selectedIndex = this.pathIndexByKey().get(this.cellKey(candidate));

    if (selectedIndex !== undefined) {
      const isCurrent = selectedIndex === currentPath.length - 1;
      const nextPath = isCurrent
        ? currentPath.slice(0, -1)
        : currentPath.slice(0, selectedIndex + 1);

      this.path.set(nextPath);
      this.hintedPosition.set(null);
      this.message.set(
        isCurrent
          ? nextPath.length === 0
            ? 'Case de départ désélectionnée.'
            : 'Dernier saut retiré. Le cavalier revient à la case précédente.'
          : 'Retour à cette étape.',
      );
      return;
    }

    if (!currentPosition) {
      if (this.samePosition(candidate, puzzle.path[0])) {
        this.path.set([candidate]);
        this.hintedPosition.set(null);
        this.message.set('');
      }

      return;
    }

    if (currentPath.length >= puzzle.normalizedWord.length) {
      return;
    }

    if (!this.knightsTourService.isKnightMove(currentPosition, candidate)) {
      this.message.set('Un cavalier se déplace de deux cases puis d’une case.');
      return;
    }

    this.path.set([...currentPath, candidate]);
    this.hintedPosition.set(null);

    if (this.isSolved()) {
      this.message.set(`Bravo! Le mot est ${puzzle.word.toLocaleUpperCase('fr-CA')}.`);
    } else {
      this.message.set('');
    }
  }

  protected selectClassicCell(candidate: KnightTourPosition): void {
    const puzzle = this.classicPuzzle();

    if (!puzzle || this.classicIsSolved()) {
      return;
    }

    const currentPath = this.classicPath();
    const currentPosition = currentPath.at(-1);
    const selectedIndex = this.classicPathIndexByKey().get(this.cellKey(candidate));

    if (selectedIndex !== undefined) {
      const isCurrent = selectedIndex === currentPath.length - 1;
      const nextPath = isCurrent
        ? currentPath.slice(0, -1)
        : currentPath.slice(0, selectedIndex + 1);

      this.classicPath.set(nextPath);
      this.classicHintedPosition.set(null);
      this.message.set(
        isCurrent
          ? nextPath.length === 0
            ? 'Case de départ désélectionnée.'
            : 'Dernier saut retiré. Le cavalier revient à la case précédente.'
          : 'Retour à cette étape.',
      );
      return;
    }

    if (!currentPosition) {
      this.classicPath.set([candidate]);
      this.classicHintedPosition.set(null);
      this.message.set('');
      return;
    }

    if (currentPath.length >= puzzle.size * puzzle.size) {
      return;
    }

    if (!this.knightsTourService.isKnightMove(currentPosition, candidate)) {
      this.message.set('Un cavalier se déplace de deux cases puis d’une case.');
      return;
    }

    this.classicPath.set([...currentPath, candidate]);
    this.classicHintedPosition.set(null);
    this.message.set(this.classicIsSolved() ? 'Bravo! La grille est complète.' : '');
  }

  protected boardCellClass(cell: KnightTourCell): string {
    const classes = [
      'grid-cell',
      'board-cell',
      (cell.row + cell.col) % 2 === 0 ? 'light-cell' : 'dark-cell',
    ];

    if (cell.blocked) {
      classes.push('blocked');
      return classes.join(' ');
    }

    const key = this.cellKey(cell);
    const pathIndex = this.pathIndexByKey().get(key);

    if (pathIndex !== undefined) {
      classes.push('visited');

      if (pathIndex === this.path().length - 1) {
        classes.push('current');
      }
    }

    if (this.legalNextKeys().has(key)) {
      classes.push('legal-next');
    }

    const hint = this.hintedPosition();

    if (hint && this.samePosition(hint, cell)) {
      classes.push('hinted');
    }

    const startPosition = this.puzzle()?.path[0];

    if (pathIndex === 0 || (startPosition && this.samePosition(startPosition, cell))) {
      classes.push('start');
    }

    return classes.join(' ');
  }

  protected classicBoardCellClass(position: KnightTourPosition): string {
    const classes = [
      'grid-cell',
      'board-cell',
      (position.row + position.col) % 2 === 0 ? 'light-cell' : 'dark-cell',
    ];
    const key = this.cellKey(position);
    const pathIndex = this.classicPathIndexByKey().get(key);

    if (pathIndex !== undefined) {
      classes.push('visited');

      if (pathIndex === this.classicPath().length - 1) {
        classes.push('current');
      }
    }

    if (this.classicLegalNextKeys().has(key)) {
      classes.push('legal-next');
    }

    const hint = this.classicHintedPosition();

    if (hint && this.samePosition(hint, position)) {
      classes.push('hinted');
    }

    if (pathIndex === 0) {
      classes.push('start');
    }

    return classes.join(' ');
  }

  protected pathIndex(cell: KnightTourPosition): number | null {
    return this.pathIndexByKey().get(this.cellKey(cell)) ?? null;
  }

  protected isWordStart(cell: KnightTourPosition): boolean {
    const startPosition = this.puzzle()?.path[0];

    return startPosition ? this.samePosition(startPosition, cell) : false;
  }

  protected classicPathIndex(position: KnightTourPosition): number | null {
    return this.classicPathIndexByKey().get(this.cellKey(position)) ?? null;
  }

  protected cellAriaLabel(cell: KnightTourCell): string {
    const coordinate = `Ligne ${cell.row + 1}, colonne ${cell.col + 1}`;

    if (cell.blocked) {
      return `${coordinate}, case barrée`;
    }

    const pathIndex = this.pathIndex(cell);
    const details = [`lettre ${cell.letter}`];
    const isStart = this.isWordStart(cell);

    if (isStart) {
      details.push(pathIndex === 0 ? 'départ' : 'départ possible');
    }

    if (pathIndex !== null) {
      details.push(`étape ${pathIndex + 1}`);
    }

    if (pathIndex === this.path().length - 1) {
      details.push('position actuelle');
    }

    const hint = this.hintedPosition();

    if (hint && this.samePosition(hint, cell)) {
      details.push('indice');
    }

    if (!isStart && this.legalNextKeys().has(this.cellKey(cell))) {
      details.push('mouvement possible');
    }

    return `${coordinate}, ${details.join(', ')}`;
  }

  protected classicCellAriaLabel(position: KnightTourPosition): string {
    const coordinate = `Ligne ${position.row + 1}, colonne ${position.col + 1}`;
    const pathIndex = this.classicPathIndex(position);
    const details = ['case libre'];

    if (pathIndex === 0) {
      details.push('départ');
    }

    if (pathIndex !== null) {
      details.push(`étape ${pathIndex + 1}`);
    }

    if (pathIndex === this.classicPath().length - 1) {
      details.push('position actuelle');
    }

    const hint = this.classicHintedPosition();

    if (hint && this.samePosition(hint, position)) {
      details.push('indice');
    }

    if (this.classicPath().length === 0) {
      details.push('départ possible');
    } else if (this.classicLegalNextKeys().has(this.cellKey(position))) {
      details.push('mouvement possible');
    }

    return `${coordinate}, ${details.join(', ')}`;
  }

  protected showHint(): void {
    if (this.isSolved()) {
      return;
    }

    const next = this.nextPosition();

    if (!next) {
      return;
    }

    this.hintedPosition.set(next);
    this.message.set(`Indice : vise la case ${next.row + 1}, ${next.col + 1}.`);
  }

  protected showClassicHint(): void {
    const puzzle = this.classicPuzzle();

    if (!puzzle || this.classicIsSolved()) {
      return;
    }

    if (this.classicPath().length === 0) {
      this.message.set('Choisis la case de départ de ton choix.');
      return;
    }

    const legalMoves = this.knightsTourService.getClassicLegalMoves(puzzle, this.classicPath());
    const generatedHint = this.classicNextPosition();
    const next =
      generatedHint && legalMoves.some((position) => this.samePosition(position, generatedHint))
        ? generatedHint
        : legalMoves[0];

    if (!next) {
      return;
    }

    this.classicHintedPosition.set(next);
    this.message.set(`Indice : vise la case ${next.row + 1}, ${next.col + 1}.`);
  }

  protected restartPuzzle(): void {
    const puzzle = this.puzzle();

    if (!puzzle || this.isSolved()) {
      return;
    }

    this.path.set([puzzle.path[0]]);
    this.hintedPosition.set(null);
    this.message.set('Le parcours est remis à zéro. Pars de la case marquée.');
  }

  protected restartClassicPuzzle(): void {
    const puzzle = this.classicPuzzle();

    if (!puzzle || this.classicIsSolved()) {
      return;
    }

    this.classicPath.set([]);
    this.classicHintedPosition.set(null);
    this.message.set('Choisis la case de départ de ton choix.');
  }

  protected newPuzzle(): void {
    try {
      const nextPuzzle = this.knightsTourService.createPuzzle();

      this.puzzle.set(nextPuzzle);
      this.path.set([nextPuzzle.path[0]]);
      this.hintedPosition.set(null);
      this.loadError.set(null);
      this.message.set('Pars de la case marquée et cherche le bon mouvement.');
    } catch {
      this.loadError.set('Impossible de créer un parcours du cavalier.');
    }
  }

  protected newClassicPuzzle(): void {
    try {
      const nextPuzzle = this.knightsTourService.createClassicPuzzle(this.classicSize());

      this.classicPuzzle.set(nextPuzzle);
      this.classicPath.set([]);
      this.classicHintedPosition.set(null);
      this.classicLoadError.set(null);
      this.message.set('Choisis la case de départ de ton choix.');
    } catch {
      this.classicPuzzle.set(null);
      this.classicPath.set([]);
      this.classicLoadError.set('Impossible de créer une grille classique.');
    }
  }

  private async loadPuzzle(): Promise<void> {
    try {
      await this.knightsTourService.loadWords();
      this.newPuzzle();
    } catch {
      this.loadError.set('Impossible de charger la liste de mots.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private cellKey(position: KnightTourPosition): string {
    return this.knightsTourService.positionKey(position);
  }

  private pathIndexMap(path: readonly KnightTourPosition[]): Map<string, number> {
    const indexes = new Map<string, number>();

    path.forEach((position, index) => {
      indexes.set(this.cellKey(position), index);
    });

    return indexes;
  }

  private samePosition(first: KnightTourPosition, second: KnightTourPosition): boolean {
    return first.row === second.row && first.col === second.col;
  }
}

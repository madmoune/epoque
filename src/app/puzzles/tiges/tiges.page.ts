import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type Point = {
  row: number;
  col: number;
};

type Rod = {
  id: string;
  name: string;
  description: string;
  color: string;
  points: Point[];
};

type Wall = {
  first: Point;
  second: Point;
};

type RodPuzzle = {
  rows: number;
  cols: number;
  start: Point;
  goal: Point;
  water: string[];
  walls: Wall[];
  rods: Rod[];
  solutionRodIds: string[];
};

type RodPlacement = {
  rodId: string;
  name: string;
  color: string;
  points: Point[];
};

type Orientation = {
  rotation: number;
  mirrored: boolean;
};

type PlacementValidation = {
  valid: boolean;
  detail: string;
  endpoint?: Point;
};

type FeedbackTone = 'info' | 'error' | 'success';

type Feedback = {
  tone: FeedbackTone;
  text: string;
};

type BoardCell = Point & {
  key: string;
  isWater: boolean;
};

type PathSegment = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type VisualPath = {
  id: string;
  color: string;
  points: Point[];
  segments: PathSegment[];
};

@Component({
  selector: 'app-tiges-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './tiges.page.html',
  styleUrl: './tiges.page.scss',
})
export class TigesPage {
  protected readonly puzzle = signal<RodPuzzle>(this.createPuzzle());
  protected readonly placements = signal<RodPlacement[]>([]);
  protected readonly selectedRodId = signal<string | null>(null);
  protected readonly orientation = signal<Orientation>({ rotation: 0, mirrored: false });
  protected readonly feedback = signal<Feedback>({
    tone: 'info',
    text: 'Choisis une tige : elle partira toujours du dernier embout.',
  });

  protected readonly boardCells = computed<BoardCell[]>(() => {
    const puzzle = this.puzzle();

    return Array.from({ length: puzzle.rows * puzzle.cols }, (_, index) => {
      const row = Math.floor(index / puzzle.cols);
      const col = index % puzzle.cols;

      return {
        row,
        col,
        key: this.pointKey({ row, col }),
        isWater: puzzle.water.includes(this.pointKey({ row, col })),
      };
    });
  });

  protected readonly availableRods = computed(() => {
    const usedIds = new Set(this.placements().map((placement) => placement.rodId));

    return this.puzzle().rods.filter((rod) => !usedIds.has(rod.id));
  });

  protected readonly selectedRod = computed(() => {
    const selectedId = this.selectedRodId();

    return this.puzzle().rods.find((rod) => rod.id === selectedId);
  });

  protected readonly currentEndpoint = computed<Point>(() => {
    const lastPlacement = this.placements().at(-1);

    return lastPlacement?.points.at(-1) ?? this.puzzle().start;
  });

  protected readonly previewPoints = computed<Point[]>(() => {
    const rod = this.selectedRod();

    return rod ? this.transformRod(rod.points, this.orientation(), this.currentEndpoint()) : [];
  });

  protected readonly previewValidation = computed<PlacementValidation>(() =>
    this.validatePath(this.previewPoints()),
  );

  protected readonly previewSegments = computed<PathSegment[]>(() =>
    this.pathSegments(this.previewPoints(), 'preview'),
  );

  protected readonly placedPaths = computed<VisualPath[]>(() =>
    this.placements().map((placement) => ({
      id: placement.rodId,
      color: placement.color,
      points: placement.points,
      segments: this.pathSegments(placement.points, placement.rodId),
    })),
  );

  protected readonly wallSegments = computed<PathSegment[]>(() =>
    this.puzzle().walls.map((wall, index) => this.wallSegment(wall, index)),
  );

  protected readonly isSolved = computed(() =>
    this.samePoint(this.currentEndpoint(), this.puzzle().goal),
  );

  protected readonly requiredRodCount = computed(() => this.puzzle().solutionRodIds.length);

  protected readonly usedRodCount = computed(() => this.placements().length);

  protected selectRod(rodId: string): void {
    if (this.isSolved() || !this.availableRods().some((rod) => rod.id === rodId)) {
      return;
    }

    this.selectedRodId.set(rodId);
    this.orientation.set({ rotation: 0, mirrored: false });
    this.feedback.set({
      tone: 'info',
      text: 'Tourne ou retourne la tige, puis pose-la quand son tracé est valide.',
    });
  }

  protected rotateSelected(delta: number): void {
    if (!this.selectedRod()) {
      return;
    }

    this.orientation.update((current) => ({
      ...current,
      rotation: (current.rotation + delta + 4) % 4,
    }));
  }

  protected toggleMirror(): void {
    if (!this.selectedRod()) {
      return;
    }

    this.orientation.update((current) => ({ ...current, mirrored: !current.mirrored }));
  }

  protected placeSelectedRod(): void {
    const rod = this.selectedRod();
    const validation = this.previewValidation();

    if (!rod) {
      this.feedback.set({ tone: 'error', text: 'Choisis d’abord une tige dans la réserve.' });
      return;
    }

    if (!validation.valid || !validation.endpoint) {
      this.feedback.set({ tone: 'error', text: validation.detail });
      return;
    }

    this.placements.update((placements) => [
      ...placements,
      {
        rodId: rod.id,
        name: rod.name,
        color: rod.color,
        points: this.previewPoints(),
      },
    ]);
    this.selectedRodId.set(null);
    this.orientation.set({ rotation: 0, mirrored: false });

    if (this.samePoint(validation.endpoint, this.puzzle().goal)) {
      this.feedback.set({
        tone: 'success',
        text: 'La chaîne atteint la cible. Bien joué !',
      });
    } else {
      this.feedback.set({
        tone: 'info',
        text: 'Bon raccord. Le prochain embout est maintenant le point de départ.',
      });
    }
  }

  protected undoLastPlacement(): void {
    if (this.placements().length === 0) {
      return;
    }

    this.placements.update((placements) => placements.slice(0, -1));
    this.selectedRodId.set(null);
    this.orientation.set({ rotation: 0, mirrored: false });
    this.feedback.set({
      tone: 'info',
      text: 'Dernière tige retirée. Repars du nouvel embout.',
    });
  }

  protected resetPath(): void {
    this.placements.set([]);
    this.selectedRodId.set(null);
    this.orientation.set({ rotation: 0, mirrored: false });
    this.feedback.set({
      tone: 'info',
      text: 'Le parcours est vide. Choisis la première tige.',
    });
  }

  protected newPuzzle(): void {
    this.puzzle.set(this.createPuzzle());
    this.resetPath();
    this.feedback.set({
      tone: 'info',
      text: 'Nouveau parcours : trouve la chaîne qui rejoint la cible.',
    });
  }

  protected orientationLabel(): string {
    const current = this.orientation();
    const mirrored = current.mirrored ? ' · retournée' : '';

    return `${current.rotation * 90}°${mirrored}`;
  }

  protected pointLabel(point: Point): string {
    return `L${point.row + 1} · C${point.col + 1}`;
  }

  protected pointLeft(point: Point): string {
    return `${((point.col + 0.5) / this.puzzle().cols) * 100}%`;
  }

  protected pointTop(point: Point): string {
    return `${((point.row + 0.5) / this.puzzle().rows) * 100}%`;
  }

  protected svgPoints(points: Point[]): string {
    return points.map((point) => `${point.col},${point.row}`).join(' ');
  }

  protected cellIsCurrent(cell: Point): boolean {
    return this.samePoint(cell, this.currentEndpoint());
  }

  protected validationClass(): string {
    return this.previewValidation().valid ? 'valid' : 'invalid';
  }

  private createPuzzle(): RodPuzzle {
    const rods: Rod[] = [
      {
        id: 'barre',
        name: 'Barre',
        description: 'Une ligne droite de deux segments.',
        color: '#ef8f5f',
        points: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
        ],
      },
      {
        id: 'angle',
        name: 'Angle',
        description: 'Un coude court.',
        color: '#78c7b1',
        points: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 1 },
        ],
      },
      {
        id: 'zigzag',
        name: 'Zigzag',
        description: 'Deux virages en sens alterné.',
        color: '#e6c35f',
        points: [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
          { row: 1, col: 1 },
          { row: 2, col: 1 },
        ],
      },
      {
        id: 'sinueuse',
        name: 'Sinueuse',
        description: 'Une trajectoire en S.',
        color: '#b892e8',
        points: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 1 },
          { row: 1, col: 2 },
        ],
      },
      {
        id: 'crochet',
        name: 'Crochet long',
        description: 'Un crochet étiré sur trois segments.',
        color: '#eb7da8',
        points: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 1 },
          { row: 2, col: 1 },
        ],
      },
      {
        id: 'detour',
        name: 'Détour',
        description: 'Un coude qui ne mène pas au bon endroit.',
        color: '#7ca6e8',
        points: [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
          { row: 2, col: 0 },
          { row: 2, col: 1 },
        ],
      },
      {
        id: 'fourche',
        name: 'Fourche',
        description: 'Un petit détour à double virage.',
        color: '#d783bf',
        points: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 2, col: 2 },
        ],
      },
    ];

    return {
      rows: 8,
      cols: 10,
      start: { row: 6, col: 1 },
      goal: { row: 1, col: 9 },
      water: [
        '6:2',
        '5:3',
        '5:5',
        '4:5',
        '3:6',
        '3:7',
        '1:7',
        '1:8',
        '2:6',
        '2:8',
        '4:3',
        '5:7',
      ],
      walls: [
        { first: { row: 6, col: 1 }, second: { row: 5, col: 1 } },
        { first: { row: 6, col: 3 }, second: { row: 6, col: 4 } },
        { first: { row: 5, col: 4 }, second: { row: 4, col: 4 } },
        { first: { row: 4, col: 6 }, second: { row: 4, col: 7 } },
        { first: { row: 2, col: 7 }, second: { row: 2, col: 8 } },
        { first: { row: 1, col: 8 }, second: { row: 0, col: 8 } },
        { first: { row: 5, col: 2 }, second: { row: 5, col: 3 } },
        { first: { row: 3, col: 4 }, second: { row: 3, col: 5 } },
      ],
      rods: this.shuffle(rods),
      solutionRodIds: ['barre', 'angle', 'zigzag', 'sinueuse', 'crochet'],
    };
  }

  private transformRod(points: Point[], orientation: Orientation, anchor: Point): Point[] {
    return points.map((point) => {
      let row = point.row;
      let col = orientation.mirrored ? -point.col : point.col;

      for (let turn = 0; turn < orientation.rotation; turn += 1) {
        [row, col] = [col, -row];
      }

      return { row: anchor.row + row, col: anchor.col + col };
    });
  }

  private validatePath(points: Point[]): PlacementValidation {
    if (!this.selectedRod()) {
      return { valid: false, detail: 'Choisis une tige pour afficher son tracé.' };
    }

    if (points.length < 2) {
      return { valid: false, detail: 'Cette tige ne possède pas assez de segments.' };
    }

    const start = this.currentEndpoint();
    const endpoint = points.at(-1);

    if (!endpoint || !this.samePoint(points[0], start)) {
      return { valid: false, detail: 'La tige doit commencer sur le dernier embout.' };
    }

    if (points.some((point) => !this.isInside(point))) {
      return { valid: false, detail: 'La tige sort de la grille.' };
    }

    if (this.isWater(endpoint)) {
      return { valid: false, detail: 'Impossible de laisser un embout sur l’eau.' };
    }

    if (this.samePoint(start, endpoint)) {
      return { valid: false, detail: 'La tige doit avancer jusqu’à un nouvel embout.' };
    }

    const occupied = new Set(
      this.placements().flatMap((placement) => placement.points.slice(1).map((point) => this.pointKey(point))),
    );

    for (const point of points.slice(1)) {
      if (occupied.has(this.pointKey(point))) {
        return { valid: false, detail: 'La tige repasse sur une partie déjà posée.' };
      }
    }

    for (let index = 1; index < points.length; index += 1) {
      if (this.hasWall(points[index - 1], points[index])) {
        return { valid: false, detail: 'Un mur bloque le passage de cette tige.' };
      }
    }

    return {
      valid: true,
      detail: `Tracé valide · nouvel embout en ${this.pointLabel(endpoint)}.`,
      endpoint,
    };
  }

  private pathSegments(points: Point[], prefix: string): PathSegment[] {
    return points.slice(1).map((point, index) => {
      const previous = points[index];

      return {
        key: `${prefix}-${index}-${this.pointKey(previous)}-${this.pointKey(point)}`,
        x1: previous.col,
        y1: previous.row,
        x2: point.col,
        y2: point.row,
      };
    });
  }

  private wallSegment(wall: Wall, index: number): PathSegment {
    const first = wall.first;
    const second = wall.second;

    if (first.row === second.row) {
      const y = first.row;
      const x = Math.min(first.col, second.col) + 0.5;

      return { key: `wall-${index}`, x1: x, y1: y - 0.5, x2: x, y2: y + 0.5 };
    }

    const x = first.col;
    const y = Math.min(first.row, second.row) + 0.5;

    return { key: `wall-${index}`, x1: x - 0.5, y1: y, x2: x + 0.5, y2: y };
  }

  private hasWall(first: Point, second: Point): boolean {
    const edge = this.edgeKey(first, second);

    return this.puzzle().walls.some((wall) => this.edgeKey(wall.first, wall.second) === edge);
  }

  private isInside(point: Point): boolean {
    const puzzle = this.puzzle();

    return point.row >= 0 && point.row < puzzle.rows && point.col >= 0 && point.col < puzzle.cols;
  }

  private isWater(point: Point): boolean {
    return this.puzzle().water.includes(this.pointKey(point));
  }

  private edgeKey(first: Point, second: Point): string {
    return [this.pointKey(first), this.pointKey(second)].sort().join('|');
  }

  private pointKey(point: Point): string {
    return `${point.row}:${point.col}`;
  }

  private samePoint(first: Point, second: Point): boolean {
    return first.row === second.row && first.col === second.col;
  }

  private shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
  }
}

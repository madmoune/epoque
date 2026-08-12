import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  HangingWeight,
  HangingWeightBranchNode,
  HangingWeightNode,
  HangingWeightPuzzle,
  HangingWeightsService,
} from './hanging-weights.service';

type HangingWeightFeedback = {
  tone: 'error' | 'hint';
  text: string;
};

type MobileBarLayout = {
  id: string;
  pivotX: number;
  leftX: number;
  rightX: number;
  y: number;
  leftDistance: number;
  rightDistance: number;
  unitMarkers: MobileUnitMarkerLayout[];
};

type MobileUnitMarkerLayout = {
  id: string;
  x: number;
};

type RawMobileBarLayout = Omit<MobileBarLayout, 'unitMarkers'>;

type MobileConnectorLayout = {
  id: string;
  x: number;
  top: number;
  bottom: number;
};

type MobileWeightLayout = {
  weightId: string;
  x: number;
  y: number;
};

type HangingMobileLayout = {
  width: number;
  height: number;
  ceilingY: number;
  rootX: number;
  rootBarY: number;
  bars: MobileBarLayout[];
  connectors: MobileConnectorLayout[];
  weights: MobileWeightLayout[];
};

@Component({
  selector: 'app-hanging-weights-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './hanging-weights.page.html',
  styleUrl: './hanging-weights.page.scss',
})
export class HangingWeightsPage {
  private readonly hangingWeightsService = inject(HangingWeightsService);

  protected readonly puzzle = signal<HangingWeightPuzzle>(
    this.hangingWeightsService.createPuzzle(),
  );
  protected readonly answers = signal<Record<string, string>>({});
  protected readonly hintedWeightIds = signal<Set<string>>(new Set());
  protected readonly feedback = signal<HangingWeightFeedback | null>(null);
  protected readonly isSolved = signal(false);
  protected readonly generationError = signal<string | null>(null);

  protected readonly layout = computed(() => createHangingMobileLayout(this.puzzle().root));
  protected readonly unknownWeights = computed(() =>
    this.puzzle().weights.filter((weight) => !weight.known),
  );
  protected readonly allAnswered = computed(() =>
    this.unknownWeights().every((weight) => this.answerFor(weight.id) !== ''),
  );
  protected readonly hasAvailableHint = computed(() =>
    this.unknownWeights().some((weight) => !this.hintedWeightIds().has(weight.id)),
  );
  protected readonly successAnswer = computed(() =>
    this.puzzle()
      .weights.map((weight) => `${weight.label} = ${this.puzzle().solution[weight.id]} kg`)
      .join(' · '),
  );

  protected updateAnswer(weightId: string, event: Event): void {
    if (this.isSolved() || this.hintedWeightIds().has(weightId)) {
      return;
    }

    const value = event.target instanceof HTMLInputElement ? event.target.value : '';

    this.answers.update((answers) => ({ ...answers, [weightId]: value }));
    this.feedback.set(null);
    this.validateAnswers();
  }

  protected answerFor(weightId: string): string {
    return this.answers()[weightId] ?? '';
  }

  private validateAnswers(): void {
    if (!this.allAnswered()) {
      return;
    }

    const values = this.unknownWeights().map((weight) => Number(this.answerFor(weight.id)));

    if (values.some((weight) => !Number.isInteger(weight) || weight <= 0)) {
      this.feedback.set({
        tone: 'error',
        text: 'Tous les poids doivent être des nombres entiers positifs.',
      });
      return;
    }

    const isCorrect = this.unknownWeights().every(
      (weight) => Number(this.answerFor(weight.id)) === this.puzzle().solution[weight.id],
    );

    if (!isCorrect) {
      this.feedback.set({
        tone: 'error',
        text: 'Le mobile pencherait avec ces valeurs. Vérifie les poids totaux de chaque branche.',
      });
      return;
    }

    this.feedback.set(null);
    this.isSolved.set(true);
  }

  protected showHint(): void {
    if (this.isSolved()) {
      return;
    }

    const hintWeight =
      this.unknownWeights().find(
        (weight) =>
          !this.hintedWeightIds().has(weight.id) &&
          Number(this.answerFor(weight.id)) !== this.puzzle().solution[weight.id],
      ) ?? this.unknownWeights().find((weight) => !this.hintedWeightIds().has(weight.id));

    if (!hintWeight) {
      return;
    }

    const value = this.puzzle().solution[hintWeight.id];

    this.answers.update((answers) => ({ ...answers, [hintWeight.id]: String(value) }));
    this.hintedWeightIds.update((weightIds) => new Set([...weightIds, hintWeight.id]));
    this.feedback.set({
      tone: 'hint',
      text: `Indice : le poids ${hintWeight.label} vaut ${value} kg.`,
    });
    this.validateAnswers();
  }

  protected resetPuzzle(): void {
    this.answers.set({});
    this.hintedWeightIds.set(new Set());
    this.feedback.set(null);
    this.isSolved.set(false);
  }

  protected newPuzzle(): void {
    try {
      this.puzzle.set(this.hangingWeightsService.createPuzzle());
      this.generationError.set(null);
      this.resetPuzzle();
    } catch {
      this.generationError.set('Impossible de créer un nouveau mobile pour le moment.');
    }
  }

  protected weightForId(weightId: string): HangingWeight {
    return (
      this.puzzle().weights.find((weight) => weight.id === weightId) ?? this.puzzle().weights[0]
    );
  }

  protected diagramWeightLabel(weightId: string): string {
    const weight = this.weightForId(weightId);

    if (!weight.known && this.answerFor(weight.id)) {
      return `Poids ${weight.label} proposé : ${this.answerFor(weight.id)} kilogrammes`;
    }

    return weight.known
      ? `Poids ${weight.label} donné : ${this.puzzle().solution[weight.id]} kilogrammes`
      : `Poids ${weight.label} à trouver`;
  }

  protected isHinted(weightId: string): boolean {
    return this.hintedWeightIds().has(weightId);
  }
}

function createHangingMobileLayout(root: HangingWeightBranchNode): HangingMobileLayout {
  const width = 760;
  const ceilingY = 28;
  const rootBarY = 102;
  const levelGap = 138;
  const leafDrop = 56;
  const weightBoxHeight = 46;
  const horizontalPadding = 62;
  const rawBars: RawMobileBarLayout[] = [];
  const rawConnectors: MobileConnectorLayout[] = [];
  const rawWeights: MobileWeightLayout[] = [];
  const allXPositions: number[] = [0];

  const visitBranch = (branch: HangingWeightBranchNode, pivotX: number, y: number): void => {
    const leftX = pivotX - branch.leftDistance;
    const rightX = pivotX + branch.rightDistance;

    rawBars.push({
      id: branch.id,
      pivotX,
      leftX,
      rightX,
      y,
      leftDistance: branch.leftDistance,
      rightDistance: branch.rightDistance,
    });
    allXPositions.push(leftX, pivotX, rightX);

    const visitChild = (child: HangingWeightNode, childX: number, side: string): void => {
      if (child.kind === 'weight') {
        const weightY = y + leafDrop;

        rawConnectors.push({
          id: `${branch.id}-${side}-poids`,
          x: childX,
          top: y,
          bottom: weightY,
        });
        rawWeights.push({ weightId: child.weightId, x: childX, y: weightY });
        allXPositions.push(childX);
        return;
      }

      const childY = y + levelGap;

      rawConnectors.push({
        id: `${branch.id}-${side}-${child.id}`,
        x: childX,
        top: y,
        bottom: childY,
      });
      visitBranch(child, childX, childY);
    };

    visitChild(branch.left, leftX, 'gauche');
    visitChild(branch.right, rightX, 'droite');
  };

  visitBranch(root, 0, rootBarY);

  const minX = Math.min(...allXPositions);
  const maxX = Math.max(...allXPositions);
  const span = Math.max(1, maxX - minX);
  const scale = Math.min(66, (width - horizontalPadding * 2) / span);
  const midpoint = (minX + maxX) / 2;
  const mapX = (x: number): number => width / 2 + (x - midpoint) * scale;
  const bars = rawBars.map((bar) => ({
    ...bar,
    pivotX: mapX(bar.pivotX),
    leftX: mapX(bar.leftX),
    rightX: mapX(bar.rightX),
    unitMarkers: [
      ...Array.from({ length: bar.leftDistance }, (_, index) => ({
        id: `${bar.id}-gauche-${index + 1}`,
        x: mapX(bar.pivotX - index - 1),
      })),
      ...Array.from({ length: bar.rightDistance }, (_, index) => ({
        id: `${bar.id}-droite-${index + 1}`,
        x: mapX(bar.pivotX + index + 1),
      })),
    ],
  }));
  const connectors = rawConnectors.map((connector) => ({
    ...connector,
    x: mapX(connector.x),
  }));
  const weights = rawWeights.map((weight) => ({ ...weight, x: mapX(weight.x) }));
  const height = Math.max(...weights.map((weight) => weight.y)) + weightBoxHeight + 38;

  return {
    width,
    height,
    ceilingY,
    rootX: mapX(0),
    rootBarY,
    bars,
    connectors,
    weights,
  };
}

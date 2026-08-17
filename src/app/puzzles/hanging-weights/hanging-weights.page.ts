import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CustomKeyboardComponent,
  CustomKeyboardKey,
} from '../shared/custom-keyboard/custom-keyboard.component';
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

type PlacementDragState = {
  pointerId: number;
  weightId: string;
  sourceSlotId: string | null;
  startX: number;
  startY: number;
  moved: boolean;
  overSlotId: string | null;
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
  imports: [RouterLink, PuzzleSuccessPopupComponent, CustomKeyboardComponent],
  templateUrl: './hanging-weights.page.html',
  styleUrl: './hanging-weights.page.scss',
})
export class HangingWeightsPage {
  private readonly hangingWeightsService = inject(HangingWeightsService);
  private placementDragCaptureTarget: HTMLElement | null = null;

  protected readonly puzzle = signal<HangingWeightPuzzle>(
    this.hangingWeightsService.createPuzzle(),
  );
  protected readonly answers = signal<Record<string, string>>({});
  protected readonly activeAnswerWeightId = signal<string | null>(null);
  protected readonly numberKeyboardRows: CustomKeyboardKey[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace'],
  ];
  protected readonly hintedWeightIds = signal<Set<string>>(new Set());
  protected readonly feedback = signal<HangingWeightFeedback | null>(null);
  protected readonly isSolved = signal(false);
  protected readonly generationError = signal<string | null>(null);
  protected readonly selectedPlacementWeightId = signal<string | null>(null);
  protected readonly placementDragState = signal<PlacementDragState | null>(null);
  protected readonly placements = signal<Record<string, string>>({});

  protected readonly layout = computed(() => createHangingMobileLayout(this.puzzle().root));
  protected readonly isPlacementMode = computed(() => this.puzzle().mode === 'placement');
  protected readonly availablePlacementWeights = computed(() => {
    const placedWeightIds = new Set(Object.values(this.placements()));

    return this.puzzle().weights.filter((weight) => !placedWeightIds.has(weight.id));
  });
  protected readonly placementCount = computed(() => Object.keys(this.placements()).length);
  protected readonly allPlaced = computed(() =>
    this.layout().weights.every((slot) => !!this.placements()[slot.weightId]),
  );
  protected readonly unknownWeights = computed(() =>
    this.puzzle().weights.filter((weight) => !weight.known),
  );
  protected readonly allAnswered = computed(() =>
    this.unknownWeights().every((weight) => this.answerFor(weight.id) !== ''),
  );
  protected readonly hasAvailableHint = computed(() =>
    (this.isPlacementMode() ? this.puzzle().weights : this.unknownWeights()).some(
      (weight) => !this.hintedWeightIds().has(weight.id),
    ),
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

    const value =
      event.target instanceof HTMLInputElement ? this.normalizeAnswer(event.target.value) : '';

    this.answers.update((answers) => ({ ...answers, [weightId]: value }));
    this.feedback.set(null);
    this.validateAnswers();
  }

  protected startPlacementWeightDrag(
    weightId: string,
    sourceSlotId: string | null,
    event: PointerEvent,
  ): void {
    if (
      !this.isPlacementMode() ||
      this.isSolved() ||
      this.isHinted(weightId) ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }

    if (!this.puzzle().weights.some((weight) => weight.id === weightId)) {
      return;
    }

    event.preventDefault();
    const target = event.currentTarget;

    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
      target.setPointerCapture?.(event.pointerId);
      this.placementDragCaptureTarget = target;
    }

    this.placementDragState.set({
      pointerId: event.pointerId,
      weightId,
      sourceSlotId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      overSlotId: sourceSlotId,
    });
  }

  protected startPlacementSlotDrag(slotId: string, event: PointerEvent): void {
    const placedWeightId = this.placedWeightIdFor(slotId);

    if (placedWeightId) {
      this.startPlacementWeightDrag(placedWeightId, slotId, event);
      return;
    }

    if (this.selectedPlacementWeightId() && !this.isSolved()) {
      event.preventDefault();
      this.placeSelectedPlacementWeight(slotId);
    }
  }

  @HostListener('document:pointermove', ['$event'])
  protected trackPlacementDrag(event: PointerEvent): void {
    const drag = this.placementDragState();

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const moved =
      drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 5;

    this.placementDragState.set({
      ...drag,
      moved,
      overSlotId: moved ? this.placementSlotAt(event.clientX, event.clientY) : drag.overSlotId,
    });
  }

  @HostListener('document:pointerup', ['$event'])
  protected finishPlacementDrag(event: PointerEvent): void {
    const drag = this.placementDragState();

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const moved =
      drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 5;
    const targetSlotId = moved ? this.placementSlotAt(event.clientX, event.clientY) : null;

    this.releasePlacementDragCapture(event.pointerId);
    this.placementDragState.set(null);

    if (!moved) {
      if (drag.sourceSlotId) {
        this.handlePlacementSlotSelection(drag.sourceSlotId);
      } else {
        this.selectPlacementWeight(drag.weightId);
      }
      return;
    }

    this.movePlacement(drag.weightId, targetSlotId);
  }

  @HostListener('document:pointercancel', ['$event'])
  protected cancelPlacementDrag(event: PointerEvent): void {
    const drag = this.placementDragState();

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    this.releasePlacementDragCapture(event.pointerId);
    this.placementDragState.set(null);
  }

  protected handlePlacementWeightKey(event: KeyboardEvent, weightId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.selectPlacementWeight(weightId);
  }

  protected handlePlacementSlotKey(event: KeyboardEvent, slotId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.handlePlacementSlotSelection(slotId);
  }

  protected placeSelectedPlacementWeight(slotId: string): void {
    const weightId = this.selectedPlacementWeightId();

    if (weightId) {
      this.movePlacement(weightId, slotId);
    }
  }

  protected placedWeightIdFor(slotId: string): string | null {
    return this.placements()[slotId] ?? null;
  }

  protected isPlacementSelected(weightId: string): boolean {
    return this.selectedPlacementWeightId() === weightId;
  }

  protected isPlacementDragging(weightId: string): boolean {
    return this.placementDragState()?.weightId === weightId;
  }

  protected isPlacementDropTarget(slotId: string): boolean {
    const drag = this.placementDragState();

    return !!drag?.moved && drag.overSlotId === slotId;
  }

  protected placementSlotAriaLabel(slotId: string): string {
    const weightId = this.placedWeightIdFor(slotId);

    if (!weightId) {
      return 'Emplacement vide. Choisis un poids puis active cet emplacement pour le placer.';
    }

    const weight = this.weightForId(weightId);

    return `Emplacement occupé par le poids ${weight.label}, ${this.puzzle().solution[weight.id]} kilogrammes. Sélectionne-le pour le déplacer.`;
  }

  protected activateAnswerInput(weightId: string, event: Event): void {
    if (this.isSolved() || this.hintedWeightIds().has(weightId)) {
      return;
    }

    if (!this.unknownWeights().some((weight) => weight.id === weightId)) {
      return;
    }

    this.activeAnswerWeightId.set(weightId);

    if (event.target instanceof HTMLInputElement) {
      event.target.select();
    }
  }

  protected handleKeyboardKey(key: CustomKeyboardKey): void {
    const weightId = this.activeAnswerWeightId();

    if (!weightId || this.isSolved() || this.hintedWeightIds().has(weightId)) {
      return;
    }

    const currentValue = this.answerFor(weightId);
    let nextValue: string;

    if (key === 'backspace') {
      nextValue = currentValue.slice(0, -1);
    } else if (key === 'clear') {
      nextValue = '';
    } else if (key === 'space') {
      return;
    } else if (/^\d$/.test(key)) {
      nextValue = this.normalizeAnswer(`${currentValue}${key}`);
    } else {
      return;
    }

    this.answers.update((answers) => ({ ...answers, [weightId]: nextValue }));
    this.feedback.set(null);
    this.validateAnswers();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected hideKeyboardWhenClickingAway(event: PointerEvent): void {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (
      target.closest('.unknown-node input') ||
      target.closest('button') ||
      target.closest('app-custom-keyboard') ||
      target.closest('app-puzzle-success-popup')
    ) {
      return;
    }

    this.activeAnswerWeightId.set(null);
  }

  protected answerFor(weightId: string): string {
    return this.answers()[weightId] ?? '';
  }

  private selectPlacementWeight(weightId: string): void {
    if (this.isSolved() || this.isHinted(weightId)) {
      return;
    }

    this.selectedPlacementWeightId.update((selectedWeightId) =>
      selectedWeightId === weightId ? null : weightId,
    );
    this.feedback.set(null);
  }

  private handlePlacementSlotSelection(slotId: string): void {
    if (this.isSolved()) {
      return;
    }

    const placedWeightId = this.placedWeightIdFor(slotId);
    const selectedWeightId = this.selectedPlacementWeightId();

    if (!selectedWeightId) {
      if (placedWeightId) {
        this.selectPlacementWeight(placedWeightId);
      }
      return;
    }

    if (selectedWeightId === placedWeightId) {
      this.selectedPlacementWeightId.set(null);
      return;
    }

    this.movePlacement(selectedWeightId, slotId);
  }

  private movePlacement(weightId: string, targetSlotId: string | null): void {
    if (this.isSolved() || !this.isPlacementMode() || this.isHinted(weightId)) {
      return;
    }

    const currentPlacements = this.placements();
    const sourceSlotId =
      Object.entries(currentPlacements).find(
        ([, placedWeightId]) => placedWeightId === weightId,
      )?.[0] ?? null;

    if (sourceSlotId === targetSlotId) {
      this.selectedPlacementWeightId.set(null);
      return;
    }

    const targetWeightId = targetSlotId ? currentPlacements[targetSlotId] : undefined;

    if (targetSlotId && this.isHinted(targetSlotId)) {
      this.feedback.set({
        tone: 'hint',
        text: 'Cet emplacement est fixé par un indice.',
      });
      return;
    }

    if (targetWeightId && this.isHinted(targetWeightId)) {
      this.feedback.set({
        tone: 'hint',
        text: 'Ce poids est fixé par un indice.',
      });
      return;
    }

    const nextPlacements = { ...currentPlacements };

    if (sourceSlotId) {
      delete nextPlacements[sourceSlotId];
    }

    if (targetSlotId) {
      if (targetWeightId && sourceSlotId) {
        nextPlacements[sourceSlotId] = targetWeightId;
      }

      nextPlacements[targetSlotId] = weightId;
    }

    this.placements.set(nextPlacements);
    this.selectedPlacementWeightId.set(null);
    this.feedback.set(null);
    this.validatePlacement();
  }

  private validatePlacement(): void {
    if (!this.allPlaced()) {
      this.feedback.set(null);
      return;
    }

    const placementSolution = Object.fromEntries(
      this.layout().weights.map((slot) => {
        const placedWeightId = this.placements()[slot.weightId];

        return [slot.weightId, this.puzzle().solution[placedWeightId]];
      }),
    );
    const isCorrect = this.hangingWeightsService.isPuzzleBalanced({
      ...this.puzzle(),
      solution: placementSolution,
    });

    if (!isCorrect) {
      this.feedback.set({
        tone: 'error',
        text: 'Le mobile ne serait pas équilibré avec cette disposition. Échange les poids qui ne sont pas au bon endroit.',
      });
      return;
    }

    this.feedback.set(null);
    this.isSolved.set(true);
    this.selectedPlacementWeightId.set(null);
  }

  private showPlacementHint(): void {
    const placements = this.placements();
    const hintSlot = this.layout().weights.find((slot) => {
      const placedWeightId = placements[slot.weightId];

      return (
        !this.isHinted(slot.weightId) &&
        placedWeightId !== slot.weightId &&
        !this.isHinted(placedWeightId ?? '')
      );
    });

    if (!hintSlot) {
      return;
    }

    const correctWeightId = hintSlot.weightId;
    const currentSlotId = Object.entries(placements).find(
      ([, placedWeightId]) => placedWeightId === correctWeightId,
    )?.[0];
    const nextPlacements = { ...placements };

    if (currentSlotId) {
      delete nextPlacements[currentSlotId];
    }

    delete nextPlacements[hintSlot.weightId];
    nextPlacements[hintSlot.weightId] = correctWeightId;

    this.placements.set(nextPlacements);
    this.selectedPlacementWeightId.set(null);
    this.hintedWeightIds.update((weightIds) => new Set([...weightIds, correctWeightId]));
    this.validatePlacement();

    if (!this.isSolved()) {
      const weight = this.weightForId(correctWeightId);

      this.feedback.set({
        tone: 'hint',
        text: `Indice : le poids ${weight.label} (${this.puzzle().solution[weight.id]} kg) doit être placé ici.`,
      });
    }
  }

  private placementSlotAt(clientX: number, clientY: number): string | null {
    const element = document.elementFromPoint(clientX, clientY);
    const slot = element?.closest('[data-hanging-slot]');

    return slot?.getAttribute('data-hanging-slot') ?? null;
  }

  private releasePlacementDragCapture(pointerId: number): void {
    if (this.placementDragCaptureTarget?.hasPointerCapture?.(pointerId)) {
      this.placementDragCaptureTarget.releasePointerCapture(pointerId);
    }

    this.placementDragCaptureTarget = null;
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
    this.activeAnswerWeightId.set(null);
  }

  protected showHint(): void {
    if (this.isSolved()) {
      return;
    }

    if (this.isPlacementMode()) {
      this.showPlacementHint();
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
    this.activeAnswerWeightId.set(null);
    this.hintedWeightIds.update((weightIds) => new Set([...weightIds, hintWeight.id]));
    this.feedback.set({
      tone: 'hint',
      text: `Indice : le poids ${hintWeight.label} vaut ${value} kg.`,
    });
    this.validateAnswers();
  }

  protected resetPuzzle(): void {
    this.answers.set({});
    this.activeAnswerWeightId.set(null);
    this.hintedWeightIds.set(new Set());
    this.selectedPlacementWeightId.set(null);
    this.placementDragState.set(null);
    this.placements.set({});
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

  private normalizeAnswer(value: string): string {
    return value.replace(/\D/g, '').slice(0, 2);
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

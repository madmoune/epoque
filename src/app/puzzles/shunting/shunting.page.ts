import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  createShuntingState,
  isShuntLinkOpen,
  isSwitchDiverging,
  moveShuntingTrain,
  parkedTrainCount,
  SHUNT_CROSSOVERS,
  SHUNT_MAIN_LINES,
  SHUNT_NODES,
  SHUNT_STOPS,
  SHUNT_SWITCHES,
  SHUNT_TRAINS,
  shuntingRoutes,
  ShuntingState,
} from './shunting.logic';

interface TrainDrag {
  train: number;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
  target: number | null;
}

function railPath(nodes: readonly number[]): string {
  return nodes
    .map((node, index) => {
      const { x, y } = SHUNT_NODES[node];
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

@Component({
  selector: 'app-shunting-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './shunting.page.html',
  styleUrl: './shunting.page.scss',
})
export class ShuntingPage {
  private readonly document = inject(DOCUMENT);
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly initial = signal(createShuntingState());
  private readonly notice = signal('');
  private recordedWin = false;

  protected readonly nodes = SHUNT_NODES;
  protected readonly trains = SHUNT_TRAINS;
  protected readonly stops = SHUNT_STOPS.map((stop) => ({
    ...stop,
    bay: SHUNT_TRAINS.find(({ bay }) => bay === stop.node),
  }));
  protected readonly tracks = [...SHUNT_CROSSOVERS, ...SHUNT_MAIN_LINES].map(railPath);
  protected readonly state = signal(this.initial());
  protected readonly history = signal<readonly ShuntingState[]>([]);
  protected readonly drag = signal<TrainDrag | null>(null);
  protected readonly keyboardTrain = signal<number | null>(null);
  protected readonly selectedTrain = computed(() => this.drag()?.train ?? this.keyboardTrain());
  protected readonly parked = computed(() => parkedTrainCount(this.state()));
  protected readonly solved = computed(() => this.parked() === SHUNT_TRAINS.length);
  protected readonly feedback = computed(
    () => this.notice() || `${this.parked()} / ${SHUNT_TRAINS.length} trains stationnés`,
  );
  protected readonly reachable = computed(() => {
    const train = this.selectedTrain();
    return train === null
      ? new Map<number, readonly number[]>()
      : shuntingRoutes(this.state(), train);
  });
  protected readonly previewPath = computed(() => {
    const target = this.drag()?.target;
    const route = target == null ? undefined : this.reachable().get(target);
    return route ? railPath(route) : null;
  });
  protected readonly connectedBranches = computed(() =>
    SHUNT_CROSSOVERS.filter(([from, to]) => isShuntLinkOpen(this.state().switches, from, to)).map(
      railPath,
    ),
  );
  protected readonly turnouts = computed(() =>
    SHUNT_SWITCHES.map((turnout, index) => {
      const diverging = isSwitchDiverging(this.state().switches, index);
      const point = SHUNT_NODES[turnout.node];
      const toward = (node: number, ratio: number) => {
        const arm = SHUNT_NODES[node];
        return `${point.x + (arm.x - point.x) * ratio} ${point.y + (arm.y - point.y) * ratio}`;
      };
      const route = `M ${toward(turnout.stem, 0.72)} L ${point.x} ${point.y} L ${toward(
        diverging ? turnout.branch : turnout.straight,
        diverging ? 0.32 : 0.72,
      )}`;
      return { point, route, diverging };
    }),
  );

  protected toggleSwitch(index: number): void {
    if (this.solved() || this.drag()) return;
    const state = this.state();
    this.record({ ...state, switches: state.switches ^ (1 << index) });
  }

  protected beginDrag(train: number, event: PointerEvent): void {
    if (event.button !== 0 || this.drag() || this.solved()) return;
    this.keyboardTrain.set(null);
    this.notice.set('');
    this.drag.set({
      train,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      target: null,
    });
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  protected moveDrag(event: PointerEvent): void {
    const drag = this.drag();
    if (!drag || drag.pointerId !== event.pointerId) return;
    const { clientX: x, clientY: y } = event;
    if (!drag.moved && Math.hypot(x - drag.startX, y - drag.startY) < 6) return;

    const board = event.currentTarget as HTMLElement;
    const stop = this.document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-shunt-stop]');
    const target = stop && board.contains(stop) ? Number(stop.dataset['shuntStop']) : null;
    this.drag.set({ ...drag, moved: true, x, y, target });
  }

  protected endDrag(event: PointerEvent): void {
    if (this.drag()?.pointerId !== event.pointerId) return;
    this.moveDrag(event);
    const drag = this.drag()!;
    this.drag.set(null);
    if (!drag.moved) return;
    if (drag.target === null) {
      this.notice.set('Dépose le train sur un repère éclairé.');
    } else {
      this.placeTrain(drag.train, drag.target);
    }
  }

  protected cancelDrag(event: PointerEvent): void {
    if (this.drag()?.pointerId === event.pointerId) this.drag.set(null);
  }

  protected selectTrain(train: number, event: MouseEvent): void {
    if (event.detail !== 0 || this.drag() || this.solved()) return;
    this.keyboardTrain.update((picked) => (picked === train ? null : train));
    this.notice.set('');
  }

  protected activateStop(node: number, event: MouseEvent): void {
    const train = this.keyboardTrain();
    if (event.detail === 0 && train !== null && !this.drag() && !this.solved()) {
      this.placeTrain(train, node);
    }
  }

  protected undo(): void {
    const history = this.history();
    const previous = history.at(-1);
    if (!previous || this.drag()) return;
    this.history.set(history.slice(0, -1));
    this.state.set(previous);
    this.clearSelection();
  }

  protected restart(): void {
    this.recordedWin = false;
    this.drag.set(null);
    this.state.set(this.initial());
    this.history.set([]);
    this.clearSelection();
  }

  protected newPuzzle(): void {
    this.initial.update((previous) => createShuntingState(previous));
    this.restart();
  }

  private placeTrain(train: number, target: number): void {
    const current = this.state();
    if (current.positions[train] === target) return;
    const next = moveShuntingTrain(current, train, target);
    if (next === current) {
      this.notice.set(
        current.positions.includes(target)
          ? 'Cette place est occupée. Choisis un repère libre.'
          : 'Vérifie les aiguillages et libère le trajet vers ce repère.',
      );
      return;
    }

    this.record(next);
    this.clearSelection();
    if (this.solved() && !this.recordedWin) {
      this.recordedWin = true;
      this.playHistory.markSolved('/triage-ferroviaire');
    }
  }

  private record(next: ShuntingState): void {
    this.history.update((history) => [...history, this.state()]);
    this.state.set(next);
    this.notice.set('');
  }

  private clearSelection(): void {
    this.keyboardTrain.set(null);
    this.notice.set('');
  }
}

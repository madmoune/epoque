import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  Bridge,
  bridgeDestination,
  bridgeId,
  BRIDGE_MAP_HEIGHT,
  BRIDGE_MAP_WIDTH,
  createBridgePuzzle,
  findBridgeHint,
} from './island-bridges.logic';

const ROUTE = '/ponts-et-iles';

@Component({
  selector: 'app-island-bridges-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './island-bridges.page.html',
  styleUrl: './island-bridges.page.scss',
})
export class IslandBridgesPage {
  private readonly playHistory = inject(PuzzlePlayHistoryService);
  private readonly injector = inject(Injector);
  private readonly map = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly undoButton = viewChild.required<ElementRef<HTMLButtonElement>>('undoButton');
  private readonly notice = signal('');

  protected readonly width = BRIDGE_MAP_WIDTH;
  protected readonly height = BRIDGE_MAP_HEIGHT;
  protected readonly puzzle = signal(createBridgePuzzle());
  protected readonly path = signal<readonly number[]>([]);
  protected readonly hinted = signal<string | null>(null);
  protected readonly current = computed(() => this.path().at(-1) ?? null);
  protected readonly crossed = computed(() => {
    const path = this.path();
    return new Set(path.slice(1).map((island, index) => bridgeId(path[index], island)));
  });
  protected readonly remaining = computed(() =>
    this.puzzle().bridges.filter((bridge) => !this.crossed().has(bridge.id)),
  );
  protected readonly destinations = computed(() => {
    const from = this.current();
    const destinations = new Map<number, Bridge>();
    for (const bridge of this.remaining()) {
      const to = bridgeDestination(bridge, from);
      if (to !== null) destinations.set(to, bridge);
    }
    return destinations;
  });
  protected readonly solved = computed(() => this.remaining().length === 0);
  protected readonly feedback = computed(() => {
    if (this.solved()) return 'Tu as traversé tous les ponts une seule fois.';
    const current = this.current();
    if (current === null) return 'Choisis ton île de départ.';
    if (this.notice()) return this.notice();
    if (!this.destinations().size) return `Tu es bloqué sur l’île ${current}. Annule un passage.`;
    return `Tu es sur l’île ${current}. Choisis un pont en surbrillance.`;
  });
  protected readonly layout = computed(() => {
    const { islands, bridges } = this.puzzle();
    const points = new Map(islands.map((island) => [island.id, island]));
    return bridges.map((bridge) => {
      const from = points.get(bridge.from)!;
      const to = points.get(bridge.to)!;
      return {
        bridge,
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
        length: Math.hypot(to.x - from.x, to.y - from.y),
        angle: Math.atan2(to.y - from.y, to.x - from.x),
      };
    });
  });

  protected selectIsland(island: number, event: MouseEvent): void {
    if (this.solved()) return;
    const bridge = this.destinations().get(island);
    if (bridge) {
      this.crossBridge(bridge, event);
    } else if (this.current() === null) {
      this.path.set([island]);
      this.clearHint();
      this.focusNextBridge(event);
    }
  }

  protected crossBridge(bridge: Bridge, event: MouseEvent): void {
    const to = bridgeDestination(bridge, this.current());
    if (to === null || this.crossed().has(bridge.id) || this.solved()) return;
    this.path.update((path) => [...path, to]);
    this.clearHint();
    if (this.solved()) {
      this.playHistory.markSolved(ROUTE);
    } else {
      this.focusNextBridge(event);
    }
  }

  protected undo(): void {
    if (this.path().length <= 1 || this.solved()) return;
    this.path.update((path) => path.slice(0, -1));
    this.clearHint();
  }

  protected hint(): void {
    const current = this.current();
    if (current === null || this.solved()) return;
    const bridge = findBridgeHint(this.remaining(), current);
    this.hinted.set(bridge?.id ?? null);
    this.notice.set(
      bridge
        ? `Essaie le pont qui mène à l’île ${bridgeDestination(bridge, current)}.`
        : 'Annule un ou plusieurs passages pour retrouver un trajet complet.',
    );
  }

  protected restart(): void {
    this.path.set([]);
    this.clearHint();
  }

  protected newPuzzle(): void {
    this.puzzle.update((previous) => createBridgePuzzle(previous));
    this.restart();
  }

  private clearHint(): void {
    this.hinted.set(null);
    this.notice.set('');
  }

  private focusNextBridge(event: MouseEvent): void {
    if (event.detail !== 0) return;
    afterNextRender(
      () => {
        const next = this.map().nativeElement.querySelector<HTMLButtonElement>('.bridge.available');
        (next ?? this.undoButton().nativeElement).focus();
      },
      { injector: this.injector },
    );
  }
}

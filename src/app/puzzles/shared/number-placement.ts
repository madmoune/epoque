import { signal } from '@angular/core';

const DRAG_THRESHOLD = 6;

interface DragPosition {
  number: number;
  x: number;
  y: number;
}

export class NumberDrag {
  private pointer: (DragPosition & { id: number }) | null = null;
  private ignorePointerClick = false;
  readonly preview = signal<DragPosition | null>(null);

  constructor(
    private readonly document: Document,
    private readonly onDragStart: () => void,
  ) {}

  blocksClick(event: MouseEvent): boolean {
    return this.pointer !== null || (event.detail > 0 && this.ignorePointerClick);
  }

  begin(event: PointerEvent): void {
    if (this.pointer || event.button !== 0 || !(event.target instanceof Element)) return;

    this.ignorePointerClick = false;
    const source = event.target.closest<HTMLButtonElement>('[data-drag-number]');
    if (!source) return;

    this.pointer = {
      id: event.pointerId,
      number: Number(source.dataset['dragNumber']),
      x: event.clientX,
      y: event.clientY,
    };
    source.setPointerCapture?.(event.pointerId);
  }

  move(event: PointerEvent): void {
    const pointer = this.pointer;
    if (!pointer || pointer.id !== event.pointerId) return;
    if (!this.preview()) {
      if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < DRAG_THRESHOLD) return;
      this.onDragStart();
    }
    this.preview.set({ number: pointer.number, x: event.clientX, y: event.clientY });
  }

  end(event: PointerEvent): { number: number; cell: number | null } | undefined {
    const pointer = this.pointer;
    if (!pointer || pointer.id !== event.pointerId) return undefined;
    this.move(event);
    const dragged = this.preview() !== null;
    this.cancel(event);
    if (!dragged) return undefined;

    // Pointer capture can send a click to the source after the drop.
    this.ignorePointerClick = true;
    const target = this.document.elementFromPoint(event.clientX, event.clientY);
    if (!target || !(event.currentTarget as HTMLElement).contains(target)) return undefined;

    const cell = target.closest<HTMLElement>('[data-placement-cell]');
    if (cell) return { number: pointer.number, cell: Number(cell.dataset['placementCell']) };
    if (target.closest('.number-tray')) return { number: pointer.number, cell: null };
    return undefined;
  }

  cancel(event: PointerEvent): void {
    if (this.pointer?.id === event.pointerId) {
      this.pointer = null;
      this.preview.set(null);
    }
  }

  reset(): void {
    this.pointer = null;
    this.preview.set(null);
    this.ignorePointerClick = false;
  }
}

export function placeNumber(
  values: readonly (number | null)[],
  number: number,
  index: number,
): (number | null)[] {
  const next = [...values];
  const source = next.indexOf(number);
  if (source >= 0) next[source] = next[index];
  next[index] = number;
  return next;
}

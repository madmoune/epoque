import {
  afterRenderEffect,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { Clue, DiagramEdge, DrawingMark, Tone } from './cadenas-mystere.model';

@Component({
  selector: 'app-cadenas-mystere-diagram',
  template: `
    @let figure = drawing();
    <div class="drawing" [style.width.px]="figure.width">
      <canvas
        #canvas
        role="img"
        [attr.aria-label]="figure.description"
        [attr.width]="figure.width * 2"
        [attr.height]="figure.height * 2"
      ></canvas>
      @for (edge of figure.edges; track $index) {
        @let strokes = traces()[$index] ?? 0;
        @let vertical = edge.from[0] === edge.to[0];
        <button
          type="button"
          data-board-cell
          class="drawing-edge"
          [class.vertical]="vertical"
          [class.bridge]="edge.double"
          [class.double]="strokes === 2"
          [style.left.%]="((edge.from[0] + edge.to[0]) / 2 / figure.width) * 100"
          [style.top.%]="((edge.from[1] + edge.to[1]) / 2 / figure.height) * 100"
          [style.--edge-length.%]="edgeLength(edge, figure)"
          [attr.aria-pressed]="strokes > 0"
          [attr.aria-label]="edge.description + (edge.double ? ' · ' + strokes + '/2' : '')"
          (click)="toggleEdge(edge, $index)"
        ></button>
      }
    </div>
  `,
  styleUrl: './cadenas-mystere-diagram.component.scss',
})
export class CadenasMystereDiagramComponent {
  readonly drawing = input.required<Extract<Clue, { kind: 'diagram' }>>();
  readonly round = input.required<number>();
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly traces = linkedSignal<Partial<Record<number, number>>>(() => {
    this.drawing();
    this.round();
    return {};
  });

  constructor() {
    const document = inject(ElementRef<HTMLElement>).nativeElement.ownerDocument;
    const repaint = () => {
      const canvas = this.canvas()?.nativeElement;
      if (canvas) this.paint(canvas, this.drawing());
    };
    afterRenderEffect(repaint);

    const observer = new MutationObserver(repaint);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  protected edgeLength(edge: DiagramEdge, drawing: { width: number; height: number }): number {
    const width = Math.abs(edge.to[0] - edge.from[0]);
    const height = Math.abs(edge.to[1] - edge.from[1]);
    return 100 * (width ? width / drawing.width : height / drawing.height);
  }

  protected toggleEdge(edge: DiagramEdge, index: number): void {
    this.traces.update((traces) => ({
      ...traces,
      [index]: ((traces[index] ?? 0) + 1) % (edge.double ? 3 : 2),
    }));
  }

  private paint(canvas: HTMLCanvasElement, drawing: Extract<Clue, { kind: 'diagram' }>): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const theme = getComputedStyle(canvas);
    const palette: Record<Tone, string> = {
      ink: theme.getPropertyValue('--text').trim() || '#edf3f1',
      muted: theme.getPropertyValue('--muted').trim() || '#9aa9a5',
      accent: theme.getPropertyValue('--accent').trim() || '#df9a75',
      focus: theme.getPropertyValue('--focus').trim() || '#81c9bf',
      paper: theme.getPropertyValue('--surface-raised').trim() || '#202c27',
    };

    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, drawing.width, drawing.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const mark of drawing.marks) this.paintMark(ctx, mark, palette);
  }

  private paintMark(
    ctx: CanvasRenderingContext2D,
    mark: DrawingMark,
    palette: Record<Tone, string>,
  ): void {
    switch (mark.kind) {
      case 'line':
        ctx.beginPath();
        ctx.lineWidth = mark.width;
        ctx.setLineDash(mark.dashed ? [4, 4] : []);
        ctx.strokeStyle = palette[mark.tone];
        ctx.moveTo(...mark.from);
        ctx.lineTo(...mark.to);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'dot':
        ctx.beginPath();
        ctx.arc(...mark.at, mark.radius, 0, 2 * Math.PI);
        ctx.fillStyle = palette[mark.fill];
        ctx.fill();
        if (mark.stroke) {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = palette[mark.stroke];
          ctx.stroke();
        }
        break;
      case 'box':
        if (mark.fill) {
          ctx.fillStyle = palette[mark.fill];
          ctx.fillRect(...mark.at, mark.width, mark.height);
        }
        if (mark.stroke) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = palette[mark.stroke];
          ctx.strokeRect(...mark.at, mark.width, mark.height);
        }
        break;
      case 'label':
        ctx.font = `700 ${mark.size}px system-ui, sans-serif`;
        ctx.fillStyle = palette[mark.tone];
        ctx.fillText(mark.text, ...mark.at);
        break;
    }
  }
}

import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { RailwayPage } from './railway.page';

describe('RailwayPage', () => {
  let fixture: ComponentFixture<RailwayPage>;
  let root: HTMLElement;
  let grid: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [RailwayPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RailwayPage);
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    grid = root.querySelector<HTMLElement>('.rail-grid')!;
    vi.spyOn(grid, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 256, 256));
  });

  function pointer(type: string, cell: number): void {
    const size = fixture.componentInstance['puzzle']().size;
    grid.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 1,
        pointerType: 'touch',
        button: 0,
        clientX: ((cell % size.columns) + 0.5) * (256 / size.columns),
        clientY: (Math.floor(cell / size.columns) + 0.5) * (256 / size.rows),
      }),
    );
    fixture.detectChanges();
  }

  function command(label: string): void {
    [...root.querySelectorAll<HTMLButtonElement>('.game-actions button')]
      .find((button) => button.textContent?.trim() === label)!
      .click();
    fixture.detectChanges();
  }

  function rightClick(cell: number): void {
    root
      .querySelectorAll<HTMLButtonElement>('.rail-cell')
      [cell].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2 }));
    fixture.detectChanges();
  }

  it('bars an empty cell with the right mouse button', () => {
    const page = fixture.componentInstance;
    const { columns } = page['puzzle']().size;
    const cell = columns + Math.floor(columns / 2);
    const target = root.querySelectorAll<HTMLButtonElement>('.rail-cell')[cell];

    rightClick(cell);
    expect(target.classList.contains('crossed')).toBe(true);
    expect(page['undoStates']()).toHaveLength(1);

    rightClick(cell);
    expect(target.classList.contains('crossed')).toBe(false);
    expect(page['undoStates']()).toHaveLength(2);
  });

  it('cycles a cell from empty to crossed, marked and empty', () => {
    const page = fixture.componentInstance;
    const { columns } = page['puzzle']().size;
    const cell = columns + Math.floor(columns / 2);
    const target = root.querySelectorAll<HTMLButtonElement>('.rail-cell')[cell];

    pointer('pointerdown', cell);
    pointer('pointerup', cell);
    expect(target.classList.contains('crossed')).toBe(true);

    pointer('pointerdown', cell);
    pointer('pointerup', cell);
    expect(target.classList.contains('crossed')).toBe(false);
    expect(target.classList.contains('marked')).toBe(true);
    expect(target.querySelector('.rail-mark')).not.toBeNull();

    pointer('pointerdown', cell);
    pointer('pointerup', cell);
    expect(target.classList.contains('marked')).toBe(false);
    expect(target.querySelector('.cross, .rail-mark')).toBeNull();
  });

  it('marks empty squares, reverses a stroke, and restores it with undo and redo', () => {
    const page = fixture.componentInstance;
    const { columns } = page['puzzle']().size;
    const rowStart = columns;
    const crossCell = rowStart + Math.floor(columns / 2);
    const rowEnd = rowStart + columns - 1;

    pointer('pointerdown', crossCell);
    pointer('pointerup', crossCell);
    expect(grid.querySelectorAll('.rail-cell')[crossCell].classList.contains('crossed')).toBe(true);

    pointer('pointerdown', rowStart);
    pointer('pointermove', rowEnd);
    pointer('pointerup', rowEnd);
    expect(page['progress']().neighbors[crossCell]).toEqual([crossCell - 1, crossCell + 1]);
    expect(grid.querySelector('.cross')).toBeNull();

    command('Annuler');
    expect(page['progress']().neighbors[crossCell]).toEqual([]);
    expect(grid.querySelector('.cross')).not.toBeNull();
    command('Rétablir');
    expect(page['progress']().neighbors[crossCell]).toEqual([crossCell - 1, crossCell + 1]);

    pointer('pointerdown', rowEnd);
    pointer('pointermove', rowStart);
    pointer('pointercancel', rowStart);
    expect(page['progress']().neighbors[crossCell]).toEqual([crossCell - 1, crossCell + 1]);
    pointer('pointerdown', rowEnd);
    pointer('pointerup', rowStart);
    expect(page['progress']().neighbors[crossCell]).toEqual([]);
    expect(markSolved).not.toHaveBeenCalled();
  });

  it('records completion after releasing the final stroke and starts the train', () => {
    const puzzle = fixture.componentInstance['puzzle']();
    const [first, ...remaining] = puzzle.solution;
    pointer('pointerdown', first);
    remaining.forEach((cell) => pointer('pointermove', cell));
    expect(markSolved).not.toHaveBeenCalled();
    pointer('pointerup', puzzle.end.cell);

    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Voie terminée');
    expect(root.querySelector('.rail-grid animateMotion')?.getAttribute('path')).toMatch(/^M /);
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/voie-ferree');
    command('Annuler');
    expect(root.querySelector('[role="alert"]')).toBeNull();
    command('Rétablir');
    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    expect(markSolved).toHaveBeenCalledTimes(1);

    command('Nouvelle grille');
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(root.querySelectorAll('.rail-grid .track-bed')).toHaveLength(2);
  });

  it('offers larger board sizes, a hint, and no separate route preview', () => {
    const page = fixture.componentInstance;
    const sizeSelect = root.querySelector<HTMLSelectElement>('#rail-size')!;
    expect(page['puzzle']().size.id).toBe('6x5');
    expect(root.querySelectorAll('.rail-cell')).toHaveLength(30);
    expect([...sizeSelect.options].map((option) => option.textContent?.trim())).toEqual([
      '4 × 4',
      '5 × 5',
      '6 × 5',
    ]);
    expect(root.querySelector('.preview')).toBeNull();
    expect(root.textContent).not.toContain('Aperçu de la voie');

    command('Indice');
    expect(root.querySelectorAll('.rail-cell.hinted')).toHaveLength(2);
    expect(page['feedback']()).toContain('Indice');

    sizeSelect.value = '5x5';
    sizeSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(page['puzzle']().size.id).toBe('5x5');
    expect(root.querySelectorAll('.rail-cell')).toHaveLength(25);

    sizeSelect.value = '6x5';
    sizeSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(page['puzzle']().size.id).toBe('6x5');
    expect(root.querySelectorAll('.rail-cell')).toHaveLength(30);
  });
});

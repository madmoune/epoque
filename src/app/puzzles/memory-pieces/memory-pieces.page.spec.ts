import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { canSnapPiece } from './memory-pieces.generator';
import { MEMORY_SNAP_DISTANCE, MemoryPuzzlePiece } from './memory-pieces.model';
import { MemoryPiecesPage } from './memory-pieces.page';

describe('MemoryPiecesPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryPiecesPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function createPage() {
    const fixture = TestBed.createComponent(MemoryPiecesPage);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
  }

  function enterAssembly(page: MemoryPiecesPage) {
    page['startRecognition']();
    for (const piece of page['puzzle']().pieces) page['recognizePiece'](piece.id);
  }

  it('shows five study pieces, then hides them and shows ten choices', () => {
    const { fixture, page, root } = createPage();
    expect(root.querySelectorAll('.study-piece')).toHaveLength(5);
    expect(root.querySelector('.assembly-board')).toBeNull();
    page['startRecognition']();
    fixture.detectChanges();
    expect(root.querySelector('.study-grid')).toBeNull();
    expect(root.querySelectorAll('.choice-grid button')).toHaveLength(10);
    expect(root.querySelector('.assembly-board')).toBeNull();
    expect(document.activeElement).toBe(root.querySelector('#recognize-title'));
  });

  it('rejects decoys and repeated choices without unlocking assembly early', () => {
    const { page } = createPage();
    const pieces = page['puzzle']().pieces;
    page['recognizePiece'](pieces[0].id);
    expect(page['foundIds']().size).toBe(0);
    page['startRecognition']();
    page['recognizePiece']('unknown');
    page['recognizePiece']('decoy-0');
    page['recognizePiece']('decoy-0');
    expect(page['mistakes']()).toBe(1);
    expect(page['foundIds']().size).toBe(0);
    for (const piece of pieces.slice(0, 4)) {
      page['recognizePiece'](piece.id);
      page['recognizePiece'](piece.id);
    }
    expect(page['foundIds']().size).toBe(4);
    expect(page['phase']()).toBe('recognize');
    page['recognizePiece'](pieces[4].id);
    expect(page['phase']()).toBe('assemble');
    expect(page['isSolved']()).toBe(false);
  });

  it('lets pieces move freely and succeeds only when all five reach their targets', () => {
    const { fixture, page, root } = createPage();
    enterAssembly(page);
    fixture.detectChanges();
    expect(root.querySelectorAll('.tray-grid button')).toHaveLength(5);
    expect(root.querySelector('.choice-grid')).toBeNull();
    expect(document.activeElement).toBe(root.querySelector('#assemble-title'));
    expect(root.querySelector('.target-silhouette')).toBeNull();
    expect(root.textContent).toContain('Assemble les morceaux');
    expect(root.textContent).toContain('Sélectionne un morceau pour commencer');
    const pieces = page['puzzle']().pieces;
    const freeCenter = distantCenter(pieces);
    page['selectPiece'](pieces[0].id);
    page['attemptPlacement'](freeCenter);
    expect(page['placedIds']().size).toBe(1);
    expect(page['placedCenters']()[pieces[0].id]).toEqual(freeCenter);
    expect(page['isSolved']()).toBe(false);
    page['selectPlacedPiece'](pieces[0].id);
    page['attemptPlacement'](centerOf(pieces[0]));
    expect(page['isSolved']()).toBe(false);
    expect(page['snappedIds']().has(pieces[0].id)).toBe(true);
    for (const piece of pieces.slice(1)) {
      page['selectPiece'](piece.id);
      page['attemptPlacement'](centerOf(piece));
    }
    fixture.detectChanges();
    expect(page['isSolved']()).toBe(true);
    expect(page['feedback']()).toContain('Bravo!');
    expect(root.querySelectorAll('.placed-shape')).toHaveLength(5);
    expect(root.querySelectorAll('.tray-grid button')).toHaveLength(0);
    expect(root.querySelector('app-puzzle-success-popup')?.textContent).toContain(
      'Casse-tête complété!',
    );
  });

  it('magnetizes a nearby drop and recognizes it without locking the piece', () => {
    const { fixture, page, root } = createPage();
    enterAssembly(page);
    fixture.detectChanges();
    const piece = page['puzzle']().pieces[0];
    const center = centerOf(piece);
    page['selectPiece'](piece.id);
    page['attemptPlacement']({
      x: center.x + MEMORY_SNAP_DISTANCE - 0.25,
      y: center.y,
    });
    expect(page['placedCenters']()[piece.id].x).toBeCloseTo(center.x);
    expect(page['placedCenters']()[piece.id].y).toBeCloseTo(center.y);
    expect(page['snappedIds']().has(piece.id)).toBe(true);
    fixture.detectChanges();
    expect(root.querySelector('.snapped-shape')).not.toBeNull();

    page['selectPlacedPiece'](piece.id);
    page['attemptPlacement']({ x: center.x + MEMORY_SNAP_DISTANCE + 1, y: center.y });
    expect(page['snappedIds']().has(piece.id)).toBe(false);
    expect(page['placedCenters']()[piece.id].x).toBeCloseTo(center.x + MEMORY_SNAP_DISTANCE + 1);
  });

  it('supports keyboard movement and placement with Enter', () => {
    const { fixture, page, root } = createPage();
    enterAssembly(page);
    fixture.detectChanges();
    const piece = page['puzzle']().pieces[0];
    page['selectPiece'](piece.id);
    const center = centerOf(piece);
    page['previewCenter'].set({ x: center.x - 3, y: center.y });
    const board = root.querySelector<HTMLElement>('.assembly-board')!;
    board.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(page['previewCenter']()?.x).toBeCloseTo(center.x);
    board.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(page['placedIds']().has(piece.id)).toBe(true);
    expect(page['placedCenters']()[piece.id]).toEqual(center);
  });

  it('supports dragging into the board and cancels interrupted gestures', () => {
    const { fixture, page, root } = createPage();
    enterAssembly(page);
    fixture.detectChanges();
    const board = root.querySelector<HTMLElement>('.assembly-board')!;
    vi.spyOn(board, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      width: 400,
      height: 400,
    } as DOMRect);
    const piece = page['puzzle']().pieces[0];
    const center = centerOf(piece);
    const pointer = (x: number, y: number, pointerId = 1) =>
      ({
        button: 0,
        clientX: x,
        clientY: y,
        pointerId,
        currentTarget: null,
        stopPropagation: vi.fn(),
      }) as unknown as PointerEvent;
    page['startDrag'](piece.id, pointer(500, 100));
    const nearCenter = { x: center.x + MEMORY_SNAP_DISTANCE - 0.5, y: center.y };
    page['moveDrag'](pointer(10 + nearCenter.x * 4, 20 + nearCenter.y * 4, 2));
    expect(page['drag']()?.active).toBe(false);
    page['moveDrag'](pointer(10 + nearCenter.x * 4, 20 + nearCenter.y * 4));
    expect(page['pointerOverBoard']()).toBe(true);
    expect(page['previewCenter']()?.x).toBeCloseTo(nearCenter.x);
    page['finishDrag'](pointer(10 + nearCenter.x * 4, 20 + nearCenter.y * 4));
    expect(page['placedIds']().has(piece.id)).toBe(true);
    expect(page['placedCenters']()[piece.id].x).toBeCloseTo(center.x);
    expect(page['placedCenters']()[piece.id].y).toBeCloseTo(center.y);
    expect(page['snappedIds']().has(piece.id)).toBe(true);
    expect(page['drag']()).toBeNull();
    page['startPlacedDrag'](piece.id, pointer(10 + center.x * 4, 20 + center.y * 4));
    const freeCenter = distantCenter([piece]);
    page['moveDrag'](pointer(10 + freeCenter.x * 4, 20 + freeCenter.y * 4));
    page['finishDrag'](pointer(10 + freeCenter.x * 4, 20 + freeCenter.y * 4));
    expect(page['placedCenters']()[piece.id].x).toBeCloseTo(freeCenter.x);
    expect(page['placedCenters']()[piece.id].y).toBeCloseTo(freeCenter.y);
    expect(page['isSolved']()).toBe(false);
    const nextPiece = page['puzzle']().pieces[1];
    page['startDrag'](nextPiece.id, pointer(500, 100));
    page['moveDrag'](pointer(250, 200));
    page['cancelDrag'](pointer(250, 200));
    expect(page['drag']()).toBeNull();
    expect(page['placedIds']().size).toBe(1);
  });

  it('resets assembly independently and starts a fresh memory round when replaying', () => {
    const { fixture, page, root } = createPage();
    page['startRecognition']();
    page['recognizePiece']('decoy-0');
    for (const piece of page['puzzle']().pieces) page['recognizePiece'](piece.id);
    const oldPuzzle = page['puzzle']();
    const piece = oldPuzzle.pieces[0];
    page['selectPiece'](piece.id);
    page['attemptPlacement'](centerOf(piece));
    page['resetAssembly']();
    expect(page['placedIds']().size).toBe(0);
    expect(page['placedCenters']()).toEqual({});
    expect(page['foundIds']().size).toBe(5);
    expect(page['mistakes']()).toBe(1);
    page['newGame']();
    fixture.detectChanges();
    expect(page['puzzle']()).not.toBe(oldPuzzle);
    expect(page['phase']()).toBe('memorize');
    expect(page['mistakes']()).toBe(0);
    expect(page['foundIds']().size).toBe(0);
    expect(page['rejectedIds']().size).toBe(0);
    expect(page['selectedPieceId']()).toBeNull();
    expect(root.querySelectorAll('.study-piece')).toHaveLength(5);
  });
});

function centerOf(piece: MemoryPuzzlePiece) {
  return { x: piece.target.x + piece.width / 2, y: piece.target.y + piece.height / 2 };
}

function distantCenter(pieces: MemoryPuzzlePiece[]) {
  const candidates = [
    { x: 2, y: 2 },
    { x: 2, y: 98 },
    { x: 98, y: 2 },
    { x: 98, y: 98 },
    { x: 50, y: 2 },
    { x: 2, y: 50 },
    { x: 98, y: 50 },
    { x: 50, y: 98 },
  ];
  return candidates.find((candidate) => pieces.every((piece) => !canSnapPiece(piece, candidate)))!;
}

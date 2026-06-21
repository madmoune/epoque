import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type PuzzleMode = 'numbers' | 'image';

@Component({
  selector: 'app-sliding-puzzle-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './sliding-puzzle.page.html',
  styleUrl: './sliding-puzzle.page.scss',
})
export class SlidingPuzzlePage {
  private readonly size = 4;
  private readonly solvedBoard = Array.from({ length: 16 }, (_, index) => (index + 1) % 16);

  protected readonly mode = signal<PuzzleMode>('numbers');
  protected readonly board = signal<number[]>([...this.solvedBoard]);
  protected readonly moves = signal(0);
  protected readonly hasStarted = signal(false);
  protected readonly imageUrl = signal('');
  protected readonly tileImageUrls = signal<string[]>([]);
  protected readonly isSolved = computed(
    () => this.hasStarted() && this.board().every((tile, index) => tile === this.solvedBoard[index]),
  );

  constructor() {
    this.newPuzzle();
  }

  protected setMode(mode: PuzzleMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.newPuzzle();
  }

  protected newPuzzle(): void {
    if (this.mode() === 'image') {
      const artwork = this.createRandomArtwork();
      this.imageUrl.set(artwork.fullImage);
      this.tileImageUrls.set(artwork.tileImages);
    }

    const board = [...this.solvedBoard];
    let emptyIndex = board.indexOf(0);
    let previousEmptyIndex = -1;

    // A legal-move shuffle guarantees a solvable puzzle. Thirty-two moves keep it approachable.
    for (let step = 0; step < 32; step++) {
      let choices = this.neighbors(emptyIndex).filter((index) => index !== previousEmptyIndex);
      if (!choices.length) choices = this.neighbors(emptyIndex);
      const tileIndex = choices[Math.floor(Math.random() * choices.length)];
      [board[emptyIndex], board[tileIndex]] = [board[tileIndex], board[emptyIndex]];
      previousEmptyIndex = emptyIndex;
      emptyIndex = tileIndex;
    }

    if (board.every((tile, index) => tile === this.solvedBoard[index])) {
      const tileIndex = this.neighbors(emptyIndex)[0];
      [board[emptyIndex], board[tileIndex]] = [board[tileIndex], board[emptyIndex]];
    }

    this.board.set(board);
    this.moves.set(0);
    this.hasStarted.set(true);
  }

  protected moveTile(index: number): void {
    if (this.isSolved()) return;
    const board = [...this.board()];
    const emptyIndex = board.indexOf(0);
    const sameRow = Math.floor(index / this.size) === Math.floor(emptyIndex / this.size);
    const sameColumn = index % this.size === emptyIndex % this.size;
    if (!sameRow && !sameColumn) return;

    const direction = sameRow ? Math.sign(index - emptyIndex) : Math.sign(index - emptyIndex) * this.size;
    for (let position = emptyIndex; position !== index; position += direction) {
      board[position] = board[position + direction];
    }
    board[index] = 0;
    this.board.set(board);
    this.moves.update((value) => value + 1);
  }

  protected tileImageUrl(tile: number): string {
    return this.tileImageUrls()[tile - 1] ?? '';
  }

  protected tileLabel(tile: number): string {
    return this.mode() === 'numbers' ? String(tile) : `Morceau d’image ${tile}`;
  }

  private neighbors(index: number): number[] {
    const row = Math.floor(index / this.size);
    const column = index % this.size;
    const result: number[] = [];
    if (row > 0) result.push(index - this.size);
    if (row < this.size - 1) result.push(index + this.size);
    if (column > 0) result.push(index - 1);
    if (column < this.size - 1) result.push(index + 1);
    return result;
  }

  private createRandomArtwork(): { fullImage: string; tileImages: string[] } {
    const hue = Math.floor(Math.random() * 360);
    const hue2 = (hue + 80 + Math.floor(Math.random() * 90)) % 360;
    const x = 20 + Math.floor(Math.random() * 60);
    const y = 20 + Math.floor(Math.random() * 60);
    const content = `<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue} 78% 60%)"/><stop offset="1" stop-color="hsl(${hue2} 72% 35%)"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="${x * 4}" cy="${y * 4}" r="115" fill="white" opacity=".28"/><path d="M-20 330 Q100 180 205 300 T430 210 V430 H-20Z" fill="hsl(${(hue + 180) % 360} 65% 35%)" opacity=".7"/><path d="M35 60 L190 30 L330 150 L270 310 L80 285Z" fill="none" stroke="white" stroke-width="18" opacity=".38"/><circle cx="330" cy="65" r="42" fill="hsl(${(hue2 + 130) % 360} 88% 68%)"/>`;
    const svgUrl = (viewBox: string) =>
      `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${content}</svg>`)}`;

    return {
      fullImage: svgUrl('0 0 400 400'),
      tileImages: Array.from({ length: 15 }, (_, index) => {
        const column = index % this.size;
        const row = Math.floor(index / this.size);
        return svgUrl(`${column * 100} ${row * 100} 100 100`);
      }),
    };
  }
}

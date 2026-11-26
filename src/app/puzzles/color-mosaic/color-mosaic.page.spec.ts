import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { MOSAIC_COLORS, MosaicColor } from './color-mosaic.logic';
import { ColorMosaicPage } from './color-mosaic.page';

describe('ColorMosaicPage', () => {
  let fixture: ComponentFixture<ColorMosaicPage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ColorMosaicPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ColorMosaicPage);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  function button(selector: string): HTMLButtonElement {
    return root.querySelector<HTMLButtonElement>(selector)!;
  }

  function click(selector: string): void {
    button(selector).click();
    fixture.detectChanges();
  }

  function paintBoard(mosaic: readonly MosaicColor[]): void {
    for (const color of MOSAIC_COLORS) {
      const selector = `.palette-color[data-color="${color}"]`;
      if (button(selector).getAttribute('aria-pressed') !== 'true') click(selector);
      for (const [index, value] of mosaic.entries()) {
        if (value === color) click(`[data-mosaic-cell="${index}"]`);
      }
    }
  }

  it('cycles the four colors, supports the palette and restores the previous color on undo', () => {
    const first = '[data-mosaic-cell="0"]';
    for (const color of [...MOSAIC_COLORS, null]) {
      click(first);
      expect(button(first).getAttribute('data-color')).toBe(color);
    }
    click('.palette-color[data-color="green"]');
    click(first);
    expect(button(first).getAttribute('data-color')).toBe('green');
    expect(button('.palette-color[data-color="green"]').textContent).toContain('1');
    click('.game-actions button:nth-child(2)');
    expect(button(first).getAttribute('data-color')).toBeNull();
    expect(button('.palette-color[data-color="green"]').textContent).toContain('0');
  });

  it('marks the violated position clue, verifies a matching mosaic and clears the next grid', () => {
    expect(
      [...root.querySelectorAll('.game-actions button')].map((item) => item.textContent?.trim()),
    ).not.toContain('Vérifier');
    const firstLine = ['red', 'green', 'yellow', 'green', 'red'] as const;
    const middle = ['yellow', 'yellow', 'blue', 'yellow', 'yellow'] as const;
    const mosaic = [...firstLine, ...firstLine, ...middle, ...firstLine, ...firstLine];
    const page = fixture.componentInstance;
    page['puzzle'].set({
      profile: 4,
      totals: { red: 8, green: 8, yellow: 8, blue: 1 },
      clues: [{ kind: 'line', axis: 'row', line: 0, color: 'red', count: 2 }],
    });
    fixture.detectChanges();
    paintBoard(
      mosaic.map((color) => (color === 'red' ? 'yellow' : color === 'yellow' ? 'red' : color)),
    );
    expect(root.querySelector('.clues .review')?.textContent).toBe(
      '2 cases rouges sur la ligne 1.',
    );
    expect(markSolved).not.toHaveBeenCalled();

    paintBoard(mosaic);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Mosaïque réussie');
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/mosaique-logique');
    click('[role="alert"] button');
    expect(root.querySelectorAll('.mosaic-cell[data-color]')).toHaveLength(0);
    expect(page['puzzle']().profile).not.toBe(4);
  });
});

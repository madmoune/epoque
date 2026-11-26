import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { createStarPuzzle, STAR_CHALLENGES } from './star-polygons.logic';
import { StarPolygonsPage } from './star-polygons.page';

describe('StarPolygonsPage', () => {
  let fixture: ComponentFixture<StarPolygonsPage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [StarPolygonsPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(StarPolygonsPage);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  function clickStar(index: number): void {
    root.querySelectorAll<HTMLButtonElement>('.star')[index].click();
    fixture.detectChanges();
  }

  function clickButton(selector: string): void {
    root.querySelector<HTMLButtonElement>(selector)!.click();
    fixture.detectChanges();
  }

  function trace(outline: readonly number[]): void {
    outline.forEach(clickStar);
    clickStar(outline[0]);
  }

  function setChallenge(index: number): void {
    const page = fixture.componentInstance;
    const challenge = STAR_CHALLENGES[index];
    page['challenge'].set(challenge);
    page['board'].set(createStarPuzzle(challenge, () => 0));
    page['restart']();
    fixture.detectChanges();
  }

  it('rejects crossed paths, highlights a continuation, and lets the player undo a closure', () => {
    setChallenge(0);
    const [a, b, c, d] = fixture.componentInstance['board']().outlines[0];
    trace([a, b, d, c]);
    expect(root.querySelector('[role="status"]')?.textContent).toContain('figure régulière');
    expect(root.querySelectorAll('svg polygon')).toHaveLength(0);

    clickButton('[data-confirm-action="hint"]');
    expect(root.querySelector('.star.hint')).toBeNull();
    expect(root.querySelector('[role="status"]')?.textContent).toContain('Annule un trait');
    clickButton('.game-actions button:first-child');
    clickButton('.game-actions button:first-child');
    clickButton('[data-confirm-action="hint"]');
    expect(root.querySelectorAll('.star')[c].classList.contains('hint')).toBe(true);

    [c, d, a].forEach(clickStar);
    expect(root.querySelectorAll('.star:disabled')).toHaveLength(4);
    expect(root.querySelectorAll('svg polygon')).toHaveLength(1);
    expect(markSolved).not.toHaveBeenCalled();
    clickButton('.game-actions button:first-child');
    expect(root.querySelectorAll('.star:disabled')).toHaveLength(0);
    expect(root.querySelector('svg polyline')).not.toBeNull();
  });

  it('plays either figure first, counts both toward a win, and randomizes the next challenge', () => {
    setChallenge(5);
    const page = fixture.componentInstance;
    const firstChallenge = page['challenge']();
    expect(root.querySelector('.challenge-control strong')?.textContent).toContain(
      firstChallenge.label,
    );
    expect(root.querySelectorAll('.star')).toHaveLength(9);

    const { outlines } = fixture.componentInstance['board']();
    trace(outlines[1].filter((_, index) => index % 2 === 0));
    expect(root.querySelector('[role="status"]')?.textContent).toContain(
      'nécessaires à l’autre figure',
    );
    clickButton('[data-confirm-action="restart"]');

    trace([...outlines[1]].reverse());
    expect(root.querySelector('[role="status"]')?.textContent).toContain('1 / 2');
    expect(markSolved).not.toHaveBeenCalled();
    trace(outlines[0]);
    expect(root.querySelectorAll('svg polygon')).toHaveLength(2);
    expect(root.querySelector('app-puzzle-success-popup')?.textContent).toContain(
      'Deux figures trouvées',
    );
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/polygones-etoiles');

    clickButton('[data-confirm-action="new-game"]');
    expect(page['challenge']()).not.toBe(firstChallenge);
    expect(root.querySelector('.challenge-control strong')?.textContent).toContain(
      page['challenge']().label,
    );
    expect(root.querySelectorAll('svg polygon')).toHaveLength(0);
    expect(root.querySelectorAll('.star')).toHaveLength(
      page['challenge']().sizes[0] + page['challenge']().sizes[1],
    );
    expect(fixture.componentInstance['board']().outlines).not.toBe(outlines);
  });
});

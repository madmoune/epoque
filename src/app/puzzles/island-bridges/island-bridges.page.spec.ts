import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePlayHistoryService } from '../../puzzle-play-history.service';
import { bridgeDestination } from './island-bridges.logic';
import { IslandBridgesPage } from './island-bridges.page';

describe('IslandBridgesPage', () => {
  let fixture: ComponentFixture<IslandBridgesPage>;
  let root: HTMLElement;
  let markSolved: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markSolved = vi.fn();
    await TestBed.configureTestingModule({
      imports: [IslandBridgesPage],
      providers: [
        provideRouter([]),
        { provide: PuzzlePlayHistoryService, useValue: { markSolved } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(IslandBridgesPage);
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

  it('allows bridges incident to the current island and reopens a bridge only after undo', () => {
    expect(root.querySelectorAll('.bridge:enabled')).toHaveLength(0);
    click('[data-island="1"]');
    const next = button('.bridge:enabled');
    const id = next.getAttribute('data-bridge')!;
    const first = fixture.componentInstance['puzzle']().bridges.find((bridge) => bridge.id === id)!;
    const destination = bridgeDestination(first, 1);

    click(`[data-bridge="${id}"]`);
    expect(button('.island.current').getAttribute('data-island')).toBe(String(destination));
    expect(next.disabled).toBe(true);
    expect(next.classList.contains('crossed')).toBe(true);
    click(`[data-bridge="${id}"]`);
    expect(root.querySelector('.bridge-count')?.textContent).toContain('1 / 15');

    click('.game-actions button:first-child');
    expect(button('.island.current').getAttribute('data-island')).toBe('1');
    expect(next.disabled).toBe(false);
    expect(next.classList.contains('crossed')).toBe(false);
    expect(markSolved).not.toHaveBeenCalled();
  });

  it('registers the win after fifteen moves and starts a different map from the success popup', () => {
    const map = fixture.componentInstance['puzzle']().map;
    click('[data-island="1"]');
    for (let move = 0; move < 15; move++) {
      click('[data-confirm-action="hint"]');
      click('.bridge.hinted');
    }
    expect(root.querySelector('.bridge-count')?.textContent).toContain('15 / 15');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Tous les ponts traversés');
    expect(markSolved).toHaveBeenCalledExactlyOnceWith('/ponts-et-iles');

    click('[role="alert"] button');
    expect(fixture.componentInstance['puzzle']().map).not.toBe(map);
    expect(root.querySelector('.bridge-count')?.textContent).toContain('0 / 15');
    expect(root.querySelector('.island.current')).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PuzzlePlaylistService } from '../../../puzzle-playlist.service';
import { PuzzleSuccessPopupComponent } from './puzzle-success-popup.component';

describe('PuzzleSuccessPopupComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzleSuccessPopupComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('keeps random and playlist actions in the same three slots', () => {
    const router = TestBed.inject(Router);
    const playlistService = TestBed.inject(PuzzlePlaylistService);
    const urlSpy = vi.spyOn(router, 'url', 'get');
    const progressSpy = vi.spyOn(playlistService, 'progressFromUrl');
    const completeSpy = vi.spyOn(playlistService, 'complete');

    urlSpy.mockReturnValue('/count-is-good?from=random');
    const randomFixture = TestBed.createComponent(PuzzleSuccessPopupComponent);
    randomFixture.componentInstance.title = 'Cible atteinte!';
    randomFixture.componentInstance.actionLabel = 'Nouveau tirage';
    randomFixture.detectChanges();

    const randomActions = [
      ...randomFixture.nativeElement.querySelectorAll('.popup-actions > *'),
    ] as HTMLElement[];

    expect(randomActions.map((action) => action.classList[0])).toEqual([
      'primary-action',
      'secondary-action',
      'menu-action',
    ]);
    expect(randomActions.map((action) => action.textContent?.trim())).toEqual([
      'Nouveau tirage',
      'Autre jeu au hasard',
      'Retour au menu',
    ]);
    randomFixture.destroy();

    urlSpy.mockReturnValue('/count-is-good?from=playlist&playlist=validation&playlistIndex=0');
    progressSpy.mockReturnValue({
      playlist: {
        id: 'validation',
        name: 'Validation',
        routes: ['/count-is-good', '/mental-arithmetic'],
      },
      index: 0,
      order: [0, 1],
      nextRoute: '/mental-arithmetic?from=playlist&playlist=validation&playlistIndex=1',
    });

    const playlistFixture = TestBed.createComponent(PuzzleSuccessPopupComponent);
    playlistFixture.componentInstance.title = 'Cible atteinte!';
    playlistFixture.componentInstance.actionLabel = 'Nouveau tirage';
    playlistFixture.detectChanges();

    expect(completeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 0,
        order: [0, 1],
      }),
    );

    const playlistActions = [
      ...playlistFixture.nativeElement.querySelectorAll('.popup-actions > *'),
    ] as HTMLElement[];

    expect(playlistActions.map((action) => action.classList[0])).toEqual([
      'primary-action',
      'secondary-action',
      'menu-action',
    ]);
    expect(playlistActions.map((action) => action.textContent?.trim())).toEqual([
      'Rejouer',
      'Jeu suivant',
      'Retour au menu',
    ]);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { parseWordFitWords, solveWordFit } from './word-fit.logic';
import { WordFitService } from './word-fit.service';

const WORDS = `énigme indice logique secret lettre nombre symbole grille labyrinthe solution
  équipe relais ballon cible flèche lancer sport piste course marche
  boussole carte chemin sentier col sommet vallée montagne rocher falaise
  forêt arbre érable sapin pin racine branche feuille fleur mousse
  canotage kayak pagaie aviron rame canot bateau voile barque radeau
  rivière cascade courant rapide remous vague plage sable terre roche
  aigle huard héron castor renard lièvre caribou orignal truite saumon
  soleil étoile lune nuage pluie neige vent orage ciel ombre`
  .split(/\s+/)
  .join('\n');

describe('WordFitService', () => {
  let service: WordFitService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WordFitService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads words.txt and reuses its words for uniquely solvable new games', async () => {
    const loading = service.loadWords();
    const request = http.expectOne('words.txt');
    expect(request.request.responseType).toBe('text');
    request.flush(WORDS);
    await loading;

    const words = parseWordFitWords(WORDS);
    for (let i = 0; i < 3; i++) {
      const puzzle = service.createPuzzle();
      expect(puzzle.words.every((word) => words.includes(word))).toBe(true);
      expect(solveWordFit(puzzle)).toEqual([
        Object.fromEntries(puzzle.solution.map((word, slot) => [slot, word])),
      ]);
    }
    await service.loadWords();
    http.expectNone('words.txt');
  });

  it('lets a failed request be retried', async () => {
    const failed = service.loadWords();
    const rejection = expect(failed).rejects.toBeDefined();
    http.expectOne('words.txt').flush('', { status: 503, statusText: 'Unavailable' });
    await rejection;

    const retry = service.loadWords();
    http.expectOne('words.txt').flush(WORDS);
    await retry;
    expect(service.createPuzzle().words.length).toBeGreaterThanOrEqual(8);
  });

  it('rejects unusable content and lets a corrected list be loaded', async () => {
    const loading = service.loadWords();
    const rejection = expect(loading).rejects.toThrow(/huit mots/);
    http.expectOne('words.txt').flush('dé\n123\nénigme\nÉNIGME');
    await rejection;

    const retry = service.loadWords();
    http.expectOne('words.txt').flush(WORDS);
    await retry;
    expect(
      service.createPuzzle().words.every((word) => parseWordFitWords(WORDS).includes(word)),
    ).toBe(true);
  });

  it('requires the word list to be loaded before creating a puzzle', () => {
    expect(() => service.createPuzzle()).toThrow(/huit mots/);
  });
});

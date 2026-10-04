import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DropQuoteService } from './drop-quote.service';

const PHRASES = [
  'Un bon indice transforme le doute en certitude',
  'La patience ouvre des portes que la force ferme',
  'Au cœur du défi, l’équipe garde son calme malgré le bruit',
];

describe('DropQuoteService', () => {
  let service: DropQuoteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DropQuoteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the shared phrase file once and avoids recent repeats', async () => {
    const loading = service.loadPhrases();
    const request = http.expectOne('mid-mid-sentences.txt');
    expect(request.request.responseType).toBe('text');
    request.flush(PHRASES.join('\n'));
    await loading;

    const played = PHRASES.map(() => service.createPuzzle().phrase);
    expect(new Set(played)).toEqual(new Set(PHRASES));
    expect(service.createPuzzle().phrase).not.toBe(played.at(-1));

    await service.loadPhrases();
    http.expectNone('mid-mid-sentences.txt');
  });

  it('allows another load after a request fails', async () => {
    const loading = service.loadPhrases();
    const failure = expect(loading).rejects.toBeDefined();
    http.expectOne('mid-mid-sentences.txt').flush('', { status: 503, statusText: 'Unavailable' });
    await failure;

    const retry = service.loadPhrases();
    http.expectOne('mid-mid-sentences.txt').flush(PHRASES[0]);
    await retry;
    expect(service.createPuzzle().phrase).toBe(PHRASES[0]);
  });

  it('rejects a bank without usable phrases', async () => {
    const loading = service.loadPhrases();
    const failure = expect(loading).rejects.toThrow('The Dropquote phrase list is empty.');
    http.expectOne('mid-mid-sentences.txt').flush('Trop court\n\nChaudière-Appalaches');
    await failure;
  });
});

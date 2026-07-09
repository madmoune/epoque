import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecentRandomPicker } from '../shared/recent-random-picker';

export type CipherType =
  | 'caesar'
  | 'pigpen'
  | 'a1z26'
  | 'morse'
  | 'braille'
  | 'atbash'
  | 'tap-code'
  | 'semaphore'
  | 'nato';

export type CipherPuzzle = {
  answer: string;
  normalizedAnswer: string;
  cipher: CipherType;
  encoded: string[];
  note: string;
};

export type CipherOption = {
  type: CipherType;
  label: string;
};

export type CipherLegendItem = {
  letter: string;
  symbol: string;
};

@Injectable({
  providedIn: 'root',
})
export class CiphersService {
  private readonly http = inject(HttpClient);
  private readonly randomWords = new RecentRandomPicker<string>(50);

  private words: string[] = [];

  readonly cipherOptions: CipherOption[] = [
    { type: 'caesar', label: 'César' },
    { type: 'pigpen', label: 'Pigpen' },
    { type: 'a1z26', label: 'A1Z26' },
    { type: 'morse', label: 'Morse' },
    { type: 'braille', label: 'Braille' },
    { type: 'atbash', label: 'Atbash' },
    { type: 'tap-code', label: 'Tap code' },
    { type: 'semaphore', label: 'Sémaphore' },
    { type: 'nato', label: 'NATO' },
  ];

  async loadWords(): Promise<void> {
    if (this.words.length > 0) {
      return;
    }

    const text = await firstValueFrom(
      this.http.get('words.txt', {
        responseType: 'text',
      }),
    );

    this.words = text
      .split(/\r?\n/)
      .map((word) => word.trim())
      .filter((word) => {
        const normalizedWord = this.normalize(word);
        return normalizedWord.length >= 4 && normalizedWord.length <= 12 && /^[a-z]+$/.test(normalizedWord);
      });
  }

  createPuzzle(cipher: CipherType): CipherPuzzle {
    if (this.words.length === 0) {
      throw new Error('Cipher words have not been loaded yet.');
    }

    const wordPool = cipher === 'tap-code' ? this.words.filter((word) => !this.normalize(word).includes('j')) : this.words;
    const answer = this.randomWords.pick(wordPool, (word) => `${cipher}:${this.normalize(word)}`);
    const normalizedAnswer = this.normalize(answer);

    return {
      answer,
      normalizedAnswer,
      cipher,
      encoded: this.encode(normalizedAnswer, cipher),
      note: this.noteFor(cipher),
    };
  }

  isCorrectAnswer(input: string, answer: string): boolean {
    return this.normalize(input) === answer;
  }

  legendFor(cipher: CipherType): CipherLegendItem[] {
    if (cipher === 'pigpen') {
      return this.createLegend(this.identityLetters);
    }

    if (cipher === 'morse') {
      return this.createLegend(this.morseCodes);
    }

    if (cipher === 'braille') {
      return this.createLegend(this.identityLetters);
    }

    if (cipher === 'tap-code') {
      return this.createLegend(this.tapCodeLetters);
    }

    if (cipher === 'semaphore') {
      return this.createLegend(this.semaphoreLetters);
    }

    if (cipher === 'nato') {
      return this.createLegend(this.natoWords);
    }

    return [];
  }

  normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase();
  }

  private encode(word: string, cipher: CipherType): string[] {
    if (cipher === 'caesar') {
      return word.split('').map((letter) => this.shiftLetter(letter, 3));
    }

    if (cipher === 'pigpen') {
      return word.split('');
    }

    if (cipher === 'a1z26') {
      return word.split('').map((letter) => String(letter.charCodeAt(0) - 96));
    }

    if (cipher === 'morse') {
      return word.split('').map((letter) => this.morseCodes[letter] ?? letter);
    }

    if (cipher === 'braille') {
      return word.split('');
    }

    if (cipher === 'atbash') {
      return word.split('').map((letter) => this.atbashLetter(letter));
    }

    if (cipher === 'tap-code') {
      return word.split('').map((letter) => this.tapCodeLetters[letter] ?? letter);
    }

    if (cipher === 'semaphore') {
      return word.split('');
    }

    return word.split('').map((letter) => this.natoWords[letter] ?? letter);
  }

  private shiftLetter(letter: string, shift: number): string {
    const alphabetIndex = letter.charCodeAt(0) - 97;
    return String.fromCharCode(((alphabetIndex + shift) % 26) + 97);
  }

  private atbashLetter(letter: string): string {
    const alphabetIndex = letter.charCodeAt(0) - 97;
    return String.fromCharCode(122 - alphabetIndex);
  }

  private createLegend(symbolsByLetter: Record<string, string>): CipherLegendItem[] {
    return Object.entries(symbolsByLetter).map(([letter, symbol]) => ({
      letter: letter.toUpperCase(),
      symbol,
    }));
  }

  private noteFor(cipher: CipherType): string {
    if (cipher === 'caesar') return 'Chaque lettre est décalée dans l’alphabet.';
    if (cipher === 'pigpen') return 'Chaque lettre est remplacée par un symbole de la grille Pigpen.';
    if (cipher === 'a1z26') return 'A=1, B=2, C=3, jusqu’à Z=26.';
    if (cipher === 'morse') return 'Points et traits : une case correspond à une lettre.';
    if (cipher === 'braille') return 'Chaque symbole braille correspond à une lettre de A à Z.';
    if (cipher === 'atbash') return 'Alphabet inverse : A devient Z, B devient Y, et ainsi de suite.';
    if (cipher === 'tap-code') return 'Chaque code indique la ligne et la colonne dans une grille 5 x 5. I et J partagent la même case.';
    if (cipher === 'semaphore') return 'Chaque lettre est montrée par deux positions de drapeaux.';
    return 'Chaque lettre est remplacée par son mot de l’alphabet radio NATO.';
  }

  private readonly morseCodes: Record<string, string> = {
    a: '.-',
    b: '-...',
    c: '-.-.',
    d: '-..',
    e: '.',
    f: '..-.',
    g: '--.',
    h: '....',
    i: '..',
    j: '.---',
    k: '-.-',
    l: '.-..',
    m: '--',
    n: '-.',
    o: '---',
    p: '.--.',
    q: '--.-',
    r: '.-.',
    s: '...',
    t: '-',
    u: '..-',
    v: '...-',
    w: '.--',
    x: '-..-',
    y: '-.--',
    z: '--..',
  };

  private readonly tapCodeLetters: Record<string, string> = {
    a: '1-1',
    b: '1-2',
    c: '1-3',
    d: '1-4',
    e: '1-5',
    f: '2-1',
    g: '2-2',
    h: '2-3',
    i: '2-4',
    j: '2-4',
    k: '2-5',
    l: '3-1',
    m: '3-2',
    n: '3-3',
    o: '3-4',
    p: '3-5',
    q: '4-1',
    r: '4-2',
    s: '4-3',
    t: '4-4',
    u: '4-5',
    v: '5-1',
    w: '5-2',
    x: '5-3',
    y: '5-4',
    z: '5-5',
  };

  private readonly semaphoreLetters: Record<string, string> = {
    a: '6,7',
    b: '5,7',
    c: '4,7',
    d: '3,7',
    e: '2,7',
    f: '1,7',
    g: '0,7',
    h: '5,6',
    i: '4,6',
    j: '3,6',
    k: '2,6',
    l: '1,6',
    m: '0,6',
    n: '4,5',
    o: '3,5',
    p: '2,5',
    q: '1,5',
    r: '0,5',
    s: '3,4',
    t: '2,4',
    u: '1,4',
    v: '0,4',
    w: '2,3',
    x: '1,3',
    y: '0,3',
    z: '0,2',
  };

  private readonly natoWords: Record<string, string> = {
    a: 'Alpha',
    b: 'Bravo',
    c: 'Charlie',
    d: 'Delta',
    e: 'Echo',
    f: 'Foxtrot',
    g: 'Golf',
    h: 'Hotel',
    i: 'India',
    j: 'Juliett',
    k: 'Kilo',
    l: 'Lima',
    m: 'Mike',
    n: 'November',
    o: 'Oscar',
    p: 'Papa',
    q: 'Quebec',
    r: 'Romeo',
    s: 'Sierra',
    t: 'Tango',
    u: 'Uniform',
    v: 'Victor',
    w: 'Whiskey',
    x: 'X-ray',
    y: 'Yankee',
    z: 'Zulu',
  };

  private readonly identityLetters: Record<string, string> = Object.fromEntries(
    'abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => [letter, letter]),
  );
}

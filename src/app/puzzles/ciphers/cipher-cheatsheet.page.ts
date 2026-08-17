import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CipherLegendItem, CipherType, CiphersService } from './ciphers.service';

type CheatsheetSection = {
  id: CipherType;
  title: string;
  description: string;
  route: string;
};

@Component({
  selector: 'app-cipher-cheatsheet-page',
  imports: [RouterLink],
  templateUrl: './cipher-cheatsheet.page.html',
  styleUrl: './cipher-cheatsheet.page.scss',
})
export class CipherCheatsheetPage {
  private readonly ciphersService = inject(CiphersService);

  protected readonly ciphers: readonly CheatsheetSection[] = [
    {
      id: 'a1z26',
      title: 'A1Z26',
      description: 'Les lettres sont remplacées par leur rang dans l’alphabet.',
      route: '/ciphers/a1z26',
    },
    {
      id: 'atbash',
      title: 'Atbash',
      description: 'L’alphabet est lu à l’envers : A devient Z, B devient Y, etc.',
      route: '/ciphers/atbash',
    },
    {
      id: 'braille',
      title: 'Braille',
      description: 'Les points actifs dans une cellule de six positions indiquent la lettre.',
      route: '/ciphers/braille',
    },
    {
      id: 'caesar',
      title: 'César',
      description: 'Chaque lettre avance ou recule du même nombre de positions dans l’alphabet.',
      route: '/ciphers/caesar',
    },
    {
      id: 'morse',
      title: 'Morse',
      description: 'Chaque lettre est écrite avec une combinaison de points et de traits.',
      route: '/ciphers/morse',
    },
    {
      id: 'nato',
      title: 'NATO',
      description: 'Chaque lettre est associée à un mot de l’alphabet radio international.',
      route: '/ciphers/nato',
    },
    {
      id: 'pigpen',
      title: 'Pigpen',
      description: 'Chaque lettre est remplacée par la portion de grille qui l’entoure.',
      route: '/ciphers/pigpen',
    },
    {
      id: 'semaphore',
      title: 'Sémaphore',
      description: 'La combinaison de deux positions de drapeaux représente une lettre.',
      route: '/ciphers/semaphore',
    },
    {
      id: 'tap-code',
      title: 'Tap code',
      description: 'Deux chiffres donnent la ligne et la colonne d’une lettre dans la grille.',
      route: '/ciphers/tap-code',
    },
  ];

  protected readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  protected readonly caesarShiftedAlphabet = 'BCDEFGHIJKLMNOPQRSTUVWXYZA'.split('');
  protected readonly atbashAlphabet = 'ZYXWVUTSRQPONMLKJIHGFEDCBA'.split('');
  protected readonly a1z26Legend = this.alphabet.map((letter, index) => ({
    letter,
    symbol: String(index + 1),
  }));
  protected readonly morseLegend: CipherLegendItem[] = this.ciphersService.legendFor('morse');
  protected readonly semaphoreLegend: CipherLegendItem[] =
    this.ciphersService.legendFor('semaphore');
  protected readonly natoLegend: CipherLegendItem[] = this.ciphersService.legendFor('nato');
  protected readonly pigpenSquareKeys = [
    [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I'],
    ],
    [
      ['J', 'K', 'L'],
      ['M', 'N', 'O'],
      ['P', 'Q', 'R'],
    ],
  ];
  protected readonly pigpenXKeys = [
    { top: 'S', right: 'U', bottom: 'V', left: 'T', dotted: false },
    { top: 'W', right: 'Y', bottom: 'Z', left: 'X', dotted: true },
  ];
  protected readonly tapCodeGrid = [
    ['A', 'B', 'C', 'D', 'E'],
    ['F', 'G', 'H', 'I/J', 'K'],
    ['L', 'M', 'N', 'O', 'P'],
    ['Q', 'R', 'S', 'T', 'U'],
    ['V', 'W', 'X', 'Y', 'Z'],
  ];
  private readonly brailleDotsByLetter: Record<string, number[]> = {
    a: [1],
    b: [1, 2],
    c: [1, 4],
    d: [1, 4, 5],
    e: [1, 5],
    f: [1, 2, 4],
    g: [1, 2, 4, 5],
    h: [1, 2, 5],
    i: [2, 4],
    j: [2, 4, 5],
    k: [1, 3],
    l: [1, 2, 3],
    m: [1, 3, 4],
    n: [1, 3, 4, 5],
    o: [1, 3, 5],
    p: [1, 2, 3, 4],
    q: [1, 2, 3, 4, 5],
    r: [1, 2, 3, 5],
    s: [2, 3, 4],
    t: [2, 3, 4, 5],
    u: [1, 3, 6],
    v: [1, 2, 3, 6],
    w: [2, 4, 5, 6],
    x: [1, 3, 4, 6],
    y: [1, 3, 4, 5, 6],
    z: [1, 3, 5, 6],
  };

  protected isBrailleDotActive(letter: string, dot: number): boolean {
    return this.brailleDotsByLetter[letter.toLowerCase()]?.includes(dot) ?? false;
  }

  protected semaphoreArmClasses(symbol: string): string[] {
    return symbol
      .split(',')
      .map((position) => position.trim())
      .filter(Boolean)
      .map((position) => `position-${position}`);
  }
}

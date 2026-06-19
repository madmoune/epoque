import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { KnightsAndKnavesPage } from './knights-and-knaves.page';

describe('KnightsAndKnavesPage', () => {
  it('generates a unique puzzle for every supported size', () => {
    const page = new KnightsAndKnavesPage() as any;

    for (const count of [3, 4, 5, 6]) {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const puzzle = page.generatePuzzle(count);
        const solutions = page.findSolutions(count, puzzle.statements);

        expect(puzzle.statements).toHaveLength(count);
        expect(new Set(puzzle.statements.map((statement: any) => statement.speaker)).size).toBe(count);
        expect(solutions).toHaveLength(1);
        expect(solutions[0]).toEqual(puzzle.roles);
      }
    }
  });

  it('shows success as soon as every correct role is selected', () => {
    const page = new KnightsAndKnavesPage() as any;
    const roles = page.puzzle().roles;

    roles.forEach((isKnight: boolean, index: number) => {
      page.chooseRole(index, isKnight ? 'knight' : 'knave');
    });

    expect(page.solved()).toBe(true);
    expect(page.message()).toBe('Tous les rôles sont corrects.');
  });

  it('clears a role when its selected button is clicked again', () => {
    const page = new KnightsAndKnavesPage() as any;

    page.chooseRole(0, 'knight');
    expect(page.answers()[0]).toBe('knight');

    page.chooseRole(0, 'knight');
    expect(page.answers()[0]).toBeNull();
  });
});

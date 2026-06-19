import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type Role = 'knight' | 'knave';
type StatementKind =
  | 'isKnight'
  | 'isKnave'
  | 'same'
  | 'different'
  | 'bothKnights'
  | 'bothKnaves'
  | 'exactlyOne'
  | 'atLeastOne'
  | 'notBothKnights'
  | 'atMostOne'
  | 'ifKnightThenKnight'
  | 'ifKnightThenKnave'
  | 'exactlyTwoOfThree'
  | 'atLeastTwoOfThree'
  | 'allSameThree'
  | 'countExact'
  | 'countNot'
  | 'oddKnights';

type LogicStatement = {
  speaker: number;
  kind: StatementKind;
  targets: number[];
  amount?: number;
  key: string;
  text: string;
};

type LogicPuzzle = {
  names: string[];
  roles: boolean[];
  statements: LogicStatement[];
};

const AVAILABLE_NAMES = ['Alex', 'Camille', 'Charlie', 'Dominique', 'Morgan', 'Sacha'];

@Component({
  selector: 'app-knights-and-knaves-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './knights-and-knaves.page.html',
  styleUrl: './knights-and-knaves.page.scss',
})
export class KnightsAndKnavesPage {
  protected readonly availableCounts = [3, 4, 5, 6];
  protected readonly personCount = signal(4);
  protected readonly puzzle = signal<LogicPuzzle>(this.generatePuzzle(4));
  protected readonly answers = signal<(Role | null)[]>(Array.from({ length: 4 }, () => null));
  protected readonly hintedPeople = signal<Set<number>>(new Set());
  protected readonly checked = signal(false);
  protected readonly solved = signal(false);
  protected readonly message = signal('Attribue un rôle à chaque personne.');

  protected readonly statementsBySpeaker = computed(() =>
    this.puzzle().names.map((_, speaker) =>
      this.puzzle().statements.filter((statement) => statement.speaker === speaker),
    ),
  );

  protected readonly answeredCount = computed(() =>
    this.answers().filter((answer) => answer !== null).length,
  );

  protected readonly solutionText = computed(() =>
    this.puzzle().names
      .map((name, index) => `${name}: ${this.puzzle().roles[index] ? 'chevalier' : 'menteur'}`)
      .join(' · '),
  );

  protected setPersonCount(count: number): void {
    if (this.personCount() === count) return;
    this.personCount.set(count);
    this.newPuzzle();
  }

  protected newPuzzle(): void {
    const count = this.personCount();
    this.puzzle.set(this.generatePuzzle(count));
    this.answers.set(Array.from({ length: count }, () => null));
    this.hintedPeople.set(new Set());
    this.checked.set(false);
    this.solved.set(false);
    this.message.set('Attribue un rôle à chaque personne.');
  }

  protected chooseRole(personIndex: number, role: Role): void {
    if (this.solved() || this.hintedPeople().has(personIndex)) return;

    this.answers.update((answers) =>
      answers.map((answer, index) =>
        index === personIndex ? (answer === role ? null : role) : answer,
      ),
    );
    this.checked.set(false);

    if (this.answeredCount() === this.personCount()) {
      this.checkAnswers();
    } else {
      this.message.set('');
    }
  }

  protected checkAnswers(): void {
    if (this.answeredCount() !== this.personCount()) {
      this.message.set('Il reste des rôles à attribuer.');
      this.checked.set(true);
      return;
    }

    const incorrectCount = this.answers().filter(
      (answer, index) => (answer === 'knight') !== this.puzzle().roles[index],
    ).length;

    if (incorrectCount === 0) {
      this.solved.set(true);
      this.message.set('Tous les rôles sont corrects.');
      return;
    }

    this.checked.set(true);
    this.message.set('La solution n’est pas encore correcte.');
  }

  protected showHint(): void {
    const candidate = this.answers().findIndex(
      (answer, index) =>
        !this.hintedPeople().has(index) &&
        (answer === null || (answer === 'knight') !== this.puzzle().roles[index]),
    );
    const personIndex = candidate !== -1
      ? candidate
      : this.answers().findIndex((_, index) => !this.hintedPeople().has(index));

    if (personIndex === -1) return;

    const role: Role = this.puzzle().roles[personIndex] ? 'knight' : 'knave';
    this.answers.update((answers) =>
      answers.map((answer, index) => (index === personIndex ? role : answer)),
    );
    this.hintedPeople.update((people) => new Set([...people, personIndex]));
    this.checked.set(false);

    if (this.answeredCount() === this.personCount()) {
      this.checkAnswers();
    } else {
      this.message.set(`${this.puzzle().names[personIndex]} est ${role === 'knight' ? 'chevalier' : 'menteur'}.`);
    }
  }

  protected roleLabel(role: Role): string {
    return role === 'knight' ? 'Chevalier' : 'Menteur';
  }

  protected personInitial(name: string): string {
    return name.slice(0, 1).toUpperCase();
  }

  private generatePuzzle(count: number): LogicPuzzle {
    for (let attempt = 0; attempt < 600; attempt += 1) {
      const names = this.shuffle([...AVAILABLE_NAMES]).slice(0, count);
      const roles = this.randomRoles(count);
      const statements: LogicStatement[] = [];
      const usedKeys = new Set<string>();

      for (const speaker of this.shuffle(Array.from({ length: count }, (_, index) => index))) {
        statements.push(this.createCompatibleStatement(speaker, names, roles, usedKeys));
      }

      const solutions = this.findSolutions(count, statements);
      if (solutions.length === 1 && solutions[0].every((role, index) => role === roles[index])) {
        return { names, roles, statements };
      }
    }

    throw new Error('Impossible de générer un puzzle logique unique.');
  }

  private createCompatibleStatement(
    speaker: number,
    names: string[],
    roles: boolean[],
    usedKeys: Set<string>,
  ): LogicStatement {
    for (let attempt = 0; attempt < 250; attempt += 1) {
      const statement = this.randomStatement(speaker, names);
      if (usedKeys.has(statement.key)) continue;
      if (this.evaluateStatement(statement, roles) !== roles[speaker]) continue;

      usedKeys.add(statement.key);
      return statement;
    }

    const target = (speaker + 1) % names.length;
    const targetIsKnight = roles[target];
    const kind: StatementKind = targetIsKnight === roles[speaker] ? 'isKnight' : 'isKnave';
    const statement = this.makeStatement(speaker, kind, [target], names);
    usedKeys.add(statement.key);
    return statement;
  }

  private randomStatement(speaker: number, names: string[]): LogicStatement {
    const otherPeople = this.shuffle(
      Array.from({ length: names.length }, (_, index) => index).filter((index) => index !== speaker),
    );
    const singleKinds: StatementKind[] = ['isKnight', 'isKnave'];
    const pairKinds: StatementKind[] = [
      'same',
      'different',
      'bothKnights',
      'bothKnaves',
      'exactlyOne',
      'atLeastOne',
      'notBothKnights',
      'atMostOne',
      'ifKnightThenKnight',
      'ifKnightThenKnave',
    ];
    const tripleKinds: StatementKind[] = [
      'exactlyTwoOfThree',
      'atLeastTwoOfThree',
      'allSameThree',
    ];
    const roll = Math.random();

    if (roll < 0.2) {
      return this.makeStatement(
        speaker,
        singleKinds[Math.floor(Math.random() * singleKinds.length)],
        [otherPeople[0]],
        names,
      );
    }

    if (roll < 0.68 && otherPeople.length >= 2) {
      return this.makeStatement(
        speaker,
        pairKinds[Math.floor(Math.random() * pairKinds.length)],
        otherPeople.slice(0, 2),
        names,
      );
    }

    if (roll < 0.86 && otherPeople.length >= 3) {
      return this.makeStatement(
        speaker,
        tripleKinds[Math.floor(Math.random() * tripleKinds.length)],
        otherPeople.slice(0, 3),
        names,
      );
    }

    const amount = Math.floor(Math.random() * (names.length + 1));
    const globalKinds: StatementKind[] = ['countExact', 'countNot', 'oddKnights'];
    const kind = globalKinds[Math.floor(Math.random() * globalKinds.length)];
    return this.makeStatement(speaker, kind, [], names, amount);
  }

  private makeStatement(
    speaker: number,
    kind: StatementKind,
    targets: number[],
    names: string[],
    amount?: number,
  ): LogicStatement {
    const first = names[targets[0]];
    const second = names[targets[1]];
    const third = names[targets[2]];
    const knightWord = amount === 1 ? 'chevalier' : 'chevaliers';
    const texts: Record<StatementKind, string> = {
      isKnight: `${first} est chevalier.`,
      isKnave: `${first} est menteur.`,
      same: `${first} et ${second} sont du même camp.`,
      different: `${first} et ${second} sont de camps différents.`,
      bothKnights: `${first} et ${second} sont tous les deux chevaliers.`,
      bothKnaves: `${first} et ${second} sont tous les deux menteurs.`,
      exactlyOne: `Une seule personne entre ${first} et ${second} est chevalier.`,
      atLeastOne: `Au moins une personne entre ${first} et ${second} est chevalier.`,
      notBothKnights: `${first} et ${second} ne sont pas tous les deux chevaliers.`,
      atMostOne: `Au maximum une personne entre ${first} et ${second} est chevalier.`,
      ifKnightThenKnight: `Si ${first} est chevalier, alors ${second} l’est aussi.`,
      ifKnightThenKnave: `Si ${first} est chevalier, alors ${second} est menteur.`,
      exactlyTwoOfThree: `Exactement deux personnes parmi ${first}, ${second} et ${third} sont chevaliers.`,
      atLeastTwoOfThree: `Au moins deux personnes parmi ${first}, ${second} et ${third} sont chevaliers.`,
      allSameThree: `${first}, ${second} et ${third} sont tous du même camp.`,
      countExact: `Il y a exactement ${amount} ${knightWord} parmi nous.`,
      countNot: `Il n’y a pas exactement ${amount} ${knightWord} parmi nous.`,
      oddKnights: `Le nombre de chevaliers parmi nous est impair.`,
    };

    return {
      speaker,
      kind,
      targets,
      amount,
      key: `${speaker}:${kind}:${[...targets].sort().join(',')}:${amount ?? ''}`,
      text: texts[kind],
    };
  }

  private findSolutions(count: number, statements: LogicStatement[]): boolean[][] {
    const solutions: boolean[][] = [];

    for (let mask = 0; mask < 2 ** count; mask += 1) {
      const roles = Array.from({ length: count }, (_, index) => Boolean(mask & (1 << index)));
      const valid = statements.every(
        (statement) => this.evaluateStatement(statement, roles) === roles[statement.speaker],
      );
      if (valid) solutions.push(roles);
    }

    return solutions;
  }

  private evaluateStatement(statement: LogicStatement, roles: boolean[]): boolean {
    const [first, second] = statement.targets.map((target) => roles[target]);

    switch (statement.kind) {
      case 'isKnight': return first;
      case 'isKnave': return !first;
      case 'same': return first === second;
      case 'different': return first !== second;
      case 'bothKnights': return first && second;
      case 'bothKnaves': return !first && !second;
      case 'exactlyOne': return Number(first) + Number(second) === 1;
      case 'atLeastOne': return first || second;
      case 'notBothKnights': return !(first && second);
      case 'atMostOne': return Number(first) + Number(second) <= 1;
      case 'ifKnightThenKnight': return !first || second;
      case 'ifKnightThenKnave': return !first || !second;
      case 'exactlyTwoOfThree': return statement.targets.filter((target) => roles[target]).length === 2;
      case 'atLeastTwoOfThree': return statement.targets.filter((target) => roles[target]).length >= 2;
      case 'allSameThree': {
        const values = statement.targets.map((target) => roles[target]);
        return values.every((value) => value === values[0]);
      }
      case 'countExact': return roles.filter(Boolean).length === statement.amount;
      case 'countNot': return roles.filter(Boolean).length !== statement.amount;
      case 'oddKnights': return roles.filter(Boolean).length % 2 === 1;
    }
  }

  private randomRoles(count: number): boolean[] {
    let roles: boolean[];
    do {
      roles = Array.from({ length: count }, () => Math.random() < 0.5);
    } while (roles.every(Boolean) || roles.every((role) => !role));
    return roles;
  }

  private shuffle<T>(items: T[]): T[] {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
  }
}

import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';
import {
  deduceZebraPositions,
  ZebraCategory,
  ZebraClue,
  ZebraDeductionStep,
} from './zebra-deduction';

type ZebraLevel = 3 | 4 | 5;

type ZebraPuzzle = {
  level: ZebraLevel;
  title: string;
  intro: string;
  positions: string[];
  categories: ZebraCategory[];
  clues: string[];
  logicalClues?: ZebraClue[];
  solution: Record<string, string>[];
};

type GridMark = 'unknown' | 'yes' | 'no';

type ZebraHintMove = {
  firstCategory: ZebraCategory;
  firstValue: string;
  secondCategory: ZebraCategory;
  secondValue: string;
  mark: 'yes' | 'no';
  clue: ZebraClue;
};

const ZEBRA_PUZZLES: Record<ZebraLevel, ZebraPuzzle> = {
  3: {
    level: 3,
    title: 'Trois maisons',
    intro: 'Associe chaque maison à sa personne, sa couleur et son animal.',
    positions: ['Maison 1', 'Maison 2', 'Maison 3'],
    categories: [
      { id: 'house', label: 'Maison', values: ['Maison 1', 'Maison 2', 'Maison 3'] },
      { id: 'person', label: 'Personne', values: ['Alice', 'Bruno', 'Clara'] },
      { id: 'color', label: 'Couleur', values: ['Rouge', 'Bleu', 'Vert'] },
      { id: 'pet', label: 'Animal', values: ['Chat', 'Chien', 'Oiseau'] },
    ],
    clues: [
      'Bruno habite la maison rouge.',
      'La maison bleue est au centre.',
      'Bruno habite juste à gauche de Clara.',
      "L'oiseau vit dans la maison verte.",
      'Bruno a le chat.',
    ],
    solution: [
      { house: 'Maison 1', person: 'Bruno', color: 'Rouge', pet: 'Chat' },
      { house: 'Maison 2', person: 'Clara', color: 'Bleu', pet: 'Chien' },
      { house: 'Maison 3', person: 'Alice', color: 'Vert', pet: 'Oiseau' },
    ],
  },
  4: {
    level: 4,
    title: 'Quatre maisons',
    intro: 'Associe chaque maison à sa personne, sa couleur, son animal et son loisir.',
    positions: ['Maison 1', 'Maison 2', 'Maison 3', 'Maison 4'],
    categories: [
      { id: 'house', label: 'Maison', values: ['Maison 1', 'Maison 2', 'Maison 3', 'Maison 4'] },
      { id: 'person', label: 'Personne', values: ['Alice', 'Bruno', 'Clara', 'Diego'] },
      { id: 'color', label: 'Couleur', values: ['Rouge', 'Bleu', 'Vert', 'Jaune'] },
      { id: 'pet', label: 'Animal', values: ['Chat', 'Chien', 'Oiseau', 'Poisson'] },
      { id: 'hobby', label: 'Loisir', values: ['Echecs', 'Peinture', 'Course', 'Violon'] },
    ],
    clues: [
      'La maison bleue est la deuxième.',
      'Alice habite la première maison.',
      'Diego habite la maison jaune.',
      'Clara habite juste à gauche de Diego.',
      'La maison verte est juste à gauche de la maison jaune.',
      'La personne qui pratique le violon habite la maison rouge.',
      'Le chien vit dans la maison bleue.',
      "L'oiseau vit dans la maison verte.",
      'La peinture est pratiquée dans la maison verte.',
      'La course est pratiquée par la personne qui a le poisson.',
    ],
    solution: [
      { house: 'Maison 1', person: 'Alice', color: 'Rouge', pet: 'Chat', hobby: 'Violon' },
      { house: 'Maison 2', person: 'Bruno', color: 'Bleu', pet: 'Chien', hobby: 'Echecs' },
      { house: 'Maison 3', person: 'Clara', color: 'Vert', pet: 'Oiseau', hobby: 'Peinture' },
      { house: 'Maison 4', person: 'Diego', color: 'Jaune', pet: 'Poisson', hobby: 'Course' },
    ],
  },
  5: {
    level: 5,
    title: 'Cinq maisons',
    intro: 'Associe chaque maison à sa personne, sa couleur, son animal, sa boisson et son loisir.',
    positions: ['Maison 1', 'Maison 2', 'Maison 3', 'Maison 4', 'Maison 5'],
    categories: [
      {
        id: 'house',
        label: 'Maison',
        values: ['Maison 1', 'Maison 2', 'Maison 3', 'Maison 4', 'Maison 5'],
      },
      { id: 'person', label: 'Personne', values: ['Alice', 'Bruno', 'Clara', 'Diego', 'Emma'] },
      { id: 'color', label: 'Couleur', values: ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Blanc'] },
      { id: 'pet', label: 'Animal', values: ['Chat', 'Chien', 'Oiseau', 'Poisson', 'Lapin'] },
      { id: 'drink', label: 'Boisson', values: ['The', 'Lait', 'Jus', 'Cafe', 'Eau'] },
      {
        id: 'hobby',
        label: 'Loisir',
        values: ['Echecs', 'Peinture', 'Course', 'Violon', 'Jardin'],
      },
    ],
    clues: [
      'La maison bleue est juste à droite de la maison rouge.',
      'La maison rouge est la première.',
      'Clara habite au centre.',
      'Diego habite la maison jaune.',
      'Emma habite la cinquième maison.',
      'Alice boit du thé.',
      'Bruno boit du café.',
      'Le lait est bu dans la maison du centre.',
      'La personne de la maison blanche boit de l’eau.',
      'Le chien vit dans la maison bleue.',
      "L'oiseau vit dans la maison verte.",
      'Le lapin vit dans la maison blanche.',
      'La peinture est pratiquée dans la maison verte.',
      'La course est pratiquée par la personne qui a le poisson.',
      'Bruno pratique les échecs.',
      'Le jardinage est pratiqué dans la maison blanche.',
      'Le violon est pratiqué dans la maison rouge.',
    ],
    solution: [
      {
        house: 'Maison 1',
        person: 'Alice',
        color: 'Rouge',
        pet: 'Chat',
        drink: 'The',
        hobby: 'Violon',
      },
      {
        house: 'Maison 2',
        person: 'Bruno',
        color: 'Bleu',
        pet: 'Chien',
        drink: 'Cafe',
        hobby: 'Echecs',
      },
      {
        house: 'Maison 3',
        person: 'Clara',
        color: 'Vert',
        pet: 'Oiseau',
        drink: 'Lait',
        hobby: 'Peinture',
      },
      {
        house: 'Maison 4',
        person: 'Diego',
        color: 'Jaune',
        pet: 'Poisson',
        drink: 'Jus',
        hobby: 'Course',
      },
      {
        house: 'Maison 5',
        person: 'Emma',
        color: 'Blanc',
        pet: 'Lapin',
        drink: 'Eau',
        hobby: 'Jardin',
      },
    ],
  },
};

@Component({
  selector: 'app-zebra-page',
  imports: [RouterLink, PuzzleSuccessPopupComponent],
  templateUrl: './zebra.page.html',
  styleUrl: './zebra.page.scss',
})
export class ZebraPage {
  private readonly clueWordingChoices = new Map<string, Set<number>>();
  protected readonly level = signal<ZebraLevel>(3);
  private readonly puzzles = ZEBRA_PUZZLES;
  private readonly activePuzzle = signal<ZebraPuzzle>(this.createRandomPuzzle(this.puzzles[3]));
  protected readonly puzzle = computed(() => this.activePuzzle());
  private readonly manualGridMarks = signal<Record<string, GridMark>>({});
  private readonly usedClueIndexes = signal<Set<number>>(new Set());
  private complexHintCount = 0;
  private lastHintSupportSize = 0;
  private hintSupportBlocked = false;
  protected readonly gridMarks = computed(() => this.buildGridMarks(this.manualGridMarks()));
  protected readonly hasChecked = signal(false);
  protected readonly hintMessage = signal<string | null>(null);

  protected readonly isSolved = computed(
    () =>
      this.trueRelations().every((relation) => this.relationMark(relation) === 'yes') &&
      Object.entries(this.gridMarks()).every(
        ([key, mark]) => mark !== 'yes' || this.isTrueRelationKey(key),
      ),
  );

  protected setLevel(level: ZebraLevel): void {
    this.level.set(level);
    this.activePuzzle.set(this.createRandomPuzzle(this.puzzles[level]));
    this.manualGridMarks.set({});
    this.usedClueIndexes.set(new Set());
    this.complexHintCount = 0;
    this.hasChecked.set(false);
    this.hintMessage.set(null);
  }

  protected checkPuzzle(): void {
    this.hasChecked.set(true);
  }

  protected resetPuzzle(): void {
    this.manualGridMarks.set({});
    this.usedClueIndexes.set(new Set());
    this.hasChecked.set(false);
    this.hintMessage.set(null);
  }

  protected newPuzzle(): void {
    this.activePuzzle.set(this.createRandomPuzzle(this.puzzles[this.level()]));
    this.manualGridMarks.set({});
    this.usedClueIndexes.set(new Set());
    this.complexHintCount = 0;
    this.hasChecked.set(false);
    this.hintMessage.set(null);
  }

  protected isClueUsed(index: number): boolean {
    return this.usedClueIndexes().has(index);
  }

  protected toggleClue(index: number): void {
    const usedIndexes = new Set(this.usedClueIndexes());

    if (usedIndexes.has(index)) {
      usedIndexes.delete(index);
    } else {
      usedIndexes.add(index);
    }

    this.usedClueIndexes.set(usedIndexes);
  }

  protected showHint(): void {
    const directMove = this.findDirectHintMove('yes') ?? this.findDirectHintMove('no');

    if (directMove) {
      this.applyHintMove(directMove, this.explainDirectHint(directMove));
      return;
    }

    if (this.puzzle().level === 4) {
      const deductionHint = this.findDeductionHint();

      if (deductionHint) {
        this.applyHintMove(deductionHint.move, deductionHint.explanation);
      } else {
        this.hintMessage.set('Toutes les associations nécessaires sont déjà déduites.');
      }

      return;
    }

    const unresolvedRelations = this.trueRelations().filter(
      (relation) => this.relationMark(relation) === 'unknown',
    );

    if (unresolvedRelations.length === 0) {
      this.hintMessage.set('Toutes les associations nécessaires sont déjà déduites.');
      return;
    }

    let hint:
      | {
          relation: ReturnType<ZebraPage['trueRelations']>[number];
          explanation: string;
        }
      | undefined;

    for (const relation of this.shuffle(unresolvedRelations).slice(0, 6)) {
      this.lastHintSupportSize = 0;
      this.hintSupportBlocked = false;
      const explanation = this.explainHint(relation);

      if (this.hintSupportBlocked) {
        continue;
      }

      if (this.lastHintSupportSize > 2) {
        this.complexHintCount += 1;
      }

      hint = { relation, explanation };
      break;
    }

    if (!hint) {
      const rescueMove = this.createRescueHintMove(unresolvedRelations[0]);

      this.applyHintMove(rescueMove, this.explainRescueHint(rescueMove));
      return;
    }

    this.setManualGridMark(
      hint.relation.firstCategory.id,
      hint.relation.firstValue,
      hint.relation.secondCategory.id,
      hint.relation.secondValue,
      'yes',
    );
    this.hasChecked.set(false);
    this.hintMessage.set(hint.explanation);
  }

  protected associationText(relation: ReturnType<ZebraPage['trueRelations']>[number]): string {
    return `${relation.firstCategory.label} « ${relation.firstValue} » ↔ ${relation.secondCategory.label} « ${relation.secondValue} »`;
  }

  private applyHintMove(move: Omit<ZebraHintMove, 'clue'>, explanation: string): void {
    this.setManualGridMark(
      move.firstCategory.id,
      move.firstValue,
      move.secondCategory.id,
      move.secondValue,
      move.mark,
    );
    this.hasChecked.set(false);
    this.hintMessage.set(explanation);
  }

  private findDeductionHint(): {
    move: Omit<ZebraHintMove, 'clue'>;
    explanation: string;
  } | null {
    const houseCategory = this.puzzle().categories[0];
    const deduction = deduceZebraPositions(this.puzzle().categories, [
      ...this.currentGridConstraints(),
      ...(this.puzzle().logicalClues ?? []),
    ]);

    for (const step of deduction.steps) {
      const category = this.categoryById(step.categoryId)!;
      const houseIndexes =
        step.after.length === 1
          ? step.after
          : step.before.filter((index) => !step.after.includes(index));
      const mark = step.after.length === 1 ? 'yes' : 'no';

      for (const houseIndex of houseIndexes) {
        const house = houseCategory.values[houseIndex];

        if (this.gridMark(houseCategory.id, house, category.id, step.value) !== 'unknown') {
          continue;
        }

        const move = {
          firstCategory: houseCategory,
          firstValue: house,
          secondCategory: category,
          secondValue: step.value,
          mark,
        } as const;

        return { move, explanation: this.explainDeductionHint(step, move) };
      }
    }

    return null;
  }

  private explainDeductionHint(
    step: ZebraDeductionStep,
    move: Omit<ZebraHintMove, 'clue'>,
  ): string {
    const houses = this.puzzle().categories[0].values;
    const subject = this.clueValueText(step.categoryId, step.value);
    const lines: string[] = [];

    if (step.reason.type === 'clue') {
      const { clue, otherCategoryId, otherValue, otherPositions, relatedValues } = step.reason;

      if (clue.text) {
        lines.push(
          'Indice utilisé :',
          `« ${this.formatClue(clue.text)} »`,
          '',
          `1. ${this.explainClueRule(clue)}`,
        );
      } else {
        lines.push(
          'Déduction à partir de la grille :',
          `1. La grille indique déjà que ${this.clueValueText(otherCategoryId!, otherValue!)} et ${subject} appartiennent à ${clue.type === 'same' ? 'la même maison' : 'des maisons différentes'}.`,
        );
      }

      if (otherCategoryId && otherValue && otherPositions) {
        lines.push(
          `2. Pour ${this.clueValueText(otherCategoryId, otherValue)}, les maisons encore possibles sont : ${otherPositions.map((index) => houses[index]).join(', ')}.`,
          `3. En respectant cet indice, ${subject} ne peut occuper que : ${step.after.map((index) => houses[index]).join(', ')}.`,
        );
      }

      if (relatedValues) {
        lines.push(
          ...relatedValues.map(
            (related, index) =>
              `${index + 2}. Pour ${this.clueValueText(related.categoryId, related.value)}, les maisons encore possibles sont : ${related.positions.map((houseIndex) => houses[houseIndex]).join(', ')}.`,
          ),
          `${relatedValues.length + 2}. En combinant ces possibilités avec l’indice, ${subject} ne peut occuper que : ${step.after.map((index) => houses[index]).join(', ')}.`,
        );
      }
    } else if (step.reason.type === 'occupied') {
      lines.push(
        'Déduction par élimination :',
        `1. ${houses[step.reason.houseIndex]} est déjà associée à ${this.clueValueText(step.categoryId, step.reason.otherValue)}.`,
        '2. Une maison ne peut recevoir qu’une seule valeur de chaque catégorie.',
        `3. ${subject} doit donc se trouver dans une autre maison.`,
      );
    } else {
      lines.push(
        'Déduction par élimination :',
        `1. Dans ${houses[step.reason.houseIndex]}, toutes les autres valeurs de la catégorie ${move.secondCategory.label.toLowerCase()} sont exclues.`,
        '2. Chaque maison doit recevoir une valeur de cette catégorie.',
        `3. Seule la valeur « ${step.value} » reste possible.`,
      );
    }

    lines.push(
      `Conclusion : ${this.associationText(move)}; la case correspondante est ${move.mark === 'yes' ? 'cochée ✓' : 'barrée ×'}.`,
    );
    return lines.join('\n');
  }

  private findDirectHintMove(mark: 'yes' | 'no'): ZebraHintMove | null {
    for (const clue of this.puzzle().logicalClues ?? []) {
      const move = this.hintMoveFromClue(clue);

      if (
        move &&
        move.mark === mark &&
        this.gridMark(
          move.firstCategory.id,
          move.firstValue,
          move.secondCategory.id,
          move.secondValue,
        ) === 'unknown'
      ) {
        return move;
      }
    }

    return null;
  }

  private hintMoveFromClue(clue: ZebraClue): ZebraHintMove | null {
    const houseCategory = this.puzzle().categories[0];
    let firstCategoryId: string;
    let firstValue: string;
    let secondCategoryId: string;
    let secondValue: string;
    let mark: 'yes' | 'no';

    if (clue.type === 'position' || clue.type === 'notPosition') {
      firstCategoryId = houseCategory.id;
      firstValue = houseCategory.values[clue.houseIndex];
      secondCategoryId = clue.categoryId;
      secondValue = clue.value;
      mark = clue.type === 'position' ? 'yes' : 'no';
    } else if (clue.type === 'same' || clue.type === 'notSame') {
      firstCategoryId = clue.firstCategoryId;
      firstValue = clue.firstValue;
      secondCategoryId = clue.secondCategoryId;
      secondValue = clue.secondValue;
      mark = clue.type === 'same' ? 'yes' : 'no';
    } else if (clue.type === 'oneOf' || clue.type === 'neither') {
      const category = this.categoryById(clue.secondCategoryId);
      const excludedValues =
        clue.type === 'neither'
          ? clue.secondValues
          : category?.values.filter((value) => !clue.secondValues.includes(value));
      const excludedValue = excludedValues?.find(
        (value) =>
          this.gridMark(clue.firstCategoryId, clue.firstValue, clue.secondCategoryId, value) ===
          'unknown',
      );

      if (!excludedValue) {
        return null;
      }

      firstCategoryId = clue.firstCategoryId;
      firstValue = clue.firstValue;
      secondCategoryId = clue.secondCategoryId;
      secondValue = excludedValue;
      mark = 'no';
    } else if (clue.type === 'adjacentRight' || clue.type === 'leftOf') {
      firstCategoryId = clue.leftCategoryId;
      firstValue = clue.leftValue;
      secondCategoryId = clue.rightCategoryId;
      secondValue = clue.rightValue;
      mark = 'no';
    } else {
      firstCategoryId = clue.firstCategoryId;
      firstValue = clue.firstValue;
      secondCategoryId = clue.secondCategoryId;
      secondValue = clue.secondValue;
      mark = 'no';
    }

    const firstCategory = this.categoryById(firstCategoryId);
    const secondCategory = this.categoryById(secondCategoryId);

    if (!firstCategory || !secondCategory || firstCategory.id === secondCategory.id) {
      return null;
    }

    return {
      firstCategory,
      firstValue,
      secondCategory,
      secondValue,
      mark,
      clue,
    };
  }

  private explainDirectHint(move: ZebraHintMove): string {
    const clueText = this.formatClue(move.clue.text);
    const relation = this.associationText(move);

    return [
      'Indice utilisé :',
      `« ${clueText} »`,
      '',
      `1. ${this.explainClueRule(move.clue)}`,
      move.mark === 'yes'
        ? `2. Repère leur intersection dans la grille : ${relation}.`
        : `2. Ces deux valeurs ne peuvent donc pas être dans la même maison : barre l’intersection ${relation}.`,
      move.mark === 'yes'
        ? `Conclusion : ${relation}; la case correspondante est cochée ✓.`
        : `Conclusion : ${relation}; la case correspondante est barrée ×.`,
    ].join('\n');
  }

  private createRescueHintMove(
    relation: ReturnType<ZebraPage['trueRelations']>[number],
  ): ZebraHintMove {
    const houseCategory = this.puzzle().categories[0];

    if (relation.firstCategory.id === houseCategory.id) {
      const clue: ZebraClue = {
        type: 'position',
        categoryId: relation.secondCategory.id,
        value: relation.secondValue,
        houseIndex: houseCategory.values.indexOf(relation.firstValue),
        text: this.describeHouseClue(
          relation.secondCategory,
          relation.secondValue,
          relation.firstValue,
        ),
      };

      return this.hintMoveFromClue(clue)!;
    }

    if (relation.secondCategory.id === houseCategory.id) {
      const clue: ZebraClue = {
        type: 'position',
        categoryId: relation.firstCategory.id,
        value: relation.firstValue,
        houseIndex: houseCategory.values.indexOf(relation.secondValue),
        text: this.describeHouseClue(
          relation.firstCategory,
          relation.firstValue,
          relation.secondValue,
        ),
      };

      return this.hintMoveFromClue(clue)!;
    }

    const clue: ZebraClue = {
      type: 'same',
      firstCategoryId: relation.firstCategory.id,
      firstValue: relation.firstValue,
      secondCategoryId: relation.secondCategory.id,
      secondValue: relation.secondValue,
      text: this.describeSameClue(
        relation.firstCategory,
        relation.firstValue,
        relation.secondCategory,
        relation.secondValue,
      ),
    };

    return this.hintMoveFromClue(clue)!;
  }

  private explainRescueHint(move: ZebraHintMove): string {
    const clueText = this.formatClue(move.clue.text);
    const relation = this.associationText(move);

    return [
      'Indice direct supplémentaire :',
      `« ${clueText} »`,
      '',
      'Cette information complète la grille pour éviter de laisser une déduction implicite te bloquer.',
      `1. ${this.explainClueRule(move.clue)}`,
      `2. Repère leur intersection dans la grille : ${relation}.`,
      `Conclusion : ${relation}; la case correspondante est cochée ✓.`,
    ].join('\n');
  }

  private categoryById(categoryId: string): ZebraCategory | undefined {
    return this.puzzle().categories.find((category) => category.id === categoryId);
  }

  private explainHint(relation: ReturnType<ZebraPage['trueRelations']>[number]): string {
    const directClue = this.puzzle().logicalClues?.find((clue) =>
      this.clueImpliesAssociation(clue, relation),
    );

    if (directClue) {
      const clueText = this.formatClue(directClue.text);

      return [
        'Indice utilisé :',
        `« ${clueText} »`,
        '',
        `1. ${this.explainClueRule(directClue)}`,
        `2. Repère leur intersection dans la grille : ${this.associationText(relation)}.`,
        `Conclusion : cette association est certaine; la case correspondante est cochée ✓.`,
      ].join('\n');
    }

    const knownRelations = this.trueRelations().filter(
      (candidate) => this.relationMark(candidate) === 'yes',
    );

    for (const first of knownRelations) {
      for (const second of knownRelations) {
        const implied = this.sharedRelationValue(first, second);

        if (implied && this.matchesAssociation(relation, implied)) {
          const sharedValue = this.sharedValueText(first, second);
          const firstAssociation = this.associationText(first);
          const secondAssociation = this.associationText(second);

          return [
            'Déduction par chaînage :',
            `1. La grille contient déjà : ${firstAssociation}.`,
            `2. Elle contient aussi : ${secondAssociation}.`,
            `3. Ces deux associations ont ${sharedValue} en commun : elles décrivent donc la même maison.`,
            `Conclusion : ${this.associationText(relation)}; la case correspondante est cochée ✓.`,
          ].join('\n');
        }
      }
    }

    const secondAlternatives = relation.secondCategory.values.filter(
      (value) =>
        value !== relation.secondValue &&
        this.gridMark(
          relation.firstCategory.id,
          relation.firstValue,
          relation.secondCategory.id,
          value,
        ) === 'no',
    );

    if (secondAlternatives.length === relation.secondCategory.values.length - 1) {
      const firstSubject = `${relation.firstCategory.label.toLowerCase()} « ${relation.firstValue} »`;
      const secondCategory = relation.secondCategory.label.toLowerCase();

      return [
        'Déduction par élimination :',
        `1. Pour ${firstSubject}, les autres choix de ${secondCategory} sont déjà barrés : ${secondAlternatives.map((value) => `« ${value} »`).join(', ')}.`,
        `2. Chaque maison doit recevoir exactement une valeur de la catégorie ${secondCategory}.`,
        `3. Il ne reste donc que « ${relation.secondValue} ».`,
        `Conclusion : ${this.associationText(relation)}; la case correspondante est cochée ✓.`,
      ].join('\n');
    }

    const firstAlternatives = relation.firstCategory.values.filter(
      (value) =>
        value !== relation.firstValue &&
        this.gridMark(
          relation.firstCategory.id,
          value,
          relation.secondCategory.id,
          relation.secondValue,
        ) === 'no',
    );

    if (firstAlternatives.length === relation.firstCategory.values.length - 1) {
      const firstCategory = relation.firstCategory.label.toLowerCase();
      const secondSubject = `${relation.secondCategory.label.toLowerCase()} « ${relation.secondValue} »`;

      return [
        'Déduction par élimination :',
        `1. Pour ${secondSubject}, les autres choix de ${firstCategory} sont déjà barrés : ${firstAlternatives.map((value) => `« ${value} »`).join(', ')}.`,
        `2. Chaque maison doit recevoir exactement une valeur de la catégorie ${firstCategory}.`,
        `3. Il ne reste donc que « ${relation.firstValue} ».`,
        `Conclusion : ${this.associationText(relation)}; la case correspondante est cochée ✓.`,
      ].join('\n');
    }

    const supportingClues = this.supportingCluesFor(relation);
    const alternatives = relation.secondCategory.values.filter(
      (value) => value !== relation.secondValue,
    );

    if (supportingClues && supportingClues.length === 0) {
      return [
        'Déduction à partir de la grille :',
        '1. Les associations déjà placées et les cases barrées éliminent toutes les autres possibilités.',
        `2. Pour ${relation.firstCategory.label.toLowerCase()} « ${relation.firstValue} », il ne reste que « ${relation.secondValue} » parmi ${relation.secondCategory.label.toLowerCase()} : ${alternatives.map((value) => `« ${value} »`).join(', ')} sont déjà impossibles.`,
        `Conclusion : ${this.associationText(relation)}; la case correspondante est cochée ✓.`,
      ].join('\n');
    }

    if (supportingClues && supportingClues.length > 0) {
      return [
        supportingClues.length === 1 ? 'Indice à appliquer :' : 'Indices à combiner :',
        ...supportingClues.map(
          (clue) => `• « ${this.formatClue(clue.text)} »\n  ↳ ${this.explainClueRule(clue)}`,
        ),
        '',
        '1. Tous ces indices doivent être vrais en même temps.',
        `2. Pour ${relation.firstCategory.label.toLowerCase()} « ${relation.firstValue} », essaie les autres valeurs de ${relation.secondCategory.label.toLowerCase()} : ${alternatives.map((value) => `« ${value} »`).join(', ')}.`,
        '3. Chacune de ces possibilités crée une contradiction avec l’ensemble des indices ci-dessus et avec la règle « une valeur par maison ».',
        `Conclusion : seule « ${relation.secondValue} » reste possible; ${this.associationText(relation)}. La case est cochée ✓.`,
      ].join('\n');
    }

    return [
      'Déduction à vérifier :',
      `1. Observe la ligne de ${relation.firstCategory.label.toLowerCase()} « ${relation.firstValue} ».`,
      `2. Barre chaque valeur de ${relation.secondCategory.label.toLowerCase()} déjà utilisée ailleurs ou contredite par un indice.`,
      `3. La seule valeur restante est « ${relation.secondValue} ».`,
      `Conclusion : ${this.associationText(relation)}; la case correspondante est cochée ✓.`,
    ].join('\n');
  }

  private explainClueRule(clue: ZebraClue): string {
    const houseCategory = this.puzzle().categories[0];

    if (clue.type === 'position' || clue.type === 'notPosition') {
      const value = this.clueValueText(clue.categoryId, clue.value);
      const house = houseCategory.values[clue.houseIndex];

      return clue.type === 'position'
        ? `Cet indice affirme directement que ${value} appartient à « ${house} ».`
        : `Cet indice exclut « ${house} » pour ${value}; cette intersection doit être barrée ×.`;
    }

    if (clue.type === 'same' || clue.type === 'notSame') {
      const first = this.clueValueText(clue.firstCategoryId, clue.firstValue);
      const second = this.clueValueText(clue.secondCategoryId, clue.secondValue);

      return clue.type === 'same'
        ? `Cet indice affirme que ${first} et ${second} appartiennent à la même maison.`
        : `Cet indice affirme que ${first} et ${second} appartiennent à deux maisons différentes; leur intersection doit être barrée ×.`;
    }

    if (clue.type === 'oneOf' || clue.type === 'neither') {
      const first = this.clueValueText(clue.firstCategoryId, clue.firstValue);
      const [optionA, optionB] = clue.secondValues.map((value) =>
        this.clueValueText(clue.secondCategoryId, value),
      );

      return clue.type === 'oneOf'
        ? `${first} partage sa maison avec ${optionA} ou ${optionB}, mais pas avec les autres valeurs de cette catégorie. Il faut croiser les indices pour départager ces deux possibilités.`
        : `${first} ne partage sa maison ni avec ${optionA} ni avec ${optionB}. Ces deux associations sont exclues; les autres restent à départager.`;
    }

    if (clue.type === 'adjacent' || clue.type === 'oneBetween') {
      const first = this.clueValueText(clue.firstCategoryId, clue.firstValue);
      const second = this.clueValueText(clue.secondCategoryId, clue.secondValue);

      return clue.type === 'adjacent'
        ? `${first} et ${second} occupent des maisons voisines : leurs numéros diffèrent de 1, sans préciser laquelle est à gauche.`
        : `${first} et ${second} sont séparés par une maison : leurs numéros diffèrent exactement de 2.`;
    }

    const left = this.clueValueText(clue.leftCategoryId, clue.leftValue);
    const right = this.clueValueText(clue.rightCategoryId, clue.rightValue);

    return clue.type === 'adjacentRight'
      ? `${left} est dans la maison immédiatement à gauche de ${right} : le numéro de droite vaut celui de gauche + 1.`
      : `${left} est quelque part à gauche de ${right} : son numéro de maison est plus petit, sans obligation d’être voisin.`;
  }

  private clueValueText(categoryId: string, value: string): string {
    const category = this.puzzle().categories.find((candidate) => candidate.id === categoryId);

    return `${category?.label.toLowerCase() ?? 'valeur'} « ${value} »`;
  }

  private supportingCluesFor(
    relation: ReturnType<ZebraPage['trueRelations']>[number],
  ): ZebraClue[] | null {
    const clues = [...(this.puzzle().logicalClues ?? [])];
    const maximumCombinedClues = this.complexHintCount === 0 ? 3 : 2;

    if (this.cluesForceAssociation([], relation)) {
      this.lastHintSupportSize = 0;
      return [];
    }

    for (let size = 1; size <= maximumCombinedClues; size += 1) {
      const supportingClues = this.findClueCombination(clues, size, relation);

      if (supportingClues) {
        this.lastHintSupportSize = supportingClues.length;
        return supportingClues;
      }
    }

    this.hintSupportBlocked = true;
    return null;
  }

  private findClueCombination(
    clues: ZebraClue[],
    size: number,
    relation: ReturnType<ZebraPage['trueRelations']>[number],
    startIndex = 0,
    selected: ZebraClue[] = [],
  ): ZebraClue[] | null {
    if (selected.length === size) {
      return this.cluesForceAssociation(selected, relation) ? selected : null;
    }

    const remainingSlots = size - selected.length;

    for (let index = startIndex; index <= clues.length - remainingSlots; index += 1) {
      const result = this.findClueCombination(clues, size, relation, index + 1, [
        ...selected,
        clues[index],
      ]);

      if (result) {
        return result;
      }
    }

    return null;
  }

  private cluesForceAssociation(
    clues: ZebraClue[],
    relation: ReturnType<ZebraPage['trueRelations']>[number],
  ): boolean {
    const contradiction: ZebraClue = {
      type: 'notSame',
      firstCategoryId: relation.firstCategory.id,
      firstValue: relation.firstValue,
      secondCategoryId: relation.secondCategory.id,
      secondValue: relation.secondValue,
      text: '',
    };

    return (
      this.countMatchingSolutions(
        this.puzzle().categories,
        [...this.currentGridConstraints(), ...clues, contradiction],
        1,
      ) === 0
    );
  }

  private currentGridConstraints(): ZebraClue[] {
    const constraints: ZebraClue[] = [];
    const constraintKeys = new Set<string>();

    for (const [key, mark] of Object.entries(this.gridMarks())) {
      if (mark === 'unknown') {
        continue;
      }

      const relation = this.parseGridMarkKey(key);

      if (!relation) {
        continue;
      }

      const isTrue = this.isTrueRelation(
        relation.firstCategoryId,
        relation.firstValue,
        relation.secondCategoryId,
        relation.secondValue,
      );

      if ((mark === 'yes') !== isTrue) {
        continue;
      }

      const constraint: ZebraClue =
        mark === 'yes'
          ? {
              type: 'same',
              firstCategoryId: relation.firstCategoryId,
              firstValue: relation.firstValue,
              secondCategoryId: relation.secondCategoryId,
              secondValue: relation.secondValue,
              text: '',
            }
          : {
              type: 'notSame',
              firstCategoryId: relation.firstCategoryId,
              firstValue: relation.firstValue,
              secondCategoryId: relation.secondCategoryId,
              secondValue: relation.secondValue,
              text: '',
            };
      const constraintKey = this.clueKey(constraint);

      if (!constraintKeys.has(constraintKey)) {
        constraintKeys.add(constraintKey);
        constraints.push(constraint);
      }
    }

    return constraints;
  }

  private sharedValueText(
    firstRelation: ReturnType<ZebraPage['trueRelations']>[number],
    secondRelation: ReturnType<ZebraPage['trueRelations']>[number],
  ): string {
    const sharedValue = this.findSharedRelationValue(firstRelation, secondRelation);

    if (!sharedValue) {
      return 'une valeur commune';
    }

    const category = this.puzzle().categories.find(
      (candidate) => candidate.id === sharedValue.categoryId,
    );

    return `${category?.label.toLowerCase() ?? 'la catégorie'} « ${sharedValue.value} »`;
  }

  private clueImpliesAssociation(
    clue: ZebraClue,
    relation: ReturnType<ZebraPage['trueRelations']>[number],
  ): boolean {
    if (clue.type === 'same') {
      return this.matchesAssociation(relation, {
        firstCategoryId: clue.firstCategoryId,
        firstValue: clue.firstValue,
        secondCategoryId: clue.secondCategoryId,
        secondValue: clue.secondValue,
      });
    }

    if (clue.type !== 'position') {
      return false;
    }

    const house = this.puzzle().categories[0];

    return this.matchesAssociation(relation, {
      firstCategoryId: house.id,
      firstValue: house.values[clue.houseIndex],
      secondCategoryId: clue.categoryId,
      secondValue: clue.value,
    });
  }

  private matchesAssociation(
    relation: ReturnType<ZebraPage['trueRelations']>[number],
    association: {
      firstCategoryId: string;
      firstValue: string;
      secondCategoryId: string;
      secondValue: string;
    },
  ): boolean {
    return (
      (relation.firstCategory.id === association.firstCategoryId &&
        relation.firstValue === association.firstValue &&
        relation.secondCategory.id === association.secondCategoryId &&
        relation.secondValue === association.secondValue) ||
      (relation.firstCategory.id === association.secondCategoryId &&
        relation.firstValue === association.secondValue &&
        relation.secondCategory.id === association.firstCategoryId &&
        relation.secondValue === association.firstValue)
    );
  }

  protected comparisonSections(): { first: ZebraCategory; second: ZebraCategory }[] {
    const categories = this.puzzle().categories;
    const sections: { first: ZebraCategory; second: ZebraCategory }[] = [];

    for (let firstIndex = 0; firstIndex < categories.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < categories.length; secondIndex += 1) {
        sections.push({
          first: categories[firstIndex],
          second: categories[secondIndex],
        });
      }
    }

    return sections;
  }

  protected rowCategories(): ZebraCategory[] {
    return this.puzzle().categories.slice(1).reverse();
  }

  protected columnCategories(): ZebraCategory[] {
    return this.puzzle().categories.slice(0, -1);
  }

  protected categoryIndex(categoryId: string): number {
    return this.puzzle().categories.findIndex((category) => category.id === categoryId);
  }

  protected hasGridCell(rowCategory: ZebraCategory, columnCategory: ZebraCategory): boolean {
    return this.categoryIndex(rowCategory.id) > this.categoryIndex(columnCategory.id);
  }

  protected gridMark(
    firstCategoryId: string,
    firstValue: string,
    secondCategoryId: string,
    secondValue: string,
  ): GridMark {
    return (
      this.gridMarks()[
        this.gridMarkKey(firstCategoryId, firstValue, secondCategoryId, secondValue)
      ] ?? 'unknown'
    );
  }

  protected toggleGridMark(
    firstCategoryId: string,
    firstValue: string,
    secondCategoryId: string,
    secondValue: string,
  ): void {
    if (!this.canToggleGridMark(firstCategoryId, firstValue, secondCategoryId, secondValue)) {
      return;
    }

    const key = this.gridMarkKey(firstCategoryId, firstValue, secondCategoryId, secondValue);
    const nextMarks: Record<GridMark, GridMark> = {
      unknown: 'no',
      no: 'yes',
      yes: 'unknown',
    };
    const nextMark =
      nextMarks[this.gridMark(firstCategoryId, firstValue, secondCategoryId, secondValue)];

    this.manualGridMarks.update((marks) => {
      const nextManualMarks = { ...marks };

      if (nextMark === 'unknown') {
        delete nextManualMarks[key];
        return nextManualMarks;
      }

      nextManualMarks[key] = nextMark;
      return nextManualMarks;
    });
    this.hasChecked.set(false);
    this.hintMessage.set(null);
  }

  protected gridMarkState(
    firstCategoryId: string,
    firstValue: string,
    secondCategoryId: string,
    secondValue: string,
  ): string {
    if (!this.hasChecked()) {
      return '';
    }

    const mark = this.gridMark(firstCategoryId, firstValue, secondCategoryId, secondValue);

    if (mark === 'unknown') {
      return '';
    }

    const isTrueRelation = this.isTrueRelation(
      firstCategoryId,
      firstValue,
      secondCategoryId,
      secondValue,
    );

    return (mark === 'yes') === isTrueRelation ? 'correct' : 'wrong';
  }

  protected gridMarkOrigin(
    firstCategoryId: string,
    firstValue: string,
    secondCategoryId: string,
    secondValue: string,
  ): string {
    const key = this.gridMarkKey(firstCategoryId, firstValue, secondCategoryId, secondValue);
    const mark = this.gridMark(firstCategoryId, firstValue, secondCategoryId, secondValue);

    if (mark === 'unknown') {
      return '';
    }

    return this.manualGridMarks()[key] ? 'manual' : 'deduced';
  }

  protected canToggleGridMark(
    firstCategoryId: string,
    firstValue: string,
    secondCategoryId: string,
    secondValue: string,
  ): boolean {
    const key = this.gridMarkKey(firstCategoryId, firstValue, secondCategoryId, secondValue);
    const mark = this.gridMark(firstCategoryId, firstValue, secondCategoryId, secondValue);

    return mark === 'unknown' || Boolean(this.manualGridMarks()[key]);
  }

  private setManualGridMark(
    firstCategoryId: string,
    firstValue: string,
    secondCategoryId: string,
    secondValue: string,
    mark: GridMark,
  ): void {
    const key = this.gridMarkKey(firstCategoryId, firstValue, secondCategoryId, secondValue);

    this.manualGridMarks.update((marks) => {
      const nextMarks = { ...marks };

      if (mark === 'unknown') {
        delete nextMarks[key];
      } else {
        nextMarks[key] = mark;
      }

      return nextMarks;
    });
  }

  private buildGridMarks(manualGridMarks: Record<string, GridMark>): Record<string, GridMark> {
    const gridMarks = { ...manualGridMarks };

    for (const [key, mark] of Object.entries(manualGridMarks)) {
      if (mark !== 'yes') {
        continue;
      }

      const relation = this.parseGridMarkKey(key);

      if (!relation) {
        continue;
      }

      this.setYesWithDeductions(
        relation.firstCategoryId,
        relation.firstValue,
        relation.secondCategoryId,
        relation.secondValue,
        gridMarks,
      );
    }

    return gridMarks;
  }

  private setYesWithDeductions(
    firstCategoryId: string,
    firstValue: string,
    secondCategoryId: string,
    secondValue: string,
    gridMarks: Record<string, GridMark>,
  ): void {
    gridMarks[this.gridMarkKey(firstCategoryId, firstValue, secondCategoryId, secondValue)] = 'yes';

    for (const value of this.getCategoryValues(secondCategoryId)) {
      if (value !== secondValue) {
        const key = this.gridMarkKey(firstCategoryId, firstValue, secondCategoryId, value);

        if (gridMarks[key] !== 'yes') {
          gridMarks[key] = 'no';
        }
      }
    }

    for (const value of this.getCategoryValues(firstCategoryId)) {
      if (value !== firstValue) {
        const key = this.gridMarkKey(firstCategoryId, value, secondCategoryId, secondValue);

        if (gridMarks[key] !== 'yes') {
          gridMarks[key] = 'no';
        }
      }
    }

    this.applyTransitiveDeductions(gridMarks);
  }

  private applyTransitiveDeductions(gridMarks: Record<string, GridMark>): void {
    let changed = true;

    while (changed) {
      changed = false;

      for (const firstRelation of this.trueRelations()) {
        if (this.gridMarkFromMap(gridMarks, firstRelation) !== 'yes') {
          continue;
        }

        for (const secondRelation of this.trueRelations()) {
          if (this.gridMarkFromMap(gridMarks, secondRelation) !== 'yes') {
            continue;
          }

          const shared = this.sharedRelationValue(firstRelation, secondRelation);

          if (!shared) {
            continue;
          }

          const impliedKey = this.gridMarkKey(
            shared.firstCategoryId,
            shared.firstValue,
            shared.secondCategoryId,
            shared.secondValue,
          );

          if (gridMarks[impliedKey] !== 'yes') {
            gridMarks[impliedKey] = 'yes';
            this.setYesWithDeductions(
              shared.firstCategoryId,
              shared.firstValue,
              shared.secondCategoryId,
              shared.secondValue,
              gridMarks,
            );
            changed = true;
          }
        }
      }
    }
  }

  private sharedRelationValue(
    firstRelation: ReturnType<ZebraPage['trueRelations']>[number],
    secondRelation: ReturnType<ZebraPage['trueRelations']>[number],
  ): {
    firstCategoryId: string;
    firstValue: string;
    secondCategoryId: string;
    secondValue: string;
  } | null {
    const firstValues = [
      { categoryId: firstRelation.firstCategory.id, value: firstRelation.firstValue },
      { categoryId: firstRelation.secondCategory.id, value: firstRelation.secondValue },
    ];
    const secondValues = [
      { categoryId: secondRelation.firstCategory.id, value: secondRelation.firstValue },
      { categoryId: secondRelation.secondCategory.id, value: secondRelation.secondValue },
    ];
    const sharedValue = this.findSharedRelationValue(firstRelation, secondRelation);

    if (!sharedValue) {
      return null;
    }

    const firstOther = firstValues.find(
      (value) => value.categoryId !== sharedValue.categoryId || value.value !== sharedValue.value,
    );
    const secondOther = secondValues.find(
      (value) => value.categoryId !== sharedValue.categoryId || value.value !== sharedValue.value,
    );

    if (!firstOther || !secondOther || firstOther.categoryId === secondOther.categoryId) {
      return null;
    }

    return {
      firstCategoryId: firstOther.categoryId,
      firstValue: firstOther.value,
      secondCategoryId: secondOther.categoryId,
      secondValue: secondOther.value,
    };
  }

  private findSharedRelationValue(
    firstRelation: ReturnType<ZebraPage['trueRelations']>[number],
    secondRelation: ReturnType<ZebraPage['trueRelations']>[number],
  ): { categoryId: string; value: string } | null {
    const firstValues = [
      { categoryId: firstRelation.firstCategory.id, value: firstRelation.firstValue },
      { categoryId: firstRelation.secondCategory.id, value: firstRelation.secondValue },
    ];
    const secondValues = [
      { categoryId: secondRelation.firstCategory.id, value: secondRelation.firstValue },
      { categoryId: secondRelation.secondCategory.id, value: secondRelation.secondValue },
    ];

    return (
      firstValues.find((first) =>
        secondValues.some(
          (second) => second.categoryId === first.categoryId && second.value === first.value,
        ),
      ) ?? null
    );
  }

  private trueRelations(): {
    firstCategory: ZebraCategory;
    firstValue: string;
    secondCategory: ZebraCategory;
    secondValue: string;
  }[] {
    return this.puzzle().solution.flatMap((row) =>
      this.comparisonSections().map((section) => ({
        firstCategory: section.first,
        firstValue: row[section.first.id],
        secondCategory: section.second,
        secondValue: row[section.second.id],
      })),
    );
  }

  private relationMark(relation: ReturnType<ZebraPage['trueRelations']>[number]): GridMark {
    return this.gridMark(
      relation.firstCategory.id,
      relation.firstValue,
      relation.secondCategory.id,
      relation.secondValue,
    );
  }

  private gridMarkFromMap(
    gridMarks: Record<string, GridMark>,
    relation: ReturnType<ZebraPage['trueRelations']>[number],
  ): GridMark {
    return (
      gridMarks[
        this.gridMarkKey(
          relation.firstCategory.id,
          relation.firstValue,
          relation.secondCategory.id,
          relation.secondValue,
        )
      ] ?? 'unknown'
    );
  }

  private isTrueRelation(
    firstCategoryId: string,
    firstValue: string,
    secondCategoryId: string,
    secondValue: string,
  ): boolean {
    return this.puzzle().solution.some(
      (row) => row[firstCategoryId] === firstValue && row[secondCategoryId] === secondValue,
    );
  }

  private isTrueRelationKey(key: string): boolean {
    const relation = this.parseGridMarkKey(key);

    return relation
      ? this.isTrueRelation(
          relation.firstCategoryId,
          relation.firstValue,
          relation.secondCategoryId,
          relation.secondValue,
        )
      : false;
  }

  private getCategoryValues(categoryId: string): string[] {
    return this.puzzle().categories.find((category) => category.id === categoryId)?.values ?? [];
  }

  private gridMarkKey(
    firstCategoryId: string,
    firstValue: string,
    secondCategoryId: string,
    secondValue: string,
  ): string {
    return [`${firstCategoryId}:${firstValue}`, `${secondCategoryId}:${secondValue}`]
      .sort()
      .join('|');
  }

  private parseGridMarkKey(key: string): {
    firstCategoryId: string;
    firstValue: string;
    secondCategoryId: string;
    secondValue: string;
  } | null {
    const [first, second] = key.split('|');

    if (!first || !second) {
      return null;
    }

    const firstSeparator = first.indexOf(':');
    const secondSeparator = second.indexOf(':');

    if (firstSeparator < 0 || secondSeparator < 0) {
      return null;
    }

    return {
      firstCategoryId: first.slice(0, firstSeparator),
      firstValue: first.slice(firstSeparator + 1),
      secondCategoryId: second.slice(0, secondSeparator),
      secondValue: second.slice(secondSeparator + 1),
    };
  }

  private createRandomPuzzle(basePuzzle: ZebraPuzzle): ZebraPuzzle {
    const categories = this.createVariantCategories(basePuzzle);
    const houseCategory = categories[0];
    const randomizedValuesByCategory = new Map(
      categories.map((category) => [
        category.id,
        category.id === houseCategory.id ? category.values : this.shuffle(category.values),
      ]),
    );

    const solution = houseCategory.values.map((house, houseIndex) =>
      Object.fromEntries(
        categories.map((category) => [
          category.id,
          category.id === houseCategory.id
            ? house
            : (randomizedValuesByCategory.get(category.id)?.[houseIndex] ?? ''),
        ]),
      ),
    );

    const candidateClues = this.createCandidateClues(categories, solution);
    const selectedClues = this.selectBalancedClues(candidateClues, categories, basePuzzle.level);

    // Choose wording after pruning so discarded candidates cannot use up the
    // different formulations intended for the clues the player actually sees.
    this.clueWordingChoices.clear();
    const logicalClues = this.shuffle(selectedClues).map((clue) => ({
      ...clue,
      text: this.formatClue(this.describeClue(clue, categories)),
    }));

    if (this.countMatchingSolutions(categories, logicalClues, 2) !== 1) {
      return this.createRandomPuzzle(basePuzzle);
    }

    return {
      ...basePuzzle,
      intro: `${basePuzzle.intro} Les maisons sont numérotées de gauche à droite.`,
      categories,
      clues: logicalClues.map((clue) => clue.text),
      logicalClues,
      solution,
    };
  }

  private createVariantCategories(basePuzzle: ZebraPuzzle): ZebraCategory[] {
    return basePuzzle.categories.map((category) => {
      if (category.id === 'house') {
        return category;
      }

      const variants = this.categoryValueVariants(category);
      const values = this.shuffle([...new Set(variants.flat())]).slice(0, category.values.length);

      return { ...category, values: [...values] };
    });
  }

  private categoryValueVariants(category: ZebraCategory): string[][] {
    const variants: Record<string, string[][]> = {
      person: [
        ['Nora', 'Omar', 'Lina'],
        ['Jade', 'Milo', 'Sara'],
        ['Émile', 'Léa', 'Noé'],
        ['Hugo', 'Maya', 'Noé', 'Zoé'],
        ['Anaïs', 'Félix', 'Iris', 'Noam'],
        ['Chloé', 'Élias', 'Maël', 'Nina'],
        ['Inès', 'Malik', 'Romy', 'Sacha', 'Yanis'],
        ['Adam', 'Éva', 'Lou', 'Marius', 'Nina'],
        ['Amine', 'Cléo', 'Liam', 'Rose', 'Théo'],
      ],
      color: [
        ['Orange', 'Violette', 'Rose'],
        ['Beige', 'Mauve', 'Turquoise'],
        ['Brune', 'Crème', 'Indigo'],
        ['Orange', 'Violette', 'Rose', 'Noire'],
        ['Beige', 'Mauve', 'Turquoise', 'Brune'],
        ['Crème', 'Indigo', 'Dorée', 'Argentée'],
        ['Orange', 'Violette', 'Rose', 'Noire', 'Grise'],
        ['Beige', 'Mauve', 'Turquoise', 'Brune', 'Crème'],
        ['Indigo', 'Dorée', 'Argentée', 'Corail', 'Grise'],
      ],
      pet: [
        ['Renard', 'Tortue', 'Aigle'],
        ['Lapin', 'Hamster', 'Canari'],
        ['Chat', 'Chien', 'Poisson'],
        ['Renard', 'Tortue', 'Aigle', 'Souris'],
        ['Lapin', 'Hamster', 'Canari', 'Poisson'],
        ['Chat', 'Chien', 'Perroquet', 'Tortue'],
        ['Renard', 'Tortue', 'Aigle', 'Souris', 'Panda'],
        ['Chat', 'Chien', 'Lapin', 'Poisson', 'Perroquet'],
        ['Canari', 'Hamster', 'Hérisson', 'Panda', 'Tortue'],
      ],
      hobby: [
        ['Randonnée', 'Musique', 'Natation', 'Lecture'],
        ['Cinéma', 'Danse', 'Photo', 'Yoga'],
        ['Cuisine', 'Dessin', 'Course', 'Jardinage'],
        ['Randonnée', 'Musique', 'Natation', 'Lecture', 'Cuisine'],
        ['Cinéma', 'Danse', 'Photo', 'Yoga', 'Dessin'],
        ['Course', 'Jardinage', 'Lecture', 'Musique', 'Peinture'],
      ],
      drink: [
        ['Infusion', 'Limonade', 'Cacao', 'Eau', 'Lait'],
        ['Tisane', 'Jus', 'Chocolat', 'Eau', 'Café'],
        ['Thé', 'Limonade', 'Cacao', 'Lait', 'Eau'],
      ],
    };
    const alternatives = (variants[category.id] ?? []).filter(
      (values) => values.length === category.values.length,
    );

    return [category.values, ...alternatives];
  }

  private describeHousePosition(category: ZebraCategory, value: string): string {
    if (category.id === 'person') {
      return `la maison de ${value}`;
    }

    if (category.id === 'color') {
      return `la maison ${this.feminineColor(value)}`;
    }

    if (category.id === 'pet') {
      return `la maison où vit ${this.withArticle(value)}`;
    }

    if (category.id === 'drink') {
      return `la maison où l'on boit ${this.drinkWithArticle(value)}`;
    }

    if (category.id === 'hobby') {
      return `la maison où l'on pratique ${this.hobbyWithArticle(value)}`;
    }

    return `la maison associée à ${category.label.toLowerCase()} ${this.displayValue(value)}`;
  }

  private describeSameHouseReference(category: ZebraCategory, value: string): string {
    if (category.id === 'person') {
      return `celle de ${value}`;
    }

    if (category.id === 'color') {
      return `celle qui est ${this.feminineColor(value)}`;
    }

    if (category.id === 'pet') {
      return `celle où vit ${this.withArticle(value)}`;
    }

    if (category.id === 'drink') {
      return `celle où l'on boit ${this.drinkWithArticle(value)}`;
    }

    if (category.id === 'hobby') {
      return `celle où l'on pratique ${this.hobbyWithArticle(value)}`;
    }

    return `celle associée à ${category.label.toLowerCase()} ${this.displayValue(value)}`;
  }

  private describeHouseClue(category: ZebraCategory, value: string, house: string): string {
    const houseText = this.houseLabel(house);
    const ordinalHouse = this.houseOrdinalLabel(house);

    if (category.id === 'person') {
      return this.chooseClueWording('position:person', [
        `${value} habite ${houseText}.`,
        `${this.capitalize(ordinalHouse)} est habitée par ${value}.`,
        `${value} vit dans ${ordinalHouse}.`,
        `C’est ${value} qui occupe ${ordinalHouse}.`,
        `On trouve ${value} dans ${houseText}.`,
      ]);
    }

    if (category.id === 'color') {
      const color = this.feminineColor(value);

      return this.chooseClueWording('position:color', [
        `${this.houseLabel(house, true)} est ${color}.`,
        `${this.capitalize(ordinalHouse)} a une façade ${color}.`,
        `La maison ${color} occupe la position ${house.replace('Maison ', '')}.`,
        `La façade de ${houseText} est ${color}.`,
        `C’est ${ordinalHouse} qui est ${color}.`,
      ]);
    }

    if (category.id === 'pet') {
      const pet = this.withArticle(value);

      return this.chooseClueWording('position:pet', [
        `${this.capitalize(pet)} vit dans ${houseText}.`,
        `Dans ${ordinalHouse}, l’animal est ${pet}.`,
        `${this.capitalize(ordinalHouse)} abrite ${pet}.`,
        `L’animal de ${houseText} est ${pet}.`,
        `On trouve ${pet} dans ${houseText}.`,
      ]);
    }

    if (category.id === 'drink') {
      const drink = this.drinkWithArticle(value);
      const drinkName = this.drinkName(value);

      return this.chooseClueWording('position:drink', [
        `On boit ${drink} dans ${houseText}.`,
        `Dans ${ordinalHouse}, on sert ${drink}.`,
        `La boisson de ${houseText} est ${drinkName}.`,
        `${this.capitalize(ordinalHouse)} est celle où l’on boit ${drink}.`,
        `La personne de ${houseText} choisit ${drinkName}.`,
      ]);
    }

    if (category.id === 'hobby') {
      const hobby = this.hobbyWithArticle(value);

      return this.chooseClueWording('position:hobby', [
        `${this.capitalize(hobby)} est le loisir de ${houseText}.`,
        `Dans ${ordinalHouse}, le loisir choisi est ${hobby}.`,
        `Le loisir de ${houseText} est ${hobby}.`,
        `${this.capitalize(ordinalHouse)} est celle où l’on pratique ${hobby}.`,
        `La personne de ${ordinalHouse} pratique ${hobby}.`,
      ]);
    }

    return `${category.label} ${value} est dans ${houseText}.`;
  }

  private withArticle(value: string): string {
    const normalizedValue = this.displayValue(value);
    const feminineValues = new Set(['souris', 'tortue']);

    if (/^[aeiouyéèêëàâäîïôöùûü]/.test(normalizedValue)) {
      return `l'${normalizedValue}`;
    }

    if (feminineValues.has(normalizedValue)) {
      return `la ${normalizedValue}`;
    }

    return `le ${normalizedValue}`;
  }

  private houseLabel(house: string, capitalize = false): string {
    const label = `la ${house.toLowerCase()}`;

    return capitalize ? this.capitalize(label) : label;
  }

  private houseOrdinalLabel(house: string): string {
    const ordinal = ['première', 'deuxième', 'troisième', 'quatrième', 'cinquième'][
      Number(house.replace('Maison ', '')) - 1
    ];

    return ordinal ? `la ${ordinal} maison` : this.houseLabel(house);
  }

  private feminineColor(value: string): string {
    const colors: Record<string, string> = {
      Rouge: 'rouge',
      Bleu: 'bleue',
      Vert: 'verte',
      Jaune: 'jaune',
      Blanc: 'blanche',
    };

    return colors[value] ?? value.toLowerCase();
  }

  private displayValue(value: string): string {
    const values: Record<string, string> = {
      Cafe: 'café',
      Echecs: 'échecs',
      Jardin: 'jardinage',
      The: 'thé',
    };

    return values[value] ?? value.toLowerCase();
  }

  private drinkWithArticle(value: string): string {
    const drink = this.displayValue(value);

    if (drink === 'eau') return "de l'eau";
    if (drink === 'infusion') return 'une infusion';
    if (['limonade', 'tisane'].includes(drink)) return `de la ${drink}`;

    return `du ${drink}`;
  }

  private drinkName(value: string): string {
    const drink = this.displayValue(value);

    if (drink === 'infusion') return 'une infusion';
    if (/^[aeiouyéèêëàâäîïôöùûü]/.test(drink)) return `l'${drink}`;
    if (['infusion', 'limonade', 'tisane'].includes(drink)) return `la ${drink}`;

    return `le ${drink}`;
  }

  private hobbyWithArticle(value: string): string {
    const hobby = this.displayValue(value);
    const feminineHobbies = new Set([
      'course',
      'cuisine',
      'danse',
      'lecture',
      'musique',
      'natation',
      'peinture',
      'photo',
      'randonnée',
    ]);

    if (hobby === 'échecs') return 'les échecs';
    if (/^[aeiouéèêëàâäîïôöùûü]/.test(hobby)) return `l'${hobby}`;
    return `${feminineHobbies.has(hobby) ? 'la' : 'le'} ${hobby}`;
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private formatClue(clue: string): string {
    const formattedClue = clue
      .replace(/\bde ([AEIOUYÉÈÊËÀÂÄÎÏÔÖÙÛÜ])/g, 'd’$1')
      .replace(/de le/g, 'du')
      .replace(/De le/g, 'Du')
      .replace(/de Le/g, 'du')
      .replace(/De Le/g, 'Du')
      .replace(/de La/g, 'de la')
      .replace(/De La/g, 'De la')
      .replace(/de L'/g, "de l'")
      .replace(/De L'/g, "De l'")
      .replace(/à le/g, 'au')
      .replace(/À le/g, 'Au')
      .replace(/à Le/g, 'au')
      .replace(/À Le/g, 'Au')
      .replace(/à La/g, 'à la')
      .replace(/À La/g, 'À la')
      .replace(/à L'/g, "à l'")
      .replace(/À L'/g, "À l'")
      .replace(/(La maison [^.]+ n'est pas )associé /g, '$1associée ')
      .replace(/(La maison [^.]+ est )associé /g, '$1associée ');

    return this.capitalize(formattedClue);
  }
  private clueKey(clue: ZebraClue): string {
    const { text, ...logicalClue } = clue;

    return JSON.stringify(logicalClue);
  }

  private randomItem<T>(values: T[]): T {
    return values[Math.floor(Math.random() * values.length)];
  }

  private chooseClueWording(kind: string, variants: string[]): string {
    let usedChoices = this.clueWordingChoices.get(kind);

    if (!usedChoices || usedChoices.size === variants.length) {
      usedChoices = new Set();
      this.clueWordingChoices.set(kind, usedChoices);
    }

    const choice = this.randomItem(
      variants.map((_, index) => index).filter((index) => !usedChoices.has(index)),
    );
    usedChoices.add(choice);
    return variants[choice];
  }

  private describeClue(clue: ZebraClue, categories: ZebraCategory[]): string {
    const category = (id: string): ZebraCategory => categories.find((item) => item.id === id)!;

    if (clue.type === 'position' || clue.type === 'notPosition') {
      const house = categories[0].values[clue.houseIndex];

      return clue.type === 'position'
        ? this.describeHouseClue(category(clue.categoryId), clue.value, house)
        : this.describeNegativeHouseClue(category(clue.categoryId), clue.value, house);
    }

    if (clue.type === 'adjacentRight' || clue.type === 'leftOf') {
      const describe =
        clue.type === 'adjacentRight'
          ? this.describeAdjacentClue.bind(this)
          : this.describeLeftOfClue.bind(this);

      return describe(
        category(clue.leftCategoryId),
        clue.leftValue,
        category(clue.rightCategoryId),
        clue.rightValue,
      );
    }

    if (clue.type === 'oneOf' || clue.type === 'neither') {
      return this.describeChoiceClue(
        clue.type,
        category(clue.firstCategoryId),
        clue.firstValue,
        category(clue.secondCategoryId),
        clue.secondValues,
      );
    }

    const describe = {
      same: this.describeSameClue.bind(this),
      notSame: this.describeNotSameClue.bind(this),
      adjacent: this.describeNeighborClue.bind(this),
      oneBetween: this.describeOneBetweenClue.bind(this),
    }[clue.type];

    return describe(
      category(clue.firstCategoryId),
      clue.firstValue,
      category(clue.secondCategoryId),
      clue.secondValue,
    );
  }

  private selectBalancedClues(
    clues: ZebraClue[],
    categories: ZebraCategory[],
    level: ZebraLevel,
  ): ZebraClue[] {
    let positionCount = 0;
    let associationCount = 0;
    const candidates = this.shuffle(clues).filter((clue) => {
      if (clue.type === 'position') {
        return positionCount++ === 0;
      }

      if (clue.type === 'same') {
        return associationCount++ < (level === 3 ? 1 : 2);
      }

      return true;
    });
    const protectedClues = new Set<ZebraClue>();
    const requiredTypes = [
      'position',
      'same',
      'notSame',
      'oneOf',
      ...(level >= 4 ? ['neither', 'leftOf'] : []),
      ...this.shuffle(['adjacentRight', 'adjacent', 'oneBetween']).slice(0, 2),
    ];

    for (const type of requiredTypes) {
      const clue = candidates.find((candidate) => candidate.type === type);

      if (clue) {
        protectedClues.add(clue);
      }
    }

    // Limit direct answers, then trim immediate-position chains before the
    // remaining relations. Keep several kinds of reasoning in every puzzle.
    const removalOrder = [
      ...candidates.filter((clue) => clue.type === 'same' || clue.type === 'notPosition'),
      ...candidates.filter((clue) => clue.type === 'adjacentRight'),
      ...candidates.filter((clue) => !['same', 'notPosition', 'adjacentRight'].includes(clue.type)),
    ];
    return this.reduceToEssentialClues(removalOrder, categories, protectedClues, level === 4);
  }

  private createCandidateClues(
    categories: ZebraCategory[],
    solution: Record<string, string>[],
  ): ZebraClue[] {
    const clues: ZebraClue[] = [];
    const clueKeys = new Set<string>();
    const houseCategory = categories[0];
    const nonHouseCategories = categories.slice(1);
    const sampleCategoryPairs = (): [ZebraCategory, ZebraCategory][] =>
      this.shuffle(
        nonHouseCategories.flatMap((firstCategory) =>
          nonHouseCategories.map(
            (secondCategory) => [firstCategory, secondCategory] as [ZebraCategory, ZebraCategory],
          ),
        ),
      ).slice(0, Math.max(4, nonHouseCategories.length));

    const addClue = (clue: ZebraClue): void => {
      const key = this.clueKey(clue);

      if (!clueKeys.has(key)) {
        clueKeys.add(key);
        clues.push(clue);
      }
    };

    for (const row of solution) {
      const houseIndex = houseCategory.values.indexOf(row[houseCategory.id]);

      for (const category of nonHouseCategories) {
        addClue({
          type: 'position',
          categoryId: category.id,
          value: row[category.id],
          houseIndex,
          text: '',
        });

        const wrongHouseIndex = this.randomItem(
          houseCategory.values.map((_, index) => index).filter((index) => index !== houseIndex),
        );

        addClue({
          type: 'notPosition',
          categoryId: category.id,
          value: row[category.id],
          houseIndex: wrongHouseIndex,
          text: '',
        });
      }

      for (let firstIndex = 0; firstIndex < nonHouseCategories.length; firstIndex += 1) {
        for (
          let secondIndex = firstIndex + 1;
          secondIndex < nonHouseCategories.length;
          secondIndex += 1
        ) {
          const firstCategory = nonHouseCategories[firstIndex];
          const secondCategory = nonHouseCategories[secondIndex];

          addClue({
            type: 'same',
            firstCategoryId: firstCategory.id,
            firstValue: row[firstCategory.id],
            secondCategoryId: secondCategory.id,
            secondValue: row[secondCategory.id],
            text: '',
          });

          const wrongSecondValue = this.randomItem(
            secondCategory.values.filter((value) => value !== row[secondCategory.id]),
          );

          addClue({
            type: 'notSame',
            firstCategoryId: firstCategory.id,
            firstValue: row[firstCategory.id],
            secondCategoryId: secondCategory.id,
            secondValue: wrongSecondValue,
            text: '',
          });

          // Vary the subject: a person's attributes, or who owns an animal,
          // has a hobby or lives in a colour.
          const [subjectCategory, choiceCategory] = this.randomItem([
            [firstCategory, secondCategory],
            [secondCategory, firstCategory],
          ]);
          const otherValues = this.shuffle(
            choiceCategory.values.filter((value) => value !== row[choiceCategory.id]),
          );

          addClue({
            type: 'oneOf',
            firstCategoryId: subjectCategory.id,
            firstValue: row[subjectCategory.id],
            secondCategoryId: choiceCategory.id,
            secondValues: this.shuffle([row[choiceCategory.id], otherValues[0]]) as [
              string,
              string,
            ],
            text: '',
          });

          if (solution.length >= 4) {
            addClue({
              type: 'neither',
              firstCategoryId: subjectCategory.id,
              firstValue: row[subjectCategory.id],
              secondCategoryId: choiceCategory.id,
              secondValues: [otherValues[0], otherValues[1]],
              text: '',
            });
          }
        }
      }
    }

    for (let houseIndex = 0; houseIndex < solution.length - 1; houseIndex += 1) {
      const leftRow = solution[houseIndex];
      const rightRow = solution[houseIndex + 1];

      for (const leftCategory of nonHouseCategories) {
        const rightCategories = [
          leftCategory,
          this.randomItem(nonHouseCategories.filter((category) => category !== leftCategory)),
        ];

        for (const rightCategory of rightCategories) {
          addClue({
            type: 'adjacentRight',
            leftCategoryId: leftCategory.id,
            leftValue: leftRow[leftCategory.id],
            rightCategoryId: rightCategory.id,
            rightValue: rightRow[rightCategory.id],
            text: '',
          });
        }
      }

      for (const [firstCategory, secondCategory] of sampleCategoryPairs()) {
        addClue({
          type: 'adjacent',
          firstCategoryId: firstCategory.id,
          firstValue: leftRow[firstCategory.id],
          secondCategoryId: secondCategory.id,
          secondValue: rightRow[secondCategory.id],
          text: '',
        });
      }
    }

    for (let firstHouseIndex = 0; firstHouseIndex < solution.length - 1; firstHouseIndex += 1) {
      for (
        let secondHouseIndex = firstHouseIndex + 1;
        secondHouseIndex < solution.length;
        secondHouseIndex += 1
      ) {
        const leftRow = solution[firstHouseIndex];
        const rightRow = solution[secondHouseIndex];

        for (const [leftCategory, rightCategory] of sampleCategoryPairs()) {
          addClue({
            type: 'leftOf',
            leftCategoryId: leftCategory.id,
            leftValue: leftRow[leftCategory.id],
            rightCategoryId: rightCategory.id,
            rightValue: rightRow[rightCategory.id],
            text: '',
          });
        }
      }
    }

    for (let firstHouseIndex = 0; firstHouseIndex < solution.length - 2; firstHouseIndex += 1) {
      const firstRow = solution[firstHouseIndex];
      const secondRow = solution[firstHouseIndex + 2];

      for (const [firstCategory, secondCategory] of sampleCategoryPairs()) {
        addClue({
          type: 'oneBetween',
          firstCategoryId: firstCategory.id,
          firstValue: firstRow[firstCategory.id],
          secondCategoryId: secondCategory.id,
          secondValue: secondRow[secondCategory.id],
          text: '',
        });
      }
    }

    return this.shuffle(clues);
  }

  private reduceToEssentialClues(
    clues: ZebraClue[],
    categories: ZebraCategory[],
    protectedClues = new Set<ZebraClue>(),
    requireDeduction = false,
  ): ZebraClue[] {
    let essentialClues = [...clues];

    for (const clue of clues) {
      if (protectedClues.has(clue)) {
        continue;
      }

      const nextClues = essentialClues.filter((candidate) => candidate !== clue);
      const stillSolvable = requireDeduction
        ? deduceZebraPositions(categories, nextClues, false).solved
        : this.countMatchingSolutions(categories, nextClues, 2) === 1;

      if (stillSolvable) {
        essentialClues = nextClues;
      }
    }

    return essentialClues;
  }

  private describeSameClue(
    firstCategory: ZebraCategory,
    firstValue: string,
    secondCategory: ZebraCategory,
    secondValue: string,
  ): string {
    if (firstCategory.id === 'person') {
      const attribute = this.describePersonAttribute(secondCategory, secondValue);

      return this.chooseClueWording('same:person', [
        `${firstValue} ${attribute}.`,
        `${this.capitalize(this.describeResident(secondCategory, secondValue))} s’appelle ${firstValue}.`,
        `C’est ${firstValue} qui ${attribute}.`,
        `${this.capitalize(this.describeHousePosition(secondCategory, secondValue))} est habitée par ${firstValue}.`,
        `La maison de ${firstValue} est ${this.describeSameHouseReference(secondCategory, secondValue)}.`,
      ]);
    }

    if (secondCategory.id === 'person') {
      return this.describeSameClue(secondCategory, secondValue, firstCategory, firstValue);
    }

    const firstDescription = this.describeHousePosition(firstCategory, firstValue);
    const secondDescription = this.describeSameHouseReference(secondCategory, secondValue);

    return this.chooseClueWording('same:attributes', [
      `${this.capitalize(this.describeResident(firstCategory, firstValue))} ${this.describePersonAttribute(secondCategory, secondValue)}.`,
      `${this.capitalize(this.describeResident(secondCategory, secondValue))} ${this.describePersonAttribute(firstCategory, firstValue)}.`,
      `Dans ${firstDescription}, la personne ${this.describePersonAttribute(secondCategory, secondValue)}.`,
      `${this.capitalize(firstDescription)} est aussi ${secondDescription}.`,
      `${this.capitalize(this.describeResident(firstCategory, firstValue))} vit dans ${this.describeHousePosition(secondCategory, secondValue)}.`,
    ]);
  }

  private describeNotSameClue(
    firstCategory: ZebraCategory,
    firstValue: string,
    secondCategory: ZebraCategory,
    secondValue: string,
  ): string {
    if (firstCategory.id === 'person') {
      const negativeAttribute = this.describeNegativePersonAttribute(secondCategory, secondValue);

      return this.chooseClueWording('notSame:person', [
        `${firstValue} ${negativeAttribute}.`,
        `${this.capitalize(this.describeResident(secondCategory, secondValue))} ne s’appelle pas ${firstValue}.`,
        `La maison de ${firstValue} et ${this.describeHousePosition(secondCategory, secondValue)} sont deux maisons différentes.`,
        `La maison de ${firstValue} n'est pas ${this.describeSameHouseReference(secondCategory, secondValue)}.`,
      ]);
    }

    if (secondCategory.id === 'person') {
      return this.describeNotSameClue(secondCategory, secondValue, firstCategory, firstValue);
    }

    const firstDescription = this.describeHousePosition(firstCategory, firstValue);
    const secondDescription = this.describeSameHouseReference(secondCategory, secondValue);

    return this.chooseClueWording('notSame:attributes', [
      `${this.capitalize(firstDescription)} n'est pas ${secondDescription}.`,
      `${this.capitalize(firstDescription)} et ${secondDescription} sont deux maisons différentes.`,
      `${this.capitalize(this.describeResident(firstCategory, firstValue))} ${this.describeNegativePersonAttribute(secondCategory, secondValue)}.`,
      `${this.capitalize(this.describeResident(secondCategory, secondValue))} ${this.describeNegativePersonAttribute(firstCategory, firstValue)}.`,
      `Dans ${firstDescription}, la personne ${this.describeNegativePersonAttribute(secondCategory, secondValue)}.`,
    ]);
  }

  private describeChoiceClue(
    type: 'oneOf' | 'neither',
    firstCategory: ZebraCategory,
    firstValue: string,
    secondCategory: ZebraCategory,
    secondValues: [string, string],
  ): string {
    const house = this.describeHousePosition(firstCategory, firstValue);
    const resident = this.capitalize(this.describeResident(firstCategory, firstValue));
    const [first, second] = secondValues;

    if (secondCategory.id === 'person') {
      return this.chooseClueWording(
        `${type}:person`,
        type === 'oneOf'
          ? [
              `${this.capitalize(house)} est habitée par ${first} ou ${second}.`,
              `${resident} s’appelle soit ${first}, soit ${second}.`,
              `Seuls ${first} ou ${second} peuvent habiter ${house}.`,
              `L’occupant de ${house} est ${first} ou ${second}.`,
            ]
          : [
              `${this.capitalize(house)} n’est habitée ni par ${first} ni par ${second}.`,
              `${resident} ne s’appelle ni ${first} ni ${second}.`,
              `Ni ${first} ni ${second} n’habitent ${house}.`,
              `${first} et ${second} habitent ailleurs que dans ${house}.`,
            ],
      );
    }

    const attribute = this.describeChoiceAttribute(type, secondCategory, secondValues);
    const [firstReference, secondReference] = secondValues.map((value) =>
      this.describeSameHouseReference(secondCategory, value),
    );
    const objects = secondValues.map((value) => {
      if (secondCategory.id === 'color') return this.feminineColor(value);
      if (secondCategory.id === 'pet') return this.withArticle(value);
      if (secondCategory.id === 'drink') return this.drinkName(value);
      return this.hobbyWithArticle(value);
    });
    const attributeLabels: Record<string, string> = {
      pet: 'L’animal',
      drink: 'La boisson',
      hobby: 'Le loisir',
    };
    const subject =
      secondCategory.id === 'color'
        ? this.capitalize(house)
        : `${attributeLabels[secondCategory.id]} de ${this.describeResident(firstCategory, firstValue)}`;
    const attributeChoice =
      type === 'oneOf'
        ? `${subject} est soit ${objects[0]}, soit ${objects[1]}.`
        : `${subject} n’est ni ${objects[0]} ni ${objects[1]}.`;

    return this.chooseClueWording(
      `${type}:attributes`,
      type === 'oneOf'
        ? [
            `${resident} ${attribute}.`,
            `${this.capitalize(house)} est soit ${firstReference}, soit ${secondReference}.`,
            attributeChoice,
          ]
        : [
            `${resident} ${attribute}.`,
            `${this.capitalize(house)} n’est ni ${firstReference} ni ${secondReference}.`,
            attributeChoice,
          ],
    );
  }

  private describeChoiceAttribute(
    type: 'oneOf' | 'neither',
    category: ZebraCategory,
    [first, second]: [string, string],
  ): string {
    if (category.id === 'color') {
      const firstHouse = `la maison ${this.feminineColor(first)}`;
      const secondHouse = `la maison ${this.feminineColor(second)}`;

      return type === 'oneOf'
        ? `habite soit ${firstHouse}, soit ${secondHouse}`
        : `n’habite ni ${firstHouse} ni ${secondHouse}`;
    }

    if (category.id === 'pet') {
      const firstPet = this.withArticle(first);
      const secondPet = this.withArticle(second);

      return type === 'oneOf'
        ? `a pour animal soit ${firstPet}, soit ${secondPet}`
        : `n’a ni ${firstPet} ni ${secondPet} comme animal`;
    }

    if (category.id === 'drink') {
      return type === 'oneOf'
        ? `boit soit ${this.drinkWithArticle(first)}, soit ${this.drinkWithArticle(second)}`
        : `ne choisit ni ${this.drinkName(first)} ni ${this.drinkName(second)} comme boisson`;
    }

    return type === 'oneOf'
      ? `pratique soit ${this.hobbyWithArticle(first)}, soit ${this.hobbyWithArticle(second)}`
      : `ne pratique ni ${this.hobbyWithArticle(first)} ni ${this.hobbyWithArticle(second)}`;
  }

  private describeAdjacentClue(
    leftCategory: ZebraCategory,
    leftValue: string,
    rightCategory: ZebraCategory,
    rightValue: string,
  ): string {
    const leftDescription = this.describeHousePosition(leftCategory, leftValue);
    const rightDescription = this.describeHousePosition(rightCategory, rightValue);

    return this.chooseClueWording('adjacentRight', [
      `${this.capitalize(leftDescription)} est juste à gauche de ${rightDescription}.`,
      `${this.capitalize(leftDescription)} se trouve immédiatement à gauche de ${rightDescription}.`,
      `${this.capitalize(rightDescription)} est immédiatement à droite de ${leftDescription}.`,
      `${this.capitalize(leftDescription)} précède directement ${rightDescription}.`,
      `En allant de gauche à droite, ${leftDescription} vient juste avant ${rightDescription}.`,
      `${this.capitalize(leftDescription)} et ${rightDescription} sont deux maisons consécutives, dans cet ordre.`,
    ]);
  }

  private describeNeighborClue(
    firstCategory: ZebraCategory,
    firstValue: string,
    secondCategory: ZebraCategory,
    secondValue: string,
  ): string {
    const firstDescription = this.describeHousePosition(firstCategory, firstValue);
    const secondDescription = this.describeHousePosition(secondCategory, secondValue);

    return this.chooseClueWording('adjacent', [
      `${this.capitalize(firstDescription)} se trouve à côté de ${secondDescription}.`,
      `${this.capitalize(firstDescription)} est voisine de ${secondDescription}.`,
      `${this.capitalize(firstDescription)} et ${secondDescription} sont côte à côte.`,
      `${this.capitalize(firstDescription)} et ${secondDescription} occupent des positions consécutives.`,
      `Ces deux maisons, ${firstDescription} et ${secondDescription}, sont voisines, sans indication du côté.`,
    ]);
  }

  private describeLeftOfClue(
    leftCategory: ZebraCategory,
    leftValue: string,
    rightCategory: ZebraCategory,
    rightValue: string,
  ): string {
    const leftDescription = this.describeHousePosition(leftCategory, leftValue);
    const rightDescription = this.describeHousePosition(rightCategory, rightValue);

    return this.chooseClueWording('leftOf', [
      `${this.capitalize(leftDescription)} se trouve quelque part à gauche de ${rightDescription}.`,
      `${this.capitalize(rightDescription)} se trouve plus à droite que ${leftDescription}.`,
      `En allant de gauche à droite, on rencontre ${leftDescription} avant ${rightDescription}.`,
      `${this.capitalize(leftDescription)} précède ${rightDescription}, mais pas nécessairement juste à côté.`,
      `${this.capitalize(leftDescription)} est située à gauche de ${rightDescription}.`,
    ]);
  }

  private describeOneBetweenClue(
    firstCategory: ZebraCategory,
    firstValue: string,
    secondCategory: ZebraCategory,
    secondValue: string,
  ): string {
    const firstDescription = this.describeHousePosition(firstCategory, firstValue);
    const secondDescription = this.describeHousePosition(secondCategory, secondValue);

    return this.chooseClueWording('oneBetween', [
      `Une seule maison se trouve exactement entre ${firstDescription} et ${secondDescription}.`,
      `Une seule maison sépare ${firstDescription} de ${secondDescription}.`,
      `Il y a exactement une seule maison entre ${firstDescription} et ${secondDescription}.`,
      `Entre ${firstDescription} et ${secondDescription}, on compte une seule maison.`,
      `${this.capitalize(firstDescription)} et ${secondDescription} sont séparées par une seule maison.`,
      `Les numéros de ${firstDescription} et de ${secondDescription} diffèrent de deux : une seule maison les sépare.`,
    ]);
  }

  private describeResident(category: ZebraCategory, value: string): string {
    return category.id === 'person'
      ? value
      : `la personne qui ${this.describePersonAttribute(category, value)}`;
  }

  private describePersonAttribute(category: ZebraCategory, value: string): string {
    if (category.id === 'color') {
      return `habite la maison ${this.feminineColor(value)}`;
    }

    if (category.id === 'pet') {
      return `a pour animal ${this.withArticle(value)}`;
    }

    if (category.id === 'drink') {
      return `boit ${this.drinkWithArticle(value)}`;
    }

    if (category.id === 'hobby') {
      return `pratique ${this.hobbyWithArticle(value)}`;
    }

    return `est associé à ${this.displayValue(value)}`;
  }

  private describeNegativePersonAttribute(category: ZebraCategory, value: string): string {
    if (category.id === 'color') {
      return `n'est pas dans la maison ${this.feminineColor(value)}`;
    }

    if (category.id === 'pet') {
      return `n'a pas ${this.withArticle(value)} comme animal`;
    }

    if (category.id === 'drink') {
      return `ne boit pas ${this.drinkWithArticle(value)}`;
    }

    if (category.id === 'hobby') {
      return `ne pratique pas ${this.hobbyWithArticle(value)}`;
    }

    return `n'est pas associé à ${this.displayValue(value)}`;
  }

  private describeNegativeHouseClue(category: ZebraCategory, value: string, house: string): string {
    const houseText = this.houseLabel(house);

    if (category.id === 'person') {
      return this.chooseClueWording('notPosition:person', [
        `${value} n'est pas dans ${houseText}.`,
        `${value} n'habite pas ${houseText}.`,
        `${this.capitalize(houseText)} n'est pas habitée par ${value}.`,
      ]);
    }

    if (category.id === 'color') {
      const color = this.feminineColor(value);

      return this.chooseClueWording('notPosition:color', [
        `${this.houseLabel(house, true)} n'est pas ${color}.`,
        `${houseText} n'a pas la couleur ${color}.`,
        `La couleur ${color} n'est pas celle de ${houseText}.`,
      ]);
    }

    if (category.id === 'pet') {
      const pet = this.withArticle(value);

      return this.chooseClueWording('notPosition:pet', [
        `${this.capitalize(pet)} ne vit pas dans ${houseText}.`,
        `${this.capitalize(pet)} ne se trouve pas dans ${houseText}.`,
        `${this.capitalize(houseText)} n'abrite pas ${pet}.`,
      ]);
    }

    if (category.id === 'drink') {
      const drink = this.drinkWithArticle(value);
      const drinkName = this.drinkName(value);

      return this.chooseClueWording('notPosition:drink', [
        `On ne boit pas ${drink} dans ${houseText}.`,
        `Dans ${houseText}, on ne sert pas ${drink}.`,
        `La boisson de ${houseText} n'est pas ${drinkName}.`,
      ]);
    }

    if (category.id === 'hobby') {
      const hobby = this.hobbyWithArticle(value);

      return this.chooseClueWording('notPosition:hobby', [
        `${this.capitalize(hobby)} n'est pas le loisir de ${houseText}.`,
        `Dans ${houseText}, le loisir choisi n'est pas ${hobby}.`,
        `Le loisir de ${houseText} n'est pas ${hobby}.`,
        `${houseText} n’est pas celle où l’on pratique ${hobby}.`,
        `La personne de ${houseText} ne pratique pas ${hobby}.`,
      ]);
    }

    return `${this.describeHousePosition(category, value)} n'est pas ${houseText}.`;
  }

  private countMatchingSolutions(
    categories: ZebraCategory[],
    clues: ZebraClue[],
    limit: number,
  ): number {
    const houseCategory = categories[0];
    const assignments: Record<string, Record<string, number>> = {
      [houseCategory.id]: Object.fromEntries(
        houseCategory.values.map((house, index) => [house, index]),
      ),
    };
    const deduction = deduceZebraPositions(categories, clues, false);
    const permutationsByCategory = new Map(
      categories.slice(1).map((category) => [
        category.id,
        this.permutations(category.values)
          .map((permutation) =>
            Object.fromEntries(permutation.map((value, index) => [value, index])),
          )
          .filter(
            (permutation) =>
              category.values.every((value) =>
                deduction.positions[category.id][value].includes(permutation[value]),
              ) &&
              clues.every((clue) =>
                this.clueCouldMatch(clue, { ...assignments, [category.id]: permutation }),
              ),
          ),
      ]),
    );
    // Search the most constrained category first, including when its anchor
    // belongs to a category near the end of the displayed grid.
    const nonHouseCategories = categories
      .slice(1)
      .sort(
        (first, second) =>
          permutationsByCategory.get(first.id)!.length -
          permutationsByCategory.get(second.id)!.length,
      );
    let solutionCount = 0;

    const search = (categoryIndex: number): void => {
      if (solutionCount >= limit) {
        return;
      }

      if (categoryIndex >= nonHouseCategories.length) {
        if (clues.every((clue) => this.clueMatches(clue, assignments))) {
          solutionCount += 1;
        }

        return;
      }

      const category = nonHouseCategories[categoryIndex];
      const permutations = permutationsByCategory.get(category.id) ?? [];

      for (const permutation of permutations) {
        assignments[category.id] = permutation;

        if (clues.every((clue) => this.clueCouldMatch(clue, assignments))) {
          search(categoryIndex + 1);
        }

        delete assignments[category.id];
      }
    };

    search(0);
    return solutionCount;
  }

  private clueCouldMatch(
    clue: ZebraClue,
    assignments: Record<string, Record<string, number>>,
  ): boolean {
    return this.clueMatches(clue, assignments, true);
  }

  private clueMatches(
    clue: ZebraClue,
    assignments: Record<string, Record<string, number>>,
    allowUnknown = false,
  ): boolean {
    if (clue.type === 'position') {
      const houseIndex = assignments[clue.categoryId]?.[clue.value];

      return houseIndex === undefined ? allowUnknown : houseIndex === clue.houseIndex;
    }

    if (clue.type === 'notPosition') {
      const houseIndex = assignments[clue.categoryId]?.[clue.value];

      return houseIndex === undefined ? allowUnknown : houseIndex !== clue.houseIndex;
    }

    if (clue.type === 'same') {
      const firstHouseIndex = assignments[clue.firstCategoryId]?.[clue.firstValue];
      const secondHouseIndex = assignments[clue.secondCategoryId]?.[clue.secondValue];

      return firstHouseIndex === undefined || secondHouseIndex === undefined
        ? allowUnknown
        : firstHouseIndex === secondHouseIndex;
    }

    if (clue.type === 'notSame') {
      const firstHouseIndex = assignments[clue.firstCategoryId]?.[clue.firstValue];
      const secondHouseIndex = assignments[clue.secondCategoryId]?.[clue.secondValue];

      return firstHouseIndex === undefined || secondHouseIndex === undefined
        ? allowUnknown
        : firstHouseIndex !== secondHouseIndex;
    }

    if (clue.type === 'oneOf' || clue.type === 'neither') {
      const firstHouseIndex = assignments[clue.firstCategoryId]?.[clue.firstValue];
      const optionIndexes = clue.secondValues.map(
        (value) => assignments[clue.secondCategoryId]?.[value],
      );

      if (firstHouseIndex === undefined) {
        return allowUnknown;
      }

      if (optionIndexes.includes(firstHouseIndex)) {
        return clue.type === 'oneOf';
      }

      if (optionIndexes.some((index) => index === undefined)) {
        return allowUnknown;
      }

      return clue.type === 'neither';
    }

    if (clue.type === 'adjacent' || clue.type === 'oneBetween') {
      const firstHouseIndex = assignments[clue.firstCategoryId]?.[clue.firstValue];
      const secondHouseIndex = assignments[clue.secondCategoryId]?.[clue.secondValue];

      if (firstHouseIndex === undefined || secondHouseIndex === undefined) {
        return allowUnknown;
      }

      const expectedDistance = clue.type === 'adjacent' ? 1 : 2;
      return Math.abs(firstHouseIndex - secondHouseIndex) === expectedDistance;
    }

    const leftHouseIndex = assignments[clue.leftCategoryId]?.[clue.leftValue];
    const rightHouseIndex = assignments[clue.rightCategoryId]?.[clue.rightValue];

    if (leftHouseIndex === undefined || rightHouseIndex === undefined) {
      return allowUnknown;
    }

    return clue.type === 'adjacentRight'
      ? leftHouseIndex + 1 === rightHouseIndex
      : leftHouseIndex < rightHouseIndex;
  }

  private permutations<T>(values: T[]): T[][] {
    if (values.length <= 1) {
      return [values];
    }

    return values.flatMap((value, index) =>
      this.permutations([...values.slice(0, index), ...values.slice(index + 1)]).map(
        (permutation) => [value, ...permutation],
      ),
    );
  }

  private shuffle<T>(values: T[]): T[] {
    const shuffled = [...values];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
  }
}

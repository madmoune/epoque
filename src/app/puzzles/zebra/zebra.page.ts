import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PuzzleSuccessPopupComponent } from '../shared/puzzle-success-popup/puzzle-success-popup.component';

type ZebraLevel = 3 | 4 | 5;

type ZebraCategory = {
  id: string;
  label: string;
  values: string[];
};

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

type ZebraClue =
  | {
      type: 'same';
      firstCategoryId: string;
      firstValue: string;
      secondCategoryId: string;
      secondValue: string;
      text: string;
    }
  | {
      type: 'notSame';
      firstCategoryId: string;
      firstValue: string;
      secondCategoryId: string;
      secondValue: string;
      text: string;
    }
  | {
      type: 'position';
      categoryId: string;
      value: string;
      houseIndex: number;
      text: string;
    }
  | {
      type: 'notPosition';
      categoryId: string;
      value: string;
      houseIndex: number;
      text: string;
    }
  | {
      type: 'adjacentRight';
      leftCategoryId: string;
      leftValue: string;
      rightCategoryId: string;
      rightValue: string;
      text: string;
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
      'La maison bleue est la deuxieme.',
      'Alice habite la premiere maison.',
      'Diego habite la maison jaune.',
      'Clara habite juste à gauche de Diego.',
      'La maison verte est juste à gauche de la maison jaune.',
      'La personne qui fait du violon habite la maison rouge.',
      'Le chien vit dans la maison bleue.',
      "L'oiseau vit dans la maison verte.",
      'La peinture est pratiquee dans la maison verte.',
      'La course est pratiquee par la personne au poisson.',
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
      'La maison rouge est la premiere.',
      'Clara habite au centre.',
      'Diego habite la maison jaune.',
      'Emma habite la cinquieme maison.',
      'Alice boit du the.',
      'Bruno boit du cafe.',
      'Le lait est bu dans la maison du centre.',
      'La personne de la maison blanche boit de l eau.',
      'Le chien vit dans la maison bleue.',
      "L'oiseau vit dans la maison verte.",
      'Le lapin vit dans la maison blanche.',
      'La peinture est pratiquee dans la maison verte.',
      'La course est pratiquee par la personne au poisson.',
      'Bruno pratique les echecs.',
      'Le jardin est pratique dans la maison blanche.',
      'Le violon est pratique dans la maison rouge.',
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
  protected readonly level = signal<ZebraLevel>(3);
  private readonly puzzles = ZEBRA_PUZZLES;
  private readonly activePuzzle = signal<ZebraPuzzle>(this.createRandomPuzzle(this.puzzles[3]));
  protected readonly puzzle = computed(() => this.activePuzzle());
  private readonly manualGridMarks = signal<Record<string, GridMark>>({});
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
    this.hasChecked.set(false);
    this.hintMessage.set(null);
  }

  protected checkPuzzle(): void {
    this.hasChecked.set(true);
  }

  protected resetPuzzle(): void {
    this.manualGridMarks.set({});
    this.hasChecked.set(false);
    this.hintMessage.set(null);
  }

  protected newPuzzle(): void {
    this.activePuzzle.set(this.createRandomPuzzle(this.puzzles[this.level()]));
    this.manualGridMarks.set({});
    this.hasChecked.set(false);
    this.hintMessage.set(null);
  }

  protected showHint(): void {
    const hintRelation = this.trueRelations().find(
      (relation) => this.relationMark(relation) !== 'yes',
    );

    if (!hintRelation) {
      this.hintMessage.set('Toutes les associations nécessaires sont déjà déduites.');
      return;
    }

    const explanation = this.explainHint(hintRelation);

    this.setManualGridMark(
      hintRelation.firstCategory.id,
      hintRelation.firstValue,
      hintRelation.secondCategory.id,
      hintRelation.secondValue,
      'yes',
    );
    this.hasChecked.set(false);
    this.hintMessage.set(explanation);
  }

  protected associationText(relation: ReturnType<ZebraPage['trueRelations']>[number]): string {
    return `${relation.firstCategory.label} « ${relation.firstValue} » avec ${relation.secondCategory.label.toLowerCase()} « ${relation.secondValue} »`;
  }

  private explainHint(relation: ReturnType<ZebraPage['trueRelations']>[number]): string {
    const knownRelations = this.trueRelations().filter(
      (candidate) => this.relationMark(candidate) === 'yes',
    );

    for (const first of knownRelations) {
      for (const second of knownRelations) {
        const implied = this.sharedRelationValue(first, second);

        if (implied && this.matchesAssociation(relation, implied)) {
          const sharedValue = this.sharedValueText(first, second);

          return `Déduction : ${this.associationText(relation)}. Pourquoi : on sait déjà que ${this.associationText(first)} et ${this.associationText(second)}. Ces deux associations ont ${sharedValue} en commun; les deux valeurs restantes doivent donc être associées. Une valeur ne peut avoir qu’une seule association dans chaque catégorie.`;
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
      return `Déduction : ${this.associationText(relation)}. Pourquoi : toutes les autres valeurs de ${relation.secondCategory.label.toLowerCase()} sont déjà impossibles pour ${relation.firstCategory.label.toLowerCase()} « ${relation.firstValue} ».`;
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
      return `Déduction : ${this.associationText(relation)}. Pourquoi : toutes les autres valeurs de ${relation.firstCategory.label.toLowerCase()} sont déjà impossibles pour ${relation.secondCategory.label.toLowerCase()} « ${relation.secondValue} ».`;
    }

    const directClue = this.puzzle().logicalClues?.find((clue) =>
      this.clueImpliesAssociation(clue, relation),
    );

    if (directClue) {
      return `Déduction : ${this.associationText(relation)}. Pourquoi : l’indice « ${this.formatClue(directClue.text)} » donne directement cette association.`;
    }

    return `Déduction : ${this.associationText(relation)}. Pourquoi : ${this.explainExistingContext(relation)}`;
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

  private explainExistingContext(relation: ReturnType<ZebraPage['trueRelations']>[number]): string {
    const knownRelations = this.trueRelations().filter((candidate) => {
      if (this.relationMark(candidate) !== 'yes') {
        return false;
      }

      return (
        (candidate.firstCategory.id === relation.firstCategory.id &&
          candidate.firstValue === relation.firstValue) ||
        (candidate.secondCategory.id === relation.secondCategory.id &&
          candidate.secondValue === relation.secondValue) ||
        (candidate.firstCategory.id === relation.secondCategory.id &&
          candidate.firstValue === relation.secondValue) ||
        (candidate.secondCategory.id === relation.firstCategory.id &&
          candidate.secondValue === relation.firstValue)
      );
    });

    const excludedSecondValues = relation.secondCategory.values.filter(
      (value) =>
        value !== relation.secondValue &&
        this.gridMark(
          relation.firstCategory.id,
          relation.firstValue,
          relation.secondCategory.id,
          value,
        ) === 'no',
    );
    const excludedFirstValues = relation.firstCategory.values.filter(
      (value) =>
        value !== relation.firstValue &&
        this.gridMark(
          relation.firstCategory.id,
          value,
          relation.secondCategory.id,
          relation.secondValue,
        ) === 'no',
    );
    const context: string[] = [];

    if (knownRelations.length > 0) {
      context.push(
        `les associations déjà confirmées sont ${knownRelations
          .map((candidate) => `« ${this.associationText(candidate)} »`)
          .join(' et ')}`,
      );
    }

    if (excludedSecondValues.length > 0) {
      context.push(
        `pour ${relation.firstCategory.label.toLowerCase()} « ${relation.firstValue} », les autres valeurs exclues sont : ${excludedSecondValues
          .map((value) => `« ${value} »`)
          .join(', ')}`,
      );
    }

    if (excludedFirstValues.length > 0) {
      context.push(
        `pour ${relation.secondCategory.label.toLowerCase()} « ${relation.secondValue} », les autres valeurs exclues sont : ${excludedFirstValues
          .map((value) => `« ${value} »`)
          .join(', ')}`,
      );
    }

    return context.length > 0
      ? `${context.join('. ')}. Il ne reste donc qu’une possibilité.`
      : `il faut maintenant vérifier l’association entre ${relation.firstCategory.label.toLowerCase()} « ${relation.firstValue} » et ${relation.secondCategory.label.toLowerCase()} « ${relation.secondValue} » pour poursuivre la déduction.`;
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

    const logicalClues = this.reduceToEssentialClues(
      this.createCandidateClues(categories, solution),
      categories,
    );

    if (this.countMatchingSolutions(categories, logicalClues, 2) !== 1) {
      return this.createRandomPuzzle(basePuzzle);
    }

    return {
      ...basePuzzle,
      categories,
      clues: this.shuffle(logicalClues.map((clue) => this.formatClue(clue.text))),
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
      const values = this.randomItem(variants);

      return { ...category, values: [...values] };
    });
  }

  private categoryValueVariants(category: ZebraCategory): string[][] {
    const variants: Record<string, string[][]> = {
      person: [
        ['Nora', 'Omar', 'Lina'],
        ['Hugo', 'Maya', 'Noé', 'Zoé'],
        ['Inès', 'Malik', 'Romy', 'Sacha', 'Yanis'],
      ],
      color: [
        ['Orange', 'Violette', 'Rose'],
        ['Orange', 'Violette', 'Rose', 'Noire'],
        ['Orange', 'Violette', 'Rose', 'Noire', 'Grise'],
      ],
      pet: [
        ['Renard', 'Tortue', 'Aigle'],
        ['Renard', 'Tortue', 'Aigle', 'Souris'],
        ['Renard', 'Tortue', 'Aigle', 'Souris', 'Panda'],
      ],
      hobby: [
        ['Randonnée', 'Musique', 'Natation', 'Lecture'],
        ['Randonnée', 'Musique', 'Natation', 'Lecture', 'Cuisine'],
      ],
      drink: [['Infusion', 'Limonade', 'Cacao', 'Eau', 'Lait']],
    };
    const alternatives = (variants[category.id] ?? []).filter(
      (values) => values.length === category.values.length,
    );

    return [category.values, ...alternatives];
  }

  private createRandomClues(
    categories: ZebraCategory[],
    solution: Record<string, string>[],
  ): string[] {
    const clues = this.reduceToEssentialClues(
      this.createCandidateClues(categories, solution),
      categories,
    );

    return this.shuffle(clues.map((clue) => this.formatClue(clue.text)));
  }

  private describeValue(category: ZebraCategory, value: string): string {
    if (category.id === 'person') {
      return value;
    }

    if (category.id === 'color') {
      return `la maison ${this.feminineColor(value)}`;
    }

    if (category.id === 'pet') {
      return this.capitalize(this.withArticle(value));
    }

    if (category.id === 'drink') {
      return `la maison où on boit ${this.displayValue(value)}`;
    }

    if (category.id === 'hobby') {
      return `la maison où le loisir est ${this.displayValue(value)}`;
    }

    return `${category.label} ${value}`;
  }

  private describeCompanionValue(category: ZebraCategory, value: string): string {
    if (category.id === 'person') {
      return value;
    }

    if (category.id === 'color') {
      return `la maison ${this.feminineColor(value)}`;
    }

    if (category.id === 'pet') {
      return this.withArticle(value);
    }

    if (category.id === 'drink') {
      return `${this.displayValue(value)} comme boisson`;
    }

    if (category.id === 'hobby') {
      return `${this.displayValue(value)} comme loisir`;
    }

    return `${category.label.toLowerCase()} ${value.toLowerCase()}`;
  }

  private describeHouseClue(category: ZebraCategory, value: string, house: string): string {
    const houseText = this.houseLabel(house);

    if (category.id === 'person') {
      return this.randomItem([
        `${value} habite ${houseText}.`,
        `${this.capitalize(houseText)} est habitée par ${value}.`,
        `${value} vit ${houseText}.`,
      ]);
    }

    if (category.id === 'color') {
      const color = this.feminineColor(value);

      return this.randomItem([
        `${this.houseLabel(house, true)} est ${color}.`,
        `La couleur ${color} correspond à ${houseText}.`,
        `${houseText} a la couleur ${color}.`,
      ]);
    }

    if (category.id === 'pet') {
      const pet = this.withArticle(value);

      return this.randomItem([
        `${this.capitalize(pet)} vit dans ${houseText}.`,
        `${this.capitalize(pet)} se trouve dans ${houseText}.`,
        `${this.capitalize(houseText)} abrite ${pet}.`,
      ]);
    }

    if (category.id === 'drink') {
      const drink = this.displayValue(value);

      return this.randomItem([
        `On boit ${drink} dans ${houseText}.`,
        `Dans ${houseText}, on sert ${drink}.`,
        `La boisson de ${houseText} est ${drink}.`,
      ]);
    }

    if (category.id === 'hobby') {
      const hobby = this.displayValue(value);

      return this.randomItem([
        `${hobby} est le loisir de ${houseText}.`,
        `Dans ${houseText}, on pratique ${hobby}.`,
        `Le loisir de ${houseText} est ${hobby}.`,
      ]);
    }

    return `${category.label} ${value} est dans ${houseText}.`;
  }

  private withArticle(value: string): string {
    const normalizedValue = this.displayValue(value);
    const feminineValues = new Set(['souris']);

    if (/^[aeiou]/.test(normalizedValue)) {
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
      The: 'thé',
    };

    return values[value] ?? value.toLowerCase();
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private lowerFirst(value: string): string {
    return value.charAt(0).toLowerCase() + value.slice(1);
  }

  private formatClue(clue: string): string {
    const formattedClue = clue
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
  private uniqueClues(clues: string[]): string[] {
    return [...new Set(clues)];
  }

  private clueKey(clue: ZebraClue): string {
    const { text, ...logicalClue } = clue;

    return JSON.stringify(logicalClue);
  }

  private randomItem<T>(values: T[]): T {
    return values[Math.floor(Math.random() * values.length)];
  }

  private createCandidateClues(
    categories: ZebraCategory[],
    solution: Record<string, string>[],
  ): ZebraClue[] {
    const clues: ZebraClue[] = [];
    const clueKeys = new Set<string>();
    const houseCategory = categories[0];
    const nonHouseCategories = categories.slice(1);

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
          text: this.describeHouseClue(category, row[category.id], row[houseCategory.id]),
        });

        const wrongHouseIndex = this.randomItem(
          houseCategory.values.map((_, index) => index).filter((index) => index !== houseIndex),
        );

        addClue({
          type: 'notPosition',
          categoryId: category.id,
          value: row[category.id],
          houseIndex: wrongHouseIndex,
          text: this.describeNegativeHouseClue(
            category,
            row[category.id],
            houseCategory.values[wrongHouseIndex],
          ),
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
            text: this.describeSameClue(
              firstCategory,
              row[firstCategory.id],
              secondCategory,
              row[secondCategory.id],
            ),
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
            text: this.describeNotSameClue(
              firstCategory,
              row[firstCategory.id],
              secondCategory,
              wrongSecondValue,
            ),
          });
        }
      }
    }

    for (let houseIndex = 0; houseIndex < solution.length - 1; houseIndex += 1) {
      const leftRow = solution[houseIndex];
      const rightRow = solution[houseIndex + 1];

      for (const leftCategory of nonHouseCategories) {
        for (const rightCategory of nonHouseCategories) {
          addClue({
            type: 'adjacentRight',
            leftCategoryId: leftCategory.id,
            leftValue: leftRow[leftCategory.id],
            rightCategoryId: rightCategory.id,
            rightValue: rightRow[rightCategory.id],
            text: this.describeAdjacentClue(
              leftCategory,
              leftRow[leftCategory.id],
              rightCategory,
              rightRow[rightCategory.id],
            ),
          });
        }
      }
    }

    return this.shuffle(clues);
  }

  private reduceToEssentialClues(clues: ZebraClue[], categories: ZebraCategory[]): ZebraClue[] {
    let essentialClues = [...clues];

    for (const clue of this.shuffle(essentialClues)) {
      const nextClues = essentialClues.filter((candidate) => candidate !== clue);

      if (this.countMatchingSolutions(categories, nextClues, 2) === 1) {
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

      return this.randomItem([
        `${firstValue} ${attribute}.`,
        `On sait que ${firstValue} ${attribute}.`,
      ]);
    }

    if (secondCategory.id === 'person') {
      const attribute = this.describePersonAttribute(firstCategory, firstValue);

      return this.randomItem([
        `${secondValue} ${attribute}.`,
        `On sait que ${secondValue} ${attribute}.`,
      ]);
    }

    const firstDescription = this.capitalize(this.describeValue(firstCategory, firstValue));
    const secondDescription = this.lowerFirst(
      this.describeCompanionValue(secondCategory, secondValue),
    );

    return this.randomItem([
      `${firstDescription} est associée à ${secondDescription}.`,
      `${firstDescription} va avec ${secondDescription}.`,
      `La bonne association est ${this.lowerFirst(firstDescription)} avec ${secondDescription}.`,
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

      return this.randomItem([
        `${firstValue} ${negativeAttribute}.`,
        `On sait que ${firstValue} ${negativeAttribute}.`,
      ]);
    }

    if (secondCategory.id === 'person') {
      const negativeAttribute = this.describeNegativePersonAttribute(firstCategory, firstValue);

      return this.randomItem([
        `${secondValue} ${negativeAttribute}.`,
        `On sait que ${secondValue} ${negativeAttribute}.`,
      ]);
    }

    const firstDescription = this.capitalize(this.describeValue(firstCategory, firstValue));
    const secondDescription = this.lowerFirst(
      this.describeCompanionValue(secondCategory, secondValue),
    );

    return this.randomItem([
      `${firstDescription} n'est pas associée à ${secondDescription}.`,
      `${firstDescription} ne va pas avec ${secondDescription}.`,
      `Il ne faut pas associer ${this.lowerFirst(firstDescription)} à ${secondDescription}.`,
    ]);
  }

  private describeAdjacentClue(
    leftCategory: ZebraCategory,
    leftValue: string,
    rightCategory: ZebraCategory,
    rightValue: string,
  ): string {
    const leftDescription = this.describeValue(leftCategory, leftValue);
    const rightDescription = this.describeValue(rightCategory, rightValue);

    return this.randomItem([
      `${leftDescription} est juste à gauche de ${rightDescription}.`,
      `${leftDescription} se trouve immédiatement à gauche de ${rightDescription}.`,
      `${rightDescription} est immédiatement à droite de ${leftDescription}.`,
      `${leftDescription} précède directement ${rightDescription}.`,
    ]);
  }

  private describePersonAttribute(category: ZebraCategory, value: string): string {
    if (category.id === 'color') {
      return `habite la maison ${this.feminineColor(value)}`;
    }

    if (category.id === 'pet') {
      return `a ${this.withArticle(value)}`;
    }

    if (category.id === 'drink') {
      return `boit ${this.displayValue(value)}`;
    }

    if (category.id === 'hobby') {
      return `a ${this.displayValue(value)} comme loisir`;
    }

    return `est associé à ${this.displayValue(value)}`;
  }

  private describeNegativePersonAttribute(category: ZebraCategory, value: string): string {
    if (category.id === 'color') {
      return `n'est pas dans la maison ${this.feminineColor(value)}`;
    }

    if (category.id === 'pet') {
      return `n'a pas ${this.withArticle(value)}`;
    }

    if (category.id === 'drink') {
      return `ne boit pas ${this.displayValue(value)}`;
    }

    if (category.id === 'hobby') {
      return `n'a pas ${this.displayValue(value)} comme loisir`;
    }

    return `n'est pas associé à ${this.displayValue(value)}`;
  }

  private describeNegativeHouseClue(category: ZebraCategory, value: string, house: string): string {
    const houseText = this.houseLabel(house);

    if (category.id === 'person') {
      return this.randomItem([
        `${value} n'est pas dans ${houseText}.`,
        `${value} n'habite pas ${houseText}.`,
        `${this.capitalize(houseText)} n'est pas habitée par ${value}.`,
      ]);
    }

    if (category.id === 'color') {
      const color = this.feminineColor(value);

      return this.randomItem([
        `${this.houseLabel(house, true)} n'est pas ${color}.`,
        `${houseText} n'a pas la couleur ${color}.`,
        `La couleur ${color} n'est pas celle de ${houseText}.`,
      ]);
    }

    if (category.id === 'pet') {
      const pet = this.withArticle(value);

      return this.randomItem([
        `${this.capitalize(pet)} ne vit pas dans ${houseText}.`,
        `${this.capitalize(pet)} ne se trouve pas dans ${houseText}.`,
        `${this.capitalize(houseText)} n'abrite pas ${pet}.`,
      ]);
    }

    if (category.id === 'drink') {
      const drink = this.displayValue(value);

      return this.randomItem([
        `On ne boit pas ${drink} dans ${houseText}.`,
        `Dans ${houseText}, on ne sert pas ${drink}.`,
        `La boisson de ${houseText} n'est pas ${drink}.`,
      ]);
    }

    if (category.id === 'hobby') {
      const hobby = this.displayValue(value);

      return this.randomItem([
        `${hobby} n'est pas le loisir de ${houseText}.`,
        `Dans ${houseText}, on ne pratique pas ${hobby}.`,
        `Le loisir de ${houseText} n'est pas ${hobby}.`,
      ]);
    }

    return `${this.describeValue(category, value)} n'est pas dans ${houseText}.`;
  }

  private countMatchingSolutions(
    categories: ZebraCategory[],
    clues: ZebraClue[],
    limit: number,
  ): number {
    const houseCategory = categories[0];
    const nonHouseCategories = categories.slice(1);
    const permutationsByCategory = new Map(
      nonHouseCategories.map((category) => [category.id, this.permutations(category.values)]),
    );
    const assignments: Record<string, Record<string, number>> = {
      [houseCategory.id]: Object.fromEntries(
        houseCategory.values.map((house, index) => [house, index]),
      ),
    };
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
        assignments[category.id] = Object.fromEntries(
          permutation.map((value, index) => [value, index]),
        );

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

    const leftHouseIndex = assignments[clue.leftCategoryId]?.[clue.leftValue];
    const rightHouseIndex = assignments[clue.rightCategoryId]?.[clue.rightValue];

    return leftHouseIndex === undefined || rightHouseIndex === undefined
      ? allowUnknown
      : leftHouseIndex + 1 === rightHouseIndex;
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

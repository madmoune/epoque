import { Injectable } from '@angular/core';

export type WeightVariantId = 'repeated-colors' | 'unique-stones' | 'shared-weights';

export type WeightRelation = 'left-heavier' | 'balanced' | 'right-heavier';

export type WeightStone = {
  id: string;
  label: string;
  color: string;
};

export type WeightPanToken = { kind: 'stone'; stoneId: string };

export type WeightBalanceClue = {
  id: string;
  left: WeightPanToken[];
  right: WeightPanToken[];
  relation: WeightRelation;
};

export type WeightDeductionPuzzle = {
  variantId: WeightVariantId;
  title: string;
  description: string;
  ruleText: string;
  stones: WeightStone[];
  copiesPerStone: number;
  allowedWeights: number[];
  allDifferent: boolean;
  requireEveryWeight: boolean;
  requireRepeatedWeight: boolean;
  clues: WeightBalanceClue[];
  solution: Record<string, number>;
};

export type WeightVariantOption = {
  id: WeightVariantId;
  title: string;
  description: string;
};

type WeightVariantConfig = WeightVariantOption & {
  stoneCount: number;
  allowedWeights: number[];
  allDifferent: boolean;
  requireEveryWeight: boolean;
  requireRepeatedWeight: boolean;
  maxCopiesPerStone: number;
  maxPanPieces: number;
  minimumClues: number;
  ruleText: string;
};

type PanAtom = { kind: 'stone'; stoneId: string; stoneIndex: number; maxCount: number };

type PanComposition = {
  tokens: WeightPanToken[];
  coefficients: number[];
  atomKeys: Set<string>;
  key: string;
};

type ClueCandidate = WeightBalanceClue & {
  coefficients: number[];
  stoneIds: Set<string>;
  key: string;
  complexity: number;
};

const VARIANT_CONFIGS: WeightVariantConfig[] = [
  {
    id: 'repeated-colors',
    title: 'Couleurs répétées',
    description: 'Plusieurs pierres d’une même couleur peuvent se retrouver sur la balance.',
    stoneCount: 4,
    allowedWeights: [2, 5, 9, 14, 20, 27, 35],
    allDifferent: true,
    requireEveryWeight: false,
    requireRepeatedWeight: false,
    maxCopiesPerStone: 3,
    maxPanPieces: 3,
    minimumClues: 5,
    ruleText:
      'Toutes les pierres d’une même couleur ont le même poids. Quatre poids distincts sont à trouver parmi 2, 5, 9, 14, 20, 27 et 35.',
  },
  {
    id: 'unique-stones',
    title: 'Pierres uniques',
    description: 'Chaque pierre est différente et ne peut apparaître qu’une fois dans une pesée.',
    stoneCount: 5,
    allowedWeights: [3, 7, 10, 15, 18, 25, 33, 42],
    allDifferent: true,
    requireEveryWeight: false,
    requireRepeatedWeight: false,
    maxCopiesPerStone: 1,
    maxPanPieces: 2,
    minimumClues: 6,
    ruleText:
      'Les cinq pierres ont des poids différents, choisis parmi 3, 7, 10, 15, 18, 25, 33 et 42. Plusieurs valeurs restent inutilisées.',
  },
  {
    id: 'shared-weights',
    title: 'Poids partagés',
    description: 'Deux couleurs différentes peuvent avoir exactement le même poids.',
    stoneCount: 5,
    allowedWeights: [2, 5, 9, 14, 20],
    allDifferent: false,
    requireEveryWeight: false,
    requireRepeatedWeight: true,
    maxCopiesPerStone: 2,
    maxPanPieces: 3,
    minimumClues: 6,
    ruleText:
      'Chaque couleur pèse 2, 5, 9, 14 ou 20. Plusieurs couleurs doivent partager au moins un poids.',
  },
];

export const WEIGHT_VARIANTS: readonly WeightVariantOption[] = VARIANT_CONFIGS.map(
  ({ id, title, description }) => ({ id, title, description }),
);

const STONE_PALETTE: WeightStone[] = [
  { id: 'corail', label: 'Corail', color: '#ef7a57' },
  { id: 'lagon', label: 'Lagon', color: '#43b9ad' },
  { id: 'violette', label: 'Violette', color: '#8d6de8' },
  { id: 'soleil', label: 'Soleil', color: '#e7b63f' },
  { id: 'mousse', label: 'Mousse', color: '#70ae58' },
  { id: 'rose', label: 'Rose', color: '#e66f9d' },
  { id: 'azur', label: 'Azur', color: '#5c9ee5' },
];

@Injectable({ providedIn: 'root' })
export class WeightDeductionService {
  createPuzzle(variantId?: WeightVariantId): WeightDeductionPuzzle {
    const config = variantId ? this.variantConfig(variantId) : this.randomItem(VARIANT_CONFIGS);
    const stones = this.shuffle(STONE_PALETTE).slice(0, config.stoneCount);
    const assignments = this.createAssignments(
      config.stoneCount,
      config.allowedWeights,
      config.allDifferent,
    );
    const possibleSolutions = assignments.filter(
      (assignment) =>
        (!config.requireEveryWeight || new Set(assignment).size === config.allowedWeights.length) &&
        (!config.requireRepeatedWeight || new Set(assignment).size < assignment.length),
    );

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const solutionValues = this.randomItem(possibleSolutions);
      const cluePool = this.createCluePool(config, stones, solutionValues);
      const selectedClues = this.selectClues(config, cluePool, possibleSolutions);

      if (!selectedClues) {
        continue;
      }

      const puzzle: WeightDeductionPuzzle = {
        variantId: config.id,
        title: config.title,
        description: config.description,
        ruleText: config.ruleText,
        stones,
        copiesPerStone: config.maxCopiesPerStone,
        allowedWeights: [...config.allowedWeights],
        allDifferent: config.allDifferent,
        requireEveryWeight: config.requireEveryWeight,
        requireRepeatedWeight: config.requireRepeatedWeight,
        clues: selectedClues.map((clue, index) => ({
          id: `pesee-${index + 1}`,
          left: clue.left,
          right: clue.right,
          relation: clue.relation,
        })),
        solution: Object.fromEntries(
          stones.map((stone, index) => [stone.id, solutionValues[index]]),
        ),
      };

      if (this.countSolutions(puzzle) === 1) {
        return puzzle;
      }
    }

    throw new Error('Unable to create a uniquely solvable weight puzzle.');
  }

  countSolutions(puzzle: WeightDeductionPuzzle): number {
    return this.createAssignments(
      puzzle.stones.length,
      puzzle.allowedWeights,
      puzzle.allDifferent,
    ).filter((assignment) => {
      if (
        (puzzle.requireEveryWeight && new Set(assignment).size !== puzzle.allowedWeights.length) ||
        (puzzle.requireRepeatedWeight && new Set(assignment).size === assignment.length)
      ) {
        return false;
      }

      const weights = Object.fromEntries(
        puzzle.stones.map((stone, index) => [stone.id, assignment[index]]),
      );

      return puzzle.clues.every((clue) => this.relationForClue(clue, weights) === clue.relation);
    }).length;
  }

  relationForClue(
    clue: WeightBalanceClue,
    weights: Readonly<Record<string, number>>,
  ): WeightRelation {
    const leftTotal = this.panTotal(clue.left, weights);
    const rightTotal = this.panTotal(clue.right, weights);

    return this.relationFromDifference(leftTotal - rightTotal);
  }

  private variantConfig(variantId: WeightVariantId): WeightVariantConfig {
    const config = VARIANT_CONFIGS.find((candidate) => candidate.id === variantId);

    if (!config) {
      throw new Error(`Unknown weight puzzle variant: ${variantId}`);
    }

    return config;
  }

  private createAssignments(
    stoneCount: number,
    allowedWeights: readonly number[],
    allDifferent: boolean,
  ): number[][] {
    const assignments: number[][] = [];
    const current: number[] = [];
    const usedWeights = new Set<number>();

    const extend = (): void => {
      if (current.length === stoneCount) {
        assignments.push([...current]);
        return;
      }

      for (const weight of allowedWeights) {
        if (allDifferent && usedWeights.has(weight)) {
          continue;
        }

        current.push(weight);
        usedWeights.add(weight);
        extend();
        current.pop();

        if (allDifferent) {
          usedWeights.delete(weight);
        }
      }
    };

    extend();
    return assignments;
  }

  private createCluePool(
    config: WeightVariantConfig,
    stones: readonly WeightStone[],
    solution: readonly number[],
  ): ClueCandidate[] {
    const pans = this.createPanCompositions(config, stones);
    const clues: ClueCandidate[] = [];

    for (let leftIndex = 0; leftIndex < pans.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < pans.length; rightIndex += 1) {
        const left = pans[leftIndex];
        const right = pans[rightIndex];

        if ([...left.atomKeys].some((atomKey) => right.atomKeys.has(atomKey))) {
          continue;
        }

        const coefficients = left.coefficients.map(
          (coefficient, index) => coefficient - right.coefficients[index],
        );

        if (coefficients.every((coefficient) => coefficient === 0)) {
          continue;
        }

        const difference = coefficients.reduce(
          (total, coefficient, index) => total + coefficient * solution[index],
          0,
        );
        const stoneIds = new Set(
          [...left.tokens, ...right.tokens]
            .filter(
              (token): token is Extract<WeightPanToken, { kind: 'stone' }> =>
                token.kind === 'stone',
            )
            .map((token) => token.stoneId),
        );

        clues.push({
          id: '',
          left: left.tokens,
          right: right.tokens,
          relation: this.relationFromDifference(difference),
          coefficients,
          stoneIds,
          key: `${left.key}|${right.key}`,
          complexity: left.tokens.length + right.tokens.length,
        });
      }
    }

    return clues;
  }

  private createPanCompositions(
    config: WeightVariantConfig,
    stones: readonly WeightStone[],
  ): PanComposition[] {
    const atoms: PanAtom[] = [
      ...stones.map<PanAtom>((stone, stoneIndex) => ({
        kind: 'stone',
        stoneId: stone.id,
        stoneIndex,
        maxCount: config.maxCopiesPerStone,
      })),
    ];
    const counts = Array.from({ length: atoms.length }, () => 0);
    const compositions: PanComposition[] = [];

    const addComposition = (): void => {
      const coefficients = Array.from({ length: stones.length }, () => 0);
      const tokens: WeightPanToken[] = [];
      const atomKeys = new Set<string>();
      const keyParts: string[] = [];

      counts.forEach((count, atomIndex) => {
        if (count === 0) {
          return;
        }

        const atom = atoms[atomIndex];
        const atomKey = `s:${atom.stoneId}`;

        atomKeys.add(atomKey);
        keyParts.push(`${atomKey}x${count}`);

        for (let copy = 0; copy < count; copy += 1) {
          coefficients[atom.stoneIndex] += 1;
          tokens.push({ kind: 'stone', stoneId: atom.stoneId });
        }
      });

      compositions.push({
        tokens,
        coefficients,
        atomKeys,
        key: keyParts.join('+'),
      });
    };

    const extend = (startIndex: number, pieceCount: number): void => {
      if (pieceCount > 0) {
        addComposition();
      }

      if (pieceCount === config.maxPanPieces) {
        return;
      }

      for (let atomIndex = startIndex; atomIndex < atoms.length; atomIndex += 1) {
        if (counts[atomIndex] >= atoms[atomIndex].maxCount) {
          continue;
        }

        counts[atomIndex] += 1;
        extend(atomIndex, pieceCount + 1);
        counts[atomIndex] -= 1;
      }
    };

    extend(0, 0);
    return compositions;
  }

  private selectClues(
    config: WeightVariantConfig,
    pool: readonly ClueCandidate[],
    assignments: readonly number[][],
  ): ClueCandidate[] | null {
    const selected: ClueCandidate[] = [];
    const selectedKeys = new Set<string>();
    const coveredStoneIds = new Set<string>();
    let remaining = [...assignments];

    const addCandidate = (candidate: ClueCandidate): void => {
      selected.push(candidate);
      selectedKeys.add(candidate.key);
      candidate.stoneIds.forEach((stoneId) => coveredStoneIds.add(stoneId));
      remaining = remaining.filter((assignment) => this.candidateMatches(candidate, assignment));
    };

    const requirements: Array<(candidate: ClueCandidate) => boolean> = [
      (candidate) => candidate.relation !== 'balanced',
    ];

    if (config.maxCopiesPerStone > 1) {
      requirements.push((candidate) => this.hasRepeatedStone(candidate));
    }

    for (const requirement of requirements) {
      const candidate = this.bestCandidate(
        pool.filter(requirement),
        remaining,
        selectedKeys,
        coveredStoneIds,
      );

      if (candidate) {
        addCandidate(candidate);
      }
    }

    while (remaining.length > 1 && selected.length < 10) {
      const balancedCount = selected.filter((clue) => clue.relation === 'balanced').length;
      const availablePool =
        balancedCount >= 2 ? pool.filter((candidate) => candidate.relation !== 'balanced') : pool;
      const candidate = this.bestCandidate(availablePool, remaining, selectedKeys, coveredStoneIds);

      if (!candidate) {
        break;
      }

      addCandidate(candidate);
    }

    if (remaining.length !== 1) {
      return null;
    }

    if (!selected.some((clue) => clue.relation === 'balanced')) {
      const equalityClue = this.bestCandidate(
        pool.filter((candidate) => candidate.relation === 'balanced'),
        assignments,
        selectedKeys,
        coveredStoneIds,
      );

      if (equalityClue) {
        selected.push(equalityClue);
        selectedKeys.add(equalityClue.key);
        equalityClue.stoneIds.forEach((stoneId) => coveredStoneIds.add(stoneId));
      }
    }

    while (selected.length < config.minimumClues) {
      const balancedCount = selected.filter((clue) => clue.relation === 'balanced').length;
      const availablePool =
        balancedCount >= 2 ? pool.filter((candidate) => candidate.relation !== 'balanced') : pool;
      const supplemental = this.bestCandidate(
        availablePool,
        assignments,
        selectedKeys,
        coveredStoneIds,
      );

      if (!supplemental) {
        break;
      }

      selected.push(supplemental);
      selectedKeys.add(supplemental.key);
      supplemental.stoneIds.forEach((stoneId) => coveredStoneIds.add(stoneId));
    }

    return selected;
  }

  private bestCandidate(
    pool: readonly ClueCandidate[],
    remaining: readonly number[][],
    selectedKeys: ReadonlySet<string>,
    coveredStoneIds: ReadonlySet<string>,
  ): ClueCandidate | null {
    let bestScore = Number.NEGATIVE_INFINITY;
    const bestCandidates: ClueCandidate[] = [];

    for (const candidate of pool) {
      if (selectedKeys.has(candidate.key)) {
        continue;
      }

      const matchingCount = remaining.reduce(
        (count, assignment) => count + Number(this.candidateMatches(candidate, assignment)),
        0,
      );
      const reduction = remaining.length - matchingCount;

      if (matchingCount === 0 || reduction === 0) {
        continue;
      }

      const uncoveredCount = [...candidate.stoneIds].filter(
        (stoneId) => !coveredStoneIds.has(stoneId),
      ).length;
      const equalityBonus = candidate.relation === 'balanced' ? 8 : 0;
      const score = reduction * 1000 + uncoveredCount * 25 + equalityBonus - candidate.complexity;

      if (score > bestScore) {
        bestScore = score;
        bestCandidates.length = 0;
        bestCandidates.push(candidate);
      } else if (score === bestScore) {
        bestCandidates.push(candidate);
      }
    }

    return bestCandidates.length > 0 ? this.randomItem(bestCandidates) : null;
  }

  private candidateMatches(candidate: ClueCandidate, assignment: readonly number[]): boolean {
    const difference = candidate.coefficients.reduce(
      (total, coefficient, index) => total + coefficient * assignment[index],
      0,
    );

    return this.relationFromDifference(difference) === candidate.relation;
  }

  private hasRepeatedStone(candidate: ClueCandidate): boolean {
    const counts = new Map<string, number>();

    for (const token of [...candidate.left, ...candidate.right]) {
      if (token.kind !== 'stone') {
        continue;
      }

      const count = (counts.get(token.stoneId) ?? 0) + 1;

      if (count >= 2) {
        return true;
      }

      counts.set(token.stoneId, count);
    }

    return false;
  }

  private panTotal(
    tokens: readonly WeightPanToken[],
    weights: Readonly<Record<string, number>>,
  ): number {
    return tokens.reduce((total, token) => total + (weights[token.stoneId] ?? 0), 0);
  }

  private relationFromDifference(difference: number): WeightRelation {
    if (difference > 0) {
      return 'left-heavier';
    }

    if (difference < 0) {
      return 'right-heavier';
    }

    return 'balanced';
  }

  private randomItem<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private shuffle<T>(items: readonly T[]): T[] {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
  }
}

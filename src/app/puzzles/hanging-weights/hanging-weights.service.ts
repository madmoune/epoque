import { Injectable } from '@angular/core';

export type HangingWeightDifficultyId = 'discovery' | 'classic' | 'cascade';

export type HangingWeightNode = HangingWeightLeafNode | HangingWeightBranchNode;

export type HangingWeightLeafNode = {
  kind: 'weight';
  weightId: string;
};

export type HangingWeightBranchNode = {
  kind: 'branch';
  id: string;
  leftDistance: number;
  rightDistance: number;
  left: HangingWeightNode;
  right: HangingWeightNode;
};

export type HangingWeight = {
  id: string;
  label: string;
  color: string;
  known: boolean;
};

export type HangingWeightPuzzle = {
  difficultyId: HangingWeightDifficultyId;
  title: string;
  description: string;
  root: HangingWeightBranchNode;
  weights: HangingWeight[];
  knownWeightId: string;
  solution: Record<string, number>;
};

export type HangingWeightDifficultyOption = {
  id: HangingWeightDifficultyId;
  title: string;
  description: string;
  weightCount: number;
};

type MobileShape = 'leaf' | readonly [MobileShape, MobileShape];
type ArmPair = readonly [leftDistance: number, rightDistance: number];

type DifficultyConfig = HangingWeightDifficultyOption & {
  maxWeight: number;
  armPairs: readonly ArmPair[];
  shapes: readonly MobileShape[];
};

const LEAF: MobileShape = 'leaf';

const SIMPLE_ARM_PAIRS: readonly ArmPair[] = [
  [1, 1],
  [2, 2],
  [1, 2],
  [2, 1],
  [2, 3],
  [3, 2],
  [1, 3],
  [3, 1],
];

const FULL_ARM_PAIRS: readonly ArmPair[] = [
  ...SIMPLE_ARM_PAIRS,
  [3, 3],
  [3, 4],
  [4, 3],
  [1, 4],
  [4, 1],
];

const DIFFICULTY_CONFIGS: readonly DifficultyConfig[] = [
  {
    id: 'discovery',
    title: 'Découverte',
    description: 'Cinq poids sur quatre barres avec des leviers simples.',
    weightCount: 5,
    maxWeight: 48,
    armPairs: SIMPLE_ARM_PAIRS,
    shapes: [
      [
        [LEAF, LEAF],
        [LEAF, [LEAF, LEAF]],
      ],
      [
        [[LEAF, LEAF], LEAF],
        [LEAF, LEAF],
      ],
      [
        LEAF,
        [
          [LEAF, LEAF],
          [LEAF, LEAF],
        ],
      ],
      [
        [
          [LEAF, LEAF],
          [LEAF, LEAF],
        ],
        LEAF,
      ],
    ],
  },
  {
    id: 'classic',
    title: 'Classique',
    description: 'Six poids et cinq équilibres qui se répondent.',
    weightCount: 6,
    maxWeight: 72,
    armPairs: FULL_ARM_PAIRS,
    shapes: [
      [
        [LEAF, [LEAF, LEAF]],
        [[LEAF, LEAF], LEAF],
      ],
      [
        [LEAF, LEAF],
        [
          [LEAF, LEAF],
          [LEAF, LEAF],
        ],
      ],
      [
        [
          [LEAF, LEAF],
          [LEAF, LEAF],
        ],
        [LEAF, LEAF],
      ],
      [
        [[LEAF, LEAF], LEAF],
        [LEAF, [LEAF, LEAF]],
      ],
    ],
  },
  {
    id: 'cascade',
    title: 'Cascade',
    description: 'Sept poids répartis sur six branches imbriquées.',
    weightCount: 7,
    maxWeight: 90,
    armPairs: FULL_ARM_PAIRS,
    shapes: [
      [
        LEAF,
        [
          [LEAF, [LEAF, LEAF]],
          [LEAF, [LEAF, LEAF]],
        ],
      ],
      [
        [
          [[LEAF, LEAF], LEAF],
          [[LEAF, LEAF], LEAF],
        ],
        LEAF,
      ],
      [
        [LEAF, LEAF],
        [
          LEAF,
          [
            [LEAF, LEAF],
            [LEAF, LEAF],
          ],
        ],
      ],
      [
        [
          [
            [LEAF, LEAF],
            [LEAF, LEAF],
          ],
          LEAF,
        ],
        [LEAF, LEAF],
      ],
    ],
  },
];

export const HANGING_WEIGHT_DIFFICULTIES: readonly HangingWeightDifficultyOption[] =
  DIFFICULTY_CONFIGS.map(({ id, title, description, weightCount }) => ({
    id,
    title,
    description,
    weightCount,
  }));

const WEIGHT_PALETTE = [
  { label: 'A', color: '#ef7a57' },
  { label: 'B', color: '#43b9ad' },
  { label: 'C', color: '#8d6de8' },
  { label: 'D', color: '#e7b63f' },
  { label: 'E', color: '#e66f9d' },
  { label: 'F', color: '#397fd0' },
  { label: 'G', color: '#39945e' },
] as const;

@Injectable({ providedIn: 'root' })
export class HangingWeightsService {
  createPuzzle(difficultyId?: HangingWeightDifficultyId): HangingWeightPuzzle {
    const config = difficultyId
      ? this.difficultyConfig(difficultyId)
      : this.randomItem(DIFFICULTY_CONFIGS);

    for (let attempt = 0; attempt < 500; attempt += 1) {
      const shape = this.randomItem(config.shapes);
      const counters = { branch: 0, weight: 0 };
      const root = this.buildNode(shape, config.armPairs, counters);

      if (root.kind !== 'branch' || !this.hasReadableGeometry(root)) {
        continue;
      }

      const branches = this.branchesOf(root);

      if (!branches.some((branch) => branch.leftDistance !== branch.rightDistance)) {
        continue;
      }

      const relativeWeights = this.relativeWeights(root);
      const relativeValues = Object.values(relativeWeights);
      const largestRelativeWeight = Math.max(...relativeValues);

      if (
        largestRelativeWeight > config.maxWeight ||
        new Set(relativeValues).size < Math.ceil(config.weightCount / 2)
      ) {
        continue;
      }

      const possibleScales = [1, 2, 3].filter(
        (scale) => largestRelativeWeight * scale <= config.maxWeight,
      );
      const nonUnitScales = possibleScales.filter((scale) => scale > 1);
      const scalePool =
        nonUnitScales.length > 0 && Math.random() < 0.65 ? nonUnitScales : possibleScales;
      const scale = this.randomItem(scalePool);
      const solution = Object.fromEntries(
        Object.entries(relativeWeights).map(([weightId, weight]) => [weightId, weight * scale]),
      );
      const weightIds = this.weightIdsOf(root);
      const knownWeightId = this.randomItem(weightIds);
      const weights = weightIds.map<HangingWeight>((id, index) => ({
        id,
        label: WEIGHT_PALETTE[index].label,
        color: WEIGHT_PALETTE[index].color,
        known: id === knownWeightId,
      }));
      const puzzle: HangingWeightPuzzle = {
        difficultyId: config.id,
        title: config.title,
        description: config.description,
        root,
        weights,
        knownWeightId,
        solution,
      };

      if (this.isPuzzleBalanced(puzzle)) {
        return puzzle;
      }
    }

    throw new Error('Unable to create a readable hanging-weight puzzle.');
  }

  solvePuzzle(puzzle: HangingWeightPuzzle): Record<string, number> {
    const relativeWeights = this.relativeWeights(puzzle.root);
    const knownRelativeWeight = relativeWeights[puzzle.knownWeightId];
    const knownWeight = puzzle.solution[puzzle.knownWeightId];

    if (!knownRelativeWeight || !knownWeight) {
      throw new Error('The known weight is missing from the mobile.');
    }

    const scale = knownWeight / knownRelativeWeight;

    if (!Number.isInteger(scale) || scale <= 0) {
      throw new Error('The known weight is incompatible with the mobile.');
    }

    return Object.fromEntries(
      Object.entries(relativeWeights).map(([weightId, weight]) => [weightId, weight * scale]),
    );
  }

  isPuzzleBalanced(puzzle: HangingWeightPuzzle): boolean {
    return this.isNodeBalanced(puzzle.root, puzzle.solution);
  }

  nodeTotal(node: HangingWeightNode, weights: Readonly<Record<string, number>>): number {
    if (node.kind === 'weight') {
      return weights[node.weightId] ?? 0;
    }

    return this.nodeTotal(node.left, weights) + this.nodeTotal(node.right, weights);
  }

  private difficultyConfig(difficultyId: HangingWeightDifficultyId): DifficultyConfig {
    const config = DIFFICULTY_CONFIGS.find((candidate) => candidate.id === difficultyId);

    if (!config) {
      throw new Error(`Unknown hanging-weight difficulty: ${difficultyId}`);
    }

    return config;
  }

  private buildNode(
    shape: MobileShape,
    armPairs: readonly ArmPair[],
    counters: { branch: number; weight: number },
  ): HangingWeightNode {
    if (shape === 'leaf') {
      counters.weight += 1;
      return { kind: 'weight', weightId: `poids-${counters.weight}` };
    }

    counters.branch += 1;
    const branchId = `branche-${counters.branch}`;
    const [leftDistance, rightDistance] = this.randomItem(armPairs);

    return {
      kind: 'branch',
      id: branchId,
      leftDistance,
      rightDistance,
      left: this.buildNode(shape[0], armPairs, counters),
      right: this.buildNode(shape[1], armPairs, counters),
    };
  }

  private relativeWeights(node: HangingWeightNode): Record<string, number> {
    if (node.kind === 'weight') {
      return { [node.weightId]: 1 };
    }

    const leftWeights = this.relativeWeights(node.left);
    const rightWeights = this.relativeWeights(node.right);
    const leftTotal = Object.values(leftWeights).reduce((total, weight) => total + weight, 0);
    const rightTotal = Object.values(rightWeights).reduce((total, weight) => total + weight, 0);
    const leftTorqueUnit = leftTotal * node.leftDistance;
    const rightTorqueUnit = rightTotal * node.rightDistance;
    const commonDivisor = this.greatestCommonDivisor(leftTorqueUnit, rightTorqueUnit);
    const leftScale = rightTorqueUnit / commonDivisor;
    const rightScale = leftTorqueUnit / commonDivisor;
    const combined = {
      ...Object.fromEntries(
        Object.entries(leftWeights).map(([weightId, weight]) => [weightId, weight * leftScale]),
      ),
      ...Object.fromEntries(
        Object.entries(rightWeights).map(([weightId, weight]) => [weightId, weight * rightScale]),
      ),
    };
    const divisor = Object.values(combined).reduce((currentDivisor, weight) =>
      this.greatestCommonDivisor(currentDivisor, weight),
    );

    return Object.fromEntries(
      Object.entries(combined).map(([weightId, weight]) => [weightId, weight / divisor]),
    );
  }

  private isNodeBalanced(
    node: HangingWeightNode,
    weights: Readonly<Record<string, number>>,
  ): boolean {
    if (node.kind === 'weight') {
      return Number.isInteger(weights[node.weightId]) && weights[node.weightId] > 0;
    }

    const leftTotal = this.nodeTotal(node.left, weights);
    const rightTotal = this.nodeTotal(node.right, weights);

    return (
      leftTotal * node.leftDistance === rightTotal * node.rightDistance &&
      this.isNodeBalanced(node.left, weights) &&
      this.isNodeBalanced(node.right, weights)
    );
  }

  private weightIdsOf(node: HangingWeightNode): string[] {
    if (node.kind === 'weight') {
      return [node.weightId];
    }

    return [...this.weightIdsOf(node.left), ...this.weightIdsOf(node.right)];
  }

  private branchesOf(node: HangingWeightNode): HangingWeightBranchNode[] {
    if (node.kind === 'weight') {
      return [];
    }

    return [node, ...this.branchesOf(node.left), ...this.branchesOf(node.right)];
  }

  private hasReadableGeometry(root: HangingWeightBranchNode): boolean {
    const branchIntervals = new Map<number, Array<{ start: number; end: number }>>();
    const weightPositions = new Map<number, number[]>();
    const allXPositions: number[] = [];

    const visit = (node: HangingWeightNode, x: number, depth: number): void => {
      allXPositions.push(x);

      if (node.kind === 'weight') {
        weightPositions.set(depth, [...(weightPositions.get(depth) ?? []), x]);
        return;
      }

      const leftX = x - node.leftDistance;
      const rightX = x + node.rightDistance;
      branchIntervals.set(depth, [
        ...(branchIntervals.get(depth) ?? []),
        { start: leftX, end: rightX },
      ]);
      allXPositions.push(leftX, rightX);
      visit(node.left, leftX, depth + 1);
      visit(node.right, rightX, depth + 1);
    };

    visit(root, 0, 0);

    for (const intervals of branchIntervals.values()) {
      const sorted = [...intervals].sort((first, second) => first.start - second.start);

      for (let index = 1; index < sorted.length; index += 1) {
        if (sorted[index - 1].end + 0.5 > sorted[index].start) {
          return false;
        }
      }
    }

    for (const positions of weightPositions.values()) {
      const sorted = [...positions].sort((first, second) => first - second);

      for (let index = 1; index < sorted.length; index += 1) {
        if (sorted[index] - sorted[index - 1] < 1.5) {
          return false;
        }
      }
    }

    return Math.max(...allXPositions) - Math.min(...allXPositions) <= 15;
  }

  private greatestCommonDivisor(first: number, second: number): number {
    let left = Math.abs(first);
    let right = Math.abs(second);

    while (right !== 0) {
      [left, right] = [right, left % right];
    }

    return left || 1;
  }

  private randomItem<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}

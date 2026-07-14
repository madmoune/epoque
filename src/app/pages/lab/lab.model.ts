export type ApprovalState = 'approved' | 'pending' | 'deleted';

export type PuzzleExampleInput = {
  id: string;
  name: string;
  description: string;
};

type PuzzleVariantInput = {
  id: string;
  name: string;
  state: ApprovalState;
  description: string;
  examples: PuzzleExampleInput[];
  exampleCount?: number;
};

type PuzzleTypeInput = {
  id: string;
  name: string;
  state: ApprovalState;
  description: string;
  answerFormat: string;
  clueFormat: string;
  variants: PuzzleVariantInput[];
};

const FAMILY_NAMES: Record<string, string> = {
  '1': 'Segments',
  '2': 'Formes géométriques',
  '3': 'Afficheurs à sept segments',
};

export class PuzzleExample {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  constructor(input: PuzzleExampleInput) {
    this.id = input.id;
    this.name = input.name;
    this.description = input.description;
  }
}

export class PuzzleVariant {
  readonly id: string;
  readonly name: string;
  readonly state: ApprovalState;
  readonly description: string;
  readonly examples: PuzzleExample[];
  readonly exampleCount: number;

  constructor(input: PuzzleVariantInput) {
    if (input.examples.length < 2) {
      throw new Error(`La variante « ${input.name} » doit contenir au moins deux exemples.`);
    }

    this.id = input.id;
    this.name = input.name;
    this.state = input.state;
    this.description = input.description;
    this.examples = input.examples.map((example) => new PuzzleExample(example));
    const exampleCount = input.exampleCount ?? input.examples.length;
    if (!Number.isInteger(exampleCount) || exampleCount < 0 || exampleCount > input.examples.length) {
      throw new Error(`Le nombre d'exemples de la variante est invalide.`);
    }
    this.exampleCount = exampleCount;
  }
}

export class PuzzleFamily {
  readonly id: string;
  readonly name: string;
  readonly state: ApprovalState;
  readonly variants: PuzzleVariant[];

  constructor(id: string, name: string, variants: PuzzleVariant[], state: ApprovalState = 'pending') {
    this.id = id;
    this.name = name;
    this.state = state;
    this.variants = variants;
  }
}

export class PuzzleType {
  readonly id: string;
  readonly name: string;
  readonly state: ApprovalState;
  readonly description: string;
  readonly answerFormat: string;
  readonly clueFormat: string;
  readonly variants: PuzzleVariant[];
  readonly families: PuzzleFamily[];

  constructor(input: PuzzleTypeInput) {
    this.id = input.id;
    this.name = input.name;
    this.state = input.state;
    this.description = input.description;
    this.answerFormat = input.answerFormat;
    this.clueFormat = input.clueFormat;
    this.variants = input.variants.map((variant) => new PuzzleVariant(variant));
    const groupedVariants = new Map<string, PuzzleVariant[]>();

    for (const variant of this.variants) {
      const familyId = variant.id.split('-')[0];
      groupedVariants.set(familyId, [...(groupedVariants.get(familyId) ?? []), variant]);
    }

    this.families = [...groupedVariants.entries()].map(
      ([familyId, variants]) => new PuzzleFamily(
        familyId,
        FAMILY_NAMES[familyId] ?? `Famille ${familyId}`,
        variants,
      ),
    );
  }
}

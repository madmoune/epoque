import { MathSequencePuzzle } from './sequences.model';
import { SequencesService } from './sequences.service';

type TemplateHarness = {
  genre: string;
  create: () => MathSequencePuzzle;
};

type ServiceHarness = {
  templates: TemplateHarness[];
  lastGenre: string | null;
  drawTemplate: () => TemplateHarness;
  isPerfectCube: (value: number) => boolean;
  isTooSimpleSequence: (sequence: number[]) => boolean;
};

describe('SequencesService', () => {
  it('contains 82 distinct sequence templates', () => {
    const service = new SequencesService();
    const harness = service as unknown as ServiceHarness;

    expect(harness.templates).toHaveLength(82);
    expect(new Set(harness.templates.map((template) => template.create)).size).toBe(82);
  });

  it('can produce an accepted puzzle from every template', () => {
    const service = new SequencesService();
    const harness = service as unknown as ServiceHarness;

    harness.templates.forEach((template, templateIndex) => {
      let acceptedPuzzle: MathSequencePuzzle | undefined;

      for (let attempt = 0; attempt < 200 && !acceptedPuzzle; attempt++) {
        const puzzle = template.create();
        const hasValidNumbers = puzzle.sequence.every(
          (value) => Number.isFinite(value) && Number.isInteger(value),
        );

        if (
          hasValidNumbers &&
          !harness.isPerfectCube(puzzle.answer) &&
          !harness.isTooSimpleSequence(puzzle.sequence)
        ) {
          acceptedPuzzle = puzzle;
        }
      }

      expect(
        acceptedPuzzle,
        'Le modèle ' + (templateIndex + 1) + ' (' + template.genre + ') est toujours rejeté.',
      ).toBeDefined();
      expect(acceptedPuzzle?.missingIndex).toBe((acceptedPuzzle?.sequence.length ?? 0) - 1);
      expect(acceptedPuzzle?.answer).toBe(acceptedPuzzle?.sequence.at(-1));
      expect(acceptedPuzzle?.hint.trim().length).toBeGreaterThan(0);
    });
  });

  it('draws every template before repeating one and avoids adjacent genres', () => {
    const service = new SequencesService();
    const harness = service as unknown as ServiceHarness;
    const drawnTemplates: TemplateHarness[] = [];

    for (let index = 0; index < harness.templates.length; index++) {
      const template = harness.drawTemplate();
      const previousTemplate = drawnTemplates.at(-1);

      if (previousTemplate) {
        expect(template.genre).not.toBe(previousTemplate.genre);
      }

      drawnTemplates.push(template);
      harness.lastGenre = template.genre;
    }

    expect(new Set(drawnTemplates.map((template) => template.create)).size).toBe(
      harness.templates.length,
    );
  });

  it('keeps every active hint accessible to a general audience', () => {
    const service = new SequencesService();
    const harness = service as unknown as ServiceHarness;
    const advancedTerms =
      /triangul|pentagon|hexagon|tétra|pyramid|factoriel|binomial|catalan|lucas|fibonacci|pronic/i;

    harness.templates.forEach((template) => {
      for (let sample = 0; sample < 20; sample++) {
        expect(template.create().hint).not.toMatch(advancedTerms);
      }
    });
  });

  it('generates valid non-trivial puzzles over a large sample', () => {
    const service = new SequencesService();
    const harness = service as unknown as ServiceHarness;

    for (let index = 0; index < 1_000; index++) {
      const puzzle = service.createPuzzle();

      expect(puzzle.sequence.length).toBeGreaterThanOrEqual(5);
      expect(puzzle.sequence.length).toBeLessThanOrEqual(9);
      expect(puzzle.sequence.every(Number.isInteger)).toBe(true);
      expect(puzzle.missingIndex).toBe(puzzle.sequence.length - 1);
      expect(puzzle.answer).toBe(puzzle.sequence.at(-1));
      expect(harness.isPerfectCube(puzzle.answer)).toBe(false);
      expect(harness.isTooSimpleSequence(puzzle.sequence)).toBe(false);
    }
  });
});

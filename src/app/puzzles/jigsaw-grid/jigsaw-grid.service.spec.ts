import { JigsawGridService } from './jigsaw-grid.service';

describe('JigsawGridService', () => {
  it('counts at least the generated solution and accepts its first placement', () => {
    const service = new JigsawGridService();
    const puzzle = service.createPuzzle();
    const solutionCount = service.countSolutions(puzzle);
    const firstPlacement = puzzle.solution[0]!;
    const hint = service.findBestHint(puzzle, []);

    expect(solutionCount.count).toBeGreaterThan(0);
    expect(hint).not.toBeNull();
    expect(hint?.optionCount).toBeGreaterThan(0);
    const analysis = service.analyzePlacement(puzzle, [], firstPlacement);

    expect(analysis.canPlace).toBe(true);
    expect(analysis.canComplete).toBe(true);

    const hintAnalysis = service.analyzePlacement(puzzle, [], hint!.placement);

    expect(hintAnalysis.canComplete).toBe(true);
  });
});

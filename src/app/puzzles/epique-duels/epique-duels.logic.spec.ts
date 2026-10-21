import {
  BOARD_CELLS,
  DominoMove,
  IsolaState,
  NimEmissionState,
  applyDomineeringMove,
  applyIsolaMove,
  applyNimEmissionMove,
  applyWythoffMove,
  chooseDomineeringMove,
  chooseHexCell,
  chooseNimEmissionMove,
  chooseWythoffMove,
  domineeringMoves,
  hexHasConnection,
  isolaMovableCells,
  isolaMoves,
  nimEmissionMoveIsWinning,
  nimEmissionMoves,
  simHasTriangle,
  SIM_EDGES,
  wythoffMoves,
} from './epique-duels.logic';

describe('Épreuves de duel Épique', () => {
  it('génère les retraits Wythoff et laisse le CPU expert sur une position sûre', () => {
    const piles: [number, number] = [7, 10];
    const move = chooseWythoffMove(piles, 'expert');

    expect(move).not.toBeNull();
    expect(wythoffMoves(piles)).toContainEqual(move);
    expect(applyWythoffMove(piles, move!)).toEqual([6, 10]);
  });

  it('gère la pile unique de Nim avec la règle dernier drapeau', () => {
    const normal: NimEmissionState = { flags: 20, maxRemoval: 5, lastFlagLoses: false };
    const normalMove = chooseNimEmissionMove(normal, 'expert');

    expect(nimEmissionMoves(normal)).toHaveLength(5);
    expect(normalMove).toEqual({ removeCount: 2 });
    expect(nimEmissionMoveIsWinning(normal, normalMove!)).toBe(true);
    expect(applyNimEmissionMove(normal, normalMove!).flags).toBe(18);

    const misere: NimEmissionState = { flags: 20, maxRemoval: 5, lastFlagLoses: true };
    const misereMove = chooseNimEmissionMove(misere, 'expert');

    expect(misereMove).toEqual({ removeCount: 1 });
    expect(nimEmissionMoveIsWinning(misere, misereMove!)).toBe(true);
    expect(nimEmissionMoveIsWinning(misere, { removeCount: 2 })).toBe(false);
  });

  it('déplace et retire une case dans Isolation', () => {
    const state: IsolaState = {
      blocked: Array.from({ length: BOARD_CELLS.length }, () => false),
      positions: { 1: 10, 2: 14 },
    };
    const moves = isolaMoves(state, 1);
    const next = applyIsolaMove(state, 1, moves[0]);

    expect(moves.length).toBeGreaterThan(0);
    expect(next.positions[1]).toBe(moves[0].to);
    expect(next.blocked[moves[0].block]).toBe(true);
    expect(isolaMovableCells(next, 2)).not.toContain(moves[0].block);
  });

  it('ne propose que des dominos horizontaux à J1 et verticaux à J2', () => {
    const empty = Array.from({ length: BOARD_CELLS.length }, () => false);
    const horizontal = domineeringMoves(empty, 1)[0];
    const vertical = domineeringMoves(empty, 2)[0];
    const firstCpuMove = chooseDomineeringMove(empty, 2, 'expert', () => 0);
    const secondCpuMove = chooseDomineeringMove(empty, 2, 'expert', () => 0.999999);

    expect(horizontal.cells[1] - horizontal.cells[0]).toBe(1);
    expect(vertical.cells[1] - vertical.cells[0]).toBe(5);
    expect(applyDomineeringMove(empty, horizontal)).toHaveLength(25);
    expect(domineeringMoves(empty, 2)).toContainEqual(firstCpuMove);
    expect(domineeringMoves(empty, 2)).toContainEqual(secondCpuMove);
    expect(secondCpuMove).not.toEqual(firstCpuMove);
  });

  it('détecte un triangle monochrome dans Sim', () => {
    const edges = SIM_EDGES.map((edge) => ({ ...edge, owner: 0 as 0 | 1 | 2 }));
    const trianglePairs = new Set(['0-1', '0-2', '1-2']);
    const colored = edges.map((edge) =>
      trianglePairs.has(`${edge.a}-${edge.b}`) ? { ...edge, owner: 1 as 1 } : edge,
    );

    expect(simHasTriangle(colored, 1)).toBe(true);
    expect(simHasTriangle(colored, 2)).toBe(false);
  });

  it('détecte les connexions Hex et choisit une case disponible', () => {
    const cells = Array.from({ length: BOARD_CELLS.length }, () => 0 as 0 | 1 | 2);
    for (const cell of [0, 5, 10, 15, 20]) cells[cell] = 1;

    expect(hexHasConnection(cells, 1)).toBe(true);
    expect(chooseHexCell(cells, 2, 'expert')).not.toBeNull();
  });

});

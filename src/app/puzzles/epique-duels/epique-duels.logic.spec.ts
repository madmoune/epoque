import {
  BOARD_CELLS,
  DominoMove,
  IsolaState,
  NimEmissionState,
  NimLimitedState,
  Player,
  SimEdge,
  applyDomineeringMove,
  applyIsolaMove,
  applyNimEmissionMove,
  applyNimLimitedMove,
  applyWythoffMove,
  chooseDomineeringMove,
  chooseHexCell,
  chooseIsolaMove,
  chooseNimEmissionMove,
  chooseNimLimitedMove,
  chooseSimEdge,
  chooseWythoffMove,
  domineeringMoves,
  hexHasConnection,
  isolaMovableCells,
  isolaMoves,
  nimEmissionMoveIsWinning,
  nimEmissionMoves,
  nimLimitedMoves,
  simHasTriangle,
  SIM_EDGES,
  wythoffMoves,
} from './epique-duels.logic';

describe('Épreuves de duel Épique', () => {
  it('génère les retraits Wythoff et laisse le CPU expert sur une position sûre', () => {
    const piles: [number, number] = [7, 10];
    const move = chooseWythoffMove(piles, () => 0.5);

    expect(move).not.toBeNull();
    expect(wythoffMoves(piles)).toContainEqual(move);
    const next = applyWythoffMove(piles, move!);
    const low = Math.min(...next);
    const difference = Math.abs(next[0] - next[1]);
    expect(low).toBe(Math.floor(difference * ((1 + Math.sqrt(5)) / 2)));
  });

  describe('Nim à retrait limité', () => {
    it.each([3, 4, 5] as const)('borne les retraits à %i jetons dans une seule pile', (maxRemoval) => {
      const state: NimLimitedState = { piles: [0, 2, 12], maxRemoval };
      const before = structuredClone(state);
      const moves = nimLimitedMoves(state);

      expect(moves).toHaveLength(2 + maxRemoval);
      for (const move of moves) {
        expect(move.removeCount).toBeGreaterThanOrEqual(1);
        expect(move.removeCount).toBeLessThanOrEqual(maxRemoval);
        const next = applyNimLimitedMove(state, move);
        expect(next.piles[move.pileIndex]).toBe(state.piles[move.pileIndex] - move.removeCount);
        expect(next.piles.filter((pile, index) => pile !== state.piles[index])).toHaveLength(1);
        expect(next.maxRemoval).toBe(maxRemoval);
      }
      expect(state).toEqual(before);
      expect(chooseNimLimitedMove({ piles: [0, 0, 0], maxRemoval })).toBeNull();
    });

    it.each([3, 4, 5] as const)('vérifie la stratégie CPU par recherche exhaustive, maximum %i', (maxRemoval) => {
      const memo = new Map<string, boolean>();
      function canWin(piles: number[]): boolean {
        const key = piles.join(',');
        if (memo.has(key)) return memo.get(key)!;
        for (let pileIndex = 0; pileIndex < piles.length; pileIndex += 1) {
          for (let count = 1; count <= Math.min(maxRemoval, piles[pileIndex]); count += 1) {
            const next = [...piles];
            next[pileIndex] -= count;
            if (!canWin(next)) {
              memo.set(key, true);
              return true;
            }
          }
        }
        memo.set(key, false);
        return false;
      }

      for (let first = 0; first <= 7; first += 1) {
        for (let second = 0; second <= 7; second += 1) {
          for (let third = 0; third <= 7; third += 1) {
            const state: NimLimitedState = { piles: [first, second, third], maxRemoval };
            const move = chooseNimLimitedMove(state, () => 0.5);
            if (move) {
              expect(nimLimitedMoves(state)).toContainEqual(move);
              expect(canWin(applyNimLimitedMove(state, move).piles)).toBe(!canWin(state.piles));
            } else {
              expect(state.piles).toEqual([0, 0, 0]);
            }
          }
        }
      }
    });
  });

  it('gère la pile unique de Nim avec la règle dernier drapeau', () => {
    const normal: NimEmissionState = { flags: 20, maxRemoval: 5, lastFlagLoses: false };
    const normalMove = chooseNimEmissionMove(normal, () => 0.5);

    expect(nimEmissionMoves(normal)).toHaveLength(5);
    expect(normalMove).toEqual({ removeCount: 2 });
    expect(nimEmissionMoveIsWinning(normal, normalMove!)).toBe(true);
    expect(applyNimEmissionMove(normal, normalMove!).flags).toBe(18);

    const misere: NimEmissionState = { flags: 20, maxRemoval: 5, lastFlagLoses: true };
    const misereMove = chooseNimEmissionMove(misere, () => 0.5);

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
    const firstRandom = vi.fn().mockReturnValueOnce(0.5).mockReturnValue(0);
    const secondRandom = vi.fn().mockReturnValueOnce(0.5).mockReturnValue(0.999999);
    const firstCpuMove = chooseDomineeringMove(empty, 2, firstRandom);
    const secondCpuMove = chooseDomineeringMove(empty, 2, secondRandom);

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
    expect(chooseHexCell(cells, 2, () => 0.5)).not.toBeNull();
  });

  describe('Stratégie Hex', () => {
    const positions: { name: string; cells: (0 | Player)[]; winning: number[] }[] = [
      {
        name: 'relie ses groupes en fin de partie',
        cells: [1, 2, 2, 1, 1, 0, 1, 0, 2, 1, 1, 1, 2, 0, 1, 0, 0, 2, 2, 2, 0, 1, 2, 0, 2],
        winning: [15, 16, 20],
      },
      {
        name: 'prépare une victoire au-delà du prochain coup',
        cells: [1, 1, 2, 2, 0, 2, 0, 2, 0, 1, 1, 1, 2, 1, 0, 2, 0, 1, 0, 1, 2, 2, 2, 1, 0],
        winning: [4, 6, 16],
      },
      {
        name: 'trouve la seule continuation gagnante',
        cells: [2, 1, 2, 1, 1, 0, 1, 2, 2, 1, 2, 2, 0, 1, 1, 0, 0, 0, 2, 2, 0, 0, 2, 1, 1],
        winning: [16],
      },
    ];

    it.each(positions)('$name, pour les rouges comme pour le CPU bleu', ({ cells, winning }) => {
      // Transposer le plateau et échanger les couleurs échange aussi les axes à relier.
      const transposed: (0 | Player)[] = BOARD_CELLS.map(() => 0);
      const transpose = (cell: number) => (cell % 5) * 5 + Math.floor(cell / 5);
      cells.forEach((owner, cell) => {
        transposed[transpose(cell)] = owner === 0 ? 0 : owner === 1 ? 2 : 1;
      });

      expect(winning).toContain(chooseHexCell(cells, 1, () => 0.5));
      expect(winning.map(transpose)).toContain(chooseHexCell(transposed, 2, () => 0.5));
    });

    it('termine son chemin dès qu’il peut gagner', () => {
      const cells: (0 | Player)[] = BOARD_CELLS.map(() => 0);
      for (const cell of [0, 5, 10, 15]) cells[cell] = 1;
      for (const cell of [20, 21, 22, 23]) cells[cell] = 2;

      expect(chooseHexCell(cells, 2, () => 0.5)).toBe(24);
    });

    it('bloque la dernière sortie d’une colonne adverse', () => {
      const cells: (0 | Player)[] = BOARD_CELLS.map(() => 0);
      for (const cell of [4, 9, 14, 19]) cells[cell] = 1;
      for (const cell of [10, 11, 12, 23]) cells[cell] = 2;

      expect(chooseHexCell(cells, 2, () => 0.5)).toBe(24);
    });

    it('intercepte une double menace avant que l’adversaire puisse la créer', () => {
      const cells: (0 | Player)[] = [
        1, 0, 2, 0, 0, 2, 2, 0, 0, 2, 0, 0, 0, 1, 0, 0, 2, 0, 0, 1, 1, 2, 0, 1, 1,
      ];

      // L’ancienne réponse en 14 permettait à l’adversaire de créer une fourchette en 3 ou 8.
      expect([3, 8]).toContain(chooseHexCell(cells, 1, () => 0.5));
    });

    it('développe une ouverture centrale et ne modifie pas le plateau reçu', () => {
      const cells: (0 | Player)[] = BOARD_CELLS.map(() => 0);
      cells[4] = 1;
      const snapshot = [...cells];
      const move = chooseHexCell(cells, 2, () => 0.5)!;

      expect([6, 7, 8, 11, 12, 13, 16, 17, 18]).toContain(move);
      expect(cells).toEqual(snapshot);
    });

    it('varie ses réponses quand une double menace adverse rend la défaite inévitable', () => {
      const cells: (0 | Player)[] = BOARD_CELLS.map(() => 0);
      for (const cell of [0, 5, 10, 15, 21]) cells[cell] = 1;
      for (const cell of [2, 7, 13, 18]) cells[cell] = 2;
      const legal = BOARD_CELLS.filter((cell) => cells[cell] === 0);
      const chosen = legal.map((_, index) =>
        chooseHexCell(cells, 2, () => (index + 0.5) / legal.length),
      );

      expect(new Set(chosen)).toEqual(new Set(legal));
    });
  });

  describe('CPU en position perdante', () => {
    const coldPairs: [number, number][] = [
      [1, 2],
      [3, 5],
      [4, 7],
      [6, 10],
      [8, 13],
      [9, 15],
    ];
    const coldPositions = new Set(['0,0', ...coldPairs.map((pair) => pair.join(','))]);

    it.each(
      coldPairs.flatMap(([first, second]) => [
        [first, second],
        [second, first],
      ]),
    )(
      'Wythoff : varie les retraits depuis (%i, %i) tout en laissant au joueur un coup gagnant',
      (first, second) => {
        const piles: [number, number] = [first, second];
        const legal = wythoffMoves(piles);
        const chosen = legal.map(
          (_, index) => chooseWythoffMove(piles, () => (index + 0.5) / legal.length)!,
        );

        expect(new Set(chosen.map((move) => JSON.stringify(move)))).toEqual(
          new Set(legal.map((move) => JSON.stringify(move))),
        );
        for (const move of chosen) {
          const next = applyWythoffMove(piles, move);
          const reply = chooseWythoffMove(next, () => 0.5)!;
          const afterReply = applyWythoffMove(next, reply).sort((a, b) => a - b);
          expect(coldPositions.has(afterReply.join(','))).toBe(true);
        }
      },
    );

    it.each([3, 4, 5] as const)(
      'Nim : varie tous les retraits perdants avec un maximum de %i drapeaux',
      (maxRemoval) => {
        for (const lastFlagLoses of [false, true]) {
          const state: NimEmissionState = {
            flags: (maxRemoval + 1) * 4 + (lastFlagLoses ? 1 : 0),
            maxRemoval,
            lastFlagLoses,
          };
          const legal = nimEmissionMoves(state);
          const chosen = legal.map(
            (_, index) => chooseNimEmissionMove(state, () => (index + 0.5) / legal.length)!,
          );

          expect(new Set(chosen.map((move) => move.removeCount))).toEqual(
            new Set(legal.map((move) => move.removeCount)),
          );
          for (const move of chosen) expect(nimEmissionMoveIsWinning(state, move)).toBe(false);
        }
      },
    );

    it('Sim : varie les arêtes quand chacune ferme un triangle du CPU', () => {
      const owners: (0 | Player)[] = [0, 0, 1, 1, 2, 1, 1, 2, 2, 2, 1, 2, 2, 1, 1];
      const edges: SimEdge[] = SIM_EDGES.map((edge, index) => ({ ...edge, owner: owners[index] }));

      expect(simHasTriangle(edges, 1)).toBe(false);
      expect(simHasTriangle(edges, 2)).toBe(false);
      for (const index of [0, 1]) {
        const next = edges.map((edge, edgeIndex) =>
          edgeIndex === index ? { ...edge, owner: 2 as const } : edge,
        );
        expect(simHasTriangle(next, 2)).toBe(true);
      }
      expect(
        new Set([chooseSimEdge(edges, 2, () => 0.25), chooseSimEdge(edges, 2, () => 0.75)]),
      ).toEqual(new Set([0, 1]));
    });
  });

  describe('CPU expert avec 20 % d’erreurs', () => {
    const isola: IsolaState = {
      blocked: Array.from({ length: BOARD_CELLS.length }, () => false),
      positions: { 1: 10, 2: 14 },
    };
    const nim: NimEmissionState = { flags: 20, maxRemoval: 5, lastFlagLoses: false };
    const domino = Array.from({ length: BOARD_CELLS.length }, () => false);
    const sim: SimEdge[] = SIM_EDGES.map((edge) => ({
      ...edge,
      owner: edge.a === 0 && (edge.b === 1 || edge.b === 2) ? 2 : 0,
    }));
    const hex: (0 | Player)[] = BOARD_CELLS.map(() => 0);

    const scenarios = [
      {
        name: 'Wythoff',
        choose: (random: () => number) => chooseWythoffMove([7, 10], random),
        legal: wythoffMoves([7, 10]),
      },
      {
        name: 'Nim à retrait limité',
        choose: (random: () => number) => chooseNimLimitedMove({ piles: [4, 7, 10], maxRemoval: 3 }, random),
        legal: nimLimitedMoves({ piles: [4, 7, 10], maxRemoval: 3 }),
      },
      {
        name: 'Nim',
        choose: (random: () => number) => chooseNimEmissionMove(nim, random),
        legal: nimEmissionMoves(nim),
      },
      {
        name: 'Isolation',
        choose: (random: () => number) => chooseIsolaMove(isola, 2, random),
        legal: isolaMoves(isola, 2),
      },
      {
        name: 'Domineering',
        choose: (random: () => number) => chooseDomineeringMove(domino, 2, random),
        legal: domineeringMoves(domino, 2),
      },
      {
        name: 'Sim',
        choose: (random: () => number) => chooseSimEdge(sim, 2, random),
        legal: sim.flatMap((edge, index) => (edge.owner === 0 ? [index] : [])),
      },
      {
        name: 'Hex',
        choose: (random: () => number) => chooseHexCell(hex, 2, random),
        legal: BOARD_CELLS,
      },
    ];

    it.each(scenarios)(
      '$name : joue expert quatre fois sur cinq et garde les coups légaux',
      ({ choose, legal }) => {
        const expert = choose(() => 0.5);
        const moves = [0.1, 0.3, 0.5, 0.7, 0.9].map((roll) =>
          choose(vi.fn().mockReturnValueOnce(roll).mockReturnValue(0.5)),
        );

        expect(moves[0]).not.toEqual(expert);
        for (const move of moves.slice(1)) expect(move).toEqual(expert);
        for (const move of moves) expect(legal).toContainEqual(move);
      },
    );

    it('cesse de faire une erreur à partir du seuil de 20 %', () => {
      expect(chooseNimEmissionMove(nim, () => 0.199999)).not.toEqual({ removeCount: 2 });
      expect(chooseNimEmissionMove(nim, () => 0.2)).toEqual({ removeCount: 2 });
    });

    it('abandonne une position gagnante à Nim uniquement lors d’une erreur', () => {
      const mistake = chooseNimEmissionMove(nim, () => 0.1)!;
      expect(nimEmissionMoveIsWinning(nim, mistake)).toBe(false);

      const misere = { ...nim, lastFlagLoses: true };
      const misereMistake = chooseNimEmissionMove(misere, () => 0.1)!;
      expect(nimEmissionMoveIsWinning(misere, misereMistake)).toBe(false);
    });

    it('bloque une victoire immédiate à Hex sauf lors d’une erreur', () => {
      const cells: (0 | Player)[] = BOARD_CELLS.map(() => 0);
      for (const cell of [0, 5, 15, 20]) cells[cell] = 1;

      expect(chooseHexCell(cells, 2, () => 0.5)).toBe(10);
      expect(chooseHexCell(cells, 2, () => 0.1)).not.toBe(10);
    });

    it('joue le seul coup disponible même lors du tirage d’une erreur', () => {
      const occupied = BOARD_CELLS.map((cell) => cell !== 0 && cell !== 5);
      const edges = sim.map((edge, index) => ({
        ...edge,
        owner: index === 0 ? (0 as const) : (1 as const),
      }));
      const cells: (0 | Player)[] = BOARD_CELLS.map((cell) => (cell === 12 ? 0 : 1));

      expect(chooseWythoffMove([0, 1], () => 0)).toEqual({
        pileIndex: 1,
        removeCount: 1,
        both: false,
      });
      expect(chooseNimEmissionMove({ ...nim, flags: 1 }, () => 0)).toEqual({ removeCount: 1 });
      expect(chooseDomineeringMove(occupied, 2, () => 0)).toEqual({ cells: [0, 5] });
      expect(chooseSimEdge(edges, 2, () => 0)).toBe(0);
      expect(chooseHexCell(cells, 2, () => 0)).toBe(12);
    });

    it('renvoie null lorsqu’aucun coup n’est disponible', () => {
      expect(chooseWythoffMove([0, 0])).toBeNull();
      expect(chooseNimEmissionMove({ ...nim, flags: 0 })).toBeNull();
      expect(chooseIsolaMove({ ...isola, blocked: BOARD_CELLS.map(() => true) }, 2)).toBeNull();
      expect(
        chooseDomineeringMove(
          BOARD_CELLS.map(() => true),
          2,
        ),
      ).toBeNull();
      expect(
        chooseSimEdge(
          sim.map((edge) => ({ ...edge, owner: 1 })),
          2,
        ),
      ).toBeNull();
      expect(
        chooseHexCell(
          BOARD_CELLS.map(() => 1),
          2,
        ),
      ).toBeNull();
    });
  });
});

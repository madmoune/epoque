export type DieFaceName =
    | 'top'
    | 'bottom'
    | 'front'
    | 'back'
    | 'left'
    | 'right';

export type DiceSymbol = {
    id: string;
    label: string;
    icon: string;
};

export type DiceOrientation = Record<DieFaceName, string>;

export type DicePathCell = {
    row: number;
    col: number;
    step: number;
    symbolId: string;
    hidden: boolean;
};

export type DicePuzzle = {
    symbols: DiceSymbol[];
    orientation: DiceOrientation;
    gridSize: number;
    path: DicePathCell[];
    answerSymbolId: string;
};
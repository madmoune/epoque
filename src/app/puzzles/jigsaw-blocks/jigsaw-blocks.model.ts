export type PathwayPort =
    | 'left'
    | 'right'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight';

export type PathwaySlot = {
    id: string;
    row: number;
    column: number;
};

export type PathwayTile = {
    id: string;
    name: string;
    pathData: string;
    ports: PathwayPort[];
};

export type PlacedPathwayTile = {
    tileId: string;
    slotId: string;
    rotation: number;
    locked?: boolean;
};

export type PathwaysPuzzle = {
    slots: PathwaySlot[];
    tiles: PathwayTile[];
    solution: PlacedPathwayTile[];
};
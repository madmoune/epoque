export type MemoryGridColor =
    | 'blue'
    | 'red'
    | 'gray'
    | 'yellow'
    | 'green'
    | 'orange'
    | 'pink'
    | 'purple';

export type MemoryGridShape =
    | 'circle'
    | 'square'
    | 'rectangle'
    | 'triangle'
    | 'losange'
    | 'pentagon'
    | 'hexagon';

export type MemoryGridCell = {
    color: MemoryGridColor;
    shape: MemoryGridShape;
};

export type PlayerMemoryGridCell = {
    color: MemoryGridColor | null;
    shape: MemoryGridShape | null;
};
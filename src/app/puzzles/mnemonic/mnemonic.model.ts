export type MnemonicMode = 'decode' | 'encode';

export type MnemonicType = 'color' | 'shape';

export type MnemonicDescriptorType = 'quality' | 'action';

export type MnemonicEntry = {
    id: string;
    label: string;
    object: string;
    quality: string;
    action: string;
    conjugatedAction: string;
};

export type MemoryPalaceLocation = {
    position: number;
    location: string;
};

export type MnemonicBasePuzzle = {
    mode: MnemonicMode;
    colorId: string;
    shapeId: string;
    position: number;
    objectSource: MnemonicType;
    descriptorSource: MnemonicType;
    descriptorType: MnemonicDescriptorType;
};

export type MnemonicDecodePuzzle = MnemonicBasePuzzle & {
    mode: 'decode';
    sentence: string;
};

export type MnemonicEncodeOption = {
    id: string;
    object: string;
    descriptor: string;
    position: number;
    sentence: string;
};

export type MnemonicEncodePuzzle = MnemonicBasePuzzle & {
    mode: 'encode';
    prompt: string;
    options: MnemonicEncodeOption[];
    answerOptionId: string;
};

export type MnemonicPuzzle = MnemonicDecodePuzzle | MnemonicEncodePuzzle;
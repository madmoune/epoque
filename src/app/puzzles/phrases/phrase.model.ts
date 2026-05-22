export type PhrasePuzzle = {
    answer: string;
    lockedIndexes: Set<number>;
    revealedIndexes: Set<number>;
};

export type PhraseCharacter = {
    character: string;
    index: number;
    isLetter: boolean;
    isRevealed: boolean;
    isLocked: boolean;
};
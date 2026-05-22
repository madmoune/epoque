export type CryptogramPuzzle = {
    answer: string;
    encrypted: string;
};

export type CryptogramCharacter = {
    encryptedCharacter: string;
    answerCharacter: string;
    isLetter: boolean;
    index: number;
};

export type CryptogramWordGroup = {
    characters: CryptogramCharacter[];
};
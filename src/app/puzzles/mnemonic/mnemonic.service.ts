import { Injectable } from '@angular/core';
import {
    MemoryPalaceLocation,
    MnemonicDecodePuzzle,
    MnemonicDescriptorType,
    MnemonicEncodeOption,
    MnemonicEncodePuzzle,
    MnemonicEntry,
    MnemonicPuzzle,
    MnemonicType,
} from './mnemonic.model';

@Injectable({
    providedIn: 'root',
})
export class MnemonicService {
    readonly colors: MnemonicEntry[] = [
        {
            id: 'red',
            label: 'Rouge',
            object: 'Pompier',
            quality: 'En feu',
            action: 'Être en feu',
            conjugatedAction: 'est en feu',
        },
        {
            id: 'yellow',
            label: 'Jaune',
            object: 'Citron',
            quality: 'Surette',
            action: 'Être surette',
            conjugatedAction: 'est surette',
        },
        {
            id: 'gray',
            label: 'Gris',
            object: 'Nassim',
            quality: '-',
            action: 'Ramer avec un arc',
            conjugatedAction: 'rame avec un arc',
        },
        {
            id: 'green',
            label: 'Vert',
            object: 'Grinch',
            quality: 'Malade',
            action: 'Être malade',
            conjugatedAction: 'est malade',
        },
        {
            id: 'blue',
            label: 'Bleu',
            object: 'Schtroumpf',
            quality: '-',
            action: 'Pleurer',
            conjugatedAction: 'pleure',
        },
        {
            id: 'orange',
            label: 'Orange',
            object: 'Citrouille',
            quality: 'Plein de bonbons',
            action: 'Avoir plein de bonbons',
            conjugatedAction: 'a plein de bonbons',
        },
        {
            id: 'purple',
            label: 'Mauve',
            object: 'Grosse Douceur',
            quality: 'Sexy',
            action: 'Être sexy',
            conjugatedAction: 'est sexy',
        },
        {
            id: 'pink',
            label: 'Rose',
            object: 'Joseph',
            quality: '-',
            action: 'Faire de la slackline',
            conjugatedAction: 'fait de la slackline',
        },
    ];

    readonly shapes: MnemonicEntry[] = [
        {
            id: 'circle',
            label: 'Cercle',
            object: 'Soleil',
            quality: '-',
            action: 'Orbiter',
            conjugatedAction: 'orbite',
        },
        {
            id: 'triangle',
            label: 'Triangle',
            object: 'Pizza',
            quality: '-',
            action: 'Être pepperoni-fromage',
            conjugatedAction: 'est pepperoni-fromage',
        },
        {
            id: 'rectangle',
            label: 'Rectangle',
            object: '-',
            quality: '-',
            action: 'Dormir dans un lit',
            conjugatedAction: 'dort dans un lit',
        },
        {
            id: 'square',
            label: 'Carré',
            object: 'Cric, Crac et Croc',
            quality: '-',
            action: 'Manger des céréales',
            conjugatedAction: 'mange des céréales',
        },
        {
            id: 'losange',
            label: 'Losange',
            object: 'Bague',
            quality: '-',
            action: 'Porter une bague',
            conjugatedAction: 'porte une bague',
        },
        {
            id: 'pentagon',
            label: 'Pentagone',
            object: 'Diable',
            quality: '-',
            action: 'Faire des incantations',
            conjugatedAction: 'fait des incantations',
        },
        {
            id: 'hexagon',
            label: 'Hexagone',
            object: 'Ruche',
            quality: 'Plein de miel',
            action: 'Avoir plein de miel',
            conjugatedAction: 'a plein de miel',
        },
    ];

    readonly memoryPalaceLocations: MemoryPalaceLocation[] = [
        {
            position: 1,
            location: 'Balcon avant',
        },
        {
            position: 2,
            location: 'Portique',
        },
        {
            position: 3,
            location: 'Salle de bain',
        },
        {
            position: 4,
            location: 'Garde-manger',
        },
        {
            position: 5,
            location: 'Îlot de cuisine',
        },
        {
            position: 6,
            location: 'Divan du salon',
        },
        {
            position: 7,
            location: 'Télévision',
        },
        {
            position: 8,
            location: 'Table de la cuisine',
        },
        {
            position: 9,
            location: 'Patio arrière',
        },
        {
            position: 10,
            location: 'Piscine',
        },
    ];

    createPuzzle(): MnemonicPuzzle {
        return Math.random() < 0.5
            ? this.createDecodePuzzle()
            : this.createEncodePuzzle();
    }

    getColorLabel(colorId: string): string {
        return this.getEntryById(this.colors, colorId).label;
    }

    getShapeLabel(shapeId: string): string {
        return this.getEntryById(this.shapes, shapeId).label;
    }

    getLocationLabel(position: number): string {
        return this.getLocationByPosition(position).location;
    }

    createDecodePuzzle(): MnemonicDecodePuzzle {
        const color = this.getRandomItem(this.colors);
        const shape = this.getRandomItem(this.shapes);
        const location = this.getRandomItem(this.memoryPalaceLocations);
        const { objectSource, descriptorSource, descriptorType } =
            this.createMnemonicSelection(color, shape);

        const objectEntry = objectSource === 'color' ? color : shape;
        const descriptorEntry = descriptorSource === 'color' ? color : shape;

        return {
            mode: 'decode',
            colorId: color.id,
            shapeId: shape.id,
            position: location.position,
            objectSource,
            descriptorSource,
            descriptorType,
            sentence: this.createSentence(
                objectEntry,
                descriptorEntry,
                descriptorType,
                location,
            ),
        };
    }

    createEncodePuzzle(): MnemonicEncodePuzzle {
        const color = this.getRandomItem(this.colors);
        const shape = this.getRandomItem(this.shapes);
        const location = this.getRandomItem(this.memoryPalaceLocations);
        const { objectSource, descriptorSource, descriptorType } =
            this.createMnemonicSelection(color, shape);

        const answerOption = this.createEncodeOption(
            color,
            shape,
            location.position,
            objectSource,
            descriptorSource,
            descriptorType,
            true,
        );

        const options = [answerOption];

        while (options.length < 6) {
            const optionColor = this.getRandomItem(this.colors);
            const optionShape = this.getRandomItem(this.shapes);
            const optionLocation = this.getRandomItem(this.memoryPalaceLocations);

            const optionSelections = this.createMnemonicSelectionOptions(
                optionColor,
                optionShape,
                objectSource,
                descriptorType,
            );

            if (optionSelections.length === 0) {
                continue;
            }

            const optionSelection = this.getRandomItem(optionSelections);

            const option = this.createEncodeOption(
                optionColor,
                optionShape,
                optionLocation.position,
                optionSelection.objectSource,
                optionSelection.descriptorSource,
                optionSelection.descriptorType,
                false,
            );

            const isCorrectCombination =
                optionColor.id === color.id &&
                optionShape.id === shape.id &&
                optionLocation.position === location.position;

            const alreadyExists = options.some(
                (existingOption) =>
                    existingOption.object === option.object &&
                    existingOption.descriptor === option.descriptor &&
                    existingOption.position === option.position,
            );

            if (!isCorrectCombination && !alreadyExists) {
                options.push(option);
            }
        }

        return {
            mode: 'encode',
            colorId: color.id,
            shapeId: shape.id,
            position: location.position,
            objectSource,
            descriptorSource,
            descriptorType,
            prompt: `Couleur : ${color.label} • Forme : ${shape.label} • Lieu : ${location.location}`,
            options: this.shuffle(options),
            answerOptionId: answerOption.id,
        };
    }

    private createEncodeOption(
        color: MnemonicEntry,
        shape: MnemonicEntry,
        position: number,
        objectSource: MnemonicType,
        descriptorSource: MnemonicType,
        descriptorType: MnemonicDescriptorType,
        isAnswer: boolean,
    ): MnemonicEncodeOption {
        const objectEntry = objectSource === 'color' ? color : shape;
        const descriptorEntry = descriptorSource === 'color' ? color : shape;
        const location = this.getLocationByPosition(position);

        const descriptor =
            descriptorType === 'quality'
                ? descriptorEntry.quality
                : descriptorEntry.action;

        return {
            id: isAnswer
                ? 'answer'
                : `${objectEntry.id}-${descriptorEntry.id}-${position}-${Math.random()}`,
            object: objectEntry.object,
            descriptor,
            position,
            sentence: this.createSentence(
                objectEntry,
                descriptorEntry,
                descriptorType,
                location,
            ),
        };
    }

    private createMnemonicSelection(
        color: MnemonicEntry,
        shape: MnemonicEntry,
        preferredObjectSource?: MnemonicType,
        preferredDescriptorType?: MnemonicDescriptorType,
    ): Pick<
        MnemonicPuzzle,
        'objectSource' | 'descriptorSource' | 'descriptorType'
    > {
        const options = this.createMnemonicSelectionOptions(
            color,
            shape,
            preferredObjectSource,
            preferredDescriptorType,
        );

        if (options.length > 0) {
            return this.getRandomItem(options);
        }

        return this.getRandomItem(this.createMnemonicSelectionOptions(color, shape));
    }

    private createMnemonicSelectionOptions(
        color: MnemonicEntry,
        shape: MnemonicEntry,
        preferredObjectSource?: MnemonicType,
        preferredDescriptorType?: MnemonicDescriptorType,
    ): Pick<
        MnemonicPuzzle,
        'objectSource' | 'descriptorSource' | 'descriptorType'
    >[] {
        const sources: MnemonicType[] = ['color', 'shape'];
        const descriptorTypes: MnemonicDescriptorType[] = ['quality', 'action'];
        const options: Pick<
            MnemonicPuzzle,
            'objectSource' | 'descriptorSource' | 'descriptorType'
        >[] = [];

        for (const objectSource of sources) {
            if (preferredObjectSource && objectSource !== preferredObjectSource) {
                continue;
            }

            const objectEntry = objectSource === 'color' ? color : shape;

            if (!this.hasMnemonicValue(objectEntry.object)) {
                continue;
            }

            const descriptorSource = this.getOppositeMnemonicType(objectSource);
            const descriptorEntry = descriptorSource === 'color' ? color : shape;

            for (const descriptorType of descriptorTypes) {
                if (
                    preferredDescriptorType &&
                    descriptorType !== preferredDescriptorType
                ) {
                    continue;
                }

                const descriptor =
                    descriptorType === 'quality'
                        ? descriptorEntry.quality
                        : descriptorEntry.action;

                if (this.hasMnemonicValue(descriptor)) {
                    options.push({
                        objectSource,
                        descriptorSource,
                        descriptorType,
                    });
                }
            }
        }

        return options;
    }

    private createSentence(
        objectEntry: MnemonicEntry,
        descriptorEntry: MnemonicEntry,
        descriptorType: MnemonicDescriptorType,
        location: MemoryPalaceLocation,
    ): string {
        if (descriptorType === 'quality') {
            return this.createQualitySentence(
                objectEntry.object,
                descriptorEntry.quality,
                location,
            );
        }

        return `${objectEntry.object} qui ${descriptorEntry.conjugatedAction} — ${location.location}`;
    }

    private createQualitySentence(
        object: string,
        quality: string,
        location: MemoryPalaceLocation,
    ): string {
        const lowerQuality = this.lowercaseFirstLetter(quality);

        if (lowerQuality.startsWith('avec ')) {
            return `${object} ${lowerQuality} — ${location.location}`;
        }

        return `${object} qui est ${lowerQuality} — ${location.location}`;
    }

    private lowercaseFirstLetter(value: string): string {
        if (value.length === 0) {
            return value;
        }

        return value.charAt(0).toLocaleLowerCase('fr-CA') + value.slice(1);
    }

    private getOppositeMnemonicType(type: MnemonicType): MnemonicType {
        return type === 'color' ? 'shape' : 'color';
    }

    private hasMnemonicValue(value: string): boolean {
        return value.trim() !== '-';
    }

    private getEntryById(entries: MnemonicEntry[], id: string): MnemonicEntry {
        const entry = entries.find((item) => item.id === id);

        if (!entry) {
            throw new Error(`Mnemonic entry not found: ${id}`);
        }

        return entry;
    }

    private getLocationByPosition(position: number): MemoryPalaceLocation {
        const location = this.memoryPalaceLocations.find(
            (item) => item.position === position,
        );

        if (!location) {
            throw new Error(`Memory palace location not found: ${position}`);
        }

        return location;
    }

    private getRandomItem<T>(items: T[]): T {
        return items[Math.floor(Math.random() * items.length)];
    }

    private shuffle<T>(items: T[]): T[] {
        const shuffledItems = [...items];

        for (let index = shuffledItems.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));

            [shuffledItems[index], shuffledItems[swapIndex]] = [
                shuffledItems[swapIndex],
                shuffledItems[index],
            ];
        }

        return shuffledItems;
    }
}

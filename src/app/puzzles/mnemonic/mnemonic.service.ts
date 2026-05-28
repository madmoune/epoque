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
            object: 'Clown',
            quality: 'Fâché',
            action: 'Brûler',
            conjugatedAction: 'brûle',
        },
        {
            id: 'yellow',
            label: 'Jaune',
            object: 'Soleil',
            quality: 'Surette',
            action: 'Ralentir',
            conjugatedAction: 'ralentit',
        },
        {
            id: 'gray',
            label: 'Gris',
            object: 'Nuage',
            quality: 'Fatigué',
            action: 'Ramer avec un arc',
            conjugatedAction: 'rame avec un arc',
        },
        {
            id: 'green',
            label: 'Vert',
            object: 'Grinch',
            quality: 'Malade',
            action: 'Vomir',
            conjugatedAction: 'vomit',
        },
        {
            id: 'blue',
            label: 'Bleu',
            object: 'Schtroumpf',
            quality: 'Mouillé',
            action: 'Pleurer',
            conjugatedAction: 'pleure',
        },
        {
            id: 'orange',
            label: 'Orange',
            object: 'Carotte',
            quality: 'Avec des lunettes',
            action: 'Voter républicain',
            conjugatedAction: 'vote républicain',
        },
        {
            id: 'purple',
            label: 'Mauve',
            object: 'Grosse douceur',
            quality: 'Sexy',
            action: 'Faire un câlin',
            conjugatedAction: 'fait un câlin',
        },
        {
            id: 'pink',
            label: 'Rose',
            object: 'Princesse',
            quality: 'Fleuri',
            action: 'Faire de la slackline',
            conjugatedAction: 'fait de la slackline',
        },
    ];

    readonly shapes: MnemonicEntry[] = [
        {
            id: 'circle',
            label: 'Cercle',
            object: 'Film',
            quality: 'Gros',
            action: 'Orbiter',
            conjugatedAction: 'orbite',
        },
        {
            id: 'triangle',
            label: 'Triangle',
            object: 'Angine de poitrine',
            quality: 'Pepperoni fromage',
            action: 'Transpercer',
            conjugatedAction: 'transperce',
        },
        {
            id: 'rectangle',
            label: 'Rectangle',
            object: 'Télévision',
            quality: 'Hypnotique',
            action: 'Zapper',
            conjugatedAction: 'zappe',
        },
        {
            id: 'square',
            label: 'Carré',
            object: 'Cric Crac et Croc',
            quality: 'Croquant',
            action: 'Danser',
            conjugatedAction: 'danse',
        },
        {
            id: 'losange',
            label: 'Losange',
            object: 'Diamant',
            quality: 'Sanglant',
            action: 'Briller',
            conjugatedAction: 'brille',
        },
        {
            id: 'pentagon',
            label: 'Pentagone',
            object: 'Diable',
            quality: 'Maléfique',
            action: 'Invoquer',
            conjugatedAction: 'invoque',
        },
        {
            id: 'hexagon',
            label: 'Hexagone',
            object: 'Ruche',
            quality: 'Collant',
            action: 'Bourdonner',
            conjugatedAction: 'bourdonne',
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
        const objectSource = this.getRandomMnemonicType();
        const descriptorSource = this.getOppositeMnemonicType(objectSource);
        const descriptorType = this.getRandomDescriptorType();

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
        const objectSource = this.getRandomMnemonicType();
        const descriptorSource = this.getOppositeMnemonicType(objectSource);
        const descriptorType = this.getRandomDescriptorType();

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

            const option = this.createEncodeOption(
                optionColor,
                optionShape,
                optionLocation.position,
                objectSource,
                descriptorSource,
                descriptorType,
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

    private getRandomMnemonicType(): MnemonicType {
        return Math.random() < 0.5 ? 'color' : 'shape';
    }

    private getOppositeMnemonicType(type: MnemonicType): MnemonicType {
        return type === 'color' ? 'shape' : 'color';
    }

    private getRandomDescriptorType(): MnemonicDescriptorType {
        return Math.random() < 0.5 ? 'quality' : 'action';
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
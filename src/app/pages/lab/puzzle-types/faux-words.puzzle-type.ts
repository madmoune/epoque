import { PuzzleType } from '../lab.model';

export type FauxWordDefinition = {
  id: string;
  definition: string;
  fauxWord: string;
  firstAnswer: string;
  secondAnswer: string;
  extractedLetter: string;
};

export const FAUX_WORD_DEFINITIONS: FauxWordDefinition[] = [
  {
    id: 'foisonde-foi-sonde',
    definition: 'Croyance en une sorte de ballon',
    fauxWord: 'FOISONDE',
    firstAnswer: 'FOI',
    secondAnswer: 'SONDE',
    extractedLetter: 'S',
  },
  {
    id: 'foisonde-fois-onde',
    definition: 'Multiplié par la propagation d’une perturbation',
    fauxWord: 'FOISONDE',
    firstAnswer: 'FOIS',
    secondAnswer: 'ONDE',
    extractedLetter: 'S',
  },
  {
    id: 'motorage-mot-orage',
    definition: 'L’unité grammaticale de base du langage formé à partir d’un cumulonimbus',
    fauxWord: 'MOTORAGE',
    firstAnswer: 'MOT',
    secondAnswer: 'ORAGE',
    extractedLetter: 'O',
  },
  {
    id: 'motorage-moto-rage',
    definition: 'Véhicule automoteur à deux roues en colère',
    fauxWord: 'MOTORAGE',
    firstAnswer: 'MOTO',
    secondAnswer: 'RAGE',
    extractedLetter: 'O',
  },
  {
    id: 'fourail-fou-rail',
    definition: 'A perdu la raison sous un train',
    fauxWord: 'FOURAIL',
    firstAnswer: 'FOU',
    secondAnswer: 'RAIL',
    extractedLetter: 'R',
  },
  {
    id: 'fourail-four-ail',
    definition: 'Là où on cuit l’aliment qui effraie les vampires',
    fauxWord: 'FOURAIL',
    firstAnswer: 'FOUR',
    secondAnswer: 'AIL',
    extractedLetter: 'R',
  },
  {
    id: 'voltrame-vol-trame',
    definition: 'Voyage dans le ciel avec celle qui est narrative',
    fauxWord: 'VOLTRAME',
    firstAnswer: 'VOL',
    secondAnswer: 'TRAME',
    extractedLetter: 'T',
  },
  {
    id: 'voltrame-volt-rame',
    definition: 'La différence de potentiel propulse le canot',
    fauxWord: 'VOLTRAME',
    firstAnswer: 'VOLT',
    secondAnswer: 'RAME',
    extractedLetter: 'T',
  },
];

export class FauxWordsPuzzleType extends PuzzleType {
  constructor() {
    super({
      id: 'faux-words',
      name: 'Mots collés',
      state: 'pending',
      playRoute: '/play/faux-words',
      description:
        'Huit définitions décrivent des mots fabriqués en collant deux vrais mots. La lettre déplacée entre les deux mots forme la réponse finale.',
      answerFormat: 'Réponse finale de 4 lettres.',
      clueFormat: 'Huit définitions et quatre faux mots à séparer.',
      createdAt: '2026-07-21',
      updatedAt: '2026-07-21',
      variants: [
        {
          id: 'faux-words-main',
          name: 'Extraction',
          state: 'pending',
          description:
            'Sépare chaque faux mot en deux réponses de définition. Dans chaque paire, une lettre passe d’un mot à l’autre : extrais-la, puis lis les quatre lettres dans l’ordre des paires.',
          examples: [
            {
              id: 'faux-words-example',
              name: 'Les mots collés',
              description: 'Les huit définitions et leurs séparations servent d’exemple complet.',
            },
          ],
          exampleCount: 0,
          partialAnswers: FAUX_WORD_DEFINITIONS.filter(
            (entry, index, entries) =>
              entries.findIndex((candidate) => candidate.fauxWord === entry.fauxWord) === index,
          ).map((entry) => ({
            answer: entry.fauxWord,
            message: 'C’est une définition valide.',
          })),
        },
      ],
    });
  }
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLexiqueTsv } from './build-french-word-lists.mjs';

const HEADER = '1_Mot\t5_Cgram\t8_Nombre\t14_IsLem';

test('filtre Lexique, conserve les accents et répartit par longueur', () => {
  const tsv = [
    HEADER,
    'Chat\tNOM\ts\t1',
    'chat\tNOM\ts\t1',
    'côte\tNOM\ts\t1',
    'cote\tNOM\ts\t1',
    'chats\tNOM\tp\t0',
    "l'été\tNOM\ts\t1",
    'porte-mots\tNOM\tp\t0',
    'abc1\tNOM\ts\t1',
    'de ux\tNOM\ts\t1',
    'SIGL\tSIGLE\ts\t1',
    'AIDE\tNOM\ts\t1',
    'été\tNOM\ts\t1',
  ].join('\n');

  const wordsByLength = parseLexiqueTsv(tsv);
  const fourLetterWords = wordsByLength.get(4);
  const fiveLetterWords = wordsByLength.get(5);

  assert.equal(fourLetterWords.filter((word) => word === 'chat').length, 1);
  assert.ok(fourLetterWords.includes('côte'));
  assert.ok(fourLetterWords.includes('cote'));
  assert.deepEqual(fiveLetterWords, ['chats']);
  assert.ok(!fourLetterWords.includes("l'été"));
  assert.ok(!fourLetterWords.includes('porte-mots'));
  assert.ok(!fourLetterWords.includes('abc1'));
  assert.ok(!fourLetterWords.includes('de ux'));
  assert.ok(!fourLetterWords.includes('sigl'));
  assert.ok(!fourLetterWords.includes('aide'));
});

test('supporte les options de filtrage facultatives', () => {
  const tsv = [
    HEADER,
    'chat\tNOM\ts\t1',
    'chats\tNOM\tp\t0',
    'chose\tNOM\ts\t0',
  ].join('\n');

  const wordsByLength = parseLexiqueTsv(tsv, {
    excludePlurals: true,
    lemmasOnly: true,
  });

  assert.deepEqual(wordsByLength.get(4), ['chat']);
  assert.deepEqual(wordsByLength.get(5), []);
});

test('écarte les formes très rares avec la fréquence orthographique', () => {
  const tsv = [
    `${HEADER}\t11_FreqOrtho`,
    'chat\tNOM\ts\t1\t49.725',
    'zoum\tNOM\ts\t1\t0.2',
    'chats\tNOM\tp\t0\t12.5',
    'zumba\tNOM\ts\t1\t0.275',
  ].join('\n');

  const wordsByLength = parseLexiqueTsv(tsv);

  assert.deepEqual(wordsByLength.get(4), ['chat']);
  assert.deepEqual(wordsByLength.get(5), ['chats']);
  assert.ok(parseLexiqueTsv(tsv, { minimumFrequency: 0.1 }).get(4).includes('zoum'));
});

test('signale un en-tête sans colonne de mot', () => {
  assert.throws(
    () => parseLexiqueTsv('categorie\tvaleur\nNOM\tchat'),
    /colonne du mot/i,
  );
});

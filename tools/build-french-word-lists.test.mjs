import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeWordLists,
  parseGrammalecteLexique,
  parseLexiqueTsv,
  parseMorphalouWordList,
} from './build-french-word-lists.mjs';

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

test('écarte les formes très rares avec la fréquence de la forme', () => {
  const tsv = [
    `${HEADER}\t10_FreqMot\t11_FreqOrtho`,
    'chat\tNOM\ts\t1\t49.725\t49.725',
    'zoum\tNOM\ts\t1\t0.2\t100',
    'chats\tNOM\tp\t0\t12.5\t12.5',
    'tris\tNOM\tp\t0\t0.592\t2.709',
    'zumba\tNOM\ts\t1\t0.275\t100',
  ].join('\n');

  const wordsByLength = parseLexiqueTsv(tsv);

  assert.deepEqual(wordsByLength.get(4), ['chat', 'tris']);
  assert.deepEqual(wordsByLength.get(5), ['chats']);
  assert.ok(parseLexiqueTsv(tsv, { minimumFrequency: 0.1 }).get(4).includes('zoum'));
});

test('limite la liste aux formes extraites de Morphalou', () => {
  const morphalou = [
    'chat',
    'chats',
    'l’été',
    'porte-mots',
    'ABC1',
    'été',
  ].join('\n');

  assert.deepEqual([...parseMorphalouWordList(morphalou)], ['chat', 'chats']);
});

test('extrait les formes françaises de Grammalecte sans les noms propres ni les symboles', () => {
  const row = (word, tags, notes = '', frequencyIndex = 5) => {
    const cells = Array.from({ length: 20 }, () => '');

    cells[0] = '0';
    cells[1] = '1';
    cells[2] = word;
    cells[3] = word;
    cells[4] = tags;
    cells[7] = notes;
    cells[19] = String(frequencyIndex);

    return cells.join('\t');
  };

  const lexique = [
    row('tris', 'nom mas pl'),
    row('Aaron', 'npr mas inv'),
    row('AABA', 'nom epi inv', 'sig'),
    row('µkat', 'nom mas inv', 'symb'),
    row('rare', 'nom mas sg', '', 4),
  ].join('\n');

  assert.deepEqual([...parseGrammalecteLexique(lexique)], ['tris']);
});

test('fusionne les sources sans supprimer les mots propres à une seule source', () => {
  assert.deepEqual(
    [...mergeWordLists(new Set(['chat']), new Set(['tris', 'chat']))],
    ['chat', 'tris'],
  );
});

test('signale un en-tête sans colonne de mot', () => {
  assert.throws(
    () => parseLexiqueTsv('categorie\tvaleur\nNOM\tchat'),
    /colonne du mot/i,
  );
});

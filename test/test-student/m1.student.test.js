/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

// const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

test('(1 pts) student test', () => {
  const util = require('@brown-ds/distribution')().util;
  const a = util.serialize(1);
  console.log('serialized', a);
  const s = util.serialize([1, 'two', false, null]);
  const serialized = '{"type":"array","value":{"0":{"type":"number","value":"1"},"1":{"type":"string","value":"two"},"2":{"type":"boolean","value":"false"},"3":{"type":"null","value":""}}}';
  expect(s).toEqual(serialized);
});


test('(1 pts) student test', () => {
  // Fill out this test case...
  const util = require('@brown-ds/distribution')().util;
  const s = util.serialize([]);
  const serialized = '{"type":"array","value":{}}';
  expect(s).toEqual(serialized);
  const deserialized = util.deserialize(s);
  expect([]).toEqual(deserialized);
});


test('(1 pts) student test', () => {
  const util = require('@brown-ds/distribution')().util;
  const original = new Date('2024-01-04T12:00:00.000Z');
  const serialized = util.serialize(original);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(original);
});

test('(1 pts) student test', () => {
  // quotes within quotes
  const util = require('@brown-ds/distribution')().util;
  const s = 'a "Hello" a';
  expect(util.deserialize(util.serialize(s))).toEqual(s);
});

test('(1 pts) student test', () => {
  const util = require('@brown-ds/distribution')().util;
  const inf = Infinity;
  expect(util.deserialize(util.serialize(inf))).toBe(Infinity);
});

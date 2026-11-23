import { test } from 'node:test';
import assert from 'node:assert/strict';
import { namesNotInTitle, namesOverlap, titleBesideNames } from '../src/lib/names.ts';

test('names overlap: match or containment, ignoring case and punctuation, whole words', () => {
  assert.equal(namesOverlap('Mana Kintorso (Black Wednesday)', 'Mana Kintorso'), true);
  assert.equal(namesOverlap('MANA KINTORSO!', 'mana kintorso'), true);
  assert.equal(namesOverlap('Stamos', 'Jon Bon Stamos'), true); // the name contains the title
  assert.equal(namesOverlap('AC/DC Tribute', 'ACDC'), false); // "acdc" isn't a word of "ac dc tribute"
  assert.equal(namesOverlap('AC/DC', 'ACDC'), true);
  assert.equal(namesOverlap('Guns N’ Roses', "Guns N' Roses"), true);
  assert.equal(namesOverlap('Crash Night', 'Ash'), false);
  assert.equal(namesOverlap('Turkey Day Hangover Show', 'Fuzzy Kitty'), false);
});

// The Pig Minds Black Wednesday listings (2026-11-25) printed the artist twice
// on the daily graphic: as the act and again in the title beside it.
test('duplicate names: a title that repeats the artist shows the name once', () => {
  assert.equal(titleBesideNames('Mana Kintorso (Black Wednesday)', ['Mana Kintorso']), 'Black Wednesday');
  assert.equal(titleBesideNames('Black Wednesday: Mana Kintorso', ['Mana Kintorso']), 'Black Wednesday');
  assert.equal(titleBesideNames('Jon Bon Stamos - Black Wednesday', ['Jon Bon Stamos']), 'Black Wednesday');
  assert.equal(titleBesideNames('Mana Kintorso', ['Mana Kintorso']), undefined);
  assert.equal(titleBesideNames('mana kintorso.', ['Mana Kintorso']), undefined);
  assert.equal(titleBesideNames('Stamos', ['Jon Bon Stamos']), undefined);
  assert.equal(titleBesideNames('An Evening with Stevee Nix', ['Stevee Nix']), 'An Evening');
  assert.equal(titleBesideNames('Rock with Mana Kintorso and Friends', ['Mana Kintorso']), undefined);
  // Real titles: the words beside the name stay.
  assert.equal(titleBesideNames('NYE Bash with Land of Linkin', ['Land of Linkin']), 'NYE Bash');
  assert.equal(titleBesideNames('Christmas with the Abram Collier Nonet', ['Abram Collier Nonet']), 'Christmas');
  assert.equal(titleBesideNames('Open Mic Night with Acoustic Revolution', ['Acoustic Revolution']), 'Open Mic Night');
  assert.equal(titleBesideNames("Mister Pink's Halloween Show", ['Mister Pink']), 'Halloween Show');
  assert.equal(titleBesideNames('Random AF Farewell Show', ['Random AF']), 'Farewell Show');
  assert.equal(titleBesideNames('Leinaala and Dave (Unplugged)', ['Leinaala & Dave']), 'Unplugged');
  assert.equal(titleBesideNames('Leinaala & Dave (Unplugged)', ['Leinaala & Dave']), 'Unplugged');
  // Titles that don't name the act are kept as they are.
  assert.equal(titleBesideNames('Final Farewell Show', ['Stevee Nix']), 'Final Farewell Show');
  assert.equal(titleBesideNames(undefined, ['Stevee Nix']), undefined);
  // Several acts: each one the title names comes out.
  assert.equal(titleBesideNames('Mana Kintorso + Jon Bon Stamos (Black Wednesday)', ['Mana Kintorso', 'Jon Bon Stamos']), 'Black Wednesday');
  assert.equal(titleBesideNames('Mana Kintorso + Jon Bon Stamos', ['Mana Kintorso', 'Jon Bon Stamos']), undefined);
  assert.equal(titleBesideNames('Mana Kintorso (Black Wednesday)', ['Mana Kintorso', 'Jon Bon Stamos']), 'Black Wednesday');
  assert.equal(titleBesideNames('Black Wednesday: Mana Kintorso', ['Mana Kintorso', 'Jon Bon Stamos']), 'Black Wednesday');
});

test('duplicate names: the site line-up skips acts the title names', () => {
  assert.deepEqual(namesNotInTitle('Mana Kintorso (Black Wednesday)', ['Mana Kintorso']), []);
  assert.deepEqual(namesNotInTitle('Mana Kintorso (Black Wednesday)', ['Mana Kintorso', 'Jon Bon Stamos']), ['Jon Bon Stamos']);
  assert.deepEqual(namesNotInTitle('Turkey Day Hangover Show', ['Fuzzy Kitty']), ['Fuzzy Kitty']);
  assert.deepEqual(namesNotInTitle(undefined, ['Fuzzy Kitty']), ['Fuzzy Kitty']);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FPS, multiTiming, multiFrame } from '../scripts/social/reel-timing.mjs';

test('reel: 7.5 s per page up to 4 pages', () => {
  assert.deepEqual(multiTiming(2), { pageFrames: 225, frames: 450, seconds: 15 });
  assert.deepEqual(multiTiming(4), { pageFrames: 225, frames: 900, seconds: 30 });
});

test('reel: more than 4 pages share the 30 s cap', () => {
  for (const n of [5, 6, 7, 9]) {
    const t = multiTiming(n);
    assert.ok(t.seconds <= 30 && t.seconds > 29, `${n} pages: ${t.seconds}`);
    assert.equal(t.pageFrames, Math.floor((30 / n) * FPS));
  }
});

test('reel: one page is not a multi-page reel', () => {
  assert.throws(() => multiTiming(1));
});

test('reel: each page zooms 100→105% and fades from and to the background', () => {
  const { pageFrames } = multiTiming(4);
  for (let p = 0; p < 4; p++) {
    const first = multiFrame(p * pageFrames, pageFrames);
    const last = multiFrame((p + 1) * pageFrames - 1, pageFrames);
    assert.equal(first.page, p);
    assert.equal(last.page, p);
    assert.equal(first.zoom, 1);
    assert.ok(Math.abs(last.zoom - 1.05) < 1e-12);
    assert.equal(first.opacity, 0);
    assert.equal(last.opacity, 0);
  }
  assert.equal(multiFrame(15, pageFrames).opacity, 1); // 0.5 s in
  assert.equal(multiFrame(100, pageFrames).opacity, 1);
  assert.equal(multiFrame(pageFrames - 16, pageFrames).opacity, 1); // 0.5 s before the end
  assert.ok(multiFrame(7, pageFrames).opacity < 1);
});

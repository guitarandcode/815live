// Frame timing for the daily Reel, kept pure so it can be tested.
//
// One page: the original 15 s reel (108% zoom, 0.6 s fades, done by ffmpeg).
// Several pages: 7.5 s each, capped at 30 s in total (more than 4 pages split
// the 30 s evenly), each page zooming 100→105% from its own start and fading
// in from and out to the background over 0.5 s.
export const FPS = 30;
export const SINGLE = { seconds: 15, zoomEnd: 1.08, fade: 0.6 };
export const MULTI = { perPage: 7.5, maxSeconds: 30, zoomEnd: 1.05, fade: 0.5 };

/** Frames per page and total frames for `pages` pages (pages >= 2). */
export function multiTiming(pages) {
  if (!Number.isInteger(pages) || pages < 2) throw new Error(`multiTiming needs 2+ pages, got ${pages}`);
  const perPage = Math.min(MULTI.perPage, MULTI.maxSeconds / pages);
  const pageFrames = Math.floor(perPage * FPS);
  const frames = pageFrames * pages;
  return { pageFrames, frames, seconds: frames / FPS };
}

/**
 * Zoom factor (1 → zoomEnd) and image opacity (0 → 1 → 0) for frame `n` of a
 * multi-page reel. Opacity over the background rect is the same blend as
 * ffmpeg's fade to a color: the first and last frame of each page are pure
 * background, and the fade is linear in frames.
 */
export function multiFrame(n, pageFrames) {
  const i = n % pageFrames;
  const page = Math.floor(n / pageFrames);
  const zoom = 1 + ((MULTI.zoomEnd - 1) * i) / (pageFrames - 1);
  const fadeFrames = Math.round(MULTI.fade * FPS);
  const opacity = Math.min(1, i / fadeFrames, (pageFrames - 1 - i) / fadeFrames);
  return { page, zoom, opacity };
}

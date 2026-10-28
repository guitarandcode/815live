import type { APIRoute } from 'astro';
import { OTHER_CATEGORIES, PAGE_CATEGORIES } from '../lib/categories.ts';
import { categoryCounts, loadAll, showsByDate, upcomingShows } from '../lib/data.ts';

// Placeholder records, empty category pages and empty date pages (all noindex) are left out; a noindex URL in a sitemap is a mixed signal.
// Past shows keep their pages (links to them still work) but no listing links them any more, so they're left out too.
export const GET: APIRoute = async ({ site }) => {
  const { venues, artists } = await loadAll();
  const shows = await upcomingShows();
  const counts = await categoryCounts();
  const byDate = await showsByDate();
  const paths = [
    '/',
    '/tonight',
    '/tomorrow',
    '/this-weekend',
    '/free',
    '/calendar',
    '/venues',
    '/artists',
    '/about',
    '/submit',
    ...[...byDate].filter(([, list]) => list.length > 0).map(([date]) => `/date/${date}`),
    ...(OTHER_CATEGORIES.some((c) => counts[c] > 0) ? ['/other-events'] : []),
    ...PAGE_CATEGORIES.filter((c) => counts[c] > 0).map((c) => `/${c}`),
    ...venues.filter((v) => !v.data.placeholder).map((v) => `/venues/${v.id}`),
    ...artists.filter((a) => !a.data.placeholder).map((a) => `/artists/${a.id}`),
    ...shows.filter((s) => !s.placeholder).map((s) => `/shows/${s.id}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

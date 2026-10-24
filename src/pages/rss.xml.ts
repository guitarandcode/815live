import type { APIRoute } from 'astro';
import { billTitle, coverLabel, NOW, upcomingShows } from '../lib/data.ts';
import { formatDay, formatTime } from '../lib/time.ts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const items = (await upcomingShows()).map((show) => {
    const url = new URL(`/shows/${show.id}`, site).href;
    const cover = coverLabel(show.cover);
    const desc = [
      `${formatDay(show.date)}, ${formatTime(show.startTime)} CT at ${show.venue.data.name}, ${show.venue.data.city}.`,
      cover && `Cover: ${cover}.`,
      show.notes,
    ]
      .filter(Boolean)
      .join(' ');
    return `    <item>
      <title>${esc(`${formatDay(show.date)}: ${billTitle(show)} at ${show.venue.data.name}`)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(desc)}</description>
    </item>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>815live: upcoming shows</title>
    <link>${site!.href}</link>
    <atom:link href="${new URL('/rss.xml', site).href}" rel="self" type="application/rss+xml" />
    <description>Upcoming live music in Rockford, Loves Park, Belvidere and the 815.</description>
    <language>en-us</language>
    <lastBuildDate>${NOW.toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};

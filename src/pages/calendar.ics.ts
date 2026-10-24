import type { APIRoute } from 'astro';
import { NOW, upcomingShows } from '../lib/data.ts';
import { calendar } from '../lib/ics.ts';

export const GET: APIRoute = async ({ site }) =>
  new Response(calendar(await upcomingShows(), site!, NOW), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });

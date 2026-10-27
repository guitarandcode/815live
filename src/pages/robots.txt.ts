import type { APIRoute } from 'astro';

// AI training crawlers that don't feed search results. Search and
// user-initiated agents (Googlebot, Bingbot, Applebot, OAI-SearchBot,
// ChatGPT-User, Claude-User, Claude-SearchBot, PerplexityBot) stay allowed.
const NO_TRAINING = ['GPTBot', 'CCBot', 'Google-Extended', 'ClaudeBot', 'Bytespider', 'Meta-ExternalAgent'];

export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *\nAllow: /',
      ...NO_TRAINING.map((bot) => `User-agent: ${bot}\nDisallow: /`),
      `Sitemap: ${new URL('/sitemap.xml', site).href}`,
    ].join('\n\n') + '\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );

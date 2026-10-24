// robots.txt parsing and matching, Google-style: the most specific group for
// our token (else `*`), `*` wildcards, `$` anchors, longest match wins, Allow
// wins ties. Unreachable or 5xx robots.txt means "don't fetch".

export const BOT_TOKEN = '815livebot';

interface Group {
  agents: string[];
  rules: [kind: 'allow' | 'disallow', path: string][];
}

export function parseRobots(text: string): Group[] {
  const groups: Group[] = [];
  let cur: Group | undefined;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#', 1)[0].trim();
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (key === 'user-agent') {
      if (!lastWasAgent || !cur) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      if ((key === 'allow' || key === 'disallow') && cur) cur.rules.push([key, value]);
      lastWasAgent = false;
    }
  }
  return groups;
}

function ruleMatches(rule: string, path: string): boolean {
  const anchored = rule.endsWith('$');
  const body = anchored ? rule.slice(0, -1) : rule;
  const rx = body
    .split('*')
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${rx}${anchored ? '$' : ''}`).test(path);
}

export function isAllowed(robotsText: string, url: string, token = BOT_TOKEN): { allowed: boolean; rule: string } {
  const groups = parseRobots(robotsText);
  let mine = groups.filter((g) => g.agents.some((a) => a !== '*' && token.includes(a)));
  if (mine.length === 0) mine = groups.filter((g) => g.agents.includes('*'));
  const u = new URL(url);
  const path = (u.pathname || '/') + u.search;
  let best: { len: number; allow: boolean; rule: string } | undefined;
  for (const g of mine) {
    for (const [kind, rule] of g.rules) {
      if (kind === 'disallow' && rule === '') continue;
      if (!ruleMatches(rule, path)) continue;
      const cand = { len: rule.length, allow: kind === 'allow', rule: `${kind}: ${rule}` };
      if (!best || cand.len > best.len || (cand.len === best.len && cand.allow && !best.allow)) best = cand;
    }
  }
  return best ? { allowed: best.allow, rule: best.rule } : { allowed: true, rule: 'no matching rule' };
}

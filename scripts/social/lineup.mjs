// Lineup images: one entry per act per venue per day (user rule, 2026-11-27).
// When the same act plays more than one slot at the same venue on the same
// night, the image shows one row with every start time on it: "at 6:30 and 9",
// "at 6, 7:30 and 9" (user rule, 2026-11-27).
// Images only: captions, the site and data/ keep one listing per slot.

// Act names match ignoring case and extra whitespace.
export const actKey = (act) => String(act ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

// rows: events with act, venue, startTime and a night (`nightOf` is passed in,
// so a 12:30 AM slot counts toward the night before). Keeps the first row of
// each act/venue/night in list order and gives it `times` (sorted start
// times) and `slots` (the merged rows, for anything that needs them back).
export function mergeSlots(rows, nightOf) {
  const byKey = new Map();
  const out = [];
  for (const row of rows) {
    const key = `${actKey(row.act)}|${row.venue}|${nightOf(row)}`;
    const hit = byKey.get(key);
    if (hit) {
      hit.slots.push(row);
      continue;
    }
    const merged = { ...row, slots: [row] };
    byKey.set(key, merged);
    out.push(merged);
  }
  for (const m of out) {
    // Times after midnight sort after the evening ones (they're the same night).
    const order = (s) => `${s.date}T${s.startTime}`;
    m.slots.sort((a, b) => order(a).localeCompare(order(b)));
    m.times = [...new Set(m.slots.map((s) => s.startTime))];
  }
  return out;
}

// "at 6:30 and 9": 12-hour times without AM/PM, ":00" dropped, in the order
// given (mergeSlots sorts them in night order), the last joined with "and".
export function slotTimes(times) {
  const short = times.map((t) => {
    const hr = Number(t.slice(0, 2)) % 12 || 12;
    const m = t.slice(3, 5);
    return m === '00' ? `${hr}` : `${hr}:${m}`;
  });
  const list = short.length > 1 ? `${short.slice(0, -1).join(', ')} and ${short.at(-1)}` : short[0];
  return `at ${list}`;
}

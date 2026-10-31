// Crawls the running local server and reports broken internal links/assets:  node tools/check-links.mjs [http://localhost:4173]
const BASE = process.argv[2] || 'http://localhost:4173';
const pages = ['/', '/terminbuchung', '/ueber-uns', '/kundenbetreuung', '/impressum', '/datenschutz', '/cookies'];
const seen = new Map();
const bad = [];
const check = async (url, from) => {
  const key = url.split('#')[0];
  if (seen.has(key)) return;
  seen.set(key, true);
  const res = await fetch(key, { redirect: 'manual' });
  if (res.status !== 200) bad.push(`${res.status} ${key}  (from ${from})`);
};
for (const p of pages) {
  const html = await (await fetch(BASE + p)).text();
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const set of html.matchAll(/(?:srcset|imagesrcset)="([^"]+)"/g)) refs.push(...set[1].split(',').map((s) => s.trim().split(/\s+/)[0]));
  for (const r of refs) {
    if (/^(mailto:|tel:|#|data:)/.test(r)) continue;
    if (/^https?:/.test(r) && !r.startsWith(BASE)) continue; // external: not checked
    await check(new URL(r, BASE + p).toString(), p);
  }
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/href="(?:\/[^"#]*)?#([^"]+)"/g)) if (!ids.has(m[1]) && !/^(\/|#)/.test('')) {
    // anchor on another page: verify there
    const target = html.match(new RegExp(`href="([^"#]*)#${m[1]}"`))?.[1] || p;
    const th = await (await fetch(BASE + (target || p))).text();
    if (!th.includes(`id="${m[1]}"`)) bad.push(`missing anchor #${m[1]} (from ${p})`);
  }
}
console.log(`checked ${seen.size} URLs on ${pages.length} pages`);
console.log(bad.length ? 'PROBLEMS:\n' + bad.join('\n') : 'no broken internal links, assets or anchors');

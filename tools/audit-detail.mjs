// Detail dump for a Lighthouse JSON report:  node tools/audit-detail.mjs reports/lh-home-mobile.json
import fs from 'node:fs';
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const a = r.audits;
const items = (id) => ((a[id] && a[id].details && a[id].details.items) || []);
const short = (s, n = 140) => String(s || '').replace(/\s+/g, ' ').slice(0, n);
const nodeLine = (i) => (i.node ? `${short(i.node.snippet, 100)} :: ${short(i.node.explanation, 150)}` : short(JSON.stringify(i), 200));

const section = (title, id, n = 6, fmt = nodeLine) => {
  if (!a[id]) { console.log(`\n## ${title}: (audit ${id} not present)`); return; }
  console.log(`\n## ${title} [${id}] score=${a[id].score}`);
  for (const i of items(id).slice(0, n)) console.log('  -', fmt(i));
};

section('LCP element', 'largest-contentful-paint-element', 3, (i) => short(JSON.stringify(i.items || i), 300));
section('Color contrast', 'color-contrast', 8);
section('Touch targets', 'target-size', 8);
section('Unused JS', 'unused-javascript', 6, (i) => `${short(i.url, 90)} ${Math.round(i.wastedBytes / 1024)}KB`);
section('Render blocking', 'render-blocking-insight', 5);
section('Cache', 'cache-insight', 8, (i) => `${short(i.url, 80)} ttl=${i.cacheLifetimeMs}`);
section('Inspector issues', 'inspector-issues', 5);
section('3rd party cookies', 'third-party-cookies', 5);
section('Legacy JS', 'legacy-javascript-insight', 4);
section('Forced reflow', 'forced-reflow-insight', 4);
for (const id of ['lcp-breakdown-insight', 'lcp-discovery-insight', 'image-delivery-insight', 'font-display-insight', 'third-parties-insight', 'dom-size-insight', 'document-latency-insight']) {
  if (a[id]) console.log(`\n## ${id} score=${a[id].score} ${short(a[id].displayValue)}  ${short(JSON.stringify(items(id).slice(0, 4)), 400)}`);
}
console.log('\nBest-practices failing:', Object.values(a).filter((x) => r.categories['best-practices'].auditRefs.some((f) => f.id === x.id) && x.score !== null && x.score < 1 && x.scoreDisplayMode === 'binary').map((x) => x.id).join(', '));

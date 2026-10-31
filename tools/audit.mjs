// Summarises Lighthouse JSON reports:  node tools/audit.mjs reports/lh-home-mobile.json [...]
import fs from 'node:fs';

for (const file of process.argv.slice(2)) {
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  const sc = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
  const a = r.audits;
  const m = (id) => (a[id] && a[id].displayValue) || '-';
  console.log(`\n${file}\n  ${r.requestedUrl}  (${r.configSettings.formFactor})`);
  console.log('  scores:', JSON.stringify(sc));
  console.log(`  FCP ${m('first-contentful-paint')} | LCP ${m('largest-contentful-paint')} | TBT ${m('total-blocking-time')} | CLS ${m('cumulative-layout-shift')} | SI ${m('speed-index')}`);
  const bad = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable' && x.scoreDisplayMode !== 'manual');
  for (const x of bad) console.log(`  - [${Math.round(x.score * 100)}] ${x.id}: ${x.title}${x.displayValue ? ' (' + x.displayValue + ')' : ''}`);
}

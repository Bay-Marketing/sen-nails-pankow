// Downloads the Google Fonts used by the site (latin subset, woff2) into assets/fonts and writes assets/fonts/fonts.css.
// Self-hosting avoids render-blocking third-party CSS and the GDPR issue of loading Google Fonts from Google servers.
// Run: node tools/fetch-fonts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'fonts');
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FAMILIES = [
  { family: 'Josefin Sans', query: 'Josefin+Sans:wght@300..700', slug: 'josefin-sans' },
  { family: 'Poppins', query: 'Poppins:wght@600;900', slug: 'poppins' },
  { family: 'Mr De Haviland', query: 'Mr+De+Haviland', slug: 'mr-de-haviland' },
  { family: 'League Spartan', query: 'League+Spartan:wght@400', slug: 'league-spartan' },
  { family: 'Yellowtail', query: 'Yellowtail', slug: 'yellowtail' },
];

let css = '';
for (const f of FAMILIES) {
  const res = await fetch(`https://fonts.googleapis.com/css2?family=${f.query}&display=swap`, { headers: { 'User-Agent': UA } });
  const text = await res.text();
  // blocks look like:  /* latin */ @font-face { ... }
  for (const m of text.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
    if (m[1] !== 'latin') continue;
    const body = m[2];
    const weight = (body.match(/font-weight:\s*([^;]+);/) || [])[1].trim();
    const url = (body.match(/url\(([^)]+)\)/) || [])[1];
    const range = (body.match(/unicode-range:\s*([^;]+);/) || [])[1];
    const file = `${f.slug}-${weight.replace(/\s+/g, '-')}.woff2`;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(OUT, file), buf);
    css += `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(/assets/fonts/${file}) format('woff2');unicode-range:${range}}\n`;
    console.log(file, (buf.length / 1024).toFixed(1) + 'KB');
  }
}
fs.writeFileSync(path.join(OUT, 'fonts.css'), css);
console.log('fonts.css written');

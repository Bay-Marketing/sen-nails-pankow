// Headless capture of original (Wix) and clone pages at several viewports into reports/audit/*.json.
//   node tools/capture.mjs                         all pages x viewports x sides
//   node tools/capture.mjs --side=orig --vp=phoneP --page=home    (any subset; comma lists allowed)
// Needs Chrome (CHROME_PATH or the default Windows path) and the clone server on http://localhost:4173 (npm run serve).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'reports', 'audit');
fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SNAP = fs.readFileSync(path.join(ROOT, 'tools', 'snapshot.js'), 'utf8');

const ORIG = 'https://vp-bay.wixstudio.com/mysite';
const CLONE = 'http://localhost:4173';
const PAGES = { home: ['', ''], services: ['/terminbuchung', '/terminbuchung'], about: ['/ueber-uns', '/ueber-uns'], contact: ['/kundenbetreuung', '/kundenbetreuung'], impressum: ['/impressum', '/impressum'], datenschutz: ['/datenschutz', '/datenschutz'], cookies: ['/cookies', '/cookies'] };
const VPS = { desktop: [1440, 900], tabletL: [1024, 768], tabletP: [768, 1024], phoneL: [812, 375], phoneP: [375, 812] };
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

const arg = (k, all) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1].split(',') : all; };
const sides = arg('side', ['orig', 'clone']);
const vps = arg('vp', Object.keys(VPS));
const pages = arg('page', Object.keys(PAGES));
const CONC = Number(arg('conc', ['3'])[0]);

const jobs = [];
for (const vp of vps) for (const page of pages) for (const side of sides) jobs.push({ side, page, vp });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', ignoreDefaultArgs: ['--hide-scrollbars'], args: ['--no-sandbox', '--mute-audio'] });
let done = 0;
const failed = [];

const run = async ({ side, page: pk, vp }) => {
  const [w, h] = VPS[vp];
  const url = (side === 'orig' ? ORIG : CLONE) + PAGES[pk][side === 'orig' ? 0 : 1];
  const name = `${side}-${pk}-${vp}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const page = await browser.newPage();
    try {
      const mobile = w < 768;
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
      if (mobile) await page.setUserAgent(MOBILE_UA);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.evaluate(SNAP);
      const res = await page.evaluate((s, p, v, ew) => window.__capture(s, p, v, ew, { returnData: true }), side, pk, vp, w);
      if (!res.ok) throw new Error(`bad viewport ${JSON.stringify(res.innerWidth)}`);
      res.data.env.url = page.url();
      fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(res.data));
      done++;
      console.log(`[${done}/${jobs.length}] ${name} els=${res.data.els.length} total=${res.data.total}`);
      await page.close();
      return;
    } catch (err) {
      await page.close().catch(() => {});
      if (attempt === 3) { failed.push(`${name}: ${err.message}`); console.log(`FAILED ${name}: ${err.message}`); }
    }
  }
};

const queue = [...jobs];
await Promise.all(Array.from({ length: CONC }, async () => { while (queue.length) await run(queue.shift()); }));
await browser.close();
console.log(failed.length ? `done with ${failed.length} failures:\n${failed.join('\n')}` : `all ${jobs.length} captures saved to ${OUT}`);

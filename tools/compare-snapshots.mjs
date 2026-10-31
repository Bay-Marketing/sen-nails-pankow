// Compares original (Wix) vs clone snapshots captured by tools/snapshot.js.
//   node tools/compare-snapshots.mjs            -> writes reports/audit/diff-<page>-<vp>.json, diff-index.json, SUMMARY.md
// Snapshots: reports/audit/{orig,clone}-<page>-<vp>.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'reports', 'audit');
const PAGES = ['home', 'services', 'about', 'contact', 'impressum', 'datenschutz', 'cookies'];
const VPS = ['desktop', 'tabletL', 'tabletP', 'phoneL', 'phoneP'];
const BANNER_H = 30; // "Erstellt mit Wix Studio" bar above the original site

const IMG_ALIAS = {
  'wix:ae3bc7_2c732fbe76234410be42fd279c53a328': 'logo',
  'wix:36034b_f4fdbfea377d4a88937e311e7cfa3e08': 'hero',
  'wix:11062b_50f06773e73c4f93a9982ce45841fa60': 'massage',
  'wix:ae3bc7_0597b89e43a04ad3a2c17ecce3666f23': 'review',
  'wix:11062b_390556f1b8334099a23309566fbc50cf': 'about',
  'wix:36034b_b0d8869031d146d191ca64d7d4457045': 'og',
};
const imgName = (src) => {
  if (IMG_ALIAS[src]) return IMG_ALIAS[src];
  const m = String(src).match(/\/assets\/img\/([a-z]+)-\d+\.(?:avif|webp|jpg|png)/);
  return m ? m[1] : src;
};
const FONT_ALIAS = [
  [/josefin/, 'josefin'], [/poppins/, 'poppins'], [/league ?spartan/, 'leaguespartan'], [/mr ?de ?haviland/, 'mrdehaviland'],
  [/belinda/, 'script-title'], [/yellowtail/, 'script-title'], [/helvetica|arial|sans-serif/, 'helvetica'],
];
const fontKey = (ff) => { const s = String(ff || '').toLowerCase().replace(/[-_]/g, ' '); for (const [re, k] of FONT_ALIAS) if (re.test(s)) return k; return s.replace(/\W/g, ''); };
const rgb = (s) => { const m = String(s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
const colorDiff = (a, b) => { const x = rgb(a), y = rgb(b); if (!x || !y) return a === b ? 0 : 99; if (x.a === 0 && y.a === 0) return 0; return Math.max(Math.abs(x.r - y.r), Math.abs(x.g - y.g), Math.abs(x.b - y.b)) + (Math.abs(x.a - y.a) > 0.1 ? 50 : 0); };
const norm = (s) => String(s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const key = (s) => norm(s).toLowerCase();
const num = (n) => Math.round(n * 10) / 10;

const load = (side, page, vp) => {
  const f = path.join(DIR, `${side}-${page}-${vp}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
};

const prep = (snap) => {
  const off = snap.side === 'orig' ? BANNER_H : 0;
  const els = snap.els.map((e, i) => ({ ...e, i, rect: [e.rect[0], e.rect[1] - off, e.rect[2], e.rect[3]] }));
  const bannerIdx = new Set();
  if (snap.side === 'orig') els.forEach((e) => { if (e.t === 'text' && /^Erstellt mit/.test(e.text)) bannerIdx.add(e.i); if (e.rect[1] < -10) bannerIdx.add(e.i); });
  return els.filter((e) => !bannerIdx.has(e.i));
};

const pairBy = (A, B, keyFn) => {
  const mapB = new Map();
  B.forEach((e) => { const k = keyFn(e); if (!mapB.has(k)) mapB.set(k, []); mapB.get(k).push(e); });
  const pairs = [];
  const usedB = new Set();
  const onlyA = [];
  for (const a of A) {
    const q = mapB.get(keyFn(a));
    if (q && q.length) { const b = q.shift(); usedB.add(b); pairs.push([a, b]); } else onlyA.push(a);
  }
  const onlyB = B.filter((b) => !usedB.has(b));
  return { pairs, onlyA, onlyB };
};

const compareStyle = (a, b, notes) => {
  const sa = a.st || {}, sb = b.st || {};
  const fa = fontKey(sa.ff), fb = fontKey(sb.ff);
  if (fa !== fb) notes.push(`font ${sa.ff} -> ${sb.ff}`);
  const scriptSub = fa === 'script-title' && fb === 'script-title';
  if (Math.abs((sa.fs || 0) - (sb.fs || 0)) > 0.6) notes.push(`font-size ${sa.fs} -> ${sb.fs}`);
  // orig "poppins-black" is a 400-weight face that renders as Black: treat as 900
  const wa = /black/i.test(String(sa.ff)) ? '900' : String(sa.fw), wb = String(sb.fw);
  if (wa !== wb && !(scriptSub)) notes.push(`font-weight ${wa} -> ${wb}`);
  if (colorDiff(sa.c, sb.c) > 6) notes.push(`color ${sa.c} -> ${sb.c}`);
  if (Math.abs((sa.ls || 0) - (sb.ls || 0)) > 0.35) notes.push(`letter-spacing ${sa.ls} -> ${sb.ls}`);
  if (sa.lh != null && sb.lh != null && Math.abs(sa.lh - sb.lh) > 2) notes.push(`line-height ${sa.lh} -> ${sb.lh}`);
  const ta = (x) => (x === 'start' ? 'left' : x);
  if (ta(sa.ta) !== ta(sb.ta)) notes.push(`text-align ${sa.ta} -> ${sb.ta}`);
  if ((sa.tt || '') !== (sb.tt || '')) notes.push(`text-transform ${sa.tt || 'none'} -> ${sb.tt || 'none'}`);
  if ((sa.td || '') !== (sb.td || '')) notes.push(`text-decoration ${sa.td || 'none'} -> ${sb.td || 'none'}`);
  if ((sa.fst || '') !== (sb.fst || '')) notes.push(`font-style ${sa.fst || 'normal'} -> ${sb.fst || 'normal'}`);
  if (colorDiff(sa.bg, sb.bg) > 6) notes.push(`background ${sa.bg} -> ${sb.bg}`);
  if ((sa.br || '0px') !== (sb.br || '0px')) notes.push(`radius ${sa.br || 0} -> ${sb.br || 0}`);
  if (!!sa.sh !== !!sb.sh) notes.push(`shadow ${sa.sh ? 'yes' : 'no'} -> ${sb.sh ? 'yes' : 'no'}`);
};

const rectDelta = (ra, rb) => ({ dx: num(rb[0] - ra[0]), dy: num(rb[1] - ra[1]), dw: num(rb[2] - ra[2]), dh: num(rb[3] - ra[3]) });
const bigRect = (d, tolPos = 6, tolSize = 8) => Math.abs(d.dx) > tolPos || Math.abs(d.dy) > tolPos || Math.abs(d.dw) > tolSize || Math.abs(d.dh) > tolSize;

const diffPage = (page, vp) => {
  const o = load('orig', page, vp), c = load('clone', page, vp);
  if (!o || !c) return { page, vp, missing: { orig: !o, clone: !c } };
  const out = { page, vp, viewport: { orig: o.env.iw, clone: c.env.iw }, height: { orig: o.total - BANNER_H, clone: c.total, delta: c.total - (o.total - BANNER_H) }, scrollWidth: { orig: o.sw, clone: c.sw } };
  const A = prep(o), B = prep(c);

  // ---- text
  const tA = A.filter((e) => e.t === 'text'), tB = B.filter((e) => e.t === 'text');
  const tp = pairBy(tA, tB, (e) => key(e.text));
  out.textOnlyOrig = tp.onlyA.map((e) => ({ text: norm(e.text).slice(0, 90), rect: e.rect }));
  out.textOnlyClone = tp.onlyB.map((e) => ({ text: norm(e.text).slice(0, 90), rect: e.rect }));
  out.textDiffs = [];
  for (const [a, b] of tp.pairs) {
    const notes = [];
    compareStyle(a, b, notes);
    const d = rectDelta(a.rect, b.rect);
    if (bigRect(d)) notes.push(`rect Δx${d.dx} Δy${d.dy} Δw${d.dw} Δh${d.dh}`);
    if (notes.length) out.textDiffs.push({ text: norm(a.text).slice(0, 70), orig: a.rect, clone: b.rect, notes });
  }
  out.textMatched = tp.pairs.length;

  // ---- links
  const lA = A.filter((e) => e.t === 'a' && e.text), lB = B.filter((e) => e.t === 'a' && e.text);
  const lp = pairBy(lA, lB, (e) => key(e.text));
  out.linkOnlyOrig = lp.onlyA.map((e) => ({ text: e.text.slice(0, 60), href: e.href, rect: e.rect }));
  out.linkOnlyClone = lp.onlyB.map((e) => ({ text: e.text.slice(0, 60), href: e.href, rect: e.rect }));
  out.linkDiffs = [];
  for (const [a, b] of lp.pairs) {
    const notes = [];
    if (a.href !== b.href) notes.push(`href ${a.href} -> ${b.href}`);
    if ((a.target || '') !== (b.target || '')) notes.push(`target ${a.target || '_self'} -> ${b.target || '_self'}`);
    const d = rectDelta(a.rect, b.rect);
    if (bigRect(d, 6, 10)) notes.push(`box Δx${d.dx} Δy${d.dy} Δw${d.dw} Δh${d.dh}`);
    if (notes.length) out.linkDiffs.push({ text: a.text.slice(0, 60), orig: a.rect, clone: b.rect, notes });
  }
  const noText = (arr) => arr.filter((e) => e.t === 'a' && !e.text).map((e) => ({ href: e.href, rect: e.rect }));
  out.imageLinksOrig = noText(A);
  out.imageLinksClone = noText(B);

  // ---- images
  const iA = A.filter((e) => e.t === 'img'), iB = B.filter((e) => e.t === 'img');
  const ip = pairBy(iA, iB, (e) => imgName(e.src));
  out.images = ip.pairs.map(([a, b]) => {
    const notes = [];
    const d = rectDelta(a.rect, b.rect);
    if (bigRect(d, 6, 8)) notes.push(`rect Δx${d.dx} Δy${d.dy} Δw${d.dw} Δh${d.dh}`);
    if (a.alt !== b.alt) notes.push(`alt "${a.alt}" -> "${b.alt}"`);
    if (a.of !== b.of) notes.push(`object-fit ${a.of} -> ${b.of}`);
    if (a.op !== b.op) notes.push(`object-position ${a.op} -> ${b.op}`);
    return { name: imgName(a.src), orig: a.rect, clone: b.rect, notes };
  }).filter((x) => x.notes.length);
  out.imageOnlyOrig = ip.onlyA.map((e) => ({ src: imgName(e.src), alt: e.alt, rect: e.rect }));
  out.imageOnlyClone = ip.onlyB.map((e) => ({ src: imgName(e.src), alt: e.alt, rect: e.rect }));

  // ---- controls + iframes + svg icons
  const cA = A.filter((e) => e.t === 'ctl'), cB = B.filter((e) => e.t === 'ctl');
  out.controls = { orig: cA.map((e) => `${e.tag}${e.type ? ':' + e.type : ''} "${e.text || e.ph || e.name || e.aria}"`), clone: cB.map((e) => `${e.tag}${e.type ? ':' + e.type : ''} "${e.text || e.ph || e.name || e.aria}"`) };
  out.iframes = { orig: A.filter((e) => e.t === 'iframe').map((e) => ({ src: e.src.slice(0, 80), rect: e.rect })), clone: B.filter((e) => e.t === 'iframe').map((e) => ({ src: e.src.slice(0, 80), rect: e.rect })) };
  out.svgCount = { orig: A.filter((e) => e.t === 'svg').length, clone: B.filter((e) => e.t === 'svg').length };

  // ---- landmark boxes (sections/header/footer by order)
  const bx = (L) => L.filter((e) => e.t === 'box' && ['section', 'header', 'footer'].includes(e.tag)).sort((x, y) => x.rect[1] - y.rect[1] || y.rect[3] - x.rect[3]);
  const bA = bx(A), bB = bx(B);
  out.sections = { orig: bA.map((e) => ({ tag: e.tag, id: e.id, rect: e.rect, bg: e.st.bg })), clone: bB.map((e) => ({ tag: e.tag, cls: e.cls, rect: e.rect, bg: e.st.bg })) };

  // ---- document level
  out.bg = { orig: [o.bodyBg, o.htmlBg], clone: [c.bodyBg, c.htmlBg] };
  return out;
};

const headDiff = (page, vp) => {
  const o = load('orig', page, vp), c = load('clone', page, vp);
  if (!o || !c) return null;
  const h = { page, title: [o.head.title, c.head.title], lang: [o.head.lang, c.head.lang] };
  const keys = new Set([...Object.keys(o.head.meta), ...Object.keys(c.head.meta)]);
  h.meta = [...keys].map((k) => ({ k, orig: o.head.meta[k] ?? null, clone: c.head.meta[k] ?? null })).filter((x) => x.orig !== x.clone);
  h.linksOrig = o.head.links; h.linksClone = c.head.links;
  h.ld = { orig: o.head.ld, clone: c.head.ld };
  h.globals = { orig: o.head.globals, clone: c.head.globals };
  h.cookies = { orig: o.head.cookies, clone: c.head.cookies };
  h.resources = { orig: o.head.resources, clone: c.head.resources };
  return h;
};

const index = [];
const lines = ['# Original vs clone – automated measurement diff', '', 'Rect deltas are clone − original, in CSS px, page coordinates (original shifted up 30px for the Wix bar). Tolerances: position 6px, size 8px.', ''];
for (const vp of VPS) {
  lines.push(`## Viewport ${vp}`, '', '| page | orig h | clone h | Δh | text matched | text only orig | text only clone | style/rect diffs | link diffs | image diffs |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const page of PAGES) {
    const d = diffPage(page, vp);
    fs.writeFileSync(path.join(DIR, `diff-${page}-${vp}.json`), JSON.stringify(d, null, 1));
    if (d.missing) { lines.push(`| ${page} | MISSING ${d.missing.orig ? 'orig ' : ''}${d.missing.clone ? 'clone' : ''} | | | | | | | | |`); index.push({ page, vp, missing: d.missing }); continue; }
    lines.push(`| ${page} | ${d.height.orig} | ${d.height.clone} | ${d.height.delta} | ${d.textMatched} | ${d.textOnlyOrig.length} | ${d.textOnlyClone.length} | ${d.textDiffs.length} | ${d.linkDiffs.length + d.linkOnlyOrig.length + d.linkOnlyClone.length} | ${d.images.length + d.imageOnlyOrig.length + d.imageOnlyClone.length} |`);
    index.push({ page, vp, heightDelta: d.height.delta, textDiffs: d.textDiffs.length, textOnlyOrig: d.textOnlyOrig.length, textOnlyClone: d.textOnlyClone.length });
  }
  lines.push('');
}
const heads = PAGES.map((p) => headDiff(p, 'desktop')).filter(Boolean);
fs.writeFileSync(path.join(DIR, 'diff-head.json'), JSON.stringify(heads, null, 1));
fs.writeFileSync(path.join(DIR, 'diff-index.json'), JSON.stringify(index, null, 1));
fs.writeFileSync(path.join(DIR, 'SUMMARY.md'), lines.join('\n'));
console.log(lines.join('\n'));

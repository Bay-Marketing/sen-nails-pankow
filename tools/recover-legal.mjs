// One-off: rebuild content/legal.json from the already generated legal HTML pages.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const parse = (file) => {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const body = html.slice(html.indexOf('<div class="ltext">') + '<div class="ltext">'.length, html.indexOf('</div></section>'));
  const out = [];
  for (const m of body.matchAll(/<(h3|p|li)([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const text = unesc(m[3].replace(/<br>/g, '\n'));
    const kind = m[1] === 'h3' ? 'h' : m[1] === 'li' ? 'li' : /cat-note/.test(m[2]) ? 'c' : 'p';
    out.push([kind, text]);
  }
  return out;
};
const data = { impressum: parse('impressum.html'), cookies: parse('cookies.html'), datenschutz: parse('datenschutz.html') };
fs.mkdirSync(path.join(ROOT, 'content'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'content', 'legal.json'), JSON.stringify(data, null, 1));
console.log(Object.entries(data).map(([k, v]) => `${k}:${v.length}`).join(' '));

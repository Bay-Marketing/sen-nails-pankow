// Generates AVIF/WebP/fallback variants + tiny blur placeholders from assets/src.
// Run: npm run images   (writes assets/img/* and assets/img/manifest.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets', 'src');
const OUT = path.join(ROOT, 'assets', 'img');
fs.mkdirSync(OUT, { recursive: true });

// name -> source file, output widths, fallback format
const JOBS = {
  hero: { src: 'hero.jpg', widths: [480, 800, 1200, 1400], fallback: 'jpg' },
  massage: { src: 'massage.jpg', widths: [480, 800, 1200, 1400], fallback: 'jpg' },
  about: { src: 'about.jpg', widths: [400, 600, 950], fallback: 'jpg' },
  logo: { src: 'logo-full.jpg', widths: [160, 320, 480, 651], fallback: 'jpg' },
  review: { src: 'review.png', widths: [180, 360], fallback: 'png' },
};

const manifest = {};
for (const [name, job] of Object.entries(JOBS)) {
  const input = path.join(SRC, job.src);
  const meta = await sharp(input).metadata();
  const ratio = meta.height / meta.width;
  const entry = { ratio, widths: [], fallback: job.fallback };
  for (const w of job.widths) {
    if (w > meta.width) continue;
    const h = Math.round(w * ratio);
    const base = sharp(input).resize(w, h);
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 78, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.webp`));
    if (job.fallback === 'png') await base.clone().png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path.join(OUT, `${name}-${w}.png`));
    else await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT, `${name}-${w}.jpg`));
    entry.widths.push({ w, h });
  }
  // 24px blur placeholder inlined as a data URI (blur-up like Wix)
  const lq = await sharp(input).resize(24, Math.max(1, Math.round(24 * ratio))).webp({ quality: 40 }).toBuffer();
  entry.lqip = `data:image/webp;base64,${lq.toString('base64')}`;
  manifest[name] = entry;
}

// Open Graph image (1200x638, as declared in the og:image:width/height tags)
await sharp(path.join(SRC, 'og.jpg')).resize(1200, 638).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, 'og.jpg'));
manifest.og = { w: 1200, h: 638 };

// favicons from the logo
for (const s of [32, 180]) await sharp(path.join(SRC, 'logo-full.jpg')).resize(s, s).png().toFile(path.join(ROOT, 'assets', s === 32 ? 'favicon-32.png' : 'apple-touch-icon.png'));

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
const total = fs.readdirSync(OUT).reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
console.log('images done:', fs.readdirSync(OUT).length, 'files,', (total / 1024).toFixed(0), 'KB');

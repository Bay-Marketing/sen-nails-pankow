// Generates the static Sen Nails Pankow site.  Run: npm run build   (images: npm run images)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
const e = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CFG = JSON.parse(read('site.config.json'));
const LEGAL = JSON.parse(read('content/legal.json'));
const IMG = JSON.parse(read('assets/img/manifest.json'));
const FONT_CSS = read('assets/fonts/fonts.css').trim();

// ---------------------------------------------------------------- content
const SERVICES = [
  ['Maniküre & Pediküre – Basispflege', [
    ['Maniküre & Pediküre – Basis', 35], ['Maniküre & Pediküre mit Shellac', 58], ['Maniküre – Basis', 12],
    ['Maniküre mit Shellac', 30], ['Pediküre – Basis', 25], ['Pediküre mit Shellac', 35],
    ['Pediküre mit Frech-Design (kreativ)', 45], ['Pediküre mit Gel', 45], ['Nägel feilen – mit Shellac', 30]]],
  ['Nagelmodellage – Hände', [
    ['Auffüllen mit LED-Gel', 33], ['Auffüllen mit UV-Gel', 33], ['Auffüllen mit Pulver-Gel', 33],
    ['Neues Set mit Pulver-Gel', 35], ['Neues Set mit UV-Gel', 35], ['Neues Set mit LED-Gel', 35],
    ['Nagelmodellage – Extras', 5], ['Nagelmodellage entfernen', 12]]],
  ['Nagelmodellage – Füße', [
    ['Neues Set mit UV-Gel (Fußnägel)', 35], ['Neues Set mit LED-Gel (Fußnägel)', 35],
    ['Auffüllen mit UV-Gel (Fußnägel)', 33], ['Auffüllen mit LED-Gel (Fußnägel)', 33]]],
  ['Nail Art & Pflege', [
    ['Nageldesign – French (komplett)', 10], ['Nageldesign – individuell', 10], ['Nageldesign entfernen', 12],
    ['Nagelreparatur', 5], ['Nagellackwechsel', 15]]],
  ['Wimpernverlängerung', [['Neuanlage – Wimpernverlängerung', 60], ['Auffüllen der Wimpern', 50]]],
];

// Page meta copied from the original site (descriptions verbatim).
const PAGES = {
  index: { file: 'index.html', url: '/', title: 'Home', desc: 'Entdecken Sie Sen Nails in Pankow! Professionelle Maniküre, Pediküre, Nageldesign & Wimpernverlängerung. Gönnen Sie sich eine Auszeit. Jetzt Termin buchen!' },
  services: { file: 'terminbuchung.html', url: '/terminbuchung', title: 'Services', desc: 'Vereinbaren Sie online einen Termin bei uns. 📅 Nutzen Sie unsere bequeme und benutzerfreundliche Terminbuchung-Seite, um Ihren Termin zu planen und zu vereinbaren. ⏰' },
  about: { file: 'ueber-uns.html', url: '/ueber-uns', title: 'Über uns', desc: 'Entspannung & Schönheit bei Sen Nails Pankow – Nageldesign – Shellac – Wimpernverlängerung – Maniküre & Pediküre!\nSen Nails Pankow ist dein Wohlfühlort für gepflegte Nägel und natürliche Schönheit. Genieße professionelle Maniküre & Pediküre, haltbaren Shellac, kreative Nagelmodellage und luxuriöse Wimpernverlängerung – individuell auf dich abgestimmt.\nBuche jetzt deinen Termin und gönn dir eine Auszeit!' },
  contact: { file: 'kundenbetreuung.html', url: '/kundenbetreuung', title: 'Kundenbetreuung', desc: 'Kundenzufriedenheit an erster Stelle! 👍 Unser Geschäft ist bestrebt, auf Ihre Anliegen einzugehen und Ihnen den bestmöglichen Service zu bieten. 🏆 Kontaktieren Sie unsere Kundenbetreuung, um uns über Ihre Bedenken oder Fragen zu informieren. 📞 Wir sind hier, um Ihnen zu helfen und sicherzustellen, dass Ihre Erfahrung bei uns unvergesslich wird. 🌟' },
  imprint: { file: 'impressum.html', url: '/impressum', title: 'Impressum', desc: 'Entspannung & Schönheit bei Sen Nails Pankow – Nageldesign – Shellac – Wimpernverlängerung – Maniküre – Pediküre!\nSen Nails Pankow ist dein Rückzugsort für stilvolle Pflege und echte Verwöhnmomente. Erlebe professionelle Maniküre & Pediküre, langanhaltenden Shellac, kreative Nagelmodellage und luxuriöse Wimpernverlängerung – individuell auf dich abgestimmt.\nBuche jetzt deinen Termin und genieße entspannte Schönheitspflege im Herzen von Pankow!' },
  privacy: { file: 'datenschutz.html', url: '/datenschutz', title: 'Datenschutz', desc: 'Unser Sen Nails Studio in Pankow heißt Sie herzlich willkommen! 💅\nErfahren Sie mehr über unser Team 👥 und unsere Leidenschaft für Nageldesign, Shellac, Maniküre, Pediküre, Nagelmodellage und Wimpernverlängerung. Kontaktieren Sie uns 📞 für Termine und persönliche Anfragen.\nEntdecken Sie stilvolle Pflege und pure Entspannung in der Berliner Straße 123, im Herzen von Pankow. 🌿' },
  cookies: { file: 'cookies.html', url: '/cookies', title: 'Cookies', desc: 'Erfahren Sie, wie wir Cookies 🍪 verwenden, um Ihr Online-Erlebnis in unserem Nagelstudio & Spa zu verbessern. Unsere Cookie-Richtlinie erklärt, wie und warum wir Cookies einsetzen, um Ihnen ein personalisiertes und benutzerfreundliches Erlebnis 💅 zu bieten. Ihr Datenschutz 🔒 ist uns wichtig.' },
};
const U = Object.fromEntries(Object.entries(PAGES).map(([k, v]) => [k, v.url]));
const abs = (u) => CFG.domain + u;
const OG = { url: abs('/assets/img/og.jpg'), w: IMG.og.w, h: IMG.og.h };

// Same schema.org block as the original home page (street string kept verbatim).
const LD = JSON.stringify({
  '@context': 'https://schema.org/', '@type': 'LocalBusiness', name: CFG.siteName, url: abs('/'), image: OG.url,
  address: { '@type': 'PostalAddress', addressCountry: 'DE', addressLocality: 'Berlin', addressRegion: 'BE', postalCode: '13156', streetAddress: '67 Dietzgenstraße' },
  telephone: '030 81302109',
});

// ---------------------------------------------------------------- helpers
const ARROW = '<svg class="arr" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const ARROW_CIRCLE = '<svg class="arr" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9 15 15 9M10 9h5v5"/></svg>';

// <picture> with AVIF + WebP + fallback, srcset/sizes, intrinsic size and optional blur-up background.
const pic = (name, { alt, cls = '', sizes, eager = false, lq = false }) => {
  const m = IMG[name];
  const ext = m.fallback === 'png' ? 'png' : 'jpg';
  const set = (f) => m.widths.map((x) => `/assets/img/${name}-${x.w}.${f} ${x.w}w`).join(', ');
  const big = m.widths[m.widths.length - 1];
  const bg = lq ? ` style="background:url(${m.lqip}) center/cover"` : '';
  const load = eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"';
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">` +
    `<img${cls ? ` class="${cls}"` : ''} src="/assets/img/${name}-${big.w}.${ext}" srcset="${set(ext)}" sizes="${sizes}" width="${big.w}" height="${big.h}" alt="${alt}"${load}${bg}></picture>`;
};

const SITE_FLAGS = JSON.stringify({
  ads: CFG.tracking.googleAdsId, pixel: CFG.tracking.metaPixelId,
  banner: !!CFG.consentBanner, reveal: !!CFG.reveal, endpoint: CFG.formEndpoint || '',
});

const BANNER = `<div class="consent" id="consent" role="dialog" aria-live="polite" aria-label="Cookie-Einstellungen" hidden>
  <p>Wir verwenden Cookies, um die Leistung unserer Website zu analysieren und die Wirksamkeit unserer Werbung zu messen. Mehr dazu in unserer <a href="${U.cookies}">Cookie-Richtlinie</a> und der <a href="${U.privacy}">Datenschutzerklärung</a>.</p>
  <div class="consent-b"><button type="button" class="cb" data-consent="no">Ablehnen</button><button type="button" class="cb cb-yes" data-consent="yes">Akzeptieren</button></div>
</div>`;

// Fonts (self-hosted) and the hero image are preloaded where they are above the fold.
const FONT_PRELOAD = { index: ['josefin-sans-300-700', 'yellowtail-400', 'poppins-900'], services: ['josefin-sans-300-700', 'league-spartan-400'], about: ['josefin-sans-300-700', 'poppins-900'] };
const preload = (key) => {
  const fonts = (FONT_PRELOAD[key] || ['josefin-sans-300-700']).map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/${f}.woff2" crossorigin>`);
  if (key === 'index') {
    const h = IMG.hero;
    fonts.push(`<link rel="preload" as="image" type="image/avif" imagesrcset="${h.widths.map((x) => `/assets/img/hero-${x.w}.avif ${x.w}w`).join(', ')}" imagesizes="100vw" fetchpriority="high">`);
  }
  return fonts.join('\n') + '\n';
};

const page = ({ key = '', title, desc, canonical, noindex = false, body, active = '' }) => {
  const nav = [[U.services, 'Services'], [U.about, 'Über uns'], [U.index + '#kontakt', 'Kontakt']];
  const links = nav.map(([h, t]) => `<a href="${h}"${t === active ? ' class="on"' : ''}>${t}</a>`).join('');
  const fullTitle = `${e(title)} | ${CFG.siteName}`;
  const d = e(desc);
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${d}">${noindex ? '\n<meta name="robots" content="noindex">' : ''}${canonical ? `\n<link rel="canonical" href="${canonical}">` : ''}
<meta property="og:title" content="${fullTitle}"><meta property="og:description" content="${d}">
<meta property="og:image" content="${OG.url}"><meta property="og:image:width" content="${OG.w}"><meta property="og:image:height" content="${OG.h}">${canonical ? `<meta property="og:url" content="${canonical}">` : ''}
<meta property="og:site_name" content="${CFG.siteName}"><meta property="og:type" content="website">
<meta name="theme-color" content="#f3a8b5">${key === 'index' ? `\n<script type="application/ld+json">${LD}</script>` : ''}
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
${preload(key)}<style>${FONT_CSS}</style>
<link rel="stylesheet" href="/style.css">
<script>window.__SITE__=${SITE_FLAGS};document.documentElement.classList.add('js')</script>
</head><body>
<a class="skip" href="#main">Weiter zum Hauptinhalt</a>
<header class="hdr">
  <a class="logo" href="${U.index}">${pic('logo', { alt: 'Sen Nails Pankow logo', sizes: '147px', eager: true })}</a>
  <nav class="nav" id="nav" aria-label="Hauptmenü">${links}<a class="btn pill" href="${U.services}">Termin buchen ${ARROW_CIRCLE}</a></nav>
  <button class="burger" id="burger" aria-label="Menü" aria-expanded="false" aria-controls="panel"><span></span><span></span></button>
</header>
<div class="panel" id="panel" hidden><nav aria-label="Mobiles Menü">${links}<a href="${U.services}" class="pbtn">Termin buchen</a></nav></div>
<main id="main">
${body}
</main>
<footer class="ftr">
  <div class="fcols">
    <div class="flogo">${pic('logo', { alt: 'Sen Nails Pankow Logo', sizes: '(max-width:1000px) 100vw, 31vw' })}</div>
    <nav class="fnav" aria-label="Footer"><a href="${U.services}">Services</a><a href="${U.about}">Über uns</a><a href="${U.index}#kontakt" class="olive">Kontakt</a></nav>
    <div class="fright">
      <nav class="small" aria-label="Rechtliches"><a href="${U.imprint}">Impressum</a><a href="${U.privacy}">Datenschutz</a><a href="${U.cookies}">Cookies</a></nav>
      <div class="small social"><p><b>Folge uns</b></p><a href="https://www.instagram.com/sennails.pankow" target="_blank" rel="noopener">Instagram</a><a href="https://www.facebook.com/sennails.pankow" target="_blank" rel="noopener">Facebook</a></div>
      <p class="credit">Feat. ViPhát</p>
    </div>
  </div>
</footer>${CFG.consentBanner ? '\n' + BANNER : ''}
<script src="/main.js" defer></script>
<script src="/tracking.js" defer></script>
</body></html>
`;
};

// ---------------------------------------------------------------- pages
const home = () => {
  const items = SERVICES.map(([n], i) =>
    `<li><a href="${U.services}#s${i + 1}">${e(n)}</a><span class="no">(${String(i + 1).padStart(2, '0')})</span></li>`).join('');
  return `
<section class="hero">
  ${pic('hero', { alt: 'Sen Nails Pankow – Nageldesign &amp; Wimpernverlängerung – Nagelstudio Berlin', cls: 'banner', sizes: '100vw', eager: true, lq: true })}
  <div class="hero-row">
    <h1 class="script">Sen Nails<br>Pankow</h1>
    <div class="hero-t">
      <h2>Schönheit und Entspannung in Perfektion – mit professioneller Maniküre &amp; Pediküre, haltbarem Shellac, kreativer Nagelmodellage, stilvoller Wimpernverlängerung und individuellem Naildesign.</h2>
      <a class="btn" href="${U.services}">Termin buchen ${ARROW}</a>
    </div>
  </div>
</section>
<section class="svc">
  ${pic('massage', { alt: 'Hand Massage - Sen Nails Pankow – Nageldesign &amp; Wimpernverlängerung – Nagelstudio Berlin', sizes: '(max-width:1000px) 100vw, 51vw', lq: true })}
  <div class="svc-t">
    <div class="svc-head"><h3 class="eyebrow">Unsere Services</h3><a class="all" href="${U.services}">Alle Services ${ARROW}</a></div>
    <ul class="list">${items}</ul>
  </div>
</section>
<section class="map"><iframe title="Google Maps und Bewertungen für Sen Nails Pankow – Nageldesign &amp; Wimpernverlängerung" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d606.0106877974425!2d13.400843428603412!3d52.586920298247634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a8525f57e6aaab%3A0xf02d3c2306714b6e!2sSen%20Nails%20Pankow!5e0!3m2!1sen!2s!4v1750933519234!5m2!1sen!2s" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe></section>
<section class="review">
  <div class="gwrap">${pic('review', { alt: 'Google Review', sizes: '174px' })}<svg class="stars" viewBox="0 0 225 91" role="img" aria-label="5-star">${[2, 47, 92, 137, 182].map((x) => `<path transform="translate(${x} 14)" fill="#f5b829" d="M18 1l4.9 10.6 11.6 1.3-8.6 7.9 2.4 11.4L18 26.2 7.7 32.2l2.4-11.4L1.5 12.9l11.6-1.3z"/>`).join('')}</svg></div>
  <div class="rtext">
    <p><b>Ihre Meinung ist uns Gold wert.</b></p>
    <p>Hinterlassen Sie uns in nur einer Minute eine Google-Bewertung.</p>
    <p><b>Wir sagen DANKE für Ihre Unterstützung!</b></p>
    <a class="btn gold" href="https://www.sen-nails-pankow.de/review" target="_blank" rel="noopener">Click &amp; Review</a>
  </div>
</section>
<section class="contact" id="kontakt">
  <p class="clabel">Kontakt</p>
  <div class="cinfo">
    <h4>Telefon</h4><a href="tel:+493081302109">030 81302109</a>
    <h4>Adresse</h4><p>Dietzgenstraße 67<br>13156 Berlin, Germany</p>
    <h4>Öffnungszeiten</h4><p>Mo – Fr: 09:30 – 19:00 Uhr<br>Sa:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;09:30 – 16:00 Uhr</p>
  </div>
</section>`;
};

const services = () => {
  const out = ['<section class="svcpage"><h1 class="ptitle">Terminbuchung</h1>'];
  SERVICES.forEach(([cat, rows], i) => {
    out.push(`<h2 class="cat" id="s${i + 1}">${e(cat)}</h2><ul class="rows">`);
    for (const [n, p] of rows)
      out.push(`<li><a class="n" href="${U.contact}">${e(n)}</a><span class="p">Ab ${p}</span><a class="btn dark" href="${U.contact}">Jetzt buchen</a></li>`);
    out.push('</ul>');
  });
  out.push('</section>');
  return out.join('\n');
};

const about = () => `
<section class="about2">
  <div class="atext">
    <span class="alabel">Über Sen Nails Pankow</span>
    <h1 class="ah">Der feine Unterschied,<br>den du gesucht hast</h1>
    <p>Entspannung &amp; Schönheit bei Sen Nails Pankow – Nageldesign – Wimpernverlängerung – Shellac – Maniküre &amp; Pediküre – Nagelmodellage!</p>
    <p>Im stilvollen und modernen Ambiente ist Sen Nails in Berlin-Pankow der perfekte Ort, um dem Alltagsstress zu entfliehen und sich von Kopf bis Fuß verwöhnen zu lassen. Wir bieten hochwertige Behandlungen wie professionelle Maniküre &amp; Pediküre, haltbaren Shellac, kreative Nagelmodellage und luxuriöse Wimpernverlängerung – individuell auf deine Wünsche abgestimmt.</p>
    <p>Jede Behandlung bei uns verbindet Präzision mit Wohlgefühl – für schöne Nägel, traumhafte Wimpern und ein rundum gepflegtes Aussehen.</p>
    <p>Buche jetzt deinen Termin und erlebe die perfekte Auszeit bei Sen Nails Pankow!</p>
    <p class="greet">Liebe Grüße,</p>
    <p class="sign">Sen Nails Pankow Team</p>
  </div>
  <div class="aimg">${pic('about', { alt: 'Permanent Eyebrows Makeup', sizes: '(max-width:1000px) 520px, 34vw', lq: true })}</div>
  <a class="btn acta" href="${U.services}">Termin buchen</a>
</section>`;

const contactForm = () => `
<section class="cpage"><h1 class="ctitle">Kundenbetreuung</h1>
<form class="form" id="cform" novalidate>
  <label>Vorname<input name="vorname" placeholder="Vorname" autocomplete="given-name"></label>
  <label>Name<input name="name" placeholder="Name" autocomplete="family-name"></label>
  <label>Email *<input name="email" type="email" placeholder="Email" required autocomplete="email" aria-describedby="err-email"><span class="err" id="err-email" role="alert"></span></label>
  <label>Phone<span class="phone"><select name="dial" aria-label="Ländervorwahl"><option>🇩🇪 +49</option><option>🇻🇳 +84</option><option>🇦🇹 +43</option><option>🇨🇭 +41</option><option>🇺🇸 +1</option></select><input name="phone" type="tel" placeholder="Phone" autocomplete="tel-national" aria-describedby="err-phone"></span><span class="err" id="err-phone" role="alert"></span></label>
  <label class="full">Rückmeldung *<textarea name="msg" placeholder="Rückmeldung" required aria-describedby="err-msg"></textarea><span class="err" id="err-msg" role="alert"></span></label>
  <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <button class="send" type="submit">Senden</button>
  <p class="ok full" id="ok" role="status" hidden>Danke für die Einreichung!</p>
  <p class="bad full" id="bad" role="alert" hidden>Das hat leider nicht geklappt. Bitte versuche es später noch einmal.</p>
</form></section>`;

const legal = (title, blocks, stack = false) => {
  const out = [`<section class="legal${stack ? ' stack' : ''}"><h1 class="ctitle">${e(title)}</h1><div class="ltext">`];
  let ul = false;
  for (const [kind, text] of blocks) {
    const t = e(text).replace(/\n/g, '<br>');
    if (kind === 'li' && !ul) { out.push('<ul>'); ul = true; }
    if (kind !== 'li' && ul) { out.push('</ul>'); ul = false; }
    out.push({ h: `<h2>${t}</h2>`, p: `<p>${t}</p>`, li: `<li>${t}</li>`, c: `<p class="cat-note">${t}</p>` }[kind]);
  }
  if (ul) out.push('</ul>');
  out.push('</div></section>');
  return out.join('\n');
};

const notFound = () => `
<section class="nf">
  <p class="nf-l">Fehler: Seite nicht gefunden</p>
  <h1 class="nf-h">404</h1>
  <p class="nf-p">Die gesuchte Seite wurde leider nicht gefunden.</p>
  <a class="btn" href="${U.index}">Zur Startseite ${ARROW}</a>
</section>`;

// ---------------------------------------------------------------- write pages
const BODIES = {
  index: [home(), ''], services: [services(), 'Services'], about: [about(), 'Über uns'], contact: [contactForm(), ''],
  imprint: [legal('Impressum', LEGAL.impressum), ''], privacy: [legal('Datenschutz', LEGAL.datenschutz), ''],
  cookies: [legal('Cookie-Richtlinie', LEGAL.cookies, true), ''],
};
for (const [key, p] of Object.entries(PAGES)) {
  write(p.file, page({ key, title: p.title, desc: p.desc, canonical: abs(p.url), body: BODIES[key][0], active: BODIES[key][1] }));
}
write('404.html', page({ title: '404 – Seite nicht gefunden', desc: 'Die gesuchte Seite wurde nicht gefunden.', noindex: true, body: notFound() }));

// ---------------------------------------------------------------- SEO + hosting files
const urls = Object.values(PAGES).map((p) => `  <url><loc>${abs(p.url)}</loc><lastmod>${CFG.lastmod}</lastmod></url>`).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);

const slugs = Object.values(PAGES).filter((p) => p.url !== '/').map((p) => p.url.slice(1));
write('_redirects', [
  '# Netlify / Cloudflare Pages: legacy URLs -> clean URLs (301)',
  '/index.html / 301',
  ...slugs.map((s) => `/${s}.html /${s} 301`),
  '/mysite / 301',
  ...slugs.map((s) => `/mysite/${s} /${s} 301`),
  '',
].join('\n'));
write('vercel.json', JSON.stringify({
  cleanUrls: true, trailingSlash: false,
  redirects: [
    { source: '/index.html', destination: '/', permanent: true },
    { source: '/mysite', destination: '/', permanent: true },
    { source: '/mysite/:path*', destination: '/:path*', permanent: true },
  ],
  headers: [
    { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
  ],
}, null, 2) + '\n');
write('.htaccess', `# Apache: clean URLs, 404 page, caching\nRewriteEngine On\nErrorDocument 404 /404.html\n\n# /page.html -> /page (301)\nRewriteCond %{THE_REQUEST} \\s/+(.+?)\\.html[\\s?] [NC]\nRewriteRule ^ /%1 [R=301,L,NE]\nRewriteRule ^index$ / [R=301,L]\n\n# legacy Wix paths\nRewriteRule ^mysite/?$ / [R=301,L]\nRewriteRule ^mysite/(.+)$ /$1 [R=301,L]\n\n# /page -> page.html\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteCond %{DOCUMENT_ROOT}/$1.html -f\nRewriteRule ^(.+?)/?$ $1.html [L]\n\n<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType image/avif "access plus 1 year"\n  ExpiresByType image/webp "access plus 1 year"\n  ExpiresByType image/jpeg "access plus 1 year"\n  ExpiresByType image/png "access plus 1 year"\n  ExpiresByType text/css "access plus 1 week"\n  ExpiresByType text/javascript "access plus 1 week"\n</IfModule>\n`);
write('nginx.conf.example', `# nginx server block example (adjust root and TLS)\nserver {\n  listen 80;\n  server_name sen-nails-pankow.de www.sen-nails-pankow.de;\n  root /var/www/sen-nails-pankow;\n  index index.html;\n  error_page 404 /404.html;\n\n  rewrite ^/index\\.html$ / permanent;\n  rewrite ^/(.+)\\.html$ /$1 permanent;\n  rewrite ^/mysite/?$ / permanent;\n  rewrite ^/mysite/(.+)$ /$1 permanent;\n\n  location / { try_files $uri $uri.html $uri/ =404; }\n  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }\n  gzip on; gzip_types text/css text/javascript application/json image/svg+xml;\n}\n`);

console.log('built', Object.keys(PAGES).length + 1, 'pages + sitemap/robots/redirect configs');

/* Browser-side page snapshot for the original-vs-clone audit.
   Served by serve.mjs when started with AUDIT=1 (GET /__audit/snapshot.js).  Usage in a page:
     (0, eval)(await (await fetch('http://localhost:4173/__audit/snapshot.js')).text());
     await window.__capture('orig' | 'clone', 'home', 'desktop', 1440)
   It scrolls the page once (so lazy content exists), measures every visible text/image/link/control/section,
   POSTs the JSON to http://localhost:4173/__save?name=<side>-<page>-<vp> and returns a short summary. */
(() => {
  const SAVE = 'http://localhost:4173/__save';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => String(s || '').replace(/[​‌‍﻿]/g, '').replace(/\s+/g, ' ').trim();
  const rnd = (n) => Math.round(n * 10) / 10;
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META', 'HEAD', 'TITLE', 'SOURCE', 'PATH', 'CIRCLE', 'G', 'DEFS', 'USE']);
  const BOX = new Set(['SECTION', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'FORM', 'UL', 'IFRAME']);
  const firstFamily = (ff) => String(ff || '').split(',')[0].replace(/["']/g, '').trim();
  const hrefKey = (raw) => {
    if (!raw) return '';
    try {
      const u = new URL(raw, location.href);
      if (u.origin === 'https://vp-bay.wixstudio.com' && u.pathname.startsWith('/mysite')) return (u.pathname.slice(7) || '/') + u.hash;
      if (u.origin === location.origin) return u.pathname + u.hash;
      return u.origin + u.pathname + u.hash;
    } catch (e) { return String(raw).slice(0, 120); }
  };
  const srcKey = (raw) => {
    if (!raw) return '';
    if (raw.startsWith('data:')) return 'data:';
    const m = raw.match(/\/media\/([a-z0-9]+_[a-f0-9]{32})/i);
    if (/wixstatic\.com/.test(raw) && m) return 'wix:' + m[1];
    try { return new URL(raw, location.href).pathname; } catch (e) { return raw.slice(0, 100); }
  };
  const style = (cs) => {
    const o = {
      ff: firstFamily(cs.fontFamily), fs: parseFloat(cs.fontSize), fw: cs.fontWeight, c: cs.color,
      ls: cs.letterSpacing === 'normal' ? 0 : rnd(parseFloat(cs.letterSpacing)), lh: cs.lineHeight === 'normal' ? null : rnd(parseFloat(cs.lineHeight)),
      ta: cs.textAlign, bg: cs.backgroundColor,
    };
    if (cs.fontStyle !== 'normal') o.fst = cs.fontStyle;
    if (cs.textTransform !== 'none') o.tt = cs.textTransform;
    if (cs.textDecorationLine !== 'none') o.td = cs.textDecorationLine;
    if (cs.borderRadius && cs.borderRadius !== '0px') o.br = cs.borderRadius;
    const bw = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
    if (bw > 0 && cs.borderTopStyle !== 'none') o.bd = `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`;
    else if (parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== 'none') o.bb = `${cs.borderBottomWidth} ${cs.borderBottomColor}`;
    if (cs.boxShadow !== 'none') o.sh = cs.boxShadow.slice(0, 80);
    if (cs.position === 'fixed' || cs.position === 'sticky') o.pos = cs.position;
    return o;
  };

  const readHead = () => {
    const meta = {};
    document.querySelectorAll('meta[name],meta[property]').forEach((m) => { meta[m.getAttribute('name') || m.getAttribute('property')] = (m.content || '').slice(0, 400); });
    const links = [...document.querySelectorAll('link[rel]')].filter((l) => /canonical|icon|manifest|alternate|preload|preconnect|stylesheet/.test(l.rel))
      .map((l) => `${l.rel}|${(l.getAttribute('href') || '').slice(0, 110)}${l.as ? '|as=' + l.as : ''}`);
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent.slice(0, 1500));
    const hosts = {};
    performance.getEntriesByType('resource').forEach((r) => {
      let h = '';
      try { h = new URL(r.name).host; } catch (e) { return; }
      const t = r.initiatorType || 'other';
      const k = `${h}|${t}`;
      hosts[k] = hosts[k] || { n: 0, bytes: 0 };
      hosts[k].n++;
      hosts[k].bytes += r.transferSize || 0;
    });
    return {
      title: document.title, lang: document.documentElement.lang, meta, links, ld,
      resources: hosts,
      globals: { gtag: typeof window.gtag, fbq: typeof window.fbq, dataLayer: (window.dataLayer || []).length },
      cookies: document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter(Boolean),
      storage: (() => { try { return Object.keys(localStorage); } catch (e) { return []; } })(),
    };
  };

  window.__capture = async (side, page, vpLabel, expectW, opts = {}) => {
    const name = `${side}-${page}-${vpLabel}`;
    try {
      document.documentElement.style.scrollBehavior = 'auto';
      if (document.readyState !== 'complete') await new Promise((r) => addEventListener('load', r, { once: true }));
      await Promise.race([document.fonts.ready, sleep(4000)]);
      await sleep(side === 'orig' ? 2500 : 600);
      // scroll once top->bottom so lazy / scroll-revealed content exists, then back to the top
      const step = Math.max(240, Math.round(innerHeight * 0.6));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
        await sleep(side === 'orig' ? 220 : 120);
      }
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      await sleep(400);
      window.scrollTo({ top: 0, behavior: 'instant' });
      await sleep(700);
      const imgs = [...document.images];
      await Promise.race([Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))), sleep(5000)]);

      const sx = window.scrollX;
      const sy = window.scrollY;
      const els = [];
      const all = document.body.querySelectorAll('*');
      for (const e of all) {
        if (SKIP.has(e.tagName.toUpperCase())) continue;
        if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.01) continue;
        const r = e.getBoundingClientRect();
        if (r.width < 0.5 || r.height < 0.5) continue;
        if (r.right < 0 || r.left > document.documentElement.scrollWidth + 40) continue;
        const rect = [rnd(r.left + sx), rnd(r.top + sy), rnd(r.width), rnd(r.height)];
        const tag = e.tagName.toLowerCase();
        const base = { tag, id: (e.id || '').slice(0, 28), cls: String(e.getAttribute('class') || '').split(/\s+/)[0].slice(0, 28), rect };
        const own = norm([...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
        if (tag === 'img') {
          els.push({ ...base, t: 'img', alt: e.alt, src: srcKey(e.currentSrc || e.src), nw: e.naturalWidth, nh: e.naturalHeight, of: cs.objectFit, op: cs.objectPosition, ld: e.loading || '' });
          continue;
        }
        if (tag === 'a') els.push({ ...base, t: 'a', text: norm(e.innerText), href: hrefKey(e.getAttribute('href')), target: e.target || '', st: style(cs) });
        else if (['button', 'input', 'textarea', 'select'].includes(tag)) els.push({ ...base, t: 'ctl', text: norm(e.innerText || ''), type: e.type || '', name: e.name || '', ph: e.placeholder || '', aria: e.getAttribute('aria-label') || '', req: !!e.required, st: style(cs) });
        else if (tag === 'iframe') els.push({ ...base, t: 'iframe', src: (e.src || '').slice(0, 200), title: e.title || '' });
        else if (tag === 'svg') els.push({ ...base, t: 'svg', label: e.getAttribute('aria-label') || '' });
        else if (BOX.has(tag.toUpperCase())) els.push({ ...base, t: 'box', st: { bg: cs.backgroundColor, pos: cs.position, disp: cs.display } });
        if (own) els.push({ ...base, t: 'text', text: own, st: style(cs) });
      }

      const data = {
        name, side, page, vp: vpLabel, expectW,
        env: { iw: innerWidth, ih: innerHeight, cw: document.documentElement.clientWidth, dpr: devicePixelRatio, ua: navigator.userAgent.slice(0, 90), url: location.href },
        total: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth,
        bodyBg: getComputedStyle(document.body).backgroundColor, htmlBg: getComputedStyle(document.documentElement).backgroundColor,
        head: readHead(), els,
      };
      window.__lastSnap = data;
      if (opts.returnData) return { name, ok: !(expectW && Math.abs(innerWidth - expectW) > 1), data }; // headless runner (tools/capture.mjs) saves it itself
      const body = JSON.stringify(data);
      let posted = 'failed';
      const wrongW = !!(expectW && Math.abs(innerWidth - expectW) > 1);
      const summary = () => ({ name, ok: posted !== 'failed' && !wrongW, posted, innerWidth, expectW, wrongViewport: wrongW, els: els.length, bytes: body.length, total: data.total, sw: data.sw });
      if (wrongW) return summary(); // viewport emulation was reset: caller must resize and retry, nothing is saved
      if (location.origin === 'http://localhost:4173') {
        // same origin as the audit server: plain POST
        const res = await fetch(`${SAVE}?name=${encodeURIComponent(name)}`, { method: 'POST', body });
        posted = res.ok || res.status === 204 ? 'post' : 'failed';
      } else {
        // other origin (the original site): https pages cannot call http://localhost, so hand the data over
        // through the URL hash of the receiver page (gzip + base64url); it POSTs it to the server.
        const cs = new CompressionStream('gzip');
        const w = cs.writable.getWriter();
        w.write(new TextEncoder().encode(body));
        w.close();
        const u8 = new Uint8Array(await new Response(cs.readable).arrayBuffer());
        let bin = '';
        for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
        const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        posted = 'hash';
        const s = summary();
        s.gzBytes = b64.length;
        setTimeout(() => { location.href = `http://localhost:4173/__audit/recv#${encodeURIComponent(name)}~${b64}`; }, 50);
        return s;
      }
      return summary();
    } catch (err) {
      return { name, ok: false, error: String(err && err.message || err) };
    }
  };
  return 'snapshot ready';
})();

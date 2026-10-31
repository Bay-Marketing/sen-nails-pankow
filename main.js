/* Sen Nails Pankow – menu, scroll reveal, contact form validation */
(() => {
  const S = window.__SITE__ || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---- menu (full-screen panel) ----
  const burger = $('#burger');
  const panel = $('#panel');
  if (burger && panel) {
    const toggle = (open) => {
      panel.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('noscroll', open);
    };
    burger.addEventListener('click', () => toggle(panel.hidden));
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !panel.hidden) { toggle(false); burger.focus(); } });
    panel.addEventListener('click', (ev) => { if (ev.target.closest('a')) toggle(false); });
  }

  // ---- scroll reveal (subtle fade-up; off for reduced motion or when disabled in site.config.json) ----
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (S.reveal && !reduced) {
    const targets = ['.hero-row > *', '.svc-t', '.list li', '.review > *', '.contact', '.atext', '.aimg', '.acta',
      '.svcpage .cat', '.svcpage .rows', '.form', '.ctitle', '.ltext', '.nf > *'];
    // Scroll-position based (not IntersectionObserver): works the same in every browser/tab state.
    let pending = [];
    const check = () => {
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < innerHeight * 0.92) { el.classList.add('rv-in'); return false; }
        return true;
      });
      if (!pending.length) { removeEventListener('scroll', tick); removeEventListener('resize', tick); }
    };
    let queued = false;
    const tick = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; check(); }, 60); };
    const items = $$(targets.join(','));
    const lis = $$('.list li');
    items.forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) return; // already on screen: no flash
      el.classList.add('rv');
      if (el.matches('.list li')) el.style.transitionDelay = `${Math.min(lis.indexOf(el), 5) * 70}ms`;
      pending.push(el);
    });
    if (pending.length) {
      addEventListener('scroll', tick, { passive: true });
      addEventListener('resize', tick);
      setTimeout(check, 3000); // safety net: never leave something hidden
    }
  }

  // ---- contact form ----
  const form = $('#cform');
  if (!form) return;
  const MSG = {
    required: 'Dieses Feld ist erforderlich.',
    email: 'Gib eine gültige E-Mail-Adresse ein.',
    phone: 'Gib eine gültige Telefonnummer ein.',
  };
  const rules = {
    email: (v) => (!v.trim() ? MSG.required : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : MSG.email),
    msg: (v) => (v.trim() ? '' : MSG.required),
    phone: (v) => (!v.trim() || /^[0-9 ()\-/]{5,}$/.test(v.trim()) ? '' : MSG.phone),
  };
  const fieldOf = (name) => form.elements[name];
  const show = (name, text) => {
    const f = fieldOf(name);
    const err = $('#err-' + name);
    if (!f || !err) return;
    err.textContent = text;
    f.setAttribute('aria-invalid', text ? 'true' : 'false');
    (f.closest('.phone') || f).classList.toggle('invalid', !!text);
  };
  const check = (name) => { const msg = rules[name](fieldOf(name).value); show(name, msg); return !msg; };

  for (const name of Object.keys(rules)) {
    const f = fieldOf(name);
    f.addEventListener('blur', () => check(name));
    f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(name); });
  }

  const ok = $('#ok');
  const bad = $('#bad');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    ok.hidden = bad.hidden = true;
    const results = Object.keys(rules).map((n) => [n, check(n)]);
    const first = results.find(([, valid]) => !valid);
    if (first) { fieldOf(first[0]).focus(); return; }
    if (fieldOf('website').value) return; // honeypot: silently drop bots

    const btn = form.querySelector('.send');
    btn.disabled = true;
    const payload = {
      vorname: fieldOf('vorname').value.trim(), name: fieldOf('name').value.trim(),
      email: fieldOf('email').value.trim(), phone: `${fieldOf('dial').value.replace(/^\S+\s/, '')} ${fieldOf('phone').value.trim()}`.trim(),
      message: fieldOf('msg').value.trim(), page: location.pathname,
    };
    try {
      if (S.endpoint) {
        const res = await fetch(S.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      } else {
        console.info('[form] no endpoint configured (site.config.json → formEndpoint); payload not sent:', payload);
      }
      ok.hidden = false;
      form.reset();
      $$('.invalid', form).forEach((el) => el.classList.remove('invalid'));
      if (window.fbq && S.pixel) fbq('track', 'Contact');
    } catch (err) {
      bad.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
})();

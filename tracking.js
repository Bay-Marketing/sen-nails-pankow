/* Sen Nails Pankow – Google tag (Ads) + Meta Pixel, same IDs the original Wix site loads.
   Original behaviour: consent defaults to "granted" and no banner is shown.
   Set "consentBanner": true in site.config.json to load the tags only after the visitor accepts. */
(() => {
  const S = window.__SITE__ || {};
  if (!S.ads && !S.pixel) return;
  const KEY = 'sn_consent';
  const stored = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const store = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } };
  let loaded = false;

  const load = () => {
    if (loaded) return;
    loaded = true;
    const add = (src) => { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };

    if (S.ads) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted', functionality_storage: 'granted', personalization_storage: 'granted', security_storage: 'granted' });
      gtag('js', new Date());
      gtag('config', S.ads, { send_page_view: false });
      gtag('event', 'page_view', { page_path: location.pathname, page_title: document.title });
      add('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(S.ads));
    }
    if (S.pixel) {
      /* eslint-disable */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      fbq('init', S.pixel);
      fbq('track', 'PageView');
    }
  };

  // Same as the original (no banner, tags run), but started after the page has loaded and the browser is idle,
  // so the tag scripts never compete with first paint / first input.
  const later = (fn) => {
    const go = () => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1500));
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  };
  if (!S.banner) { later(load); return; }

  const choice = stored();
  if (choice === 'yes') { later(load); return; }
  if (choice === 'no') return;
  const box = document.getElementById('consent');
  if (!box) return;
  box.hidden = false;
  box.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-consent]');
    if (!b) return;
    const yes = b.dataset.consent === 'yes';
    store(yes ? 'yes' : 'no');
    box.hidden = true;
    if (yes) load();
  });
})();

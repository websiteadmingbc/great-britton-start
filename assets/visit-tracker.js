/* City-level visit logger for start.greatbrittongc.com (no IP storage). */
(function () {
  var cfg = window.GBC_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey) return;
  if (sessionStorage.getItem('gbc_start_visit_logged')) return;
  if (localStorage.getItem('gbc_start_tracker_optout') === '1') return;

  // Internal traffic — checked in-memory only; never written to Supabase
  var BLOCKED_IPS = {
    '107.208.12.223': 1,
    '2600:1700:1150:6b90:9d39:f73d:ab04:d60d': 1
  };

  var GEO_URL = 'https://get.geojs.io/v1/ip/geo.json';

  function normalizeIp(ip) {
    return String(ip || '').trim().toLowerCase();
  }

  function isBlockedIp(ip) {
    return !!BLOCKED_IPS[normalizeIp(ip)];
  }

  function markOptOut() {
    try { localStorage.setItem('gbc_start_tracker_optout', '1'); } catch (e) {}
    try { sessionStorage.setItem('gbc_start_visit_logged', '1'); } catch (e) {}
  }

  // Permanent opt-out helper: /?tracker_optout=1
  try {
    if (/(?:^|[?&])tracker_optout=1(?:&|$)/.test(location.search)) {
      markOptOut();
      return;
    }
  } catch (e) {}

  function insertVisit(row) {
    return fetch(cfg.url + '/rest/v1/start_visits', {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: 'Bearer ' + cfg.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row),
      keepalive: true
    });
  }

  function logVisit() {
    var path = (location.pathname || '/') + (location.search || '');
    var referrer = document.referrer || null;
    var base = { path: path.slice(0, 500), referrer: referrer ? referrer.slice(0, 500) : null };

    fetch(GEO_URL, { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (geo) {
        if (geo && isBlockedIp(geo.ip)) {
          markOptOut();
          return null;
        }
        // Intentionally drop IP — only city/region/country are stored
        return insertVisit({
          city: (geo && geo.city) || null,
          region: (geo && (geo.region || geo.region_code)) || null,
          country: (geo && (geo.country || geo.country_code)) || null,
          path: base.path,
          referrer: base.referrer
        });
      })
      .catch(function () {
        // If geo lookup fails we cannot check the blocklist; skip logging
        // rather than risk counting blocked traffic.
        return null;
      })
      .then(function (res) {
        if (res && res.ok) sessionStorage.setItem('gbc_start_visit_logged', '1');
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logVisit);
  } else {
    logVisit();
  }
})();

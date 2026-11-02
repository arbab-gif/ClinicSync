/* ClinicSync prototype — the clinic being viewed/edited, kept in the browser so edits show up across pages.
   Not real persistence: clearing site data resets it. */
(() => {
  const KEY = 'cs-clinic-saturday';
  const DEFAULTS = {
    name: 'Saturday',
    description: 'Drills and match play for intermediate players. We play on Courts 2 & 3 — enter by the north gate and park in Lot B. Bring water and a spare racket.',
    sport: 'Tennis',
    location: 'Riverside Tennis Center',
    startDate: '2026-10-03',
    days: ['Sat'],
    startTime: '09:00',
    length: 90,
    sessions: 8,
    excluded: [],          // [{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }] — no sessions on these dates
    started: false,
  };
  const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_NAMES = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };

  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    const c = { ...DEFAULTS, ...saved };
    const p = new URLSearchParams(location.search);
    if (p.has('started')) c.started = p.get('started') !== '0';
    return c;
  }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }

  const parseDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtDay = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtLong = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = hhmm => { let [h, m] = hhmm.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
  const isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (iso, n) => { const d = parseDate(iso); d.setDate(d.getDate() + n); return isoOf(d); };
  const isExcluded = (c, iso) => (c.excluded || []).some(r => r.from <= iso && iso <= r.to);
  const fmtLength = min => min < 60 ? `${min} minutes` : (min % 60 ? `${Math.floor(min / 60)} hr ${min % 60} min` : `${min / 60} hour${min > 60 ? 's' : ''}`);

  // Session dates: the chosen weekdays from the start date on, skipping excluded dates, until `sessions` dates
  // are collected — so a skipped session moves to the next recurring day and the end date moves out.
  function sessionDates(c, opts = {}) {
    if (!c.startDate || !c.days.length) return [];
    const out = [], skipped = []; const d = parseDate(c.startDate);
    for (let i = 0; out.length < c.sessions && i < 800; i++) {
      if (c.days.includes(DAY_KEYS[d.getDay()])) (!opts.ignoreExcluded && isExcluded(c, isoOf(d)) ? skipped : out).push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return opts.skipped ? skipped : out;
  }
  // Recurring days that fall on an excluded date (the sessions that were skipped)
  const skippedDates = c => sessionDates(c, { skipped: true });
  function daysLabel(days) {
    const ordered = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter(k => days.includes(k));
    if (!ordered.length) return 'No day selected';
    if (ordered.length === 7) return 'Every day';
    if (ordered.length === 1) return `Every ${DAY_NAMES[ordered[0]]}`;
    return 'Every ' + ordered.join(', ').replace(/, ([^,]*)$/, ' & $1');
  }
  function scheduleLine(c) {
    const ds = sessionDates(c);
    if (!ds.length) return '';
    return `${fmtDay(ds[0])} – ${fmtDay(ds[ds.length - 1])} · ${daysLabel(c.days)} at ${fmtTime(c.startTime)}`;
  }

  window.ClinicData = { load, save, reset, DEFAULTS, DAY_KEYS, DAY_NAMES, sessionDates, skippedDates, isExcluded, isoOf, addDays, daysLabel, scheduleLine, fmtTime, fmtLength, fmtLong, parseDate };
})();

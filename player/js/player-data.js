/* ClinicSync — Player portal data: the signed-in player's clinics, sessions, people, activity and payments.
   State (RSVPs, replacement requests, spots joined, payments) is kept in localStorage (cs-player);
   PlayerData.reset() restores the defaults. Values match the Figma player screens. */

(() => {
  const KEY = 'cs-player';
  // Matches the Figma player screens: Monday Morning Tennis starts Mon, Oct 5 and the dashboard is seen the day before
  const TODAY = '2026-10-04';
  const IMG = '/organizer/assets/img/people/';

  const PLAYER = { name: 'Jessica Lee', first: 'Jessica', photo: IMG + 'blonde.png' };

  // Everyone the player shares a clinic with
  const PEOPLE = {
    'Jenny Wilson': { photo: IMG + 'red.png' },
    'Sarah Miller': { photo: IMG + 'side.png' },
    'Liam Johnson': { photo: IMG + 'curly.png' },
    'Olivia Chen': { photo: IMG + 'sophia.png' },
    'Robert Wilson': { photo: IMG + 'man1.png' },
    'Maria Lopez': { photo: IMG + 'dark.png' },
    'Marcus Reed': { photo: IMG + 'man2.png' },
    'Jessica Lee': { photo: IMG + 'blonde.png' },
  };

  const CLINICS = [
    { id: 'monday', description: 'A relaxed Monday-morning clinic for 3.5-level players: warm-up drills with Sarah, then doubles match play on courts 2 and 3. Bring water and arrive 10 minutes early.', name: 'Monday Morning Tennis', sport: 'Tennis', status: 'active', role: 'Player', share: 'Half Share',
      organizer: 'Jenny Wilson', coach: 'Sarah Miller', coachFee: 50, facilityFee: 125, location: 'Riverside Tennis Center', court: 'Courts 2 & 3',
      day: 'Mon', days: 'Mondays', start: '09:00', end: '10:30', startDate: '2026-10-05', sessions: 8, allowed: 4, capacity: 4,
      players: ['Jessica Lee', 'Liam Johnson', 'Olivia Chen', 'Robert Wilson'], subs: ['Maria Lopez'],
      // other people's sessions: who is in each one (you are added where you booked or joined)
      roster: { 1: ['Liam Johnson', 'Olivia Chen', 'Robert Wilson'], 2: ['Liam Johnson', 'Olivia Chen', 'Robert Wilson'], 3: ['Liam Johnson', 'Robert Wilson', 'Olivia Chen'], 4: ['Liam Johnson', 'Olivia Chen', 'Robert Wilson'], 5: ['Olivia Chen', 'Robert Wilson', 'Liam Johnson'], 6: ['Liam Johnson', 'Olivia Chen', 'Robert Wilson'], 7: ['Liam Johnson', 'Robert Wilson', 'Olivia Chen'], 8: ['Olivia Chen', 'Liam Johnson', 'Robert Wilson'] },
      // open replacement spots in sessions you're not booked for
      openSpots: { 2: { who: 'Robert Wilson', reason: 'Work trip' } },
      moved: { 6: { venue: 'Northside Courts, Court 1', reason: 'Riverside courts resurfacing' } },
      // facility fee is paid when you accept the invite: Stripe, Venmo, Zelle or cash
      paidFacility: { method: 'Stripe', on: 'Sep 28' }, coachHandle: { venmo: '@sarah-miller', zelle: 'sarah.miller@gmail.com' } },
    { id: 'thursday', description: 'Fast-paced evening doubles for 3.5–4.5 players. Substitutes fill in when a regular can’t make it.', name: 'Thursday Rally', sport: 'Tennis', status: 'active', role: 'Substitute', share: 'Substitute list',
      organizer: 'Jenny Wilson', coach: 'Sarah Miller', coachFee: 50, facilityFee: 0, location: 'Riverside Tennis Center', court: 'Courts 3 & 4', coachHandle: { venmo: '@sarah-miller', zelle: 'sarah.miller@gmail.com' },
      day: 'Thu', days: 'Thursdays', start: '18:00', end: '19:30', startDate: '2026-10-08', sessions: 8, allowed: 0, capacity: 4,
      players: ['Marcus Reed', 'Olivia Chen', 'Robert Wilson', 'Liam Johnson'], subs: ['Jessica Lee', 'Maria Lopez'],
      roster: {}, openSpots: { 2: { who: 'Marcus Reed', reason: 'Family event' } }, moved: {} },
    { id: 'spring', description: 'Six weeks of doubles strategy and point play under the lights, with drills led by Sarah.', name: 'Spring Doubles', sport: 'Tennis', status: 'completed', role: 'Player', share: 'Full Share',
      organizer: 'Jenny Wilson', coach: 'Sarah Miller', coachFee: 50, facilityFee: 180, location: 'Riverside Tennis Center',
      day: 'Wed', days: 'Wednesdays', start: '18:00', end: '19:30', startDate: '2026-04-08', sessions: 6, allowed: 6, capacity: 4,
      players: ['Jessica Lee', 'Liam Johnson', 'Olivia Chen', 'Robert Wilson'], subs: ['Maria Lopez'],
      // final state of each of your sessions
      past: { 1: 'attended', 2: 'attended', 3: 'replaced', 4: 'attended', 5: 'attended', 6: 'attended' }, replacedBy: { 3: 'Maria Lopez' }, paidFacility: { method: 'Venmo', on: 'Apr 2' }, },
    // a finished clinic where you were a substitute: you filled 2 spots
    { id: 'summer', description: 'Summer evening doubles. Substitutes stepped in when regulars were away.', name: 'Summer Rally', sport: 'Tennis', status: 'completed', role: 'Substitute', share: 'Substitute list',
      organizer: 'Jenny Wilson', coach: 'Sarah Miller', coachFee: 50, facilityFee: 0, location: 'Riverside Tennis Center', court: 'Courts 3 & 4',
      day: 'Thu', days: 'Thursdays', start: '18:00', end: '19:30', startDate: '2026-06-04', sessions: 6, allowed: 0, capacity: 4,
      players: ['Marcus Reed', 'Olivia Chen', 'Robert Wilson', 'Liam Johnson'], subs: ['Jessica Lee', 'Maria Lopez'],
      past: { 2: 'attended', 5: 'attended' }, filledFor: { 2: 'Liam Johnson', 5: 'Olivia Chen' }, coachPaidVia: { 2: 'Venmo', 5: 'Card' } },
  ];

  const DEFAULTS = {
    booked: { monday: [1, 3, 5, 7], spring: [1, 2, 3, 4, 5, 6], summer: [2, 5] },
    joined: {},        // "clinic:n" → true for replacement spots you took (beyond your share)
    rsvp: {},          // kept for older saved state; booked sessions are always 'going'
    today: null,       // "clinic:n" of a session happening today, before it starts (prototype: 'it's session day')
    played: {},        // "clinic:n" → true once you attended (prototype: 'play your next session')
    coachPaid: {},     // "clinic:n" → { method: 'Stripe' | 'Venmo' | 'Zelle' | 'Cash', status: 'paid' | 'reported' }
    requests: {},      // "clinic:n" → { reason, status: 'players' | 'subs' | 'filled', by }
    changes: {},       // "clinic:n" → organizer change: { type: 'moved' | 'rescheduled' | 'cancelled', ... }
    attended: 0,
    readActivity: [],
  };

  const ACTIVITY = [
    { id: 'invite', kind: 'invite', title: 'Clinic Invitation', body: 'Jenny Wilson invited you to Thursday Rally as a substitute.', when: '2 hours ago', link: 'View Invite', href: 'invite.html', unread: true },
    { id: 'replace', kind: 'replace', title: 'Replacement Needed', body: 'Robert Wilson needs coverage for the October 12 session.', when: '10 minutes ago', link: 'View Opportunity', href: 'clinic.html?id=monday&open=2', unread: true },
    { id: 'message', kind: 'message', title: 'New Clinic Message', body: 'Jenny Wilson: “Please arrive 10 minutes early on Monday.”', when: '1 hour ago', link: 'View Message', href: 'messages.html', unread: true },
    { id: 'reminder', kind: 'reminder', title: 'Session Reminder', body: 'Your October 5 session starts tomorrow at 9:00 AM.', when: 'Yesterday', link: 'View Session', href: 'clinic.html?id=monday&tab=sessions&open=1' },
    { id: 'coach', kind: 'coach', title: 'Coach Confirmed', body: 'Sarah Miller is confirmed as your clinic coach.', when: 'October 1', link: 'View Clinic', href: 'clinic.html?id=monday' },
  ];

  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); return { ...structuredClone(DEFAULTS), ...s, booked: { ...DEFAULTS.booked, ...(s.booked || {}) } }; }
    catch { return structuredClone(DEFAULTS); }
  }
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

  const parse = iso => new Date(iso + 'T12:00:00');
  const isoOf = d => d.toISOString().slice(0, 10);
  const addDays = (iso, n) => { const d = parse(iso); d.setDate(d.getDate() + n); return isoOf(d); };
  const fmtTime = hm => { const [h, m] = hm.split(':').map(Number); return `${(h % 12) || 12}:${String(m).padStart(2, '0')}`; };
  const ampm = hm => (Number(hm.split(':')[0]) < 12 ? 'AM' : 'PM');
  const timeRange = c => `${fmtTime(c.start)}–${fmtTime(c.end)} ${ampm(c.end)}`;
  const fmt = (iso, o) => parse(iso).toLocaleDateString('en-US', o);
  const key = s => `${s.clinic.id}:${s.n}`;

  // an organizer change can move a session to a new date and time
  function sessionsOf(c) { return Array.from({ length: c.sessions }, (_, i) => { const s = { clinic: c, n: i + 1, date: addDays(c.startDate, i * 7) }; const ch = state.changes?.[key(s)]; if (ch && ch.date) Object.assign(s, { date: ch.date, dayLabel: ch.dayLabel, at: ch.at, range: ch.range, was: ch.was }); return s; }); }
  const isBooked = s => (state.booked[s.clinic.id] || []).includes(s.n) || !!state.joined[key(s)];
  const rsvpOf = s => state.rsvp[key(s)] || 'pending';
  const requestOf = s => state.requests[key(s)] || null;

  // What a session looks like to the player
  function statusOf(s) {
    const c = s.clinic;
    if ((c.cancelled && c.cancelled[s.n]) || state.changes?.[key(s)]?.type === 'cancelled') return { kind: 'cancelled', label: 'Session cancelled', tone: 'red' };
    if (c.status === 'completed') {
      if (!isBooked(s)) return { kind: 'other', label: 'Not in your share', tone: 'gray' };
      const p = (c.past || {})[s.n] || 'attended';
      return { kind: p, label: p === 'attended' ? 'Attended' : p === 'replaced' ? `Replaced by ${c.replacedBy?.[s.n] || 'a substitute'}` : 'Missed', tone: p === 'attended' ? 'green' : 'gray' };
    }
    const r = requestOf(s);
    if (isBooked(s) && state.played[key(s)]) return { kind: 'attended', label: 'Attended', tone: 'green' };
    if (isBooked(s) && state.today === key(s) && !(r && r.status === 'filled')) return { kind: 'today', label: 'Today', tone: 'blue' };
    if (isBooked(s)) {
      if (r && r.status === 'filled') return { kind: 'replaced', label: `Replaced by ${r.by}`, tone: 'gray' };
      if (r) return { kind: 'requested', label: r.status === 'subs' ? 'Request sent to substitutes' : 'Replacement requested', tone: 'purple' };
      // you picked this session when you accepted the invite, so it's confirmed (no RSVP step)
      return { kind: 'going', label: 'Going', tone: 'green' };
    }
    if (c.openSpots && c.openSpots[s.n] && !(state.dismissed || {})[key(s)]) return { kind: 'open', label: 'Open spot', tone: 'blue' };
    return { kind: 'other', label: 'Not in your share', tone: 'gray' };
  }

  // Who is in a session (participants list); you appear when booked/joined, the open spot's player is out
  function participants(s) {
    const c = s.clinic; const base = [...(c.roster?.[s.n] || c.players.filter(p => p !== PLAYER.name).slice(0, c.role === 'Substitute' ? (c.capacity || 4) : (c.capacity || 4) - 1))];
    const out = base.map(name => ({ name, role: 'Player' }));
    const open = c.openSpots?.[s.n];
    if (open) { const i = out.findIndex(p => p.name === open.who); if (i >= 0) out[i].out = true; }
    // the spot you joined: the player you replaced is out of this session
    const took = state.joined[key(s)] || c.filledFor?.[s.n];
    if (typeof took === 'string') { const i = out.findIndex(p => p.name === took); if (i >= 0) out[i].out = true; else out.push({ name: took, role: 'Player', out: true }); }
    const myRole = c.role === 'Substitute' ? 'Substitute' : 'Player';
    if (isBooked(s)) {
      const r = requestOf(s);
      if (r && r.status === 'filled') out.push({ name: PLAYER.name, role: myRole, out: true, me: true }, { name: r.by, role: r.byRole || 'Player', replacement: true });
      else out.unshift({ name: PLAYER.name, role: myRole, me: true, replacement: !!state.joined[key(s)] && c.role !== 'Substitute', status: r ? 'Need Replacement' : null });
    }
    return out.filter(p => !p.out).concat(out.filter(p => p.out));
  }

  window.PlayerData = {
    TODAY, PLAYER, PEOPLE, CLINICS, ACTIVITY, IMG,
    get state() { return state; },
    timeRange, fmt, fmtTime, addDays,
    clinic: id => CLINICS.find(c => c.id === id),
    sessionsOf, rsvpOf, requestOf, statusOf, participants, isBooked,
    photo: name => (PEOPLE[name] || {}).photo,
    setRsvp(s, v) { state.rsvp[key(s)] = v; save(); },
    booked(c) { return sessionsOf(c).filter(isBooked); },
    upcoming() {
      return CLINICS.filter(c => c.status === 'active').flatMap(c => this.booked(c)).filter(s => s.date >= TODAY && !state.played[key(s)] && !(requestOf(s)?.status === 'filled')).sort((a, b) => a.date.localeCompare(b.date));
    },
    openSpots(c) { return sessionsOf(c).filter(s => statusOf(s).kind === 'open'); },
    requestReplacement(s, reason) { state.requests[key(s)] = { reason, status: 'players' }; state.rsvp[key(s)] = 'cant'; save(); },
    toSubs(s) { const r = state.requests[key(s)]; if (r) { r.status = 'subs'; save(); } },
    fillRequest(s, by, byRole) { const r = state.requests[key(s)]; if (r) { r.status = 'filled'; r.by = by; r.byRole = byRole; save(); } },
    cancelRequest(s) { delete state.requests[key(s)]; state.rsvp[key(s)] = 'going'; save(); },
    isPlayed: s => !!state.played[key(s)],
    attendedCount(filter = () => true) { return Object.keys(state.played).filter(k => { const c = CLINICS.find(x => x.id === k.split(':')[0]); return c && filter(c); }).length; },
    // Prototype: your next session happens (so its coach fee becomes due)
    nextToPlay(c) { return this.booked(c).find(x => !state.played[key(x)] && !(requestOf(x)?.status === 'filled')); },
    todayOf(c) { const s = state.today && this.booked(c).find(x => key(x) === state.today); return s || null; },
    // Prototype: your next session is today (it hasn't started yet)
    sessionDay(c) { const s = this.nextToPlay(c); if (s) { state.today = key(s); state.rsvp[key(s)] = state.rsvp[key(s)] || 'going'; save(); } return s; },
    // Prototype: today's session is over, so its coach fee becomes due
    playNext(c) { const s = this.todayOf(c) || this.nextToPlay(c); if (s) { state.played[key(s)] = true; state.rsvp[key(s)] = 'going'; if (state.today === key(s)) state.today = null; save(); } return s; },
    coachPaidOf(s) { return state.coachPaid[key(s)] || null; },
    // Stripe settles at once; Venmo, Zelle and cash are reported until the coach confirms
    payCoach(list, method) { for (const s of list) state.coachPaid[key(s)] = { method, status: method === 'Stripe' ? 'paid' : 'reported' }; save(); },
    // hide an open spot you don't want (you still hear about new ones)
    dismissSpot(s) { state.dismissed = { ...(state.dismissed || {}), [key(s)]: true }; save(); },
    changeOf: s => state.changes?.[key(s)] || null,
    // prototype: the organizer changes a session you're in
    changeSession(s, type) {
      const C = {
        moved: { type, venue: 'Northside Tennis Club', reason: 'Riverside courts are being resurfaced' },
        rescheduled: { type, date: addDays(s.date, 1), dayLabel: 'Fri', at: '7:00 PM', range: '7:00–8:30 PM', was: `${fmt(s.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${timeRange(s.clinic)}`, reason: 'Court booking clash' },
        cancelled: { type, reason: 'Courts closed for rain' },
      };
      const prev = state.changes?.[key(s)]; const next = type === 'cancelled' && prev?.date ? { ...C[type], date: prev.date, dayLabel: prev.dayLabel, at: prev.at, range: prev.range, was: prev.was } : C[type]; state.changes = { ...(state.changes || {}), [key(s)]: next }; applyChanges(); save(); return C[type];
    },
    ackChange(s) { const ch = state.changes?.[key(s)]; if (ch) { ch.ack = true; save(); } },
    clearChange(s) { if (state.changes) delete state.changes[key(s)]; applyChanges(); save(); },
    // a substitute who can't make the new time gives the spot back
    leaveSpot(s) { const took = state.joined[key(s)]; delete state.joined[key(s)]; delete state.rsvp[key(s)]; if (state.changes?.[key(s)]) state.changes[key(s)].ack = true; if (typeof took === 'string') s.clinic.openSpots = { ...(s.clinic.openSpots || {}), [s.n]: s.clinic.baseSpots?.[s.n] || { who: took } }; applyChanges(); save(); },
    // activity items for changes to sessions you're in
    changeActivity() { return Object.entries(state.changes || {}).map(([k, ch]) => { const [id, n] = k.split(':'); const c = CLINICS.find(x => x.id === id); if (!c) return null;
      const t = { moved: ['Session moved', `${c.name} · Session ${n} is now at ${ch.venue}.`], rescheduled: ['Session rescheduled', `${c.name} · Session ${n} moved to ${ch.dayLabel}, ${fmt(ch.date, { month: 'short', day: 'numeric' })} at ${ch.at}.`], cancelled: ['Session cancelled', `${c.name} · Session ${n} was cancelled: ${ch.reason}. You won’t be charged.`] }[ch.type];
      return { id: 'chg-' + k, kind: ch.type === 'cancelled' ? 'replace' : 'reminder', title: t[0], body: t[1], when: 'Just now', link: 'View Session', href: `clinic.html?id=${id}&open=${n}`, unread: !ch.ack }; }).filter(Boolean); },
    // prototype: a substitute schedule with one session in every state
    seedSubStates(c) {
      const S = n => sessionsOf(c)[n - 1];
      const who = { 2: 'Marcus Reed', 3: 'Liam Johnson', 4: 'Olivia Chen', 5: 'Robert Wilson', 6: 'Marcus Reed', 7: 'Liam Johnson' };
      for (const [n, w] of Object.entries(who)) { state.joined[`${c.id}:${n}`] = w; state.rsvp[`${c.id}:${n}`] = 'going'; if (c.openSpots) delete c.openSpots[n]; }
      state.played[`${c.id}:2`] = true; state.coachPaid[`${c.id}:2`] = { method: 'Venmo', status: 'paid' };
      state.today = `${c.id}:3`;
      const s4 = S(4);
      state.changes = { ...(state.changes || {}),
        [`${c.id}:4`]: { type: 'rescheduled', date: addDays(s4.date, 1), dayLabel: 'Fri', at: '7:00 PM', range: '7:00–8:30 PM', was: `${fmt(s4.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${timeRange(c)}`, reason: 'Court booking clash' },
        [`${c.id}:5`]: { type: 'moved', venue: 'Northside Tennis Club', reason: 'Riverside courts are being resurfaced' },
        [`${c.id}:6`]: { type: 'cancelled', reason: 'Courts closed for rain' } };
      applyChanges(); save();
    },
    joinSpot(s) { state.joined[key(s)] = s.clinic.openSpots?.[s.n]?.who || true; state.rsvp[key(s)] = 'going'; if (s.clinic.openSpots) delete s.clinic.openSpots[s.n]; save(); },
    unreadCount() { return [...this.changeActivity(), ...ACTIVITY].filter(a => a.unread && !state.readActivity.includes(a.id)).length; },
    markRead(id) { if (!state.readActivity.includes(id)) { state.readActivity.push(id); save(); } },
    reset() { state = structuredClone(DEFAULTS); save(); },
  };
  // "moved" changes show as a new venue for that session
  function applyChanges() { for (const c of CLINICS) { c.moved = { ...(c.baseMoved || (c.baseMoved = { ...(c.moved || {}) })) }; } for (const [k, ch] of Object.entries(state.changes || {})) { if (ch.type !== 'moved') continue; const [id, n] = k.split(':'); const c = CLINICS.find(x => x.id === id); if (c) c.moved[n] = { venue: ch.venue, reason: ch.reason }; } }
  applyChanges();
  for (const c of CLINICS) c.baseSpots = { ...(c.openSpots || {}) };
  // a spot you already joined is no longer open
  for (const c of CLINICS) for (const n of Object.keys(c.openSpots || {})) if (state.joined[`${c.id}:${n}`]) delete c.openSpots[n];
})();

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
      organizer: 'Jenny Wilson', coach: null, coachFee: 0, facilityFee: 0, location: 'Riverside Tennis Center', court: 'Courts 3 & 4',
      day: 'Thu', days: 'Thursdays', start: '18:00', end: '19:30', startDate: '2026-10-08', sessions: 8, allowed: 0, capacity: 4,
      players: ['Marcus Reed', 'Olivia Chen', 'Robert Wilson', 'Liam Johnson'], subs: ['Jessica Lee', 'Maria Lopez'],
      roster: {}, openSpots: { 2: { who: 'Marcus Reed', reason: 'Family event' } }, moved: {} },
    { id: 'spring', description: 'Six weeks of doubles strategy and point play under the lights, with drills led by Sarah.', name: 'Spring Doubles', sport: 'Tennis', status: 'completed', role: 'Player', share: 'Full Share',
      organizer: 'Jenny Wilson', coach: 'Sarah Miller', coachFee: 50, facilityFee: 180, location: 'Riverside Tennis Center',
      day: 'Wed', days: 'Wednesdays', start: '18:00', end: '19:30', startDate: '2026-04-08', sessions: 6, allowed: 6, capacity: 4,
      players: ['Jessica Lee', 'Liam Johnson', 'Olivia Chen', 'Robert Wilson'], subs: ['Maria Lopez'],
      // final state of each of your sessions
      past: { 1: 'attended', 2: 'attended', 3: 'replaced', 4: 'attended', 5: 'attended', 6: 'attended' }, replacedBy: { 3: 'Maria Lopez' }, paidFacility: { method: 'Venmo', on: 'Apr 2' } },
    { id: 'sunday', description: 'Social padel mornings with rotating partners. Rackets were available to borrow.', name: 'Sunday Padel Social', sport: 'Padel', status: 'cancelled', role: 'Player', share: 'Half Share',
      organizer: 'Jenny Wilson', coach: null, coachFee: 0, facilityFee: 120, location: 'Northside Padel Club',
      day: 'Sun', days: 'Sundays', start: '10:00', end: '11:00', startDate: '2026-08-02', sessions: 8, allowed: 4, capacity: 4,
      players: ['Jessica Lee', 'Olivia Chen', 'Marcus Reed', 'Liam Johnson'], subs: [],
      booked: [1, 3, 5, 7], past: { 1: 'attended', 3: 'attended' }, cancelledOn: 'Aug 20', reason: 'The club closed the padel courts for resurfacing.', refund: '$60 refunded for the 2 sessions not played', paidFacility: { method: 'Zelle', on: 'Jul 28' } },
  ];

  const DEFAULTS = {
    booked: { monday: [1, 3, 5, 7], spring: [1, 2, 3, 4, 5, 6], sunday: [1, 3, 5, 7] },
    joined: {},        // "clinic:n" → true for replacement spots you took (beyond your share)
    rsvp: {},          // kept for older saved state; booked sessions are always 'going'
    today: null,       // "clinic:n" of a session happening today, before it starts (prototype: 'it's session day')
    played: {},        // "clinic:n" → true once you attended (prototype: 'play your next session')
    coachPaid: {},     // "clinic:n" → { method: 'Stripe' | 'Venmo' | 'Zelle' | 'Cash', status: 'paid' | 'reported' }
    requests: {},      // "clinic:n" → { reason, status: 'players' | 'subs' | 'filled', by }
    attended: 0,
    readActivity: [],
  };

  const ACTIVITY = [
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

  function sessionsOf(c) { return Array.from({ length: c.sessions }, (_, i) => ({ clinic: c, n: i + 1, date: addDays(c.startDate, i * 7) })); }
  const isBooked = s => (state.booked[s.clinic.id] || []).includes(s.n) || !!state.joined[key(s)];
  const rsvpOf = s => state.rsvp[key(s)] || 'pending';
  const requestOf = s => state.requests[key(s)] || null;

  // What a session looks like to the player
  function statusOf(s) {
    const c = s.clinic;
    if (c.status === 'completed' || (c.status === 'cancelled' && c.past && c.past[s.n])) {
      if (!isBooked(s)) return { kind: 'other', label: 'Not in your share', tone: 'gray' };
      const p = (c.past || {})[s.n] || 'attended';
      return { kind: p, label: p === 'attended' ? 'Attended' : p === 'replaced' ? `Replaced by ${c.replacedBy?.[s.n] || 'a substitute'}` : 'Missed', tone: p === 'attended' ? 'green' : 'gray' };
    }
    if (c.status === 'cancelled') return { kind: 'cancelled', label: 'Cancelled', tone: 'red' };
    const r = requestOf(s);
    if (isBooked(s) && state.played[key(s)]) return { kind: 'attended', label: 'Attended', tone: 'green' };
    if (isBooked(s) && state.today === key(s) && !(r && r.status === 'filled')) return { kind: 'today', label: `Today · ${fmtTime(s.clinic.start)} ${ampm(s.clinic.start)}`, tone: 'blue' };
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
    const c = s.clinic; const base = [...(c.roster?.[s.n] || c.players.filter(p => p !== PLAYER.name).slice(0, 3))];
    const out = base.map(name => ({ name, role: 'Player' }));
    const open = c.openSpots?.[s.n];
    if (open) { const i = out.findIndex(p => p.name === open.who); if (i >= 0) out[i].out = true; }
    if (isBooked(s)) {
      const r = requestOf(s);
      if (r && r.status === 'filled') out.push({ name: PLAYER.name, role: 'Player', out: true, me: true }, { name: r.by, role: r.byRole || 'Player', replacement: true });
      else out.unshift({ name: PLAYER.name, role: 'Player', me: true, replacement: !!state.joined[key(s)], status: r ? 'Need Replacement' : null });
    }
    return out;
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
    attendedCount() { return Object.keys(state.played).length; },
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
    joinSpot(s) { state.joined[key(s)] = true; state.rsvp[key(s)] = 'going'; if (s.clinic.openSpots) delete s.clinic.openSpots[s.n]; save(); },
    unreadCount() { return ACTIVITY.filter(a => a.unread && !state.readActivity.includes(a.id)).length; },
    markRead(id) { if (!state.readActivity.includes(id)) { state.readActivity.push(id); save(); } },
    reset() { state = structuredClone(DEFAULTS); save(); },
  };
  // a spot you already joined is no longer open
  for (const c of CLINICS) for (const n of Object.keys(c.openSpots || {})) if (state.joined[`${c.id}:${n}`]) delete c.openSpots[n];
})();

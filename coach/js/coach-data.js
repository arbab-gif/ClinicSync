/* Coach prototype data + state (Maria Lopez, Pro plan: coaches, and also plays in one clinic).
   Clinics she coaches, invitations (clinic + coverage), attendance and coaching-fee payments.
   State lives in localStorage (cs-coach): invite answers, reschedule answers, unavailability, payments. */
window.CoachData = (() => {
  const TODAY = '2026-11-17';
  const IMG = '/organizer/assets/img/people/';
  const ME = { name: 'Maria Lopez', first: 'Maria', photo: IMG + 'coach.png' };
  const PEOPLE = {
    'Maria Lopez': IMG + 'coach.png', 'Albert John': IMG + 'man1.png', 'Jenny Wilson': IMG + 'red.png', 'Sarah Miller': IMG + 'side.png',
    'Liam Johnson': IMG + 'curly.png', 'Jessica Lee': IMG + 'blonde.png', 'Olivia Chen': IMG + 'sophia.png', 'Robert Wilson': IMG + 'man2.png',
    'Priya Nair': IMG + 'dark.png',
  };
  const add = (iso, d) => { const t = new Date(iso + 'T12:00:00'); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
  const fmt = (iso, o) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', o);
  const short = iso => fmt(iso, { month: 'short', day: 'numeric' });
  const day = iso => fmt(iso, { weekday: 'short', month: 'short', day: 'numeric' });

  // payments per completed session: player → 'Stripe' (paid in the app) | 'Venmo' | 'Zelle' | 'Cash' (paid, confirmed by the coach),
  // 'r:Venmo' (player says they paid by Venmo / Zelle / cash: the coach must confirm), null (outstanding)
  const CLINICS = [
    { id: 'saturday', name: 'Saturday Tennis', role: 'Coach', sport: 'Tennis', organizer: 'Albert John', status: 'active',
      day: 'Sat', days: 'Saturdays', time: '9:00–10:30 AM', start: '2026-10-10', sessions: 8, location: 'Riverside Tennis Center', court: 'Courts 2 & 3',
      desc: 'Saturday morning doubles for 3.5–4.0 players. Drills to start, then match play on two courts.',
      capacity: 4, fee: 25, players: ['Liam Johnson', 'Jessica Lee', 'Olivia Chen', 'Robert Wilson'], subs: ['Priya Nair', 'Daniel Kim'],
      names: { 8: 'Match vs Northside' },
      attended: { 1: 'all', 2: 'all', 3: ['Liam Johnson', 'Jessica Lee', 'Priya Nair', 'Robert Wilson'], 4: 'all', 5: ['Liam Johnson', 'Jessica Lee', 'Olivia Chen'], 6: 'all' },
      paid: {
        1: { 'Liam Johnson': 'Stripe', 'Jessica Lee': 'Stripe', 'Olivia Chen': 'Stripe', 'Robert Wilson': 'Stripe' },
        2: { 'Liam Johnson': 'Stripe', 'Jessica Lee': 'Venmo', 'Olivia Chen': 'Stripe', 'Robert Wilson': 'Cash' },
        3: { 'Liam Johnson': 'Stripe', 'Jessica Lee': 'Stripe', 'Priya Nair': 'Zelle', 'Robert Wilson': 'Stripe' },
        4: { 'Liam Johnson': 'Stripe', 'Jessica Lee': 'Stripe', 'Olivia Chen': 'Stripe', 'Robert Wilson': null },
        5: { 'Liam Johnson': 'Stripe', 'Jessica Lee': 'r:Venmo', 'Olivia Chen': 'Stripe' },
        6: { 'Liam Johnson': 'Stripe', 'Jessica Lee': 'r:Zelle', 'Olivia Chen': 'Stripe', 'Robert Wilson': null },
      },
      reschedule: { 7: { from: 'Albert John', date: '2026-11-22', dayLabel: 'Sun', time: '10:00–11:30 AM', reason: 'Riverside is hosting a junior tournament on Saturday' } },
      out: { 8: ['Robert Wilson'] }, inFor: { 8: { 'Daniel Kim': 'Robert Wilson' } } },
    { id: 'weekend', name: 'Weekend Beginners', role: 'Coach', sport: 'Tennis', organizer: 'Jenny Wilson', status: 'active',
      day: 'Sun', days: 'Sundays', time: '10:00–11:30 AM', start: '2026-11-01', sessions: 6, location: 'Maple Grove Tennis Club', court: 'Court 1',
      desc: 'A relaxed Sunday clinic for new players: grips, footwork and rallying from the baseline.',
      capacity: 6, fee: 20, players: ['Grace Liu', 'Marcus Reed', 'Ava Patel', 'Noah Kim', 'Emma Davis', 'Lucas Brown'], subs: ['Tomas Rivera'],
      attended: { 1: 'all', 2: ['Grace Liu', 'Marcus Reed', 'Ava Patel', 'Emma Davis', 'Lucas Brown'], 3: 'all' },
      paid: {
        1: { 'Grace Liu': 'Stripe', 'Marcus Reed': 'Stripe', 'Ava Patel': 'Zelle', 'Noah Kim': 'Stripe', 'Emma Davis': 'Stripe', 'Lucas Brown': 'Cash' },
        2: { 'Grace Liu': 'Stripe', 'Marcus Reed': 'Stripe', 'Ava Patel': 'Zelle', 'Emma Davis': 'Stripe', 'Lucas Brown': 'Cash' },
        3: { 'Grace Liu': 'Stripe', 'Marcus Reed': 'Stripe', 'Ava Patel': null, 'Noah Kim': 'Stripe', 'Emma Davis': 'Stripe', 'Lucas Brown': 'r:Cash' },
      },
      cancelled: { 4: 'Courts closed for resurfacing' } },
    { id: 'fall', name: 'Fall Padel Basics', role: 'Coach', sport: 'Padel', organizer: 'Robert Fox', status: 'completed',
      day: 'Wed', days: 'Wednesdays', time: '6:00–7:30 PM', start: '2026-09-02', sessions: 6, location: 'Northside Padel Club', court: 'Court A',
      desc: 'A six-week introduction to padel: walls, lobs and positioning as a pair.',
      capacity: 4, fee: 20, players: ['Hannah Cole', 'Ethan Brown', 'Maya Patel', 'Sofia Lee'], subs: [],
      attended: { 1: 'all', 2: 'all', 3: 'all', 4: 'all', 5: 'all', 6: 'all' }, paid: 'all' },
    // she also plays in a clinic (the Pro plan covers every role); it opens in the player view
    { id: 'monday', name: 'Monday Morning Tennis', role: 'Player', sport: 'Tennis', organizer: 'Jenny Wilson', status: 'active',
      day: 'Mon', days: 'Mondays', time: '9:00–10:30 AM', start: '2026-10-05', sessions: 8, location: 'Riverside Tennis Center', capacity: 8, players: [], subs: [] },
  ];

  // Invitations: clinic invites from organizers + coverage requests from other coaches
  const INVITES = [
    { id: 'thu-evening', type: 'clinic', name: 'Thursday Evening Rally', from: 'Sarah Miller', fromRole: 'Organizer', sport: 'Tennis', received: '2h ago',
      day: 'Thu', days: 'Thursdays', time: '7:00–8:30 PM', start: '2026-12-03', sessions: 6, location: 'Riverside Tennis Center', court: 'Courts 3 & 4', players: 6, subs: 2, fee: 30,
      desc: 'Fast-paced evening doubles for 3.5–4.5 players. Drills first, then match play.', status: 'pending' },
    { id: 'sat-juniors', type: 'clinic', name: 'Saturday Juniors', from: 'Jenny Wilson', fromRole: 'Organizer', sport: 'Tennis', received: 'Yesterday',
      day: 'Sat', days: 'Saturdays', time: '9:30–11:00 AM', start: '2026-11-28', sessions: 4, location: 'Maple Grove Tennis Club', court: 'Courts 1 & 2', players: 8, subs: 3, fee: 20,
      desc: 'Junior development clinic for ages 12–16. Footwork, serve and rally consistency.', status: 'pending',
      conflict: { clinic: 'saturday', n: 8 } },
    { id: 'cover-thu', type: 'coverage', name: 'Thursday Rally', from: 'James Carter', fromRole: 'Coach', organizer: 'Jenny Wilson', sport: 'Tennis', received: '5h ago',
      day: 'Thu', time: '6:00–7:30 PM', date: '2026-11-26', n: 6, sessions: 1, location: 'Riverside Tennis Center', court: 'Courts 3 & 4', players: 6, subs: 2, fee: 25,
      reason: 'I’m at a coaching certification that week.', status: 'pending',
      roster: ['Olivia Chen', 'Marcus Reed', 'Daniel Kim', 'Jessica Lee', 'Robert Wilson', 'Grace Liu'] },
    { id: 'saturday', type: 'clinic', name: 'Saturday Tennis', from: 'Albert John', fromRole: 'Organizer', sport: 'Tennis', received: 'Sep 30', day: 'Sat', days: 'Saturdays', time: '9:00–10:30 AM', start: '2026-10-10', sessions: 8, location: 'Riverside Tennis Center', players: 4, fee: 25, status: 'accepted', on: 'Sep 30' },
    { id: 'weekend', type: 'clinic', name: 'Weekend Beginners', from: 'Jenny Wilson', fromRole: 'Organizer', sport: 'Tennis', received: 'Oct 28', day: 'Sun', days: 'Sundays', time: '10:00–11:30 AM', start: '2026-11-01', sessions: 6, location: 'Maple Grove Tennis Club', players: 6, fee: 20, status: 'accepted', on: 'Oct 28' },
    { id: 'tuesday', type: 'clinic', name: 'Tuesday Tennis Club', from: 'Albert John', fromRole: 'Organizer', sport: 'Tennis', received: 'Oct 2', day: 'Tue', days: 'Tuesdays', time: '6:00–7:30 PM', start: '2026-10-13', sessions: 8, location: 'Riverside Tennis Center', players: 12, fee: 25, status: 'declined', on: 'Oct 2', reason: 'Tuesday evenings are already booked.' },
  ];

  // Coaches Maria can ask to cover a session
  const COACHES = [
    { name: 'James Carter', sport: 'Tennis · USPTA certified', photo: '/organizer/assets/img/player-ethan-brown.png', ntrp: '4.5', level: 'Advanced', loc: 'Riverside, CA, USA', years: 6, status: 'Available' },
    { name: 'Olivia Davis', sport: 'Tennis · PTR certified', photo: '/organizer/assets/img/coach-olivia-davis.png', ntrp: '4.5', level: 'Advanced', loc: 'Riverside, CA, USA', years: 4, status: 'Available' },
    { name: 'Sophia Martinez', sport: 'Tennis & padel coach', photo: '/organizer/assets/img/coach-sophia-martinez.png', ntrp: '5.0', level: 'Advanced', loc: 'Riverside, CA, USA', years: 8, status: 'Available' },
    { name: 'Ethan Brooks', sport: 'Tennis · USPTA certified', photo: '/organizer/assets/img/people/curly.png', ntrp: '4.0', level: 'Intermediate', loc: 'Corona, CA, USA', years: 3, status: 'Available' },
    { name: 'Noah Williams', sport: 'Tennis coach', photo: '/organizer/assets/img/people/man2.png', ntrp: '4.5', level: 'Advanced', loc: 'Riverside, CA, USA', years: 5, status: 'Busy' },
    { name: 'Maya Patel', sport: 'Tennis coach', photo: '/organizer/assets/img/player-maya-patel.png', ntrp: '4.0', level: 'Intermediate', loc: 'Corona, CA, USA', years: 2, status: 'Available' },
  ];
  for (const x of COACHES) PEOPLE[x.name] = x.photo;

  // ---------- state ----------
  const KEY = 'cs-coach';
  const blank = () => ({ inv: {}, resched: {}, unavail: {}, pay: {} });
  const state = blank();
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const reset = () => { Object.assign(state, blank()); save(); };

  const k = (c, n) => `${c.id}:${n}`;
  const invite = id => INVITES.find(v => v.id === id);
  const inviteStatus = v => state.inv[v.id]?.status || v.status;

  // a coverage request Maria accepted becomes a one-session "Covering" clinic
  const coverClinic = v => ({ id: v.id, name: v.name, role: 'Covering', sport: v.sport, organizer: v.organizer, status: 'active', cover: { for: v.from, n: v.n, date: v.date },
    day: v.day, days: v.day, time: v.time, start: v.date, sessions: 1, location: v.location, court: v.court, capacity: v.players, fee: v.fee,
    players: v.roster, subs: [], attended: {}, paid: {}, desc: 'Evening doubles for 3.5–4.5 players. You’re covering one session for the regular coach.' });
  // an accepted clinic invitation becomes a clinic she coaches
  const invitedClinic = v => ({ id: v.id, name: v.name, role: 'Coach', sport: v.sport, organizer: v.from, status: 'active', day: v.day, days: v.days, time: v.time, start: v.start,
    sessions: v.sessions, location: v.location, court: v.court, capacity: v.players, fee: v.fee, players: [], subs: [], attended: {}, paid: {}, fresh: true, desc: v.desc });
  function allClinics() {
    const extra = INVITES.filter(v => v.status === 'pending' && inviteStatus(v) === 'accepted').map(v => v.type === 'coverage' ? coverClinic(v) : invitedClinic(v));
    return [...CLINICS, ...extra];
  }
  const find = id => allClinics().find(c => c.id === id);

  // ---------- sessions ----------
  function sessionsOf(c) {
    if (c.cover) return [{ clinic: c, n: c.cover.n, date: c.cover.date }];
    return Array.from({ length: c.sessions }, (_, i) => {
      const s = { clinic: c, n: i + 1, date: add(c.start, i * 7) };
      const r = state.resched[k(c, s.n)];
      if (r && r.status === 'final') { const p = c.reschedule[s.n]; Object.assign(s, { was: `${day(s.date)} · ${c.time}`, date: p.date, dayLabel: p.dayLabel, time: p.time }); }
      return s;
    });
  }
  const timeOf = s => s.time || s.clinic.time;
  const dayOf = s => s.dayLabel || s.clinic.day;
  const isPast = s => s.date < TODAY;
  // who attended a completed session
  function attendees(s) { const a = s.clinic.attended?.[s.n]; return a === 'all' ? [...s.clinic.players] : a ? [...a] : []; }
  // who is confirmed for an upcoming session
  function lineup(s) {
    const c = s.clinic, out = c.out?.[s.n] || [], inn = c.inFor?.[s.n] || {};
    return [...c.players.map(p => ({ name: p, role: 'Player', out: out.includes(p) })), ...Object.entries(inn).map(([p, f]) => ({ name: p, role: 'Substitute', for: f }))];
  }

  // ---------- payments ----------
  // status of one player's coaching fee for one completed session
  function payOf(s, player) {
    const c = s.clinic, key = `${k(c, s.n)}:${player}`;
    if (state.pay[key]) return state.pay[key];
    const v = c.paid === 'all' ? 'Stripe' : c.paid?.[s.n]?.[player];
    if (!v) return { status: 'due' };
    // Venmo, Zelle and cash happen outside ClinicSync: the player reports it, the coach confirms it
    if (v.startsWith('r:')) return { status: 'reported', method: v.slice(2) };
    return v === 'Stripe' ? { status: 'paid', method: v } : { status: 'paid', method: v, how: 'confirmed' };
  }
  function recordPay(s, player, method, how) { state.pay[`${k(s.clinic, s.n)}:${player}`] = { status: 'paid', method, how }; save(); }
  // earnings: the fee × players who actually attended each completed session
  function earnings(cs = allClinics().filter(c => c.role !== 'Player')) {
    const rows = [];
    for (const c of cs) for (const s of sessionsOf(c)) {
      if (!isPast(s) || c.cancelled?.[s.n] || coveredBy(s)) continue;
      for (const p of attendees(s)) rows.push({ s, player: p, amt: c.fee, pay: payOf(s, p) });
    }
    const sum = f => rows.filter(f).reduce((a, r) => a + r.amt, 0);
    return { rows, total: sum(() => true), received: sum(r => r.pay.status === 'paid'), reported: sum(r => r.pay.status === 'reported'), due: sum(r => r.pay.status === 'due') };
  }
  const confirmed = s => lineup(s).filter(p => !p.out);
  const expected = s => s.clinic.fee * confirmed(s).length;

  // ---------- session status (coach's view) ----------
  const unavailOf = s => state.unavail[k(s.clinic, s.n)] || null;
  function coveredBy(s) { const u = unavailOf(s); if (!u) return null; const a = (u.invited || []).find(i => i.status === 'accepted'); return a ? a.name : u.assigned || null; }
  function statusOf(s) {
    const c = s.clinic;
    if (c.cancelled?.[s.n]) return { kind: 'cancelled', label: 'Cancelled', tone: 'red' };
    const cov = coveredBy(s);
    if (cov) return { kind: 'covered', label: `Covered by ${cov.split(' ')[0]}`, tone: 'gray' };
    if (isPast(s)) return { kind: 'completed', label: 'Completed', tone: 'gray' };
    const u = unavailOf(s);
    if (u) {
      const last = (u.invited || []).at(-1);
      if (u.mode === 'org') return { kind: 'unavail', label: 'Organizer finding a coach', tone: 'red' };
      if (last && last.status === 'pending') return { kind: 'unavail', label: 'Replacement invited', tone: 'yellow' };
      if (last && last.status === 'declined') return { kind: 'unavail', label: 'Replacement declined', tone: 'red' };
    }
    const r = c.reschedule?.[s.n], rs = state.resched[k(c, s.n)];
    if (r && !rs) return { kind: 'resched', label: 'Reschedule requested', tone: 'yellow' };
    if (r && rs.status === 'accepted') return { kind: 'resched-wait', label: 'Waiting for organizer', tone: 'blue' };
    if (r && rs.status === 'declined') return { kind: 'resched-no', label: 'You declined the new time', tone: 'gray' };
    if (s.date === TODAY) return { kind: 'today', label: 'Today', tone: 'blue' };
    return { kind: 'upcoming', label: 'Upcoming', tone: 'green' };
  }
  // every upcoming session she coaches or covers, soonest first
  const upcoming = () => allClinics().filter(c => c.role !== 'Player' && c.status === 'active').flatMap(sessionsOf)
    .filter(s => !isPast(s) && !s.clinic.cancelled?.[s.n] && !coveredBy(s)).sort((a, b) => a.date.localeCompare(b.date));
  // a clinic invitation that overlaps a session she already coaches
  function conflictOf(v) {
    if (!v.conflict) return null;
    const c = find(v.conflict.clinic), s = sessionsOf(c)[v.conflict.n - 1];
    if (s.date !== v.start && !(s.date > v.start && s.clinic.day === v.day)) return null;   // moved away: no clash any more
    return { clinic: c, s, text: `${c.name} · Session ${s.n} on ${day(s.date)}, ${timeOf(s)}` };
  }

  return { TODAY, ME, PEOPLE, CLINICS, INVITES, COACHES, state, save, reset, fmt, short, day, add,
    clinic: find, allClinics, invite, inviteStatus, sessionsOf, timeOf, dayOf, isPast, attendees, lineup, confirmed, payOf, recordPay, earnings, expected,
    unavailOf, coveredBy, statusOf, upcoming, conflictOf, key: k, photo: n => PEOPLE[n] || '' };
})();

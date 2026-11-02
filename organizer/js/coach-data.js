/* ClinicSync prototype — coach assignment for the "Saturday" clinic, at clinic level and per session.
   Kept in localStorage so the Coaches tab, Overview and session details agree. Not real persistence.

   Rules
   - Every assignment is a request: a registered coach must accept; an invited coach must join ClinicSync and accept.
   - While a replacement is pending, the current coach keeps coaching.
   - Session-level changes override the clinic coach for that one session only.
   - Completed sessions never change.
   - Coach fee is per player, per session; a session's fee follows the coach on that session. */
(() => {
  const KEY = 'cs-coaches-saturday';
  const COMPLETED = 2;      // sessions 1–2 have been played (prototype)
  const PLAYERS = 12;

  const DIRECTORY = {
    maria:  { id: 'maria',  name: 'Maria Lopez',     photo: 'assets/img/coach-maria-lopez.png',     email: 'maria.lopez@gmail.com',  fee: 25, rating: '4.9', years: 8, loc: 'Riverside, CA' },
    sophia: { id: 'sophia', name: 'Sophia Martinez', photo: 'assets/img/coach-sophia-martinez.png', email: 'sophia.m@gmail.com',     fee: 30, rating: '4.8', years: 6, loc: 'Riverside, CA' },
    olivia: { id: 'olivia', name: 'Olivia Davis',    photo: 'assets/img/coach-olivia-davis.png',    email: 'olivia.davis@gmail.com', fee: 20, rating: '4.7', years: 4, loc: 'Riverside, CA', away: ['2026-11-07'] },
    david:  { id: 'david',  name: 'David Kim',       photo: null,                                   email: 'david.kim@gmail.com',    fee: 35, rating: '5.0', years: 12, loc: 'Austin, TX', fullyBooked: true },
  };

  const fresh = preset => ({
    clinic: preset === 'none' ? { coach: null, pending: null, declined: null } : { coach: 'maria', pending: null, declined: null },
    sessions: {},           // { [n]: { coach: id|null, reason, pending, declined } }  — presence of `coach` key = override
    joined: {},             // coaches who joined from an email invite: { id: coach }
    away: {},               // { coachId: [iso] } dates a coach became unavailable
    log: preset === 'none'
      ? [{ t: 'info', title: 'Clinic created without a coach', body: 'You skipped the coach step. Add one any time from here.', at: 'Oct 1' }]
      : [{ t: 'ok', title: 'Maria Lopez accepted', body: 'Coaching all 8 sessions at $25 per player, per session.', at: 'Oct 1' }],
  });

  let S;
  function load() { try { S = JSON.parse(localStorage.getItem(KEY)) || fresh('maria'); } catch (e) { S = fresh('maria'); } return S; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function reset(preset) { S = fresh(preset); save(); return S; }

  const coach = id => (id && (DIRECTORY[id] || S.joined[id])) || null;
  const byEmail = email => Object.values({ ...DIRECTORY, ...S.joined }).find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
  const initials = name => name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const whoName = who => who.id ? coach(who.id).name : (who.invite.name || who.invite.email);
  const money = n => `$${Number(n).toFixed(0)}`;

  // Sessions come from the clinic schedule (js/clinic-data.js)
  function sessions() {
    const D = window.ClinicData, c = D.load();
    return D.sessionDates(c).map((d, i) => ({ n: i + 1, date: d, iso: D.isoOf(d), label: D.fmtLong(d), done: i < COMPLETED }));
  }
  const upcoming = () => sessions().filter(s => !s.done);
  // Coach on a session: session override (null = removed) else the clinic coach
  function sessionCoach(n) { const o = S.sessions[n]; return o && 'coach' in o ? o.coach : S.clinic.coach; }
  const isOverride = n => !!(S.sessions[n] && 'coach' in S.sessions[n]);
  const feeFor = n => { const c = coach(sessionCoach(n)); return c ? c.fee : 0; };
  const isAway = (id, iso) => ((S.away[id] || []).concat((coach(id) && coach(id).away) || [])).includes(iso);

  function log(t, title, body) { S.log.unshift({ t, title, body, at: 'Just now' }); }
  // Before the clinic coach changes, pin completed sessions to the coach who actually ran them
  function freezeCompleted() {
    sessions().filter(s => s.done && !isOverride(s.n)).forEach(s => { S.sessions[s.n] = { coach: S.clinic.coach, played: true }; });
  }

  window.CoachData = { load, save, reset, coach, byEmail, initials, whoName, money, sessions, upcoming, sessionCoach, isOverride, feeFor, isAway, log, freezeCompleted,
    DIRECTORY, PLAYERS, COMPLETED, get S() { return S; } };
})();

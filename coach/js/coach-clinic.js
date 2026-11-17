/* Coach clinic page (?id=saturday&tab=sessions&s=7): Overview · Sessions · Players · Payments.
   Sessions: upcoming / completed / cancelled, each with the coach's actions (reschedule request, can't make it → replacement).
   Session details: confirmed players and substitutes, spots, coaching fee and payment status.
   Payments: who paid, who owes, see who owes, confirm Venmo / Zelle / cash payments players report; fees use who actually attended. */
(() => {
  const D = CoachData, U = CoachUI, $ = s => document.querySelector(s), { esc, st, face, first, I } = U;
  const q = new URLSearchParams(location.search);
  const c = D.clinic(q.get('id')) || D.clinic('saturday');
  const live = c.status === 'active', org = 'the organizer', Org = 'The organizer';
  let tab = q.get('tab') || 'overview', filter = null, payFilter = 'all', modalFor = q.get('s') ? +q.get('s') : null;
  const pad = n => String(n).padStart(2, '0');
  const ss = () => D.sessionsOf(c);
  const s$ = n => ss().find(x => x.n === n);
  const chatBtn = (name, role) => `<button class="dc-open" type="button" data-chat="${esc(name)}" data-role="${role}" aria-label="Message ${esc(name)}" title="Message ${esc(first(name))}"><img src="${I}chat-circle.svg" alt=""></button>`;
  const title = s => `Session ${s.n}${c.names?.[s.n] ? ` <span class="s-name">· ${esc(c.names[s.n])}</span>` : ''}`;
  const group = s => c.cancelled?.[s.n] ? 'cancelled' : D.isPast(s) ? 'completed' : 'upcoming';

  // ---------- header ----------
  document.title = `${c.name} · ClinicSync`;
  $('#c-name').textContent = c.name;
  $('#c-role').textContent = c.cover ? `Covering for ${c.cover.for}` : 'Coach'; if (c.cover) $('#c-role').classList.add('chip-cover');
  $('#c-sport').textContent = c.sport;
  $('#c-status').textContent = live ? 'Active' : 'Completed'; $('#c-status').classList.add(live ? 'badge-ok' : 'badge-mute');
  $('#c-schedule').textContent = c.cover ? `${D.day(c.cover.date)} · ${c.time} · Session ${c.cover.n} only` : `${D.short(ss()[0].date)} – ${D.short(ss().at(-1).date)} · ${c.days}, ${c.time}`;
  $('#c-location').textContent = `${c.location}${c.court ? ` · ${c.court}` : ''}`;
  if (c.desc) { $('#c-desc').textContent = c.desc; $('#c-desc').hidden = false; }
  $('#c-msg').href = `messages.html?to=${encodeURIComponent(c.name)}`;
  if (!live) $('#c-msg').hidden = true;

  // ---------- what the coach can do with a session (card + modal) ----------
  function actions(s, inModal) {
    const t = D.statusOf(s), key = D.key(c, s.n), u = D.unavailOf(s), r = c.reschedule?.[s.n], rs = D.state.resched[key];
    const row = (note, btns) => (note || btns) ? `<div class="p-sact${inModal ? ' in-modal' : ''}"><span class="p-snote">${note}</span><span class="p-sbtns">${btns}</span></div>` : '';
    const demo = (what, label) => `<button class="p-demo" type="button" data-proto="${what}:${s.n}">${label}</button>`;
    if (t.kind === 'cancelled') return row(`${Org} cancelled this session · “${esc(c.cancelled[s.n])}”. No coaching fee.`, '');
    if (t.kind === 'covered') return row(`<b>${esc(D.coveredBy(s))}</b> ${D.isPast(s) ? 'covered' : 'is covering'} this session. Their fee is tracked separately and isn’t part of your earnings.`, '');
    if (t.kind === 'completed') {
      const at = D.attendees(s);
      return inModal ? '' : row(`${at.length} attended`, '');
    }
    if (t.kind === 'unavail') {
      const last = u.invited?.at(-1);
      if (u.mode === 'org') return row(`You can’t make it (${esc(u.reason)}). <b>${Org}</b> is choosing a replacement coach.`, `${demo('o-assign', `Prototype: ${org} assigns Olivia Davis`)}<button class="btn btn-sm btn-soft" type="button" data-proto="undo:${s.n}">I can make it after all</button>`);
      if (last.status === 'pending') return row(`You can’t make it (${esc(u.reason)}). You invited <b>${esc(last.name)}</b> to cover · waiting for a reply.`, `${demo('r-accept', `Prototype: ${first(last.name)} accepts`)}${demo('r-decline', `… declines`)}`);
      return row(`<b>${esc(last.name)}</b> can’t cover it. Invite another coach, or let ${esc(org)} arrange it.`, `<button class="btn btn-sm btn-soft" type="button" data-orgfix="${s.n}">Let ${esc(org)} arrange it</button><button class="btn btn-sm btn-primary" type="button" data-again="${s.n}">Invite another coach</button>`);
    }
    // reschedule request: current → proposed time at a glance, the reason in small text
    if (t.kind === 'resched') return `<div class="p-sact rs-req${inModal ? ' in-modal' : ''}">
      <div class="rs-body"><span class="rs-ic"><i style="--ico:url(${I}arrows-clockwise.svg)" aria-hidden="true"></i></span>
        <div><b class="rs-t">Reschedule session</b>
          <span class="rs-move"><b>${D.fmt(r.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${esc(r.time)}</b></span>
          <small>${esc(r.reason)}</small></div></div>
      <span class="p-sbtns"><button class="btn btn-sm btn-soft" type="button" data-rs="${s.n}">Decline</button><button class="btn btn-sm btn-primary" type="button" data-rs-ok="${s.n}">I’m available</button></span></div>`;
    if (t.kind === 'resched-wait') return row(`You can make ${D.day(r.date)} · ${esc(r.time)}. Waiting for ${esc(org)} to confirm the new time.`, demo('o-final', `Prototype: ${org} confirms`));
    // in the session details, "Can't make it" sits on the coach's own line instead
    const cant = inModal ? '' : `<button class="btn btn-sm btn-soft" type="button" data-cant="${s.n}">Can’t make it</button>`;
    if (t.kind === 'resched-no') return row(`You declined the new time (${esc(rs.reason)}). ${Org} can suggest another time or find a coach for that day.`, cant);
    if (s.was) return row(`Moved from ${esc(s.was)}. The organizer and all players were notified.`, cant);
    return inModal ? '' : row('', cant);
  }

  function sCard(s) {
    const t = D.statusOf(s), past = D.isPast(s), lu = D.confirmed(s), at = D.attendees(s);
    const fee = t.kind === 'cancelled' || t.kind === 'covered' ? '—' : past ? `$${at.length * c.fee}` : `$${lu.length * c.fee}`;
    return `<article class="s-card p-scard ${t.kind}" id="s-${s.n}">
      <div class="s-top">
        <div class="datebox"><small>${D.fmt(s.date, { month: 'short' })}</small><b>${D.fmt(s.date, { day: 'numeric' })}</b></div>
        <div class="s-main">
          <div class="s-info">
            <div class="s-title"><h3>${title(s)}</h3>${['upcoming'].includes(t.kind) ? '' : st(t.tone, t.label)}</div>
            <div class="s-cols">
              <div class="s-col"><span class="lbl"><img src="${I}calendar-blank-sm.svg" alt="">Scheduled</span><span class="val">${D.dayOf(s)} · ${D.timeOf(s)}</span></div>
              <div class="s-col"><span class="lbl"><img src="${I}map-pin-sm.svg" alt="">Venue</span><span class="val">${esc(c.location)}</span></div>
              <div class="s-col"><span class="lbl"><img src="${I}nav-payments.svg" alt="">${past ? 'Earned' : 'Expected fee'}</span><span class="val">${fee}</span></div>
            </div>
          </div>
          <button class="s-view" type="button" data-view="${s.n}"><img src="${I}eye.svg" alt="">View session</button>
        </div>
      </div>
      ${actions(s)}
    </article>`;
  }

  // ---------- session details ----------
  const mHead = (s, extra) => `<div class="m-head m-head-s"><div><span class="m-stitle">Session ${s.n}${c.names?.[s.n] ? ` · ${esc(c.names[s.n])}` : ''}</span><h2 id="sm-title">${D.fmt(s.date, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
    <div class="m-when"><span><img src="${I}clock-brand-24.svg" alt="">${D.timeOf(s)}</span><span><img src="${I}map-pin-brand-24.svg" alt="">${esc(c.location)}</span>${(extra || '').replace(/^ · /, '')}</div></div><button class="m-x" type="button" data-close aria-label="Close"><img src="${I}x-close-sm.svg" alt=""></button></div>`;
  const payPill = p => p.status === 'paid' ? st('green', p.method === 'Stripe' ? 'Paid · Stripe' : `${p.method} · confirmed`) : p.status === 'reported' ? st('purple', `${p.method} · confirm it`) : st('yellow', 'Outstanding');
  const payBtn = (s, name, p) => p.status === 'reported' ? `<button class="btn btn-sm btn-outline m-cant" type="button" data-confirm="${s.n}|${esc(name)}|${p.method}">Confirm</button>`
    : '';
  function openSession(n) {
    const s = s$(n); if (!s) return; modalFor = n;
    const t = D.statusOf(s), past = D.isPast(s);
    const orgRow = `<section class="m-sec"><h3>Organizer</h3><div class="m-row">${face(c.organizer)}<div class="m-who"><b>${esc(c.organizer)}</b><span class="m-tags"><span class="tag">Organizer</span></span></div></div></section>`;
    if (past && t.kind !== 'cancelled') {
      const at = D.attendees(s), cov = D.coveredBy(s);
      const ab = c.players.filter(p => !at.includes(p));
      // payments are handled on the Payments tab; the session shows who attended
      $('#sm').innerHTML = `${mHead(s, ` · ${st('gray', 'Completed')}`)}
        ${cov ? actions(s, true) + '<hr class="m-hr">' : ''}
        <section class="m-sec"><div class="m-sec-h"><h3>Who attended</h3><span class="m-count">${at.length} attended</span></div>
          ${at.map(p => `<div class="m-row">${face(p)}<div class="m-who"><b>${esc(p)}</b><span class="m-tags"><span class="tag">${c.subs.includes(p) ? 'Substitute' : 'Player'}</span>${c.subs.includes(p) ? '<span class="tag tag-repl">Replacement</span>' : ''}</span></div>${st('green', 'Attended')}</div>`).join('')}
          ${ab.map(p => `<div class="m-row out">${face(p)}<div class="m-who"><b>${esc(p)}</b><span class="m-tags"><span class="tag">Player</span></span></div>${st('gray', 'Didn’t attend')}</div>`).join('')}
        </section>`;
    } else {
      const lu = D.lineup(s), conf = lu.filter(p => !p.out);
      // the coach's line: the fee, and "Can't make it" while the session is still theirs to coach
      const canCant = ['upcoming', 'today', 'resched-no'].includes(t.kind);
      const fee = t.kind === 'cancelled' ? st('gray', 'Not charged') : t.kind === 'covered' ? st('gray', `Goes to ${first(D.coveredBy(s))}`)
        : canCant ? `<button class="btn btn-sm btn-outline m-cant" type="button" data-cant="${s.n}">Can’t make it</button>` : '';
      $('#sm').innerHTML = `${mHead(s, t.kind === 'upcoming' ? '' : ` · ${st(t.tone, t.label)}`)}
        <div class="m-stats"><div><span>Confirmed</span><b>${pad(conf.length)}</b></div><div><span>Open spots</span><b>${pad(Math.max(0, c.capacity - conf.length))}</b></div><div><span>Capacity</span><b>${pad(c.capacity)}</b></div></div>
        <hr class="m-hr">
        ${actions(s, true)}
        <section class="m-sec"><h3>Coaching fee</h3><div class="m-row coach">${face(D.ME.name)}<div class="m-who"><b>${D.coveredBy(s) ? esc(D.coveredBy(s)) : 'You'}</b><span>$${c.fee} per player × ${conf.length} confirmed${c.cover ? ` · covering for ${esc(c.cover.for)}` : ''}</span></div><span class="m-fee">$${conf.length * c.fee}</span>${fee}</div></section>
        <hr class="m-hr">${orgRow}<hr class="m-hr">
        <section class="m-sec"><div class="m-sec-h"><h3>Session Participants</h3><span class="m-count">${conf.length} Confirmed</span></div>
          ${conf.map(p => `<div class="m-row">${face(p.name)}<div class="m-who"><b>${esc(p.name)}</b><span class="m-tags"><span class="tag">${p.role}</span></span></div>${st('green', 'Confirmed')}</div>`).join('') || '<p class="muted">Players join once the organizer invites them.</p>'}
        </section>`;
    }
    const ov = $('#session'); if (ov.hidden) { ov.hidden = false; document.body.style.overflow = 'hidden'; }
    const u = new URL(location); u.searchParams.set('s', n); history.replaceState(null, '', u);
  }

  // ---------- tabs ----------
  const statBox = (l, v, sm) => `<div><span>${l}</span><b>${v}${sm ? `<small>${sm}</small>` : ''}</b></div>`;
  const personRow = (name, role, note, extra = '') => `<div class="pl-row">${face(name, 'pl-av')}<div class="pl-who"><span class="pl-name"><b>${esc(name)}</b><span class="chip">${role}</span></span>${note ? `<span class="pl-note">${note}</span>` : ''}</div>${extra}${chatBtn(name, role)}</div>`;
  // Session by session, as an accordion: "Session 6 — Nov 14", "Sat · 9:00–10:30 AM · 1 substitute", then who attended (Regular / Substitute) and their payment
  const openAcc = new Set();
  function accordion(rows) {
    const bySession = new Map();
    for (const r of rows) { if (!bySession.has(r.s.n)) bySession.set(r.s.n, []); bySession.get(r.s.n).push(r); }
    if (!openAcc.size && bySession.size) openAcc.add([...bySession.keys()][0]);   // latest session open to start
    const money = v => `$${v.toFixed(2)}`;
    // a player's line: paid (in the app, or Venmo / Zelle / cash the coach confirmed), payment reported (coach to confirm), pending
    const pStatus = p => p.status === 'paid' ? `<span class="st st-green" title="${p.method === 'Stripe' ? 'Paid by card' : `${p.method} · confirmed by you`}">Paid</span>`
      : p.status === 'reported' ? `<span class="st st-blue" title="${p.method}">Payment reported</span>` : st('yellow', 'Pending');
    const head = `<div class="cp-tr cp-th" role="row"><span>Session / Attendee</span><span>Attendance</span><span>Coach fees</span><span>Paid</span><span>Outstanding</span><span>Status</span><span></span></div>`;
    return `<div class="cp-grid" role="table">${head}${[...bySession.entries()].map(([n, list]) => {
      const s = list[0].s, all = D.attendees(s), subs = all.filter(p => c.subs.includes(p)).length, open = openAcc.has(n);
      const fees = all.length * c.fee, paid = all.filter(p => D.payOf(s, p).status === 'paid').length * c.fee;
      const sst = paid === fees ? st('green', 'Paid') : paid ? st('yellow', 'Partially paid') : st('red', 'Unpaid');
      return `<div class="cp-tgroup${open ? ' open' : ''}">
        <button class="cp-tr cp-ts" type="button" data-acc="${n}" aria-expanded="${open}">
          <span class="cp-tname"><img class="cp-acc-caret" src="${I}chevron-down-16.svg" alt=""><span><b>Session ${n}${c.names?.[n] ? ` · ${esc(c.names[n])}` : ''} — ${D.short(s.date)}</b><small>${D.dayOf(s)} • ${D.timeOf(s)}${subs ? ` • ${subs} substitute${subs > 1 ? 's' : ''}` : ''}</small></span></span>
          <span>${all.length}</span><span>${money(fees)}</span><span>${money(paid)}</span><span>${money(fees - paid)}</span><span>${sst}</span><span></span>
        </button>
        ${open ? `<div class="cp-tbody">${list.map(r => { const sub = c.subs.includes(r.player), pd = r.pay.status === 'paid' ? r.amt : 0;
          return `<div class="cp-tr cp-tp" role="row"><span class="cp-tname">${face(r.player)}<b>${esc(r.player)}</b><span class="cp-role${sub ? ' sub' : ''}">${sub ? 'Substitute' : 'Regular'}</span></span><span></span><span>${money(r.amt)}</span><span>${money(pd)}</span><span>${money(r.amt - pd)}</span><span>${pStatus(r.pay)}</span><span class="cp-act">${payBtn(r.s, r.player, r.pay)}</span></div>`; }).join('')}</div>` : ''}
      </div>`;
    }).join('')}</div>`;
  }
  // Sessions calendar: one month at a time, this clinic's sessions as chips (click opens the session)
  let sView = 'list', sQuery = '', calMonth = null;
  function calendar(list) {
    calMonth ||= (list.find(s => !D.isPast(s)) || list.at(-1) || { date: D.TODAY }).date.slice(0, 7);
    // the organizer's calendar (Figma 385:1041): date top-right, session chips with time, venue and coach
    const [y, m] = calMonth.split('-').map(Number), first = new Date(y, m - 1, 1);
    const by = {}; for (const s of list) (by[s.date] ||= []).push(s);
    const start = new Date(first); start.setDate(1 - first.getDay());
    const weeks = Math.ceil((first.getDay() + new Date(y, m, 0).getDate()) / 7);
    const tone = k => ({ resched: 'pending', unavail: 'repl', cancelled: 'done', covered: 'done', completed: 'done' }[k] || '');
    const cells = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const chips = (by[iso] || []).map(s => { const t = D.statusOf(s), coach = D.coveredBy(s) || D.ME.name;
        return `<button type="button" class="chip-s ${tone(t.kind)}" data-view="${s.n}" title="${esc(t.label)}"><b>Session ${s.n}</b>
          <span><img src="${I}calendar-blank-sm.svg" alt="">${esc(D.timeOf(s).split('–')[0])}${/AM|PM/.test(D.timeOf(s).split('–')[0]) ? '' : ` ${D.timeOf(s).slice(-2)}`}</span>
          <span><img src="${I}map-pin-sm.svg" alt=""><em class="tx">${esc(c.location)}</em></span>
          <span>${D.photo(coach) ? `<img class="av" src="${D.photo(coach)}" alt="">` : ''}<em class="tx">${esc(coach)}</em></span></button>`; }).join('');
      cells.push(`<div class="cal-cell${d.getMonth() !== m - 1 ? ' other' : ''}" role="gridcell"><span class="dnum">${d.getDate()}</span>${chips}</div>`);
    }
    return `<div class="sc-cal-head"><h3 class="cal-month">${first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3><span class="cal-nav"><button class="icon-btn" type="button" data-cal="-1" aria-label="Previous month"><img src="${I}chevron-right.svg" alt="" style="transform:rotate(180deg)"></button><button class="icon-btn" type="button" data-cal="1" aria-label="Next month"><img src="${I}chevron-right.svg" alt=""></button></span></div>
      <div class="cal-card"><div class="cal-dow" aria-hidden="true">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<span>${d}</span>`).join('')}</div><div class="cal-grid" role="grid" aria-label="Sessions calendar">${cells.join('')}</div></div>`;
  }
  const TABS = {
    overview() {
      const list = ss(), e = D.earnings([c]);
      const done = list.filter(s => D.isPast(s) && !c.cancelled?.[s.n] && !D.coveredBy(s)).length;
      const next = list.filter(s => group(s) === 'upcoming').slice(0, 3);
      const stats = statBox('Sessions coached', pad(done), `/${pad(c.sessions)}`) + statBox('Earned', `$${e.total}`) + statBox('Outstanding', `$${e.due + e.reported}`);
      const nextSec = next.length ? `<section class="ov-sessions"><div class="section-head"><h2 class="h2">${live ? 'Upcoming sessions' : 'Sessions'}</h2><button class="link" type="button" data-goto="sessions">All sessions<img class="icon" src="${I}caret-right.svg" alt=""></button></div><div class="ov-list">${next.map(sCard).join('')}</div></section>`
        : `<section class="ov-sessions"><div class="section-head"><h2 class="h2">Sessions</h2><button class="link" type="button" data-goto="sessions">All sessions<img class="icon" src="${I}caret-right.svg" alt=""></button></div><div class="ov-list">${list.slice(-2).map(sCard).join('')}</div></section>`;
      const about = `<section class="p-about"><h2 class="h2">About this clinic</h2><dl class="p-dl">
        <div><dt>Coaching fee</dt><dd>$${c.fee} per player, per session</dd></div>
        ${c.court ? `<div><dt>Sport Facility</dt><dd>${esc(c.court)}</dd></div>` : ''}</dl></section>`;
      const pay = `<section class="p-paycard"><div class="ovc-head"><h2 class="h2">Coaching fees</h2><button class="link" type="button" data-goto="payments">View all<img class="icon" src="${I}caret-right.svg" alt=""></button></div>
        <div class="p-payline"><div><b>Received</b></div><div class="amt"><b>$${e.received}</b>${st('green', 'Paid')}</div></div>
        ${e.reported ? `<div class="p-payline"><div><b>To confirm</b></div><div class="amt"><b>$${e.reported}</b>${st('purple', 'Confirm')}</div></div>` : ''}
        <div class="p-payline${e.due ? ' due' : ''}"><div><b>Outstanding</b></div><div class="amt"><b>$${e.due}</b>${e.due ? st('yellow', 'Due') : st('green', 'Clear')}</div></div></section>`;
      return `<div class="ov"><div class="ov-main"><div class="ov-stats">${stats}</div>${nextSec}</div>
        <aside class="ov-side"><section class="ov-coach"><div class="ovc-head"><h2 class="h2">Organizer</h2></div>${personRow(c.organizer, 'Organizer', 'Sets the schedule and lineup')}${c.cover ? personRow(c.cover.for, 'Coach', 'Regular coach for this clinic') : ''}</section>${pay}${about}</aside></div>`;
    },
    sessions() {
      // toolbar like the organizer's Sessions: search · Status · List View / Calendar View
      const list = ss();
      filter ||= 'all';
      const needs = s => ['resched', 'unavail'].includes(D.statusOf(s).kind);
      const F = [['all', 'All statuses'], ['upcoming', 'Upcoming'], ['needs', 'Needs your answer'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];
      const shown = list.filter(s => filter === 'all' || (filter === 'needs' ? needs(s) : group(s) === filter));
      const bar = `<div class="ss-bar">
          <div class="search"><img src="${I}search.svg" alt=""><input class="input" id="ss-q" type="search" placeholder="Search Session" aria-label="Search session" value="${esc(sQuery)}"></div>
          <div class="ss-right">
            <div class="dd"><button class="dd-btn" type="button" data-menu="#status-menu" aria-haspopup="menu" aria-expanded="false"><span>${filter === 'all' ? 'Status' : F.find(f => f[0] === filter)[1]}</span><img src="${I}arrow-right-16.svg" alt=""></button>
              <div class="menu" id="status-menu" role="menu" hidden>${F.map(([k, l]) => `<button type="button" role="menuitem" data-filter="${k}">${l}</button>`).join('')}</div></div>
            <div class="view-seg" role="tablist" aria-label="View">
              <a href="#" class="${sView === 'list' ? 'on' : ''}" data-sview="list"><img src="${I}list-dashes.svg" alt="">List View</a>
              <a href="#" class="${sView === 'calendar' ? 'on' : ''}" data-sview="calendar"><img src="${I}calendar-blank-20.svg" alt="">Calendar View</a>
            </div>
          </div></div>`;
      if (sView === 'calendar') return `<div class="ss">${bar}${calendar(shown)}</div>`;
      return `<div class="ss">${bar}
        <div class="ss-list" id="ss-list">${shown.map(s => sCard(s).replace('<article ', `<article data-search="${esc(`session ${s.n} ${c.names?.[s.n] || ''} ${D.fmt(s.date, { month: 'short', day: 'numeric', weekday: 'long' })} ${D.statusOf(s).label}`.toLowerCase())}" `)).join('') || '<p class="muted">No sessions here.</p>'}</div>
        <p class="muted" id="ss-empty" hidden>No sessions match your search.</p></div>`;
    },
    players() {
      const sec = (title, rows) => `<section class="pl-sec"><h2 class="h2">${title}</h2><div class="pl-list">${rows}</div></section>`;
      const att = p => ss().filter(s => D.isPast(s) && D.attendees(s).includes(p)).length;
      const note = p => `Attended ${att(p)} session${att(p) === 1 ? '' : 's'}`;   // what they owe lives on the Payments tab
      return `<div class="pl">${sec('Organizer', personRow(c.organizer, 'Organizer', 'Sets the schedule and lineup'))}
        ${c.players.length ? sec(`Players (${c.players.length})`, c.players.map(p => personRow(p, 'Player', note(p))).join('')) : sec('Players', '<p class="muted">Players appear once the organizer invites them.</p>')}
        ${c.subs.length ? sec(`Substitutes (${c.subs.length})`, c.subs.map(p => personRow(p, 'Substitute', att(p) ? note(p) : 'On the substitute list')).join('')) : ''}</div>`;
    },
    payments() {
      const e = D.earnings([c]);
      const rows = e.rows.filter(r => payFilter === 'all' || (payFilter === 'due' ? r.pay.status !== 'paid' : r.pay.status === 'paid')).sort((a, b) => b.s.date.localeCompare(a.s.date));
      return `<div class="p-pay cp-pay">
        <div class="ov-stats cp-stats">${statBox('Total earned', `$${e.total}`)}${statBox('Received', `$${e.received}`)}${statBox('Outstanding', `$${e.due + e.reported}`)}</div>
        <h2 class="h2">Session by session</h2>
        ${rows.length ? `<div class="cp-acc">${accordion(rows)}</div>`
          : `<p class="muted">${e.rows.length ? 'Nothing here.' : 'No completed sessions yet. Fees appear after each session.'}</p>`}
      </div>`;
    },
  };
  function render() {
    document.querySelectorAll('#c-tabs [data-tab]').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    $('#c-body').innerHTML = TABS[tab]();
    if (modalFor && !$('#session').hidden) openSession(modalFor);
  }
  const go = t => { tab = t; const u = new URL(location); u.searchParams.set('tab', t); u.searchParams.delete('s'); history.replaceState(null, '', u); render(); };

  document.addEventListener('click', e => {
    const b = sel => e.target.closest(sel);
    if (b('#c-tabs [data-tab]')) return go(b('#c-tabs [data-tab]').dataset.tab);
    if (b('[data-goto]')) return go(b('[data-goto]').dataset.goto);
    if (b('[data-filter]')) { filter = b('[data-filter]').dataset.filter; return render(); }
    if (b('[data-sview]')) { e.preventDefault(); sView = b('[data-sview]').dataset.sview; return render(); }
    if (b('[data-cal]')) { const [y, m] = calMonth.split('-').map(Number), d = new Date(y, m - 1 + +b('[data-cal]').dataset.cal, 1); calMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; return render(); }
    if (b('[data-acc]')) { const n = +b('[data-acc]').dataset.acc; openAcc.has(n) ? openAcc.delete(n) : openAcc.add(n); if (!openAcc.size) openAcc.add(-1); return render(); }
    if (b('[data-pf]')) { payFilter = b('[data-pf]').dataset.pf; return render(); }
    if (b('[data-view]')) return openSession(+b('[data-view]').dataset.view);
    if (b('[data-cant]')) return U.unavailable(s$(+b('[data-cant]').dataset.cant), render);
    if (b('[data-again]')) return U.pickCoach(s$(+b('[data-again]').dataset.again), render);
    if (b('[data-orgfix]')) { D.state.unavail[D.key(c, +b('[data-orgfix]').dataset.orgfix)].mode = 'org'; D.save(); window.toast(`${Org} will arrange a replacement.`); return render(); }
    if (b('[data-rs]')) return U.reschedDecline(s$(+b('[data-rs]').dataset.rs), render);
    if (b('[data-rs-ok]')) { const x = s$(+b('[data-rs-ok]').dataset.rsOk), n = D.confirmed(x).length; D.state.resched[D.key(c, x.n)] = { status: 'final' }; D.save(); window.toast(`Session moved to ${D.day(c.reschedule[x.n].date)}. The organizer and all ${n} players were notified.`); return render(); }
    if (b('[data-proto]')) { const [what, n] = b('[data-proto]').dataset.proto.split(':'); U.proto(s$(+n), what); return render(); }
    // quick confirm from "Waiting for your confirmation" (no extra dialog: the coach is looking at the list)
    if (b('[data-confirm-now]')) { const [n, p, m] = b('[data-confirm-now]').dataset.confirmNow.split('|'); D.recordPay(s$(+n), p, m, 'confirmed'); window.toast(`Confirmed. ${first(p)}’s ${m === 'Cash' ? 'cash' : m} payment is marked as paid.`); return render(); }
    if (b('[data-notyet]')) return window.toast(`We’ll remind ${first(b('[data-notyet]').dataset.notyet)} that it hasn’t arrived yet.`);
    if (b('[data-confirm]')) { const [n, p, m] = b('[data-confirm]').dataset.confirm.split('|'); return U.record(s$(+n), p, render, m); }
    if (b('[data-chat]')) { const x = b('[data-chat]'); return DirectChat.open({ name: x.dataset.chat, role: x.dataset.role, photo: D.photo(x.dataset.chat) || null, ctx: ' · ' + c.name }); }
    if (b('#session [data-close]') || e.target.id === 'session') { modalFor = null; const u = new URL(location); u.searchParams.delete('s'); history.replaceState(null, '', u); }
  });
  // search filters the session cards in place (keeps focus while typing)
  const applySearch = () => { const list = document.getElementById('ss-list'); if (!list) return; let n = 0;
    list.querySelectorAll('.s-card').forEach(card => { const ok = !sQuery || card.dataset.search.includes(sQuery.toLowerCase()); card.hidden = !ok; if (ok) n++; });
    document.getElementById('ss-empty').hidden = n > 0 || !sQuery; };
  document.addEventListener('input', e => { if (e.target.id !== 'ss-q') return; sQuery = e.target.value.trim(); applySearch(); });
  const _render = render; render = () => { _render(); applySearch(); };
  render();
  if (modalFor) openSession(modalFor);
})();

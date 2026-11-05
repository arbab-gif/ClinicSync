/* Player clinic page: Overview · Sessions · Players · Payments for one clinic (?id=monday&tab=sessions&open=2).
   Active clinics are interactive (RSVP, can't make it → replacement request, join an open spot, chat);
   completed clinics are read-only history. Data and state: js/player-data.js. */

(() => {
  const P = PlayerData, $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = '/organizer/assets/icons/';
  const q = new URLSearchParams(location.search);
  const c = P.clinic(q.get('id')) || P.clinic('monday');
  const live = c.status === 'active';
  let tab = q.get('tab') || 'overview', modalFor = null, actFor = null;

  const long = iso => P.fmt(iso, { weekday: 'long', month: 'long', day: 'numeric' });
  const short = iso => P.fmt(iso, { month: 'short', day: 'numeric' });
  const when = `${P.fmtTime(c.start)} ${c.start < '12' ? 'AM' : 'PM'}`;
  const sessions = P.sessionsOf(c);
  const s$ = n => sessions[n - 1];
  const photo = name => P.photo(name) || '';
  const face = (name, cls = 'avatar-img') => photo(name) ? `<img class="${cls}" src="${photo(name)}" alt="">` : `<span class="initials m-av">${name.split(' ').map(w => w[0]).join('')}</span>`;
  const chatBtn = (name, role) => `<button class="dc-open" type="button" data-chat="${esc(name)}" data-role="${role}" aria-label="Message ${esc(name)}" title="Message ${esc(name.split(' ')[0])}"><img src="${I}chat-circle.svg" alt=""></button>`;

  // ---------- header ----------
  document.title = `${c.name} · ClinicSync`;
  $('#c-name').textContent = c.name; $('#c-role').textContent = c.role; $('#c-sport').textContent = c.sport;
  const started = sessions[0].date <= P.TODAY;
  // clinic status, top right of the header
  $('#c-status').textContent = c.status === 'completed' ? 'Completed' : 'Active';
  $('#c-status').classList.add(c.status === 'completed' ? 'badge-mute' : 'badge-ok');
  $('#c-schedule').textContent = `${short(sessions[0].date)} – ${short(sessions.at(-1).date)} · ${c.days}, ${P.timeRange(c)}`;
  $('#c-location').textContent = c.location;
  if (c.description) { $('#c-desc').textContent = c.description; $('#c-desc').hidden = false; }
  if (!live) $('#c-msgs').hidden = true;

  // ---------- banner (role / history) ----------
  const mine = P.booked(c), past = c.past || {};
  const att = mine.filter(s => past[s.n] === 'attended').length, rep = mine.filter(s => past[s.n] === 'replaced').length;

  // Completed clinic: a wrap-up card with an attendance ring, totals and a session-by-session strip
  function doneBanner() {
    const I = '../organizer/assets/icons/';
    const dots = mine.map(x => { const k = past[x.n] === 'replaced' ? 'rep' : 'ok'; return `<li class="cd-dot ${k}" title="Session ${x.n} · ${short(x.date)} · ${k === 'ok' ? 'Attended' : 'Replaced'}"><b>${x.n}</b><small>${short(x.date)}</small></li>`; }).join('');
    return `<section class="cd">
      <div class="cd-main">
        <span class="cd-badge"><img src="${I}check-circle-green.svg" alt="">Completed</span>
        <h2 class="cd-title">That’s a wrap!</h2>
        <p class="cd-sub">This clinic ended on ${long(sessions.at(-1).date)}. Your sessions and payments stay here for reference.</p>
        <ol class="cd-strip" aria-label="Your sessions">${dots}</ol>
        <div class="cd-legend"><span><i class="ok"></i>Attended</span><span><i class="rep"></i>Replaced</span></div>
      </div>
    </section>`;
  }
  $('#c-banner').innerHTML = c.status === 'completed'
    ? doneBanner()
      : c.role === 'Substitute'
        ? `<div class="pc-banner info"><div><b>You’re on the substitute list.</b><span>When a player can’t make it, the spot goes to the clinic’s players first, then to substitutes. Open spots show up in Sessions.</span></div></div>`
        : '';

  // ---------- session status + actions ----------
  const tone = st => `st st-${st.tone}`;
  function actions(s, inModal) {
    if (!live) return '';
    const st = P.statusOf(s), r = P.requestOf(s), open = c.openSpots?.[s.n];
    const row = (note, btns) => `<div class="p-sact${inModal ? ' in-modal' : ''}"><span class="p-snote">${note}</span><span class="p-sbtns">${btns}</span></div>`;
    switch (st.kind) {
      // a session you're simply in: nothing extra; Can't make it sits on your own row in the session details
      case 'going': return '';
      case 'requested': return row(r.status === 'subs' ? 'No player joined in time, so your spot went to the substitutes.' : `Your spot is offered to the clinic’s players${r.reason ? ` · “${esc(r.reason)}”` : ''}.`,
        `<button class="btn btn-sm btn-soft" type="button" data-cancel-req="${s.n}">Cancel request</button>${r.status === 'players' ? `<button class="p-demo" type="button" data-demo="${s.n}">Prototype: no player joins in time</button>` : ''}`);
      case 'today': return row('',
        `<button class="btn btn-sm btn-soft" type="button" data-late="${s.n}">Running late</button><button class="btn btn-sm btn-soft" type="button" data-cant="${s.n}">Can’t make it</button>`);
      case 'attended': { const p = P.coachPaidOf(s); return row(c.coachFee ? `You attended. Coach fee $${c.coachFee} ${!p ? 'is due.' : p.status === 'paid' ? `paid · ${p.method}.` : `reported · ${p.method}.`}` : 'You attended.', c.coachFee && !p ? '<button class="btn btn-sm btn-primary" type="button" data-pay-coach>Pay coach fee</button>' : ''); }
      case 'replaced': return row(`${esc(r.by)} took your spot. You’re off this session and won’t pay its coach fee.`, '');
      case 'open': return row(`${esc(open.who)} can’t make it${open.reason ? ` · ${esc(open.reason)}` : ''}.${c.role === 'Player' ? ' You can join, even past your share.' : ' Players had their chance, so it’s open to substitutes.'}`, `<button class="btn btn-sm btn-soft" type="button" data-dismiss="${s.n}">Not interested</button><button class="btn btn-sm btn-primary" type="button" data-join="${s.n}">Join this session</button>`);
      default: return inModal ? '' : row('Not in your share. Spots open up here when someone can’t make it.', '');
    }
  }
  function sCard(s) {
    const st = P.statusOf(s), mv = c.moved?.[s.n];
    const joined = P.state.joined[`${c.id}:${s.n}`];
    return `<article class="s-card p-scard ${st.kind}" id="s-${s.n}">
      <div class="s-top">
        <div class="datebox"><small>${P.fmt(s.date, { month: 'short' }).toUpperCase()}</small><b>${P.fmt(s.date, { day: 'numeric' })}</b></div>
        <div class="s-main">
          <div class="s-info">
            <div class="s-title"><h3>Session ${s.n}</h3>${st.kind === 'going' ? '' : `<span class="${tone(st)}">${esc(st.label)}</span>`}${joined ? '<span class="st st-blue">Replacement</span>' : ''}${mv && live ? '<span class="loc-tag">Moved for this session</span>' : ''}</div>
            <div class="s-cols">
              <div class="s-col"><span class="lbl"><img src="${I}calendar-blank-sm.svg" alt="">Scheduled</span><span class="val">${c.day} at ${when}</span></div>
              <div class="s-col${mv ? ' moved' : ''}"><span class="lbl"><img src="${I}map-pin-sm.svg" alt="">Venue</span><span class="val">${esc(mv ? mv.venue : `${c.location}`)}</span></div>
              <div class="s-col"><span class="lbl"><img src="${I}chalkboard-teacher.svg" alt="">Coach</span><span class="val">${c.coach ? `${face(c.coach, '')}${esc(c.coach)}` : 'No coach'}</span></div>
            </div>
          </div>
          <button class="s-view" type="button" data-view="${s.n}"><img src="${I}eye.svg" alt="">View session</button>
        </div>
      </div>
      ${actions(s)}
    </article>`;
  }

  // ---------- session modal ----------
  // A session that already happened: the coach fee and who actually played
  function doneSession(s, st) {
    const n = s.n, mv = c.moved?.[n], venue = mv ? mv.venue : c.location;
    const replaced = st.kind === 'replaced', by = replaced ? (c.replacedBy?.[n] || P.requestOf(s)?.by || 'A substitute') : null;
    // who played: everyone else, you (or the person who took your spot)
    const others = P.participants(s).filter(p => !p.me && !p.out && !(replaced && p.name === by));
    const roster = replaced
      ? [...others.map(p => ({ ...p })), { name: by, role: P.requestOf(s)?.byRole || 'Substitute', replacement: true }, { name: P.PLAYER.name, role: 'Player', me: true, out: true }]
      : [{ name: P.PLAYER.name, role: 'Player', me: true, replacement: !!P.state.joined[`${c.id}:${n}`] }, ...others];
    const played = roster.filter(p => !p.out).length;
    // coach fee for this one session
    const paid = live ? P.coachPaidOf(s) : { method: c.paidFacility?.method || 'Stripe', status: 'paid' };
    const fee = !c.coachFee ? null
      : replaced ? { amt: '$0', pill: '<span class="st st-gray">Not charged</span>', note: `${esc(by.split(' ')[0])} played this one, so there’s no fee for you` }
      : !paid ? { amt: `$${c.coachFee}`, pill: '<span class="st st-yellow">Due</span>', note: 'Charged after the session · pay by card, Venmo, Zelle or cash', due: true }
      : paid.status === 'paid' ? { amt: `$${c.coachFee}`, pill: `<span class="st st-green">Paid · ${paid.method}</span>`, note: `Paid to ${esc(c.coach)}` }
      : { amt: `$${c.coachFee}`, pill: `<span class="st st-purple">${paid.method === 'Cash' ? 'Cash · to confirm' : `Reported · ${paid.method}`}</span>`, note: `Waiting for ${esc(c.coach.split(' ')[0])} to confirm` };
    return `
      <div class="m-head"><div><div class="cs-title"><h2 id="sm-title">${long(s.date)}</h2><span class="badge badge-mute">Completed</span></div><p>${P.timeRange(c)} · Session ${n} of ${c.sessions}</p></div><button class="m-x" type="button" data-close aria-label="Close"><img src="${I}x-close-sm.svg" alt=""></button></div>
      ${fee ? `<div class="cs-fee${fee.due ? ' due' : ''}">${face(c.coach)}<div class="m-who"><b>Coach fee · ${esc(c.coach)}</b><span>${fee.note}</span></div><div class="cs-amt"><b>${fee.amt}</b>${fee.pill}</div>${fee.due ? '<button class="btn btn-sm btn-primary" type="button" data-pay-coach>Pay now</button>' : ''}</div>` : ''}
      <hr class="m-hr">
      <section class="m-sec"><div class="m-sec-h"><h3>Who played</h3><span class="m-count">${played} played</span></div>
        ${roster.map(p => `<div class="m-row${p.out ? ' out' : ''}">${face(p.name)}<div class="m-who"><b${p.me ? ' data-me' : ''}>${esc(p.name)}${p.me ? ' (You)' : ''}</b><span class="m-tags"><span class="tag">${p.role}</span>${p.replacement ? '<span class="tag tag-repl">Replacement</span>' : ''}</span></div>${p.out ? '<span class="st st-gray">Replaced</span>' : '<span class="st st-green">Played</span>'}</div>`).join('')}
      </section>`;
  }

  function openSession(n) {
    const s = s$(n); modalFor = n;
    const st = P.statusOf(s), mv = c.moved?.[n], ps = P.participants(s);
    if (['attended', 'replaced'].includes(st.kind) || (live && P.isBooked(s) && P.isPlayed(s))) {
      $('#sm').innerHTML = doneSession(s, st);
      const ov = $('#session'); if (ov.hidden) { ov.hidden = false; document.body.style.overflow = 'hidden'; }
      return;
    }
    const confirmed = ps.filter(p => !p.out && !(p.me && st.kind !== 'going' && st.kind !== 'attended')).length;
    const pStatus = p => p.out ? (p.me ? '<span class="st st-gray">Replaced</span>' : '<span class="st st-gray">Can’t make it</span>')
      : p.me ? (st.kind === 'requested' ? '<span class="st st-red">Need Replacement</span>' : st.kind === 'pending' ? '<span class="st st-yellow">RSVP pending</span>' : '<span class="st st-green">Confirmed</span>')
      : '<span class="st st-green">Confirmed</span>';
    $('#sm').innerHTML = `
      <div class="m-head"><div><h2 id="sm-title">${long(s.date)}</h2><p>${P.timeRange(c)} · Session ${n} of ${c.sessions}</p></div><button class="m-x" type="button" data-close aria-label="Close"><img src="${I}x-close-sm.svg" alt=""></button></div>
      <div class="m-stats"><div><span>Confirmed</span><b>${String(confirmed).padStart(2, '0')}</b></div><div><span>Open spots</span><b>${String(Math.max(0, c.capacity - confirmed)).padStart(2, '0')}</b></div><div><span>Capacity</span><b>${String(c.capacity).padStart(2, '0')}</b></div></div>
      <hr class="m-hr">
      ${actions(s, true)}
      <section class="m-sec"><h3>Location</h3>
        <div class="m-row loc${mv ? ' moved' : ''}"><span class="loc-ic"><img src="${I}map-pin-24.svg" alt=""></span><div class="m-who"><b>${esc(mv ? mv.venue : c.location)}</b><span>${mv ? `Moved for this session · ${esc(mv.reason)}` : `Clinic location · ${esc(c.court || '')}`}</span></div></div></section>
      <hr class="m-hr">
      <section class="m-sec"><h3>Coach</h3>
        ${c.coach ? `<div class="m-row coach">${face(c.coach)}<div class="m-who"><b>${esc(c.coach)}</b><span>Clinic coach</span></div><span class="m-fee">$${c.coachFee}<small>/player</small></span><span class="st st-green">Confirmed</span></div>`
          : '<div class="m-row coach"><span class="initials m-av">—</span><div class="m-who"><b>No coach</b><span>Players pay the facility share only</span></div></div>'}</section>
      <hr class="m-hr">
      <section class="m-sec"><div class="m-sec-h"><h3>Session Participants</h3><span class="m-count">${confirmed} Confirmed</span></div>
        ${ps.map(p => `<div class="m-row${p.out ? ' out' : ''}">${face(p.name)}<div class="m-who"><b${p.me ? ' data-me' : ''}>${esc(p.name)}${p.me ? ' (You)' : ''}</b><span class="m-tags"><span class="tag">${p.role}</span>${p.replacement ? '<span class="tag tag-repl">Replacement</span>' : ''}</span></div>${pStatus(p)}${p.me && ['going', 'today'].includes(st.kind) ? `<button class="btn btn-sm btn-outline m-cant" type="button" data-cant="${n}">Can’t make it</button>` : ''}</div>`).join('')}
      </section>`;
    const ov = $('#session'); if (ov.hidden) { ov.hidden = false; document.body.style.overflow = 'hidden'; }
  }

  // 'Want to play more?' can be dismissed; it stays hidden for this clinic
  const MORE_KEY = 'cs-player-more-hidden';
  const moreHidden = () => { try { return JSON.parse(localStorage.getItem(MORE_KEY) || '[]').includes(c.id); } catch { return false; } };
  const hideMore = () => { try { const l = JSON.parse(localStorage.getItem(MORE_KEY) || '[]'); l.push(c.id); localStorage.setItem(MORE_KEY, JSON.stringify(l)); } catch {} };

  // ---------- fees ----------
  // Coach fee: one per session you attend (booked or joined, not replaced/cancelled)
  // Coach fee: charged per session you attend, and only after it happens (no paying in advance)
  function coachFees() {
    const chargeable = c.coachFee ? P.booked(c).filter(s => !['replaced', 'cancelled', 'other', 'missed'].includes(P.statusOf(s).kind)) : [];
    if (!live) return { chargeable, due: [], reported: [], upcoming: [], paidAmt: chargeable.length * c.coachFee };
    const played = chargeable.filter(P.isPlayed);
    return {
      chargeable,
      due: played.filter(s => !P.coachPaidOf(s)),
      reported: played.filter(s => P.coachPaidOf(s)?.status === 'reported'),
      upcoming: chargeable.filter(s => !P.isPlayed(s) && P.statusOf(s).kind !== 'today'),
      today: chargeable.find(s => P.statusOf(s).kind === 'today') || null,
      paidAmt: played.filter(s => P.coachPaidOf(s)?.status === 'paid').length * c.coachFee,
    };
  }
  // Prototype steps through a session's life: upcoming → session day (before it starts) → attended (fee due)
  const demoBtn = cf => !live || !c.coachFee ? '' : cf.today ? '<button class="p-demo" type="button" data-play-next>Prototype: finish today’s session</button>'
    : !cf.due.length && cf.upcoming.length ? '<button class="p-demo" type="button" data-session-day>Prototype: it’s session day</button>' : '';
  function coachBlock(cf) {
    const n = (k, w = 'session') => `${k} ${w}${k > 1 ? 's' : ''}`;
    return `${cf.due.length ? `<div class="p-payline due"><div><b>Coach fee due</b><span>${cf.due.map(s => `Session ${s.n} (${short(s.date)})`).join(', ')}</span></div><div class="amt"><b>$${cf.due.length * c.coachFee}</b><span class="st st-yellow">Due</span></div></div>
      <button class="btn btn-md btn-primary btn-block" type="button" data-pay-coach>Pay coach fee · $${cf.due.length * c.coachFee}</button>`
      : `<div class="p-payline"><div><b>Coach fee</b><span>$${c.coachFee} after each session you attend</span></div><div class="amt"><b>$${cf.paidAmt}</b><span class="st ${cf.reported.length ? 'st-purple' : 'st-green'}">${cf.reported.length ? 'Reported' : cf.paidAmt ? 'Paid' : 'Nothing due'}</span></div></div>`}
      ${cf.reported.length ? `<div class="p-paysum"><span>Pending</span><b>$${cf.reported.length * c.coachFee}</b></div>` : ''}
      ${cf.upcoming.length ? `<div class="p-paysum"><span>Upcoming</span><b>$${cf.upcoming.length * c.coachFee}</b></div>` : ''}
      ${cf.today ? `<div class="p-paysum today"><span>Today</span><b>$${c.coachFee}</b></div>` : ''}
      ${demoBtn(cf)}`;
  }
  const facilityLine = () => c.facilityFee ? `<div class="p-payline"><div><b>Facility fee</b><span>Paid when you accepted the invite${c.paidFacility ? ` · ${c.paidFacility.method}` : ''}</span></div><div class="amt"><b>$${c.facilityFee}</b><span class="st st-green">Paid</span></div></div>` : '';
  const METHODS = [
    ['Stripe', 'Card', 'Pay now by card. Marked paid straight away.'],
    ['Venmo', 'Venmo', () => `Send to ${c.coachHandle?.venmo || 'the coach'} on Venmo, then confirm here. ${c.coach} confirms it.`],
    ['Zelle', 'Zelle', () => `Send to ${c.coachHandle?.zelle || 'the coach'} with Zelle, then confirm here. ${c.coach} confirms it.`],
    ['Cash', 'Cash', () => `Pay ${c.coach} at the court. It shows as paid once ${c.coach.split(' ')[0]} confirms.`],
  ];
  let method = 'Stripe';
  function payTotals() {
    const n = document.querySelectorAll('#pc-list input:checked').length, amt = n * c.coachFee;
    $('#pc-total').textContent = `$${amt}`;
    const m = METHODS.find(x => x[0] === method);
    $('#pc-hint').textContent = typeof m[2] === 'function' ? m[2]() : m[2];
    $('#pc-go').textContent = !n ? 'Choose a session' : method === 'Stripe' ? `Pay $${amt}` : method === 'Cash' ? `I’ll pay $${amt} in cash` : `I’ve sent $${amt}`;
    $('#pc-go').disabled = !n;
  }
  function openPayCoach() {
    const { due: unpaid } = coachFees();
    $('#pc-lead').textContent = `${c.coach} · $${c.coachFee} per session you attend`;
    $('#pc-list').innerHTML = unpaid.map(s => `<label class="pc-row"><input type="checkbox" value="${s.n}" checked><span><b>Session ${s.n}</b><small>${long(s.date)}</small></span><b>$${c.coachFee}</b></label>`).join('');
    method = 'Stripe';
    $('#pc-methods').innerHTML = METHODS.map(([k, l]) => `<label class="pc-method"><input type="radio" name="pc-m" value="${k}"${k === method ? ' checked' : ''}><span>${l}</span></label>`).join('');
    payTotals(); $('#pay-coach').hidden = false; document.body.style.overflow = 'hidden';
  }
  document.addEventListener('change', e => { if (e.target.closest('#pc-list')) payTotals(); if (e.target.name === 'pc-m') { method = e.target.value; payTotals(); } });

  // ---------- tabs ----------
  const statBox = (label, val, small) => `<div><span>${label}</span><b>${val}${small ? `<small>${small}</small>` : ''}</b></div>`;
  function personRow(name, role, note, me) {
    return `<div class="pl-row">${face(name, 'pl-av')}<div class="pl-who"><span class="pl-name"><b>${esc(name)}${me ? ' (You)' : ''}</b><span class="chip">${role}</span></span>${note ? `<span class="pl-note">${esc(note)}</span>` : ''}</div>${me ? '<span class="dc-gap"></span>' : chatBtn(name, role)}</div>`;
  }
  const TABS = {
    overview() {
      // your next three sessions (booked or joined, not handed to someone else)
      const upcoming = P.booked(c).filter(s => s.date >= P.TODAY && !['replaced', 'attended'].includes(P.statusOf(s).kind) && !P.isPlayed(s)).slice(0, 3);
      const open = live ? P.openSpots(c) : [];
      const stats = live
        ? (c.role === 'Substitute' ? statBox('Your role', 'Sub') + statBox('Sessions taken', String(mine.length).padStart(2, '0')) + statBox('Open spots', String(open.length).padStart(2, '0'))
          : statBox('Your sessions', String(mine.length).padStart(2, '0'), `/${String(c.sessions).padStart(2, '0')}`) + statBox('Attended', String(P.booked(c).filter(P.isPlayed).length).padStart(2, '0')) + statBox('Open spots', String(open.length).padStart(2, '0')))
        : statBox('Attended', String(att).padStart(2, '0'), `/${String(mine.length).padStart(2, '0')}`) + statBox('Replaced', String(rep).padStart(2, '0')) + statBox('Sessions run', String(c.sessions).padStart(2, '0'));
      const nextSec = live && upcoming.length ? `<section class="ov-sessions"><div class="section-head"><h2 class="h2">Your upcoming sessions</h2><button class="link" type="button" data-goto="sessions">All sessions<img class="icon" src="${I}caret-right.svg" alt=""></button></div><div class="ov-list">${upcoming.map(sCard).join('')}</div></section>` : '';
      // Finished clinics: your sessions as history, filling the overview
      const pastSec = !live && mine.length ? `<section class="ov-sessions"><div class="section-head"><h2 class="h2">Your sessions</h2><button class="link" type="button" data-goto="sessions">All sessions<img class="icon" src="${I}caret-right.svg" alt=""></button></div><div class="ov-list">${mine.slice(0, 3).map(sCard).join('')}</div></section>` : '';
      // Open spots live on the overview: sessions someone can't make, which you can join
      const openSec = live && open.length ? `<section class="ov-sessions ov-open" id="open-spots"><div class="section-head"><h2 class="h2 with-count">Open spots <span class="count">${open.length}</span></h2></div><div class="ov-list">${open.map(sCard).join('')}</div></section>` : '';
      const more = live && c.role === 'Player' && !moreHidden() ? `<div class="p-more"><span class="p-more-ic"><img src="${I}user-plus.svg" alt=""></span><div><b>Want to play more?</b><span>You can join extra sessions when a replacement spot opens, even after reaching your share limit.${open.length ? ` ${open.length} spot${open.length > 1 ? 's are' : ' is'} open below.` : ''}</span></div><button class="p-more-x" type="button" data-hide-more aria-label="Dismiss"><img src="${I}x.svg" alt=""></button></div>` : '';
      // Only what the header (dates, schedule, location) and the coach row (coach fee) don't already say
      const [h1, h2] = c.start.split(':').map(Number), [e1, e2] = c.end.split(':').map(Number);
      const about = `<section class="p-about"><h2 class="h2">About this clinic</h2><dl class="p-dl">
        <div><dt>Your share</dt><dd>${esc(c.share)}${c.allowed ? ` · ${c.allowed} of ${c.sessions}` : ''}</dd></div>
        <div><dt>Sessions</dt><dd>${c.sessions} × ${(e1 * 60 + e2) - (h1 * 60 + h2)} min</dd></div>
        ${c.court ? `<div><dt>Courts</dt><dd>${esc(c.court)}</dd></div>` : ''}</dl></section>`;
      // Payment overview: facility fee (paid when you accepted the invite) + coach fee (per session you attend)
      const cf = coachFees();
      const payCard = (c.facilityFee || c.coachFee) ? `<section class="p-paycard"><div class="ovc-head"><h2 class="h2">Payments</h2><button class="link" type="button" data-goto="payments">View all<img class="icon" src="${I}caret-right.svg" alt=""></button></div>
        ${facilityLine()}
        ${c.coachFee ? coachBlock(cf) : ''}
      </section>` : '';
      return `<div class="ov"><div class="ov-main"><div class="ov-stats">${stats}</div>${more}${openSec}${nextSec}${pastSec}</div>
        <aside class="ov-side"><section class="ov-coach"><div class="ovc-head"><h2 class="h2">Organizer &amp; coach</h2></div>
          ${personRow(c.organizer, 'Organizer', '')}${c.coach ? personRow(c.coach, 'Coach', `$${c.coachFee} per session`) : ''}</section>
          ${payCard}
          ${about}
        </aside></div>`;
    },
    sessions() {
      // Only the sessions in your share (picked when you accepted the invite) and extra spots you joined; open spots are on the Overview
      const list = sessions.filter(P.isBooked);
      return `<div class="ss"><div class="ss-bar"><span class="muted">${c.allowed ? `Your ${esc(c.share)} · ${mine.length} of ${c.sessions} sessions` : `Substitute · ${c.sessions} sessions`}</span></div>
        <div class="ss-list">${list.map(sCard).join('') || `<p class="muted">You haven’t taken any sessions yet. Open spots show up on the Overview.</p>`}</div></div>`;
    },
    players() {
      const sec = (title, rows) => `<section class="pl-sec"><h2 class="h2">${title}</h2><div class="pl-list">${rows}</div></section>`;
      const booked = n => n === P.PLAYER.name ? `${mine.length} of ${c.sessions} sessions` : `${c.allowed || 4} of ${c.sessions} sessions`;
      return `<div class="pl">${sec('Organizer &amp; coach', personRow(c.organizer, 'Organizer', '') + (c.coach ? personRow(c.coach, 'Coach', `$${c.coachFee} per session`) : ''))}
        ${sec(`Players (${c.players.length})`, c.players.map(n => personRow(n, 'Player', `Plays ${booked(n)}`, n === P.PLAYER.name)).join(''))}
        ${c.subs.length ? sec(`Substitutes (${c.subs.length})`, c.subs.map(n => personRow(n, 'Substitute', 'On the substitute list', n === P.PLAYER.name)).join('')) : ''}</div>`;
    },
    payments() {
      const rows = [];
      if (c.facilityFee) rows.push([`Facility fee · ${c.share}`, c.paidFacility ? c.paidFacility.on : short(sessions[0].date), `$${c.facilityFee}.00`, `<span class="st st-green">Paid${c.paidFacility ? ` · ${c.paidFacility.method}` : ''}</span>`]);
      const cf = coachFees();
      for (const s of mine) {
        if (!c.coachFee) break;
        const st = P.statusOf(s), label = `Coach fee · Session ${s.n}${P.state.joined[`${c.id}:${s.n}`] ? ' (extra)' : ''}`;
        if (st.kind === 'replaced') { rows.push([label, short(s.date), '—', '<span class="st st-gray">Not charged · replaced</span>']); continue; }
        if (st.kind === 'cancelled') { rows.push([label, short(s.date), '—', '<span class="st st-gray">Not charged · session cancelled</span>']); continue; }
        const p = live ? P.coachPaidOf(s) : { method: c.paidFacility?.method || 'Stripe', status: 'paid' };
        if (live && !P.isPlayed(s)) { rows.push([label, short(s.date), `$${c.coachFee}.00`, '<span class="muted">—</span>']); continue; }
        rows.push([label, short(s.date), `$${c.coachFee}.00`, !p ? '<span class="st st-yellow">Due</span>'
          : p.status === 'paid' ? `<span class="st st-green">Paid · ${p.method}</span>` : `<span class="st st-purple">${p.method === 'Cash' ? 'Cash · to confirm' : `Reported · ${p.method}`}</span>`]);
      }
      const sum = statBox('Facility fee', c.facilityFee ? `$${c.facilityFee}` : '$0') + statBox('Coach fees paid', `$${cf.paidAmt}`)
        + statBox(live ? 'Coach fee due now' : 'Outstanding', `$${cf.due.length * c.coachFee}`);
      const btn = live && cf.due.length ? `<button class="btn btn-md btn-primary" type="button" data-pay-coach>Pay coach fee · $${cf.due.length * c.coachFee}</button>` : demoBtn(cf);
      return `<div class="p-pay"><div class="ov-stats">${sum}</div>${btn ? `<div class="p-pay-head">${btn}</div>` : ''}
        ${rows.length ? `<div class="p-pay-table" role="table"><div class="p-pay-row head" role="row"><span>Item</span><span>Date</span><span>Amount</span><span>Status</span></div>${rows.map(r => `<div class="p-pay-row" role="row">${r.map(x => `<span>${x}</span>`).join('')}</div>`).join('')}</div>` : '<p class="muted">Nothing to pay yet.</p>'}</div>`;
    },
  };
  function render() {
    document.querySelectorAll('#c-tabs [data-tab]').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    $('#c-banner').hidden = c.status === 'completed' && tab !== 'overview';
    $('#c-body').innerHTML = TABS[tab]();
    if (modalFor && !$('#session').hidden) openSession(modalFor);
  }
  const go = t => { tab = t; const u = new URL(location); u.searchParams.set('tab', t); u.searchParams.delete('open'); u.searchParams.delete('join'); history.replaceState(null, '', u); render(); };

  // ---------- events ----------
  document.addEventListener('click', e => {
    const t = e.target;
    const b = (sel) => t.closest(sel);
    if (b('#c-tabs [data-tab]')) return go(b('#c-tabs [data-tab]').dataset.tab);
    if (b('[data-goto]')) return go(b('[data-goto]').dataset.goto);
    if (b('[data-view]')) return openSession(+b('[data-view]').dataset.view);
    if (b('[data-going]')) { const s = s$(+b('[data-going]').dataset.going); P.setRsvp(s, 'going'); window.toast(`You’re going on ${short(s.date)}`); return render(); }
    if (b('[data-cant]')) { actFor = s$(+b('[data-cant]').dataset.cant); $('#rp-lead').textContent = `${long(actFor.date)} · ${P.timeRange(c)} · Session ${actFor.n}`; $('#rp-reason').value = ''; $('#replace').hidden = false; return; }
    if (b('[data-cancel-req]')) { const s = s$(+b('[data-cancel-req]').dataset.cancelReq); P.cancelRequest(s); window.toast('Request cancelled. You’re back in the session.'); return render(); }
    if (b('[data-demo]')) {
      const s = s$(+b('[data-demo]').dataset.demo); P.toSubs(s); render(); window.toast('No player joined in time. Your spot went to the substitutes.');
      setTimeout(() => { P.fillRequest(s, 'Maria Lopez', 'Substitute'); render(); window.toast('Maria Lopez took your spot'); }, 1800);
      return;
    }
    if (b('[data-hide-more]')) { hideMore(); return render(); }
    if (b('[data-dismiss]')) { const x = s$(+b('[data-dismiss]').dataset.dismiss); P.dismissSpot(x); $('#session').hidden = true; modalFor = null; document.body.style.overflow = ''; window.toast(`Session ${x.n} hidden. You’ll still get a notification when another spot opens.`); return render(); }
    if (b('[data-join]')) return openJoin(+b('[data-join]').dataset.join);
    if (b('#session [data-close]') || t.id === 'session') modalFor = null;
    if (b('#reset-demo')) { P.reset(); location.reload(); }
  });
  function openJoin(n) {
      actFor = s$(n);
      $('#jn-date').textContent = long(actFor.date);
      $('#jn-time').textContent = P.timeRange(c);
      $('#jn-loc').textContent = c.location;
      $('#jn-role').textContent = c.role;
      $('#jn-fee').textContent = `$${(c.coachFee || 0).toFixed(2)}`;
      $('#join').hidden = false; document.body.style.overflow = 'hidden';
  }
  document.addEventListener('click', e => {
    const t = e.target, b = (sel) => t.closest(sel);
    if (b('[data-pay-coach]')) return openPayCoach();
    if (b('[data-session-day]')) { const x = P.sessionDay(c); if (x) window.toast(`It’s session day: Session ${x.n} starts at ${when}.`); return render(); }
    if (b('[data-late]')) return window.toast(`Posted in the clinic chat: “Running a few minutes late.” ${c.organizer.split(' ')[0]} and the group can see it.`);
    if (b('[data-play-next]')) { const x = P.playNext(c); if (x) window.toast(`Session ${x.n} on ${short(x.date)} is done. Its $${c.coachFee} coach fee is now due.`); return render(); }
    if (b('[data-chat]')) { const x = b('[data-chat]'); return DirectChat.open({ name: x.dataset.chat, role: x.dataset.role, photo: photo(x.dataset.chat), ctx: ' · ' + c.name }); }
  });
  $('#rp-go').addEventListener('click', () => {
    P.requestReplacement(actFor, $('#rp-reason').value.trim()); $('#replace').hidden = true;
    window.toast('Replacement requested. Your spot is offered to the clinic’s players.'); render();
  });
  $('#pc-go').addEventListener('click', () => {
    const picked = [...document.querySelectorAll('#pc-list input:checked')].map(i => s$(+i.value));
    P.payCoach(picked, method); $('#pay-coach').hidden = true; document.body.style.overflow = '';
    const amt = picked.length * c.coachFee;
    window.toast(method === 'Stripe' ? `Paid $${amt} to ${c.coach}` : method === 'Cash' ? `Marked $${amt} as cash. ${c.coach.split(' ')[0]} will confirm.` : `Reported $${amt} via ${method}. ${c.coach.split(' ')[0]} will confirm.`);
    render();
  });
  $('#jn-go').addEventListener('click', () => {
    P.joinSpot(actFor); $('#join').hidden = true; document.body.style.overflow = '';
    window.toast(`You joined Session ${actFor.n} on ${short(actFor.date)}`); render();
  });

  if (q.get('join') && sessions[+q.get('join') - 1] && P.statusOf(s$(+q.get('join'))).kind === 'open') { tab = 'overview'; render(); openJoin(+q.get('join')); const u = new URL(location); u.searchParams.delete('join'); history.replaceState(null, '', u); }
  else if (q.get('open') && sessions[+q.get('open') - 1]) { const n = +q.get('open'); if (!q.get('tab')) tab = P.statusOf(s$(n)).kind === 'open' ? 'overview' : 'sessions'; render(); openSession(n); }
  else render();
})();

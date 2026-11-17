/* Coach dashboard (organizer dashboard layout): stats, active clinics by role, what needs attention
   (invitations, coverage requests, reschedule requests, replacements, payments to confirm), upcoming sessions, payments. */
(() => {
  const D = CoachData, U = CoachUI, $ = s => document.querySelector(s), { esc, st, first } = U;
  const I = U.I, pad = n => String(n).padStart(2, '0');
  let role = 'all';
  if (new URLSearchParams(location.search).get('welcome')) setTimeout(() => window.toast('Welcome to ClinicSync, Maria! Your invitation is waiting below.'), 300);

  function render() {
    const all = D.allClinics(), active = all.filter(c => c.status === 'active'), coach = all.filter(c => c.role !== 'Player');
    const up = D.upcoming(), pend = D.INVITES.filter(v => D.inviteStatus(v) === 'pending');
    const coached = coach.flatMap(D.sessionsOf).filter(s => D.isPast(s) && !s.clinic.cancelled?.[s.n] && !D.coveredBy(s)).length;
    $('#stats').innerHTML = [['Active clinics', active.length], ['Completed clinics', all.filter(c => c.status === 'completed').length], ['Sessions coached', coached], ['Upcoming sessions', up.length]]
      .map(([l, v]) => `<div><span>${l}</span><b>${pad(v)}</b></div>`).join('');

    // ---- active clinics, filtered by role (the roles on her plan) ----
    const roleOf = c => c.role === 'Covering' ? 'Coach' : c.role;
    const cnt = r => active.filter(c => r === 'all' || roleOf(c) === r).length;
    $('#role-pills').innerHTML = [['all', 'All'], ['Organizer', 'Organizer'], ['Player', 'Player'], ['Substitute', 'Substitute'], ['Coach', 'Coach']]
      .map(([k, l]) => `<button type="button" data-role="${k}" class="${role === k ? 'on' : ''}"${cnt(k) ? '' : ' disabled'}>${l} (${cnt(k)})</button>`).join('');
    $('#clinic-list').innerHTML = active.filter(c => role === 'all' || roleOf(c) === role).map(c => {
      const next = D.sessionsOf(c).find(s => !D.isPast(s));
      const href = c.role === 'Player' ? '/player/clinic.html?id=monday' : `clinic.html?id=${c.id}`;
      const chips = `<span class="chip">${c.role === 'Covering' ? 'Coach' : c.role}</span>${c.cover ? `<span class="chip chip-cover">Covering for ${esc(first(c.cover.for))}</span>` : ''}${c.fresh ? '<span class="chip chip-new">New</span>' : ''}`;
      const sched = c.cover ? `${D.day(c.cover.date)} • ${c.time} • Session ${c.cover.n} only` : `Every ${c.days.replace(/s$/, '')} • ${c.time}`;
      const people = c.role === 'Player' ? `Organized by ${esc(c.organizer)}` : `${c.players.length || c.capacity} players • ${c.sessions} session${c.sessions > 1 ? 's' : ''} • $${c.fee}/player`;
      return `<article class="card clinic-card">
        <div class="cc-body">
          <div class="cc-title"><h3 class="h3">${esc(c.name)}</h3><div class="chips">${chips}</div></div>
          <div class="meta-list">
            <span class="meta-row"><img class="icon" src="${I}calendar-blank.svg" alt="">${sched}</span>
            <span class="meta-row"><img class="icon" src="${I}map-pin.svg" alt="">${esc(c.location)}</span>
            <span class="meta-row"><img class="icon" src="${I}users.svg" alt="">${people}</span>
          </div>
        </div>
        <a class="link" href="${href}">View Clinic<img class="icon" src="${I}caret-right.svg" alt=""></a>
      </article>`;
    }).join('');

    // ---- needs your attention ----
    const items = [];
    const item = (ic, title, sub, btns, extra = '') => `<div class="attn"><span class="attn-ic ${ic[0]}"><img class="icon-20" src="${I}${ic[1]}" alt=""></span><div class="attn-body"><b>${title}</b><span>${sub}</span>${extra}<div class="attn-actions">${btns}</div></div></div>`;
    for (const v of pend) {
      const cf = D.conflictOf(v);
      items.push(v.type === 'coverage'
        ? item(['info', 'user-switch.svg'], 'Coverage request', `${esc(v.from)} · ${esc(v.name)} · ${D.day(v.date)}, ${v.time}`, `<a class="btn btn-sm btn-outline" href="invitation.html?id=${v.id}">Review</a>`)
        : item(['info', 'envelope.svg'], 'Coaching invitation', `${esc(v.name)} · from ${esc(v.from)} · $${v.fee}/player`, `<a class="btn btn-sm btn-outline" href="invitation.html?id=${v.id}">Review</a>`, cf ? `<span class="attn-warn">Clashes with ${esc(cf.clinic.name)} on ${D.short(cf.s.date)}</span>` : ''));
    }
    for (const s of up) {
      const k = D.statusOf(s).kind, key = D.key(s.clinic, s.n), r = s.clinic.reschedule?.[s.n], u = D.unavailOf(s);
      if (k === 'resched') items.push(item(['warn', 'calendar-blank-20.svg'], 'Reschedule request', `${U.sLabel(s)} → ${D.day(r.date)} · ${esc(r.time)}`, `<button class="btn btn-sm btn-outline" type="button" data-rs="${key}">Review</button>`));
      if (k === 'unavail' && u.mode === 'self' && u.invited.at(-1)?.status === 'declined') items.push(item(['danger', 'user-switch.svg'], `${esc(first(u.invited.at(-1).name))} can’t cover`, `${U.sLabel(s)} · ${D.day(s.date)}`, `<button class="btn btn-sm btn-outline" type="button" data-again="${key}">Invite another coach</button><button class="btn btn-sm btn-soft" type="button" data-orgfix="${key}">Let the organizer arrange it</button>`));
    }
    const e = D.earnings();
    for (const r of e.rows.filter(r => r.pay.status === 'reported')) items.push(item(['purple', 'check-circle.svg'], 'Confirm a payment', `${esc(r.player)} paid $${r.amt} by ${r.pay.method} · ${esc(r.s.clinic.name)} · ${D.short(r.s.date)}`, `<button class="btn btn-sm btn-outline" type="button" data-confirm="${D.key(r.s.clinic, r.s.n)}|${esc(r.player)}|${r.pay.method}">Confirm</button>`));
    $('#attn-count').textContent = items.length; $('#attn-count').hidden = !items.length;
    $('#attn').innerHTML = items.join('') || '<p class="muted">You’re all caught up.</p>';

    // ---- upcoming sessions ----
    $('#upcoming').innerHTML = up.slice(0, 3).map(s => { const t = D.statusOf(s);
      return `<a class="up" href="clinic.html?id=${s.clinic.id}&tab=sessions&s=${s.n}">
        <span class="datebox"><small>${D.fmt(s.date, { month: 'short' })}</small><b>${D.fmt(s.date, { day: 'numeric' })}</b></span>
        <span class="up-body"><b>${esc(s.clinic.name)}</b><span>${D.timeOf(s)} · ${esc(s.clinic.location)}</span>${['upcoming', 'today'].includes(t.kind) ? '' : `<span class="up-note">${st(t.tone, t.label)}</span>`}</span>
        <span class="badge ${s.clinic.cover ? 'badge-info' : 'badge-purple'}">${s.clinic.cover ? 'Covering' : 'Coach'}</span>
        <img class="icon" src="${I}chevron-right.svg" alt=""></a>`; }).join('') || '<p class="muted">No upcoming sessions.</p>';

    // ---- payments (by role) ----
    const dueClinics = new Set(e.rows.filter(r => r.pay.status !== 'paid').map(r => r.s.clinic.name));
    const duePlayers = new Set(e.rows.filter(r => r.pay.status !== 'paid').map(r => r.player));
    $('#pay-card').innerHTML = `<h2 class="h2">Payments</h2>
      <div class="pay-row"><div><b>Coaching Earnings</b><strong>$${e.total.toLocaleString()}.00</strong><span>$${e.received.toLocaleString()} received across ${coach.length} clinics</span></div><span class="chip">Coach</span></div>
      <div class="pay-row"><div><b>Outstanding Coaching Fees</b><strong class="due">$${e.due + e.reported}.00</strong><span>From ${duePlayers.size} players across ${dueClinics.size} clinics${e.reported ? ` · $${e.reported} to confirm` : ''}</span></div><span class="chip">Coach</span></div>
      <div class="pay-row"><div><b>My Payments Due</b><strong>$50.00</strong><span>Coach fees · Monday Morning Tennis</span></div><span class="chip">Player</span></div>
      <a class="btn btn-lg btn-primary btn-block" href="payments.html">Review payments</a>`;
  }

  const sOf = key => { const [id, n] = key.split(':'); return D.sessionsOf(D.clinic(id)).find(x => x.n === +n); };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-role],[data-rs],[data-again],[data-orgfix],[data-confirm]'); if (!b) return;
    if (b.dataset.role) { role = b.dataset.role; return render(); }
    if (b.dataset.rs) return U.resched(sOf(b.dataset.rs), render);
    if (b.dataset.again) { U.pickCoach(sOf(b.dataset.again), render); return; }
    if (b.dataset.orgfix) { const s = sOf(b.dataset.orgfix); D.state.unavail[b.dataset.orgfix].mode = 'org'; D.save(); window.toast('The organizer will arrange a replacement.'); return render(); }
    if (b.dataset.confirm) { const [key, p, m] = b.dataset.confirm.split('|'); return U.record(sOf(key), p, render, m); }
  });
  render();
})();

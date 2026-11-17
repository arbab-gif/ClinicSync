/* Coach Clinics list: Active · Completed · Invitations (Pending / Accepted / Declined), same cards as the organizer's Clinics. */
(() => {
  const D = CoachData, $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = '/organizer/assets/icons/';
  const q = new URLSearchParams(location.search);
  let status = ['active', 'completed', 'invitations'].includes(q.get('tab')) ? q.get('tab') : 'active';
  let pill = status === 'invitations' ? 'pending' : 'all';
  const coachClinics = () => D.allClinics().filter(c => c.role !== 'Player');

  function card(c) {
    const ss = D.sessionsOf(c), range = c.cover ? D.day(c.cover.date) : `${D.short(ss[0].date)} – ${D.short(ss.at(-1).date)}`;
    const roleChip = c.cover ? `<span class="chip chip-cover">Covering for ${esc(c.cover.for)}</span>` : '<span class="chip">Coach</span>';
    const head = `<div class="cl-top"><div class="cc-title"><h3 class="h3">${esc(c.name)}</h3><div class="chips">${roleChip}<span class="chip">${c.sport}</span></div></div>`;
    const meta = `<div class="meta-list">
      <span class="meta-row"><img class="icon" src="${I}calendar-blank.svg" alt="">${range} · ${c.cover ? `Session ${c.cover.n} only` : c.days}, ${c.time}</span>
      <span class="meta-row"><img class="icon" src="${I}map-pin.svg" alt="">${esc(c.location)}</span>
      <span class="meta-row"><img class="icon" src="${I}users.svg" alt="">Organized by ${esc(c.organizer)} · ${c.players.length || c.capacity} players · $${c.fee} per player</span></div>`;
    const href = `clinic.html?id=${c.id}`;
    if (c.status === 'completed') {
      const e = D.earnings([c]);
      return `<a class="card card-lg cl-card cl-past" href="${href}">${head}<span class="badge badge-mute">Completed</span></div>${meta}
        <dl class="cl-result"><div><dt>Sessions coached</dt><dd>${ss.length}</dd></div><div><dt>Earned</dt><dd>$${e.total}</dd></div><div><dt>Fees</dt><dd class="ok">${e.due ? `$${e.due} due` : 'All paid'}</dd></div></dl>
        <div class="cl-foot"><span class="note">Ended ${D.short(ss.at(-1).date)}</span><span class="link">View history<img class="icon" src="${I}caret-right.svg" alt=""></span></div></a>`;
    }
    const next = ss.find(s => !D.isPast(s) && !c.cancelled?.[s.n]);
    const started = ss[0].date <= D.TODAY;
    const badge = started ? '<span class="badge badge-ok">Active</span>' : `<span class="badge badge-warn">Starts ${D.short(ss[0].date)}</span>`;
    const t = next && D.statusOf(next);
    const nextRow = next ? `<div class="cl-next"><span class="datebox"><small>${D.fmt(next.date, { month: 'short' })}</small><b>${D.fmt(next.date, { day: 'numeric' })}</b></span><span class="cl-next-body"><small>Next session</small><b>Session ${next.n} · ${D.dayOf(next)}, ${D.timeOf(next)}</b></span>${['upcoming', 'today'].includes(t.kind) ? '' : `<span class="st st-${t.tone}">${esc(t.label)}</span>`}</div>` : '';
    const e = D.earnings([c]);
    const note = c.fresh ? 'Just added to your schedule' : e.due + e.reported ? `<span class="note brand">$${e.due + e.reported} in coaching fees outstanding</span>` : c.cover ? `Covering for ${esc(c.cover.for)} · fee tracked separately` : 'All coaching fees paid';
    return `<a class="card card-lg cl-card${c.cover ? ' cl-cover-card' : ''}" href="${href}">${head}${badge}</div>${meta}${nextRow}<div class="cl-foot"><span class="note">${note}</span><span class="link">View clinic<img class="icon" src="${I}caret-right.svg" alt=""></span></div></a>`;
  }

  function invRow(v) {
    const s = D.inviteStatus(v), cf = s === 'pending' && D.conflictOf(v), a = D.state.inv[v.id] || {};
    const total = v.fee * v.players * v.sessions;
    const tag = v.type === 'coverage' ? '<span class="chip chip-cover">Coverage request</span>' : '<span class="chip">Clinic invitation</span>';
    const when = v.type === 'coverage' ? `${D.day(v.date)} · ${v.time} · Session ${v.n} only` : `${v.days}, ${v.time} · ${v.sessions} sessions from ${D.short(v.start)}`;
    const pillS = { pending: cf ? '<span class="st st-red">Schedule clash</span>' : '<span class="st st-yellow">Waiting for you</span>', accepted: `<span class="st st-green">Accepted${a.on || v.on ? ` · ${a.on || v.on}` : ''}</span>`, declined: `<span class="st st-gray">Declined${a.on || v.on ? ` · ${a.on || v.on}` : ''}</span>` }[s];
    const reason = s === 'declined' && (a.reason || v.reason) ? `<span class="inv-reason">“${esc(a.reason || v.reason)}”</span>` : '';
    const av = D.photo(v.from) ? `<img class="inv-av" src="${D.photo(v.from)}" alt="">` : `<span class="initials inv-av">${v.from.split(' ').map(w => w[0]).join('')}</span>`;
    return `<a class="inv-row" href="invitation.html?id=${v.id}">${av}
      <div class="inv-row-body"><div class="inv-row-t"><h3>${esc(v.name)}</h3></div>
        <span class="inv-row-from">${v.type === 'coverage' ? `${esc(v.from)} asked you to cover · organizer ${esc(v.organizer)}` : `From ${esc(v.from)}`} · ${v.received}</span>
        <span class="meta-row"><img class="icon" src="${I}calendar-blank.svg" alt="">${when}</span>
        <span class="meta-row"><img class="icon" src="${I}map-pin.svg" alt="">${esc(v.location)}${v.court ? ` · ${esc(v.court)}` : ''}</span>${reason}</div>
      <div class="inv-row-side"><b>$${v.fee}<small>/player</small></b><span class="link">${s === 'pending' ? 'Review' : 'View'}<img class="icon" src="${I}caret-right.svg" alt=""></span></div></a>`;
  }

  function render() {
    const term = $('#clinic-q').value.trim().toLowerCase();
    const cs = coachClinics(), counts = { active: cs.filter(c => c.status === 'active').length, completed: cs.filter(c => c.status === 'completed').length, invitations: D.INVITES.filter(v => D.inviteStatus(v) === 'pending').length };
    document.querySelectorAll('#status-tabs [data-status]').forEach(b => { const on = b.dataset.status === status; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.querySelector('.tab-count').textContent = counts[b.dataset.status]; });
    const inv = status === 'invitations';
    $('#clinics').hidden = inv; $('#invites').hidden = !inv;
    if (inv) {
      const n = k => D.INVITES.filter(v => D.inviteStatus(v) === k).length;
      $('#pills').innerHTML = ['pending', 'accepted', 'declined'].map(k => `<button type="button" data-pill="${k}" class="${pill === k ? 'on' : ''}">${k[0].toUpperCase() + k.slice(1)} (${n(k)})</button>`).join('');
      const list = D.INVITES.filter(v => D.inviteStatus(v) === pill && v.name.toLowerCase().includes(term));
      $('#invites').innerHTML = list.map(invRow).join('');
      $('#clinics-empty').hidden = !!list.length; $('#clinics-empty').textContent = pill === 'pending' ? 'No invitations waiting for you.' : `No ${pill} invitations.`;
      return;
    }
    const roles = { all: 'All', Coach: 'Coach', Covering: 'Covering' };
    const inTab = cs.filter(c => c.status === status);
    $('#pills').innerHTML = Object.entries(roles).map(([k, l]) => { const n = inTab.filter(c => k === 'all' || c.role === k).length; return `<button type="button" data-pill="${k}" class="${pill === k ? 'on' : ''}"${n ? '' : ' disabled'}>${l} (${n})</button>`; }).join('');
    const list = inTab.filter(c => (pill === 'all' || c.role === pill) && c.name.toLowerCase().includes(term));
    $('#clinics').innerHTML = list.map(card).join('');
    $('#clinics-empty').hidden = !!list.length; $('#clinics-empty').textContent = 'No clinics match.';
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-status]'); if (t) { status = t.dataset.status; pill = status === 'invitations' ? 'pending' : 'all'; const u = new URL(location); u.searchParams.set('tab', status); history.replaceState(null, '', u); return render(); }
    const p = e.target.closest('[data-pill]'); if (p && !p.disabled) { pill = p.dataset.pill; render(); }
  });
  $('#clinic-q').addEventListener('input', render);
  render();
})();

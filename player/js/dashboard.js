/* Player dashboard: renders stats, upcoming sessions, clinics and activity from PlayerData. */

(() => {
  const P = window.PlayerData;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const fmt = (iso, o) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', o);
  const ICON = '../organizer/assets/icons/';
  const caret = '<img class="icon-16" src="assets/icons/caret-right-brand.svg" alt="">';

  const RSVP = {
    going: '<span class="badge p-badge badge-ok">Going</span>',
    cant: '<span class="badge p-badge badge-mute">Can’t make it</span>',
  };
  let rsvpFor = null;

  // Sessions you picked when you accepted the invite are confirmed: no RSVP step
  const BADGE = { cancelled: 'badge-danger', going: 'badge-ok', today: 'badge-info', requested: 'badge-purple', replaced: 'badge-mute', attended: 'badge-ok' };
  function sessionCard(s) {
    const c = s.clinic, st = P.statusOf(s);
    // booked sessions are simply yours: only show a badge when something is different
    const badge = st.kind === 'going' ? '' : `<span class="badge p-badge ${BADGE[st.kind] || 'badge-ok'}">${st.label}</span>`;
    return `<article class="ps">
      <span class="datebox"><small>${fmt(s.date, { month: 'short' })}</small><b>${fmt(s.date, { day: 'numeric' })}</b></span>
      <div class="ps-body">
        <div class="ps-title"><h3>${esc(c.name)}</h3>${badge}</div>
        <div class="ps-row">
          <span class="p-meta"><img src="${ICON}clock-16.svg" alt="">${s.dayLabel || c.day} · ${s.range || P.timeRange(c)}</span>
          <span class="p-meta"><img src="${ICON}map-pin-16.svg" alt="">${esc(c.location)}</span>
        </div>
        <span class="p-meta"><img src="${ICON}court-basketball.svg" alt="">Session ${s.n} of ${c.sessions}${c.names?.[s.n] ? ` · ${esc(c.names[s.n])}` : ''} · ${esc(c.share)}</span>
      </div>
      <a class="link" href="clinic.html?id=${c.id}&tab=sessions&open=${s.n}">View session${caret}</a>
    </article>`;
  }

  // Open spots: someone can't make a session, you can take it (players even past their share)
  function openCard(s) {
    const c = s.clinic, o = c.openSpots[s.n];
    return `<article class="ps ps-open">
      <span class="datebox"><small>${fmt(s.date, { month: 'short' })}</small><b>${fmt(s.date, { day: 'numeric' })}</b></span>
      <div class="ps-body">
        <div class="ps-title"><h3>${esc(c.name)}</h3><span class="badge p-badge badge-info">Open spot</span></div>
        <div class="ps-row">
          <span class="p-meta"><img src="${ICON}clock-16.svg" alt="">${s.dayLabel || c.day} · ${s.range || P.timeRange(c)}</span>
          <span class="p-meta"><img src="${ICON}map-pin-16.svg" alt="">${esc(c.location)}</span>
        </div>
        <span class="p-meta"><img src="${ICON}user-switch.svg" alt="">${esc(o.who)} can’t make it · Session ${s.n} of ${c.sessions}</span>
      </div>
      <div class="ps-acts">
        <button class="btn btn-sm btn-soft" type="button" data-dash-dismiss="${c.id}:${s.n}">Not interested</button>
        <a class="btn btn-sm btn-primary" href="clinic.html?id=${c.id}&join=${s.n}">Join</a>
      </div>
    </article>`;
  }
  // Role filter (All / Player / Substitute) applies to stats, open spots, upcoming sessions and clinics
  let role = 'all';
  const inRole = c => role === 'all' || c.role === role;
  const allOpen = () => P.CLINICS.filter(c => c.status === 'active' && inRole(c)).flatMap(c => P.openSpots(c));

  function clinicCard(c) {
    const booked = P.booked(c).length;
    return `<article class="pc">
      <div class="pc-title"><h3>${esc(c.name)}</h3><span class="badge p-badge badge-ok">Active</span></div>
      <div class="pc-meta">
        <span class="p-meta"><img src="${ICON}court-basketball.svg" alt="">${esc(c.share)}</span>
        <span class="p-meta"><img src="${ICON}check-circle.svg" alt="">${c.role === 'Substitute' ? 'On the substitute list' : `${booked} of ${c.allowed} sessions selected`}</span>
        <span class="p-meta"><img src="${ICON}calendar-blank-16.svg" alt="">${c.days}, ${P.timeRange(c)}</span>
        <span class="p-meta"><img src="${ICON}user.svg" alt="">Organizer: ${esc(c.organizer)}</span>
      </div>
      <hr>
      <a class="link" href="clinic.html?id=${c.id}">View clinic${caret}</a>
    </article>`;
  }

  const ACT_ICON = { invite: 'user-plus.svg', replace: 'user-switch.svg', message: 'chat-circle.svg', reminder: 'bell.svg', coach: 'identification-badge.svg' };
  function activityItem(a) {
    const unread = a.unread && !P.state.readActivity.includes(a.id);
    return `<div class="pa-item">
      <span class="pa-ic ${a.kind}"><i style="--ico:url(/organizer/assets/icons/${ACT_ICON[a.kind]})"></i></span>
      <div class="pa-body">
        <b>${esc(a.title)}${unread ? '<span class="unread" aria-label="Unread"></span>' : ''}</b>
        <p>${esc(a.body)}</p>
        <small>${esc(a.when)}<span class="sep">·</span><a href="${a.href}" data-act="${a.id}">${esc(a.link)}</a></small>
      </div>
    </div>`;
  }

  function render() {
    const live = P.CLINICS.filter(c => c.status === 'active');
    document.querySelectorAll('#role-pills [data-role]').forEach(b => {
      const n = live.filter(c => b.dataset.role === 'all' || c.role === b.dataset.role).length;
      b.textContent = `${b.dataset.role === 'all' ? 'All' : b.dataset.role} (${n})`;
      b.disabled = !n && b.dataset.role !== 'all';
    });
    const active = live.filter(inRole);
    const upcoming = P.upcoming().filter(s => inRole(s.clinic));
    $('#st-clinics').textContent = pad(active.length);
    $('#st-upcoming').textContent = pad(upcoming.filter(s => P.statusOf(s).kind !== 'requested').length);
    $('#st-attended').textContent = pad(P.attendedCount(inRole));
    $('#upcoming-list').innerHTML = upcoming.length ? upcoming.slice(0, 4).map(sessionCard).join('') : `<p class="ps-empty">${role === 'Substitute' ? 'No sessions yet. You’ll play when you pick up an open spot.' : 'No upcoming sessions yet.'}</p>`;
    $('#clinic-list').innerHTML = active.map(clinicCard).join('');
    const open = allOpen();
    $('#open-sec').hidden = !open.length;
    $('#open-count').textContent = open.length;
    $('#open-list').innerHTML = open.map(openCard).join('');
    $('#activity').innerHTML = [...P.changeActivity(), ...P.ACTIVITY].map(activityItem).join('');
    const n = P.unreadCount();
    $('#act-new').textContent = `${n} new`;
    $('#act-new').hidden = !n;
    document.querySelectorAll('[data-p="first"]').forEach(el => (el.textContent = P.PLAYER.first));
    document.querySelectorAll('[data-p="name"]').forEach(el => (el.textContent = P.PLAYER.name));
  }

  document.addEventListener('click', e => {
    const open = e.target.closest('[data-rsvp-open]');
    if (open) {
      const [id, n] = open.dataset.rsvpOpen.split(':');
      rsvpFor = P.sessionsOf(P.clinic(id))[n - 1];
      $('#rsvp-lead').textContent = `${rsvpFor.clinic.name} · ${fmt(rsvpFor.date, { weekday: 'long', month: 'long', day: 'numeric' })}, ${P.timeRange(rsvpFor.clinic)} at ${rsvpFor.clinic.location}. ${rsvpFor.clinic.organizer} sees your answer.`;
      $('#rsvp').hidden = false;
      $('#rsvp [data-rsvp="going"]').focus();
      return;
    }
    const pick = e.target.closest('[data-rsvp]');
    if (pick && rsvpFor) {
      P.setRsvp(rsvpFor, pick.dataset.rsvp);
      $('#rsvp').hidden = true;
      window.toast(pick.dataset.rsvp === 'going'
        ? `You’re going on ${fmt(rsvpFor.date, { month: 'short', day: 'numeric' })}`
        : `${rsvpFor.clinic.organizer} will know you can’t make it on ${fmt(rsvpFor.date, { month: 'short', day: 'numeric' })}`);
      rsvpFor = null; render();
      return;
    }
    const dis = e.target.closest('[data-dash-dismiss]');
    if (dis) {
      const [id, n] = dis.dataset.dashDismiss.split(':'), s = P.sessionsOf(P.clinic(id))[n - 1];
      P.dismissSpot(s); render();
      window.toast(`Hidden. You’ll still get a notification when another spot opens.`);
      return;
    }
    const rp = e.target.closest('#role-pills [data-role]');
    if (rp) {
      role = rp.dataset.role;
      document.querySelectorAll('#role-pills [data-role]').forEach(b => { b.classList.toggle('on', b === rp); b.setAttribute('aria-selected', String(b === rp)); });
      render(); return;
    }
    const act = e.target.closest('[data-act]');
    if (act) { P.markRead(act.dataset.act); return; }
    if (e.target.closest('#reset-demo')) { P.reset(); render(); window.toast('Prototype data reset'); }
  });

  render();
})();

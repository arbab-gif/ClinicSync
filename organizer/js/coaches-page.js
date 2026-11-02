/* Coaches tab (clinic-coaches.html): clinic-level and session-level coach management.
   State and rules live in js/coach-data.js. */
(() => {
  const CD = window.CoachData, D = window.ClinicData;
  CD.load();
  const st = () => CD.S;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const { money, PLAYERS } = CD;

  const av = (c, cls = '') => c && c.photo ? `<img class="co-av ${cls}" src="${c.photo}" alt="">` : `<span class="co-av initials ${cls}">${CD.initials(c ? c.name : '?')}</span>`;
  const avWho = (who, cls = '') => who.id ? av(CD.coach(who.id), cls) : `<span class="co-av initials ${cls}">${CD.initials(who.invite.name || who.invite.email)}</span>`;
  const sess = n => CD.sessions().find(s => s.n === Number(n));
  const range = list => list.length ? `${D.fmtLong(list[0].date)} – ${D.fmtLong(list[list.length - 1].date)}` : '';
  const overrides = () => CD.upcoming().filter(s => CD.isOverride(s.n));

  // ---------- Clinic header (from the edited clinic data)
  const clinic = D.load();
  document.querySelectorAll('[data-c]').forEach(el => { const k = el.dataset.c; el.textContent = k === 'schedule' ? D.scheduleLine(clinic) : clinic[k]; });
  document.title = `Coach · ${clinic.name} · ClinicSync`;

  // ---------- Pending block (invite or request), used at clinic and session level
  function pendingBlock(p, scope, n) {
    const isInvite = !!p.who.invite, name = CD.whoName(p.who), cur = CD.coach(scope === 'clinic' ? st().clinic.coach : CD.sessionCoach(n));
    const badge = p.expired ? '<span class="badge badge-danger">Invite expired</span>'
      : p.nudged ? '<span class="badge badge-warn">No response · 3 days</span>'
      : isInvite ? '<span class="badge badge-info">Waiting to join ClinicSync</span>' : '<span class="badge badge-warn">Awaiting response</span>';
    const fee = isInvite ? 'Fee per player: set when they create their profile'
      : `${money(CD.coach(p.who.id).fee)} per player · per session${cur ? ` (now ${money(cur.fee)})` : ''}`;
    const body = p.expired ? 'They didn’t join within 7 days. Cancel the invite to add someone else.'
      : isInvite ? `This coach isn’t on ClinicSync yet. When they create a profile and accept, you’ll be notified and their fee shows here.`
      : `${esc(name)} needs to accept before they’re assigned.`;
    return `<div class="co-pending${p.expired ? ' bad' : ''}">
      <div class="co-who">${avWho(p.who)}<div>
        <div class="co-name">${isInvite ? `Invite sent to ${esc(p.who.invite.email)}` : `Request sent to ${esc(name)}`} ${badge}</div>
        <div class="co-meta">${p.kind === 'replace' ? 'Replacement for this session' : 'New coach'} · sent ${esc(p.sentAt)}${isInvite && p.who.invite.name ? ` · ${esc(p.who.invite.name)}` : ''}</div>
      </div></div>
      <p class="co-body">${body}</p>
      <div class="co-line"><img src="assets/icons/info-grey.svg" alt="">${fee}</div>
      ${p.reason ? `<div class="co-line"><b>Reason:</b> ${esc(p.reason)}</div>` : ''}
      <div class="co-acts">
        <button class="btn btn-sm btn-outline" type="button" data-act="cancel-pending" data-scope="${scope}" data-n="${n || ''}">Cancel ${isInvite ? 'invite' : 'request'}</button>
      </div>
    </div>`;
  }

  function alertBox(tone, title, body, actions = '') {
    return `<div class="co-alert ${tone}"><img src="assets/icons/${tone === 'warn' ? 'warning-circle' : 'info-circle'}.svg" alt=""><div><b>${title}</b><p>${body}</p>${actions ? `<div class="co-acts">${actions}</div>` : ''}</div></div>`;
  }

  // ---------- Clinic coach card
  function renderClinic() {
    const s = st(), cur = CD.coach(s.clinic.coach), p = s.clinic.pending, up = CD.upcoming();
    let h = '';
    if (s.clinic.declined) h += alertBox('bad', `${esc(s.clinic.declined.name)} declined your ${s.clinic.declined.invite ? 'invitation' : 'request'}`, `“${esc(s.clinic.declined.reason)}” ${cur ? `${esc(cur.name)} is still coaching this clinic.` : 'The clinic still has no coach.'}`,
      `<button class="btn btn-sm btn-primary" type="button" data-act="add-clinic">Choose another coach</button><button class="link" type="button" data-act="dismiss-declined">Dismiss</button>`);
    if (cur) {
      const coached = up.filter(x => CD.sessionCoach(x.n) === cur.id).length;
      h += `<div class="co-card">
        <div class="co-top">
          <div class="co-who">${av(cur, 'lg')}<div>
            <div class="co-name">${esc(cur.name)} <span class="badge badge-ok">Coaching</span></div>
            <div class="co-meta">★ ${esc(cur.rating)} · ${cur.years} yrs experience · ${esc(cur.loc)}</div>
          </div></div>
          <div class="co-fee"><b>${money(cur.fee)}</b><span>per player · per session</span></div>
        </div>
        <div class="co-facts"><span>Coaching <b>${coached} of ${up.length}</b> upcoming sessions</span><span>Earns about <b>${money(cur.fee * PLAYERS)}</b> per session with ${PLAYERS} players</span></div>
        <p class="co-lockline"><img src="assets/icons/lock-simple.svg" alt="">The clinic coach is set once they accept and can’t be changed or removed. If they can’t attend a session, they’ll send you a request and you choose a coach for that session.</p>
        <div class="co-acts"><button class="link" type="button" data-toast="Coach profiles open from the coach directory in the full app">View profile</button></div>
      </div>`;
    }
    // Coach-raised requests: "I can't attend Session N" → organizer picks a coach for that session only
    up.forEach(x => {
      const o = s.sessions[x.n] || {}, ca = o.cantAttend;
      if (!ca || o.pending) return;
      const who = CD.coach(ca.coach);
      h += alertBox('warn', `${esc(who.name)} can’t attend Session ${x.n} (${x.label})`, `“${esc(ca.reason)}” Choose a coach for this session only. ${esc(who.name)} keeps every other session.`,
        `<button class="btn btn-sm btn-primary" type="button" data-act="replace-request" data-n="${x.n}">Choose a replacement</button><button class="link" type="button" data-act="no-coach-session" data-n="${x.n}">Run this session without a coach</button>`);
    });
    if (p) h += pendingBlock(p, 'clinic');
    if (!cur && !p) {
      h += `<div class="co-empty">
        <span class="co-empty-ic"><img src="assets/icons/chalkboard-teacher.svg" alt=""></span>
        <b>No coach for this clinic yet</b>
        <p>Sessions run without a coach and players only pay the facility share. Add a coach on ClinicSync or invite one by email.</p>
        <button class="btn btn-md btn-primary" type="button" data-act="add-clinic"><img class="icon" src="assets/icons/plus.svg" alt="" style="filter:invert(1)">Add coach</button>
      </div>`;
    }
    $('#clinic-coach').innerHTML = h;
  }

  // ---------- Per-session list
  function renderSessions() {
    const s = st(), clinicCoach = CD.coach(s.clinic.coach);
    $('#session-list').innerHTML = CD.sessions().map(x => {
      const c = CD.coach(CD.sessionCoach(x.n)), ov = CD.isOverride(x.n), o = s.sessions[x.n] || {}, p = o.pending;
      const away = !x.done && !!o.cantAttend && !ov;
      const tag = !c || x.done ? '' : o.replacing ? `<span class="tag tag-brand">Covering for ${esc(o.replacing)}</span>` : ov ? '<span class="tag tag-brand">This session only</span>' : '<span class="tag">Clinic coach</span>';
      const who = c ? `${av(c)}<div><b>${esc(c.name)}</b>${tag}${away ? '<span class="tag tag-bad">Can’t attend</span>' : ''}</div>`
        : `<span class="co-av none">—</span><div><b class="muted">No coach</b>${ov && clinicCoach ? `<span class="tag tag-warn">${o.noCoachBecause ? `${esc(o.noCoachBecause)} can’t attend` : 'No coach this session'}</span>` : ''}</div>`;
      const sub = [
        p ? `<span class="cs-sub pend">${p.who.invite ? `Invite sent to ${esc(p.who.invite.email)}` : `Request sent to ${esc(CD.whoName(p.who))}`}${p.nudged ? ' · no response yet' : ''}${p.expired ? ' · expired' : ''}</span>` : '',
        o.declined ? `<span class="cs-sub bad">${esc(o.declined.name)} declined: “${esc(o.declined.reason)}”</span>` : '',
        ov && o.reason ? `<span class="cs-sub">Reason: ${esc(o.reason)}</span>` : '',
      ].join('');
      const fee = c ? `${money(c.fee)}<small>/player</small>${clinicCoach && c.id !== clinicCoach.id && !x.done ? `<em>Clinic ${money(clinicCoach.fee)}</em>` : ''}`
        : `<span class="muted">$0</span>${ov && clinicCoach ? `<em>Clinic ${money(clinicCoach.fee)}</em>` : ''}`;
      let menu = '';
      if (!x.done) {
        const items = [];
        if (p) items.push(['cancel-pending', `Cancel ${p.who.invite ? 'invite' : 'request'}`]);
        else if (away) items.push(['replace-request', 'Choose a replacement'], ['no-coach-session', 'Run without a coach']);
        menu = !items.length ? '' : `<button class="icon-btn sm" type="button" aria-label="Coach options for session ${x.n}" aria-haspopup="menu" data-menu="#cs-menu-${x.n}"><img class="icon-20" src="assets/icons/dots-three.svg" alt=""></button>
          <div class="menu" id="cs-menu-${x.n}" role="menu" hidden>${items.map(([a, l, cls]) => `<button role="menuitem" type="button" class="${cls || ''}" data-act="${a}" data-scope="session" data-n="${x.n}">${esc(l)}</button>`).join('')}</div>`;
      }
      return `<div class="cs-row${x.done ? ' done' : ''}${away ? ' away' : ''}" id="session-${x.n}">
        <div class="cs-date"><b>Session ${x.n}</b><span>${x.label}</span></div>
        <div class="cs-coach"><div class="co-who sm">${who}</div>${sub}</div>
        <div class="cs-fee">${fee}</div>
        <div class="cs-act">${x.done ? '<span class="cs-lock"><img src="assets/icons/lock-simple.svg" alt="">Completed</span>' : menu}${away && !p ? `<button class="btn btn-sm btn-primary" type="button" data-act="replace-request" data-n="${x.n}">Choose replacement</button>` : ''}</div>
      </div>`;
    }).join('');
  }

  // ---------- Simulation panel (the coach's side)
  function pendings() {
    const out = [], s = st();
    if (s.clinic.pending) out.push({ scope: 'clinic', p: s.clinic.pending });
    Object.entries(s.sessions).forEach(([n, o]) => { if (o.pending) out.push({ scope: 'session', n: Number(n), p: o.pending }); });
    return out;
  }
  function renderSim() {
    const ps = pendings(), s = st(), cur = CD.coach(s.clinic.coach), b = [];
    const anyInvite = ps.some(x => x.p.who.invite);
    if (ps.length) {
      b.push(['sim-accept', anyInvite ? 'Coach joins ClinicSync & accepts' : 'Coach accepts'], ['sim-decline', 'Coach declines'], ['sim-silent', 'No response after 3 days']);
      if (anyInvite) b.push(['sim-expire', 'Invite expires (7 days)']);
    }
    if (cur && CD.upcoming().some(x => CD.sessionCoach(x.n) === cur.id && !(s.sessions[x.n] || {}).cantAttend)) b.push(['sim-cant', `${cur.name} requests: can’t attend a session`]);
    b.push(['sim-reset-maria', 'Start over · Maria Lopez assigned'], ['sim-reset-none', 'Start over · no coach (skipped in setup)']);
    $('#sim-body').innerHTML = `<p>${ps.length ? `${ps.length} pending ${ps.length > 1 ? 'requests' : 'request'}. Respond as the coach:` : 'Nothing waiting on a coach right now.'}</p>` +
      b.map(([a, l]) => `<button type="button" class="${a.startsWith('sim-reset') ? 'ghost' : ''}" data-act="${a}">${esc(l)}</button>`).join('');
  }

  function renderAll() { renderClinic(); renderSessions(); renderSim(); CD.save(); }

  // ---------- Picker
  let ctx = null;
  const open = id => { const el = $(id); el.hidden = false; const f = el.querySelector('input, textarea, button:not([data-close])'); if (f) setTimeout(() => f.focus(), 30); };
  const close = id => { $(id).hidden = true; };

  function openPicker(c) {
    ctx = c; const up = CD.upcoming(), s = st();
    const cc = CD.coach(s.clinic.coach);
    if (c.scope === 'clinic') {
      $('#pk-title').textContent = 'Add a coach to this clinic';
      const ovs = overrides();
      $('#pk-scope').innerHTML = `<span class="scope clinic">Whole clinic</span>Applies to all ${up.length} upcoming sessions (${range(up)}). Completed sessions keep their coach.${ovs.length ? ` Sessions with their own coach (${ovs.map(x => x.n).join(', ')}) stay as they are.` : ''}`;
    } else {
      const x = sess(c.n);
      const ca = (s.sessions[c.n] || {}).cantAttend;
      $('#pk-title').textContent = ca ? `Choose a replacement for Session ${x.n}` : `Add a coach for Session ${x.n}`;
      $('#pk-scope').innerHTML = `<span class="scope session">This session only</span>${ca ? `${esc(CD.coach(ca.coach).name)} can’t attend ${x.label}: “${esc(ca.reason)}”` : x.label + '.'} Every other session keeps ${cc ? esc(cc.name) : 'its current setup'}.`;
    }
    $('#pk-q').value = ''; setTab('find'); renderPickList(); resetInvite();
    open('#picker');
  }
  function setTab(t) {
    document.querySelectorAll('[data-pk-tab]').forEach(b => { const on = b.dataset.pkTab === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    $('#pk-find').hidden = t !== 'find'; $('#pk-invite').hidden = t !== 'invite';
  }
  function renderPickList() {
    const q = $('#pk-q').value.trim().toLowerCase(), s = st(), up = CD.upcoming();
    const current = ctx.scope === 'clinic' ? s.clinic.coach : CD.sessionCoach(ctx.n);
    const x = ctx.scope === 'session' ? sess(ctx.n) : null;
    const list = Object.values({ ...CD.DIRECTORY, ...s.joined }).filter(c => c.name.toLowerCase().includes(q));
    if (!list.length) {
      $('#pk-list').innerHTML = `<div class="co-empty sm"><b>No coaches match “${esc(q)}”</b><p>If they’re not on ClinicSync yet, invite them by email.</p><button class="btn btn-sm btn-outline" type="button" data-act="to-invite">Invite by email</button></div>`;
      return;
    }
    $('#pk-list').innerHTML = list.map(c => {
      let badge = '<span class="badge badge-ok">Available</span>', disabled = false, note = '';
      if (c.id === current) { badge = x && (s.sessions[x.n] || {}).cantAttend ? '<span class="badge badge-danger">Can’t attend</span>' : '<span class="badge badge-brand">Current coach</span>'; disabled = true; }
      else if (c.fullyBooked) { badge = '<span class="badge badge-mute">Not taking new clinics</span>'; disabled = true; }
      else if (x && CD.isAway(c.id, x.iso)) { badge = `<span class="badge badge-danger">Unavailable ${x.label.replace(/^\w+, /, '')}</span>`; disabled = true; }
      else if (!x) { const away = up.filter(u => CD.isAway(c.id, u.iso)); if (away.length) { badge = `<span class="badge badge-warn">Away ${away.length} session${away.length > 1 ? 's' : ''}</span>`; note = `Can’t make Session ${away.map(a => a.n).join(', ')}. You can pick someone for ${away.length > 1 ? 'those sessions' : 'that session'} later.`; } }
      return `<div class="pk-row${disabled ? ' off' : ''}">
        ${av(c)}<div class="pk-main"><b>${esc(c.name)}</b><span>★ ${esc(c.rating)} · ${c.years} yrs · ${esc(c.loc)}</span>${note ? `<small>${note}</small>` : ''}</div>
        <div class="pk-side">${badge}<span class="pk-fee"><b>${money(c.fee)}</b>/player/session</span></div>
        <button class="btn btn-sm ${disabled ? 'btn-soft' : 'btn-primary'}" type="button" data-pick="${c.id}"${disabled ? ' disabled' : ''}>Select</button>
      </div>`;
    }).join('');
  }
  function resetInvite() { ['#iv-name', '#iv-email', '#iv-msg'].forEach(s => $(s).value = ''); $('#iv-err').hidden = true; $('#iv-exists').hidden = true; $('#iv-email').classList.remove('err'); }
  $('#pk-q').addEventListener('input', renderPickList);
  document.querySelectorAll('[data-pk-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.pkTab)));
  $('#pk-invite').addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#iv-email').value.trim(), err = $('#iv-err'), ex = $('#iv-exists');
    err.hidden = true; ex.hidden = true; $('#iv-email').classList.remove('err');
    const fail = m => { err.textContent = m; err.hidden = false; $('#iv-email').classList.add('err'); $('#iv-email').focus(); };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address, like robert@gmail.com');
    if (pendings().some(x => x.p.who.invite && x.p.who.invite.email.toLowerCase() === email.toLowerCase())) return fail('An invite to this email is already pending. Wait for their response or cancel it first.');
    const existing = CD.byEmail(email);
    if (existing) {
      ex.innerHTML = `${av(existing)}<div><b>${esc(existing.name)} is already on ClinicSync</b><p>No invite needed. Send them a request directly; their fee is ${money(existing.fee)} per player, per session.</p><button class="btn btn-sm btn-primary" type="button" data-pick="${existing.id}">Request ${esc(existing.name)}</button></div>`;
      ex.hidden = false; return;
    }
    openReview({ invite: { name: $('#iv-name').value.trim(), email, message: $('#iv-msg').value.trim() } });
  });

  // ---------- Review & send (add a coach, or cover a session the coach can't attend)
  let pickWho = null;
  function openReview(who) {
    pickWho = who; close('#picker');
    const s = st(), up = CD.upcoming(), isClinic = ctx.scope === 'clinic', x = isClinic ? null : sess(ctx.n);
    const o = isClinic ? {} : (s.sessions[ctx.n] || {}), away = o.cantAttend ? CD.coach(o.cantAttend.coach) : null;
    const nc = who.id ? CD.coach(who.id) : null, name = CD.whoName(who);
    $('#rv-title').textContent = away ? `Cover Session ${x.n} with ${name}?` : (isClinic ? 'Add this coach to the clinic?' : `Add a coach for Session ${x.n}?`);
    $('#rv-swap').innerHTML = `${away ? `<div class="sw from">${av(away)}<div><small>Can’t attend</small><b>${esc(away.name)}</b><span>${money(away.fee)}/player/session</span></div></div><span class="sw-arrow">→</span>` : ''}
      <div class="sw to">${avWho(who)}<div><small>${who.invite ? 'Invite' : away ? 'Covering' : 'New coach'}</small><b>${esc(name)}</b><span>${nc ? `${money(nc.fee)}/player/session` : 'Fee set when they join'}</span></div></div>`;
    const li = [];
    if (isClinic) li.push(`<b>Whole clinic:</b> all ${up.length} upcoming sessions, ${range(up)}.`, `Once they accept, the clinic coach can’t be changed or removed.`);
    else li.push(`<b>This session only:</b> Session ${x.n}, ${x.label}.`, `Every other session keeps ${CD.coach(s.clinic.coach) ? esc(CD.coach(s.clinic.coach).name) : 'its current setup'} and its fee.`);
    if (away) li.push(`<b>Requested by ${esc(away.name)}:</b> “${esc(o.cantAttend.reason)}”`);
    if (nc) {
      const base = away ? away.fee : 0, d = nc.fee - base;
      li.push(`<b>Coach fee:</b> ${away ? `${money(base)} → ` : ''}${money(nc.fee)} per player, per session${d && away ? ` <span class="${d > 0 ? 'warn' : 'ok'}">(players pay ${money(Math.abs(d))} ${d > 0 ? 'more' : 'less'}${isClinic ? '' : ', this session only'})</span>` : ''}.`);
    } else li.push('<b>Coach fee:</b> appears once they join ClinicSync and set it. Players see it before paying.');
    li.push(who.invite ? `We’ll email ${esc(who.invite.email)} an invite to join ClinicSync.` : `${esc(name)} gets a request and must accept.`);
    $('#rv-impact').innerHTML = li.map(l => `<li>${l}</li>`).join('');
    $('#rv-notify').innerHTML = `<img src="assets/icons/bell.svg" alt="">${away ? `${esc(away.name)}, ` : ''}${PLAYERS} players and 3 substitutes are notified when ${esc(name)} accepts.`;
    $('#rv-go').textContent = who.invite ? 'Send invite' : 'Send request';
    open('#review');
  }
  $('#rv-back').addEventListener('click', () => { close('#review'); open('#picker'); });
  $('#rv-go').addEventListener('click', () => {
    const s = st(), name = CD.whoName(pickWho), o = ctx.scope === 'clinic' ? {} : (s.sessions[ctx.n] || {});
    const p = { who: pickWho, kind: o.cantAttend ? 'replace' : 'add', reason: o.cantAttend ? `${CD.coach(o.cantAttend.coach).name} can’t attend: ${o.cantAttend.reason}` : '', sentAt: 'Nov 2' };
    const where = ctx.scope === 'clinic' ? 'For the whole clinic' : `For Session ${ctx.n} only (${sess(ctx.n).label})`;
    if (ctx.scope === 'clinic') { s.clinic.pending = p; s.clinic.declined = null; }
    else s.sessions[ctx.n] = { ...o, pending: p, declined: null };
    CD.log('info', pickWho.invite ? `Invite sent to ${pickWho.invite.email}` : `Request sent to ${name}`, `${where}. You’ll be notified when they ${pickWho.invite ? 'join ClinicSync and accept' : 'respond'}.`);
    close('#review'); renderAll();
    toast(pickWho.invite ? `Invite sent to ${pickWho.invite.email}` : `Request sent to ${name}`);
  });

  // ---------- Run a session without a coach (only after the coach said they can't attend)
  let rmCtx = null;
  function openNoCoach(n) {
    rmCtx = { n }; const s = st(), x = sess(n), o = s.sessions[n] || {}, away = CD.coach(o.cantAttend.coach), cc = CD.coach(s.clinic.coach);
    $('#rm-title').textContent = `Run Session ${x.n} without a coach?`;
    $('#rm-lead').textContent = `${away.name} can’t attend ${x.label}: “${o.cantAttend.reason}”`;
    $('#rm-impact').innerHTML = [`Players don’t pay the ${money(away.fee)} coach fee for this session.`, `Every other session keeps ${cc ? cc.name : 'its current setup'}.`].map(l => `<li>${esc(l)}</li>`).join('');
    $('#rm-notify').innerHTML = `<img src="assets/icons/bell.svg" alt="">${esc(away.name)}, ${PLAYERS} players and 3 substitutes will be notified.`;
    $('#rm-go').textContent = 'Run without a coach';
    open('#remove');
  }
  $('#rm-go').addEventListener('click', () => {
    const s = st(), x = sess(rmCtx.n), o = s.sessions[rmCtx.n] || {}, away = CD.coach(o.cantAttend.coach);
    s.sessions[rmCtx.n] = { coach: null, noCoachBecause: away.name };
    CD.log('info', `Session ${x.n} runs without a coach`, `${away.name} can’t attend ${x.label}. The ${money(away.fee)} coach fee is dropped for that session only.`);
    close('#remove'); renderAll(); toast(`Session ${x.n} runs without a coach`);
  });

  // ---------- Simulated coach responses
  function joinFromInvite(inv) {
    const local = inv.email.split('@')[0].replace(/[._-]+/g, ' ');
    const name = inv.name || local.replace(/\b\w/g, m => m.toUpperCase());
    const id = 'inv-' + inv.email.toLowerCase().replace(/[^a-z0-9]/g, '');
    st().joined[id] = { id, name, photo: null, email: inv.email, fee: 28, rating: 'New', years: 3, loc: 'Riverside, CA' };
    CD.log('ok', `${name} joined ClinicSync`, `Profile created from your invite. Fee: $28 per player, per session.`);
    return id;
  }
  function resolve(action) {
    const s = st();
    pendings().forEach(({ scope, n, p }) => {
      const name = CD.whoName(p.who), holder = scope === 'clinic' ? s.clinic : s.sessions[n], where = scope === 'clinic' ? 'the clinic' : `Session ${n}`;
      if (action === 'accept') {
        const id = p.who.id || joinFromInvite(p.who.invite), nc = CD.coach(id);
        if (scope === 'clinic') {
          const prev = CD.coach(s.clinic.coach), k = CD.upcoming().filter(x => !CD.isOverride(x.n)).length;
          CD.freezeCompleted(); s.clinic.coach = id; s.clinic.pending = null;
          CD.log('ok', `${nc.name} accepted`, `Now coaching ${k} upcoming sessions.${prev ? ` ${prev.name} was notified of the change.` : ''}`);
          CD.log('info', prev && prev.fee !== nc.fee ? 'Coach fee updated' : 'Players can see the coach fee', prev && prev.fee !== nc.fee
            ? `${money(prev.fee)} → ${money(nc.fee)} per player for ${k} upcoming sessions. Players were notified.`
            : `${money(nc.fee)} per player, per session, on ${k} upcoming sessions.`);
        } else {
          const prev = CD.coach(CD.sessionCoach(n));
          const ca = (s.sessions[n] || {}).cantAttend;
          s.sessions[n] = { coach: id, reason: p.reason, replacing: ca ? CD.coach(ca.coach).name : '' };
          CD.log('ok', `${nc.name} accepted Session ${n}`, `Coaching ${sess(n).label} only.${prev ? ` ${prev.name} keeps every other session.` : ''}`);
          if (!prev || prev.fee !== nc.fee) CD.log('info', `Fee updated for Session ${n} only`, `${prev ? money(prev.fee) : '$0'} → ${money(nc.fee)} per player. Other sessions are unchanged.`);
        }
      } else if (action === 'decline') {
        const why = p.who.id === 'olivia' ? 'Away that weekend' : 'Fully booked on Saturdays';
        holder.pending = null; holder.declined = { name, reason: why, invite: !!p.who.invite };
        CD.log('bad', `${name} declined`, `For ${where}: “${why}”. Choose another coach.`);
      } else if (action === 'silent') {
        p.nudged = true;
        CD.log('warn', `${name} hasn’t responded`, `Your ${p.who.invite ? 'invite' : 'request'} for ${where} was sent 3 days ago. Wait for them, or cancel it to choose someone else.`);
      } else if (action === 'expire' && p.who.invite) {
        p.expired = true;
        CD.log('bad', `Invite to ${p.who.invite.email} expired`, `They didn’t join within 7 days, so ${where} has no change. Cancel the invite to add someone else.`);
      }
    });
  }

  // ---------- Actions
  document.addEventListener('click', e => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { openReview({ id: pick.dataset.pick }); return; }
    const t = e.target.closest('[data-act]'); if (!t) return;
    const a = t.dataset.act, n = Number(t.dataset.n) || null, scope = t.dataset.scope || (n ? 'session' : 'clinic'), s = st();
    const holder = scope === 'clinic' ? s.clinic : s.sessions[n];
    document.querySelectorAll('.menu:not([hidden])').forEach(m => { if (m.id.startsWith('cs-menu')) m.hidden = true; });
    switch (a) {
      case 'add-clinic': return openPicker({ scope: 'clinic', mode: 'add' });
      case 'replace-request': return openPicker({ scope: 'session', n, mode: 'replace' });
      case 'no-coach-session': return openNoCoach(n);
      case 'cancel-pending': { const p = holder.pending; holder.pending = null; CD.log('info', `${p.who.invite ? 'Invite' : 'Request'} cancelled`, `${CD.whoName(p.who)} was told it’s no longer needed.`); renderAll(); return toast('Cancelled'); }
      case 'dismiss-declined': s.clinic.declined = null; return renderAll();
      case 'to-invite': setTab('invite'); return $('#iv-email').focus();
      case 'sim-accept': resolve('accept'); renderAll(); return toast('Coach accepted · organizer notified');
      case 'sim-decline': resolve('decline'); renderAll(); return toast('Coach declined');
      case 'sim-silent': resolve('silent'); renderAll(); return toast('3 days later: no response');
      case 'sim-expire': resolve('expire'); renderAll(); return toast('Invite expired');
      case 'sim-cant': {
        const cur = CD.coach(s.clinic.coach), free = CD.upcoming().filter(u => CD.sessionCoach(u.n) === cur.id && !(s.sessions[u.n] || {}).cantAttend);
        const x = free.find(u => u.n > CD.COMPLETED + 1) || free[0], why = ['Family commitment that weekend', 'Tournament travel', 'Medical appointment'][Object.keys(s.sessions).length % 3];
        s.sessions[x.n] = { ...(s.sessions[x.n] || {}), cantAttend: { coach: cur.id, reason: why } };
        CD.log('warn', `${cur.name} can’t attend Session ${x.n}`, `“${why}” Choose a coach for ${x.label}; every other session stays with ${cur.name}.`);
        renderAll(); return toast(`${cur.name} sent a can’t-attend request for Session ${x.n}`);
      }
      case 'sim-reset-maria': CD.reset('maria'); return renderAll();
      case 'sim-reset-none': CD.reset('none'); return renderAll();
    }
  });
  $('#sim-toggle').addEventListener('click', () => { const b = $('#sim-body'), open = b.hidden; b.hidden = !open; $('#sim-toggle').setAttribute('aria-expanded', String(open)); });

  renderAll();
  // Deep links: ?add=clinic (from Overview) · ?session=<n> or ?date=<iso> (from session details)
  const q = new URLSearchParams(location.search);
  const n = q.get('session') || (q.get('date') && (CD.sessions().find(x => x.iso === q.get('date')) || {}).n);
  if (q.get('add') === 'clinic' && !st().clinic.coach) openPicker({ scope: 'clinic', mode: 'add' });
  else if (n) {
    const row = document.getElementById(`session-${n}`); if (row) { row.classList.add('flash'); row.scrollIntoView({ block: 'center' }); }
    const d = q.get('do'), x = sess(n);
    if (x && !x.done) {
      const o = st().sessions[x.n] || {};
      if (d === 'replace' && o.cantAttend && !o.pending) openPicker({ scope: 'session', n: x.n, mode: 'replace' });
    }
  }
})();

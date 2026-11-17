/* Coach flows shared by the dashboard, clinic page and payments page:
   - reschedule request: accept / decline with a reason; the organizer finalizes, then the schedule moves
   - can't make a session: give a reason, then either invite a replacement coach yourself or let the organizer arrange one;
     a replacement who declines → invite another coach or hand it to the organizer
   - confirm a Venmo / Zelle / cash payment a player reported (coaches never record payments themselves)
   Each flow calls onDone() so the page re-renders. */
window.CoachUI = (() => {
  const D = CoachData;
  const I = '/organizer/assets/icons/';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ini = n => n.split(' ').map(w => w[0]).join('').slice(0, 2);
  const face = (n, cls = 'avatar-img') => D.photo(n) ? `<img class="${cls}" src="${D.photo(n)}" alt="">` : `<span class="initials ${cls === 'avatar-img' ? '' : cls}">${ini(n)}</span>`;
  const st = (tone, label) => `<span class="st st-${tone}">${esc(label)}</span>`;
  const first = n => n.split(' ')[0];
  const sLabel = s => `${esc(s.clinic.name)} · Session ${s.n}${s.clinic.names?.[s.n] ? ` · ${esc(s.clinic.names[s.n])}` : ''}`;
  const when = s => `${D.day(s.date)} · ${D.timeOf(s)}`;

  // one overlay reused by every flow
  const ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'coach-flow'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<div class="modal p-modal cf-modal" id="cf"></div>';
  document.body.appendChild(ov);
  const box = ov.querySelector('#cf');
  const show = (html, wide) => { box.classList.toggle('cf-wide', !!wide); box.innerHTML = `<button class="x-btn" type="button" data-close aria-label="Close">✕</button>${html}`; ov.hidden = false; document.body.style.overflow = 'hidden'; box.querySelector('textarea, select, input:not([type=radio])')?.focus(); };
  // the highlighted session summary used at the top of the flows
  const sessBox = s => `<div class="cf-sess"><span class="cf-sess-t"><b>Session ${s.n}${s.clinic.names?.[s.n] ? ` · ${esc(s.clinic.names[s.n])}` : ''}</b><small>${esc(s.clinic.name)}</small></span>
    <span class="cf-sess-w"><span><img src="${I}clock-brand-24.svg" alt="">${D.day(s.date)} · ${esc(D.timeOf(s))}</span><span><img src="${I}map-pin-brand-24.svg" alt="">${esc(s.clinic.location)}</span></span></div>`;
  const hide = () => { ov.hidden = true; if (!document.querySelector('.overlay:not([hidden])')) document.body.style.overflow = ''; };
  const q = s => box.querySelector(s);
  let done = () => {};

  // ---------- reschedule request ----------
  function resched(s, onDone) {
    done = onDone || done;
    const r = s.clinic.reschedule[s.n];
    show(`<h2>Reschedule request</h2>
      <p class="lead">The organizer wants to move ${sLabel(s)}. Organizers set the schedule; you can accept or decline the new time.</p>
      <div class="cf-move"><div><small>Now</small><b>${D.day(s.date)}</b><span>${esc(D.timeOf(s))}</span></div><img src="${I}arrow-right.svg" alt="to"><div class="to"><small>Proposed</small><b>${D.day(r.date)}</b><span>${esc(r.time)}</span></div></div>
      <p class="cf-why"><b>Reason</b> “${esc(r.reason)}”</p>
      <div class="p-acts"><button class="btn btn-lg btn-soft" type="button" data-cf="rs-decline">Decline</button><button class="btn btn-lg btn-primary" type="button" data-cf="rs-accept">I’m available</button></div>`);
    ov.dataset.s = D.key(s.clinic, s.n);
  }
  // declining a new time works like "Can't make it": reason, note, then who finds the replacement
  function reschedDecline(s, onDone) { return unavailable(s, onDone, true); }

  // ---------- can't make it → replacement ----------
  function unavailable(s, onDone, rs) {
    done = onDone || done;
    const org = 'the organizer', Org = 'The organizer';
    const r = rs && s.clinic.reschedule[s.n];
    ov.dataset.rsflow = rs ? '1' : '';
    const reasons = rs ? ['I’m coaching another clinic then', 'I’m away that day', 'That time doesn’t work for me', 'Something else'] : ['I’m sick', 'Family commitment', 'Travel', 'Clash with another clinic', 'Something else'];
    show(`<h2>${rs ? 'Can’t make the new time?' : 'Can’t make this session?'}</h2>
      ${sessBox(rs ? { ...s, date: r.date, time: r.time } : s)}
      <div class="field"><label for="cf-reason">Reason <span class="req">*</span></label><select class="select" id="cf-reason"><option value="">Choose a reason</option>${reasons.map(x => `<option>${x}</option>`).join('')}</select></div>
      <div class="field"><label for="cf-note">Note <span class="opt">(optional)</span></label><textarea class="textarea" id="cf-note" rows="2" placeholder="Anything ${esc(org)} should know"></textarea></div>
      <fieldset class="cf-who"><legend>Who finds the replacement?</legend>
        <label class="cf-opt"><input type="radio" name="cf-mode" value="self" checked><span><b>I’ll invite a replacement coach</b></span></label>
        <label class="cf-opt"><input type="radio" name="cf-mode" value="org"><span><b>Let ${esc(org)} arrange it</b></span></label>
      </fieldset>
      <div class="p-acts"><button class="btn btn-lg btn-soft" type="button" data-close>${rs ? 'Cancel' : 'Keep the session'}</button><button class="btn btn-lg btn-primary" type="button" data-cf="ua-next">Continue</button></div>`);
    ov.dataset.s = D.key(s.clinic, s.n);
  }
  function pickCoach(s, onDone) {
    done = onDone || done;
    const u = D.unavailOf(s) || {}, tried = (u.invited || []).map(i => i.name);
    const n = D.confirmed(s).length;
    picker = { s, tried, n, q: '', loc: '', av: '', pick: null };
    show(`<h2>${tried.length ? 'Invite another coach' : 'Invite a replacement coach'}</h2>
      ${sessBox(s)}
      <div class="coach-tools">
        <label class="coach-search"><img src="${I}search.svg" alt=""><input id="cp-q" type="search" placeholder="Search by coach name or specialty" autocomplete="off" aria-label="Search coaches"></label>
        <div class="coach-filters">
          <div class="f"><button type="button" data-menu="#cp-m-sport" aria-haspopup="menu"><span>${esc(s.clinic.sport)}</span><img src="${I}filter-arrow-16.svg" alt=""></button>
            <div class="menu" id="cp-m-sport" role="menu" hidden><button type="button">${esc(s.clinic.sport)}</button></div></div>
          <div class="f"><button type="button" data-menu="#cp-m-loc" aria-haspopup="menu"><span id="cp-loc">Location</span><img src="${I}filter-arrow-16.svg" alt=""></button>
            <div class="menu" id="cp-m-loc" role="menu" hidden><button type="button" data-cpf="loc" data-v="">Any location</button><button type="button" data-cpf="loc" data-v="Riverside, CA, USA">Riverside, CA, USA</button><button type="button" data-cpf="loc" data-v="Corona, CA, USA">Corona, CA, USA</button></div></div>
          <div class="f"><button type="button" data-menu="#cp-m-av" aria-haspopup="menu"><span id="cp-av">Availability</span><img src="${I}filter-arrow-16.svg" alt=""></button>
            <div class="menu" id="cp-m-av" role="menu" hidden><button type="button" data-cpf="av" data-v="">Any availability</button><button type="button" data-cpf="av" data-v="Available">Available</button><button type="button" data-cpf="av" data-v="Busy">Busy</button></div></div>
        </div>
      </div>
      <div class="coach-grid" id="cp-grid"></div>
      <div class="p-acts"><button class="btn btn-lg btn-soft" type="button" data-cf="${tried.length ? 'ua-org' : 'ua-back'}">${tried.length ? 'Let the organizer arrange it' : 'Back'}</button><button class="btn btn-lg btn-primary" type="button" data-cf="ua-send" disabled>Send invite</button></div>`, true);
    paintCoaches();
  }
  // coach cards (same card as the organizer's Find Coach): photo, name, availability, NTRP · level, location, experience, fee
  let picker = null;
  function paintCoaches() {
    const p = picker, t = p.q.toLowerCase();
    const list = D.COACHES.filter(c => (!t || `${c.name} ${c.sport}`.toLowerCase().includes(t)) && (!p.loc || c.loc === p.loc) && (!p.av || c.status === p.av));
    q('#cp-grid').innerHTML = list.map(c => {
      const declined = p.tried.includes(c.name), busy = c.status === 'Busy', sel = p.pick === c.name;
      return `<article class="coach-card${sel ? ' sel' : ''}${declined || busy ? ' off' : ''}">
        <div class="coach-top"><img src="${c.photo}" alt="">
          <div class="coach-info">
            <div class="coach-row"><div><div class="coach-name">${esc(c.name)}</div>
              <div class="coach-stats"><span>NTRP :<b>${c.ntrp}</b></span><span>Level :<b>${c.level}</b></span></div></div>
              ${declined ? st('gray', 'Declined') : busy ? st('yellow', 'Busy') : '<span class="badge-green">Available</span>'}</div>
            <div class="coach-meta"><span><img src="${I}map-pin-16.svg" alt="">${esc(c.loc)}</span><span><img src="${I}identification-badge.svg" alt="">${c.years} years experience</span></div>
          </div></div>
        <hr>
        <div class="coach-foot"><div class="coach-price">$${p.s.clinic.fee}<small>/player-session</small></div>
          <div class="coach-btns"><button type="button" class="vp" data-toast="${esc(c.name)}’s profile is the next screen">View Profile</button><button type="button" class="sl" data-cp-sel="${esc(c.name)}"${declined || busy ? ' disabled' : ''}>${sel ? 'Selected' : 'Select'}</button></div></div>
      </article>`;
    }).join('') || '<p class="coach-empty">No coaches match these filters.</p>';
    q('[data-cf="ua-send"]').disabled = !p.pick;
    q('[data-cf="ua-send"]').textContent = p.pick ? `Send invite to ${first(p.pick)}` : 'Send invite';
  }

  // ---------- payments ----------
  function record(s, player, onDone, reported) {
    done = onDone || done;
    ov.dataset.s = D.key(s.clinic, s.n); ov.dataset.p = player;
    if (reported) {
      show(`<h2>Confirm payment</h2>
        <p class="lead">${esc(player)} says they paid you <b>$${s.clinic.fee}</b> ${reported === 'Cash' ? 'in cash' : `by ${esc(reported)}`} for ${sLabel(s)} (${D.short(s.date)}). Payments outside ClinicSync count once you confirm them.</p>
        <div class="cf-pay">${face(player)}<div><b>${esc(player)}</b><span>Reported ${esc(reported)} · $${s.clinic.fee}.00</span></div>${st('purple', 'To confirm')}</div>
        <p class="hint">${reported === 'Cash' ? 'Only confirm if you received the cash.' : `Only confirm once the money is in your ${esc(reported)} account.`} Until then it stays outstanding for ${esc(first(player))}.</p>
        <div class="p-acts"><button class="btn btn-lg btn-soft" type="button" data-cf="pay-notyet">Not received</button><button class="btn btn-lg btn-primary" type="button" data-cf="pay-confirm" data-m="${esc(reported)}">Confirm received</button></div>`);
      return;
    }
  }

  // ---------- events ----------
  const sOf = () => { const [id, n] = ov.dataset.s.split(':'); const c = D.clinic(id); return D.sessionsOf(c).find(x => x.n === +n); };
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-cf]'); if (!b) return;
    const s = sOf(), key = ov.dataset.s, org = 'the organizer', Org = 'The organizer';
    const need = sel => { const el = q(sel); if (el && !el.value) { el.classList.add('err'); el.focus(); window.toast('Choose a reason'); return true; } return false; };
    switch (b.dataset.cf) {
      case 'rs-accept': { const n = D.confirmed(s).length; D.state.resched[key] = { status: 'final' }; D.save(); hide(); window.toast(`Session moved to ${D.day(s.clinic.reschedule[s.n].date)}. The organizer and all ${n} players were notified.`); return done(); }
      case 'rs-decline': return reschedDecline(s);
      case 'rs-back': return resched(s);
      case 'rs-decline-go': if (need('#cf-reason')) return; D.state.resched[key] = { status: 'declined', reason: q('#cf-reason').value, note: q('#cf-note').value.trim() }; D.save(); hide(); window.toast(`Declined. ${Org} has your reason.`); return done();
      case 'ua-next': {
        if (need('#cf-reason')) return;
        const mode = q('input[name=cf-mode]:checked').value, reason = q('#cf-reason').value, note = q('#cf-note').value.trim();
        // declining a new time: the session still moves; you find (or hand off) a replacement for the new time
        const rs = ov.dataset.rsflow === '1';
        if (rs) D.state.resched[key] = { status: 'final', declined: true, reason, note };
        D.state.unavail[key] = { reason, note, mode, invited: [] }; D.save();
        const s2 = sOf();
        if (mode === 'org') { hide(); window.toast(rs ? `The session moves to ${D.day(s2.date)}. ${Org} has your reason and will arrange a replacement coach.` : `${Org} has been told and will arrange a replacement.`); return done(); }
        return pickCoach(s2);
      }
      case 'ua-back': { delete D.state.unavail[key]; const wasRs = D.state.resched[key]?.declined; if (wasRs) delete D.state.resched[key]; D.save(); const s0 = sOf(); return unavailable(s0, null, !!wasRs); }
      case 'ua-org': D.state.unavail[key].mode = 'org'; D.save(); hide(); window.toast(`${Org} will arrange a replacement.`); return done();
      case 'ua-send': {
        const pick = picker && picker.pick; if (!pick) return window.toast('Pick a coach');
        const u = D.state.unavail[key]; u.mode = 'self'; (u.invited ||= []).push({ name: pick, status: 'pending' }); D.save();
        hide(); window.toast(`Invite sent to ${pick}. ${Org} can see it too.`); return done();
      }
      case 'pay-confirm': D.recordPay(s, ov.dataset.p, b.dataset.m, 'confirmed'); hide(); window.toast(`Confirmed. ${first(ov.dataset.p)} is marked as paid.`); return done();
      case 'pay-notyet': hide(); return window.toast(`We’ll remind ${first(ov.dataset.p)} that it hasn’t arrived yet.`);
    }
  });
  box.addEventListener('change', e => e.target.classList?.remove('err'));
  // replacement-coach picker: search, filters, select
  box.addEventListener('input', e => { if (e.target.id !== 'cp-q' || !picker) return; picker.q = e.target.value.trim(); paintCoaches(); });
  box.addEventListener('click', e => {
    if (!picker) return;
    const f = e.target.closest('[data-cpf]');
    if (f) { picker[f.dataset.cpf] = f.dataset.v; q(f.dataset.cpf === 'loc' ? '#cp-loc' : '#cp-av').textContent = f.dataset.v || (f.dataset.cpf === 'loc' ? 'Location' : 'Availability'); return paintCoaches(); }
    const sel = e.target.closest('[data-cp-sel]');
    if (sel && !sel.disabled) { picker.pick = picker.pick === sel.dataset.cpSel ? null : sel.dataset.cpSel; paintCoaches(); }
  });

  // prototype: the invited replacement answers / the organizer finalizes or assigns
  function proto(s, what) {
    const key = D.key(s.clinic, s.n), u = D.state.unavail[key], org = 'the organizer', Org = 'The organizer';
    if (what === 'r-accept' || what === 'r-decline') { const last = u.invited.at(-1); last.status = what === 'r-accept' ? 'accepted' : 'declined'; D.save();
      return window.toast(what === 'r-accept' ? `${last.name} accepted. They’re coaching ${D.short(s.date)}.` : `${last.name} can’t cover it. Invite another coach or let ${org} arrange it.`); }
    if (what === 'o-assign') { u.assigned = 'Olivia Davis'; D.save(); return window.toast(`${Org} assigned Olivia Davis to cover ${D.short(s.date)}.`); }
    if (what === 'o-final') { D.state.resched[key] = { status: 'final' }; D.save(); return window.toast(`${Org} confirmed the new time. Your schedule is updated.`); }
    if (what === 'undo') { delete D.state.unavail[key]; D.save(); return window.toast('You’re back on this session.'); }
  }

  return { esc, face, st, first, sLabel, when, resched, reschedDecline, unavailable, pickCoach, record, proto, I };
})();

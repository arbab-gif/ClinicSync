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
  const show = html => { box.innerHTML = `<button class="x-btn" type="button" data-close aria-label="Close">✕</button>${html}`; ov.hidden = false; document.body.style.overflow = 'hidden'; box.querySelector('textarea, select, input:not([type=radio])')?.focus(); };
  const hide = () => { ov.hidden = true; if (!document.querySelector('.overlay:not([hidden])')) document.body.style.overflow = ''; };
  const q = s => box.querySelector(s);
  let done = () => {};

  // ---------- reschedule request ----------
  function resched(s, onDone) {
    done = onDone || done;
    const r = s.clinic.reschedule[s.n];
    show(`<h2>Reschedule request</h2>
      <p class="lead">${esc(r.from)} wants to move ${sLabel(s)}. Organizers set the schedule; you can accept or decline the new time.</p>
      <div class="cf-move"><div><small>Now</small><b>${D.day(s.date)}</b><span>${esc(D.timeOf(s))}</span></div><img src="${I}arrow-right.svg" alt="to"><div class="to"><small>Proposed</small><b>${D.day(r.date)}</b><span>${esc(r.time)}</span></div></div>
      <p class="cf-why"><b>Reason</b> “${esc(r.reason)}”</p>
      <div class="p-acts"><button class="btn btn-lg btn-soft" type="button" data-cf="rs-decline">Decline</button><button class="btn btn-lg btn-primary" type="button" data-cf="rs-accept">I’m available</button></div>`);
    ov.dataset.s = D.key(s.clinic, s.n);
  }
  function reschedDecline(s) {
    show(`<h2>Decline the new time?</h2>
      <p class="lead">${esc(s.clinic.organizer)} will see your reason and can propose another time or find a coach for that day.</p>
      <div class="field"><label for="cf-reason">Reason <span class="req">*</span></label><select class="select" id="cf-reason"><option value="">Choose a reason</option><option>I’m coaching another clinic then</option><option>I’m away that day</option><option>That time doesn’t work for me</option><option>Something else</option></select></div>
      <div class="field"><label for="cf-note">Note to ${esc(first(s.clinic.organizer))} <span class="opt">(optional)</span></label><textarea class="textarea" id="cf-note" rows="2" placeholder="e.g. Sunday afternoon would work"></textarea></div>
      <div class="p-acts"><button class="btn btn-lg btn-soft" type="button" data-cf="rs-back">Back</button><button class="btn btn-lg btn-primary" type="button" data-cf="rs-decline-go">Decline new time</button></div>`);
  }

  // ---------- can't make it → replacement ----------
  function unavailable(s, onDone) {
    done = onDone || done;
    const org = first(s.clinic.organizer);
    show(`<h2>Can’t make this session?</h2>
      <p class="lead">${sLabel(s)} · ${when(s)}. ${esc(s.clinic.organizer)} is told right away.</p>
      <div class="field"><label for="cf-reason">Reason <span class="req">*</span></label><select class="select" id="cf-reason"><option value="">Choose a reason</option><option>I’m sick</option><option>Family commitment</option><option>Travel</option><option>Clash with another clinic</option><option>Something else</option></select></div>
      <div class="field"><label for="cf-note">Note <span class="opt">(optional)</span></label><textarea class="textarea" id="cf-note" rows="2" placeholder="Anything ${esc(org)} should know"></textarea></div>
      <fieldset class="cf-who"><legend>Who finds the replacement?</legend>
        <label class="cf-opt"><input type="radio" name="cf-mode" value="self" checked><span><b>I’ll invite a replacement coach</b><small>Pick a coach you trust. ${esc(org)} sees who you invited.</small></span></label>
        <label class="cf-opt"><input type="radio" name="cf-mode" value="org"><span><b>Let ${esc(org)} arrange it</b><small>${esc(org)} chooses a replacement or cancels the session.</small></span></label>
      </fieldset>
      <div class="p-acts"><button class="btn btn-lg btn-soft" type="button" data-close>Keep the session</button><button class="btn btn-lg btn-primary" type="button" data-cf="ua-next">Continue</button></div>`);
    ov.dataset.s = D.key(s.clinic, s.n);
  }
  function pickCoach(s, onDone) {
    done = onDone || done;
    const u = D.unavailOf(s) || {}, tried = (u.invited || []).map(i => i.name);
    const n = D.confirmed(s).length;
    show(`<h2>${tried.length ? 'Invite another coach' : 'Invite a replacement coach'}</h2>
      <p class="lead">${sLabel(s)} · ${when(s)} · ${n} players. Their fee is tracked separately from yours.</p>
      <div class="cf-coaches">${D.COACHES.map((c, i) => { const t = tried.includes(c.name);
        return `<label class="cf-coach${t ? ' off' : ''}"><input type="radio" name="cf-coach" value="${esc(c.name)}"${t ? ' disabled' : ''}${!t && !box.dataset.picked ? (box.dataset.picked = '1', ' checked') : ''}>${face(c.name)}<span><b>${esc(c.name)}</b><small>${esc(c.sport)}</small></span>${t ? st('gray', 'Declined') : `<span class="cf-fee">$${s.clinic.fee}<small>/player</small></span>`}</label>`; }).join('')}</div>
      <div class="field"><label for="cf-msg">Message <span class="opt">(optional)</span></label><textarea class="textarea" id="cf-msg" rows="2">Hi! Could you cover ${esc(s.clinic.name)} on ${D.day(s.date)}? ${n} players, $${s.clinic.fee} per player.</textarea></div>
      <div class="p-acts"><button class="btn btn-lg btn-soft" type="button" data-cf="${tried.length ? 'ua-org' : 'ua-back'}">${tried.length ? `Let ${esc(first(s.clinic.organizer))} arrange it` : 'Back'}</button><button class="btn btn-lg btn-primary" type="button" data-cf="ua-send">Send invite</button></div>`);
    delete box.dataset.picked;
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
    const s = sOf(), key = ov.dataset.s, org = first(s.clinic.organizer);
    const need = sel => { const el = q(sel); if (el && !el.value) { el.classList.add('err'); el.focus(); window.toast('Choose a reason'); return true; } return false; };
    switch (b.dataset.cf) {
      case 'rs-accept': D.state.resched[key] = { status: 'accepted' }; D.save(); hide(); window.toast(`${org} knows you can make the new time. Waiting for ${org} to confirm it.`); return done();
      case 'rs-decline': return reschedDecline(s);
      case 'rs-back': return resched(s);
      case 'rs-decline-go': if (need('#cf-reason')) return; D.state.resched[key] = { status: 'declined', reason: q('#cf-reason').value, note: q('#cf-note').value.trim() }; D.save(); hide(); window.toast(`Declined. ${org} has your reason.`); return done();
      case 'ua-next': {
        if (need('#cf-reason')) return;
        const mode = q('input[name=cf-mode]:checked').value;
        D.state.unavail[key] = { reason: q('#cf-reason').value, note: q('#cf-note').value.trim(), mode, invited: [] }; D.save();
        if (mode === 'org') { hide(); window.toast(`${org} has been told and will arrange a replacement.`); return done(); }
        return pickCoach(s);
      }
      case 'ua-back': delete D.state.unavail[key]; D.save(); return unavailable(s);
      case 'ua-org': D.state.unavail[key].mode = 'org'; D.save(); hide(); window.toast(`${org} will arrange a replacement.`); return done();
      case 'ua-send': {
        const pick = q('input[name=cf-coach]:checked'); if (!pick) return window.toast('Pick a coach');
        const u = D.state.unavail[key]; u.mode = 'self'; (u.invited ||= []).push({ name: pick.value, status: 'pending' }); D.save();
        hide(); window.toast(`Invite sent to ${pick.value}. ${org} can see it too.`); return done();
      }
      case 'pay-confirm': D.recordPay(s, ov.dataset.p, b.dataset.m, 'confirmed'); hide(); window.toast(`Confirmed. ${first(ov.dataset.p)} is marked as paid.`); return done();
      case 'pay-notyet': hide(); return window.toast(`We’ll remind ${first(ov.dataset.p)} that it hasn’t arrived yet.`);
    }
  });
  box.addEventListener('change', e => e.target.classList?.remove('err'));

  // prototype: the invited replacement answers / the organizer finalizes or assigns
  function proto(s, what) {
    const key = D.key(s.clinic, s.n), u = D.state.unavail[key], org = first(s.clinic.organizer);
    if (what === 'r-accept' || what === 'r-decline') { const last = u.invited.at(-1); last.status = what === 'r-accept' ? 'accepted' : 'declined'; D.save();
      return window.toast(what === 'r-accept' ? `${last.name} accepted. They’re coaching ${D.short(s.date)}.` : `${last.name} can’t cover it. Invite another coach or let ${org} arrange it.`); }
    if (what === 'o-assign') { u.assigned = 'Olivia Davis'; D.save(); return window.toast(`${org} assigned Olivia Davis to cover ${D.short(s.date)}.`); }
    if (what === 'o-final') { D.state.resched[key] = { status: 'final' }; D.save(); return window.toast(`${org} confirmed the new time. Your schedule is updated.`); }
    if (what === 'undo') { delete D.state.unavail[key]; D.save(); return window.toast('You’re back on this session.'); }
  }

  return { esc, face, st, first, sLabel, when, resched, unavailable, pickCoach, record, proto, I };
})();

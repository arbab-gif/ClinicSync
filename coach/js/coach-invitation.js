/* Invitation detail (?id=thu-evening | sat-juniors | cover-thu | …): details, schedule-clash check, accept → added to schedule, decline with a reason. */
(() => {
  const D = CoachData, $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = '/organizer/assets/icons/';
  const v = D.invite(new URLSearchParams(location.search).get('id')) || D.INVITES[0];
  const cover = v.type === 'coverage';
  const first = n => n.split(' ')[0];
  const sessions = cover ? [{ n: v.n, date: v.date }] : Array.from({ length: v.sessions }, (_, i) => ({ n: i + 1, date: D.add(v.start, i * 7) }));
  const total = v.fee * v.players * v.sessions;
  const av = n => D.photo(n) ? `<img class="inv-av" src="${D.photo(n)}" alt="">` : `<span class="initials inv-av">${n.split(' ').map(w => w[0]).join('')}</span>`;
  document.title = `${v.name} · Invitation · ClinicSync`;

  function review() {
    const cf = D.conflictOf(v), st = D.inviteStatus(v), a = D.state.inv[v.id] || {};
    const meta = cover ? [
      ['Sport', v.sport], ['Session', `Session ${v.n} only · ${D.day(v.date)}`], ['Time', v.time], ['Location', `${v.location} · ${v.court}`],
      ['Organizer', v.organizer], ['Players', `${v.players} confirmed`], ['Coaching fee', `$${v.fee} per player · paid to you, not ${first(v.from)}`],
    ] : [
      ['Sport', v.sport], ['Schedule', `${v.days}, ${v.time}`], ['Dates', `${D.short(sessions[0].date)} – ${D.short(sessions.at(-1).date)}`], ['Sessions', `${v.sessions} sessions`],
      ['Location', `${v.location}${v.court ? ` · ${v.court}` : ''}`], ['Players', `${v.players} players`], ['Proposed coaching fee', `$${v.fee} per player, per session`],
    ];
    const steps = cover ? [
      ['Only this session.', `You coach ${D.day(v.date)}. ${first(v.from)} stays the coach for the rest of the clinic.`],
      ['Your fee is tracked separately.', `Players pay you $${v.fee} each for this session. It never mixes with ${first(v.from)}’s fees.`],
      ['You’re paid for who shows up.', 'The fee is worked out from the players who attend.'],
    ] : [
      ['You become the clinic coach.', `Every session lands on your schedule and ${first(v.from)} is told right away.`],
      ['Players pay you directly.', `$${v.fee} per player for each session they attend, by card, Venmo, Zelle or cash.`],
      ['The organizer controls the schedule.', 'If a session needs to move, you’ll get a request to accept or decline.'],
    ];
    const clash = cf && st === 'pending' ? `<div class="iv-clash"><img src="${I}warning-circle.svg" alt=""><div><b>This clashes with a session you already coach</b><span>${esc(cf.text)}. Accepting would double-book you, so ask ${first(v.from)} to start a week later or decline.</span>
        <div class="iv-clash-acts"><a class="btn btn-sm btn-outline" href="messages.html?to=${encodeURIComponent(v.from)}">Message ${esc(first(v.from))}</a><a class="link" href="clinic.html?id=${cf.clinic.id}&tab=sessions&s=${cf.s.n}">See the session</a></div></div></div>` : '';
    const state = st === 'pending' ? '' : `<div class="iv-state ${st}">${st === 'accepted' ? `You accepted this ${cover ? 'request' : 'invitation'}${a.on || v.on ? ` on ${a.on || v.on}` : ''}.` : `You declined${a.on || v.on ? ` on ${a.on || v.on}` : ''}${a.reason || v.reason ? ` · “${esc(a.reason || v.reason)}”` : ''}.`}</div>`;
    $('#inv').innerHTML = `<a class="back" href="clinics.html?tab=invitations"><img class="icon" src="${I}arrow-left.svg" alt="">Invitations</a>
      <section class="inv-card">
        <div class="inv-from">${av(v.from)}<p><b>${esc(v.from)}</b> ${cover ? `asked you to cover a session · ${v.received}` : `invited you to coach · ${v.received}`}</p></div>
        <div class="inv-title"><h1 class="h1">${esc(v.name)}</h1><span class="chip ${cover ? 'chip-cover' : ''}">${cover ? 'Coverage request' : 'Coach'}</span><span class="chip">${v.sport}</span></div>
        ${cover ? `<p class="inv-desc">“${esc(v.reason)}” — ${esc(v.from)}</p>` : v.desc ? `<p class="inv-desc">${esc(v.desc)}</p>` : ''}
        ${state}${clash}
        <dl class="inv-meta">${meta.map(([t, d]) => `<div><dt>${t}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
        <h2 class="inv-h2">${cover ? 'The session' : 'Sessions'}</h2>
        <div class="iv-sessions">${sessions.map(s => { const hit = cf && s.date === cf.s.date; return `<div class="iv-s${hit ? ' hit' : ''}"><span class="datebox"><small>${D.fmt(s.date, { month: 'short' })}</small><b>${D.fmt(s.date, { day: 'numeric' })}</b></span><span><b>Session ${s.n}</b><small>${D.fmt(s.date, { weekday: 'short' })} · ${v.time}</small></span>${hit ? '<span class="st st-red">Clash</span>' : ''}</div>`; }).join('')}</div>
        ${cover ? `<h2 class="inv-h2">Confirmed players (${v.roster.length})</h2><div class="iv-roster">${v.roster.map(n => `<span class="iv-p">${av(n)}${esc(n)}</span>`).join('')}</div>` : ''}
        <h2 class="inv-h2">How it works</h2>
        <ol class="inv-steps">${steps.map(([b, t]) => `<li><b>${b}</b> ${esc(t)}</li>`).join('')}</ol>
        <div class="inv-pay"><span>Expected earnings<small>${v.players} players × $${v.fee}${v.sessions > 1 ? ` × ${v.sessions} sessions` : ''}, if everyone attends</small></span><b>$${total.toLocaleString()}</b></div>
        ${st === 'pending' ? `<div class="inv-acts"><button class="btn btn-lg btn-soft" type="button" data-open="#decline">Decline</button><button class="btn btn-lg btn-primary" type="button" id="accept"${cf ? ' disabled title="Clashes with a session you coach"' : ''}>${cover ? 'Accept and cover the session' : 'Accept invitation'}</button></div>` : ''}
      </section>
      <button class="p-demo" type="button" id="reset-inv">Prototype: reset this invitation</button>`;
  }

  function accepted() {
    $('#inv').innerHTML = `<a class="back" href="clinics.html?tab=invitations"><img class="icon" src="${I}arrow-left.svg" alt="">Invitations</a>
      <section class="inv-card inv-done">
        <span class="inv-ok"><img src="${I}check-circle-green.svg" alt=""></span>
        <h1 class="h1">${cover ? `You’re covering ${D.short(v.date)}` : `You’re coaching ${esc(v.name)}`}</h1>
        <p>${cover ? `${esc(v.from)} and ${esc(v.organizer)} have been told. The session is on your schedule and its fee is tracked separately from ${first(v.from)}’s.` : `${esc(v.from)} has been told. ${v.sessions} sessions were added to your schedule, starting ${D.day(v.start)}.`}</p>
        <div class="iv-added">${sessions.slice(0, 3).map(s => `<div class="iv-s"><span class="datebox"><small>${D.fmt(s.date, { month: 'short' })}</small><b>${D.fmt(s.date, { day: 'numeric' })}</b></span><span><b>Session ${s.n}</b><small>${D.fmt(s.date, { weekday: 'short' })} · ${v.time}</small></span><span class="st st-green">Added</span></div>`).join('')}${sessions.length > 3 ? `<span class="muted">+ ${sessions.length - 3} more sessions</span>` : ''}</div>
        <div class="inv-acts center"><a class="btn btn-lg btn-soft" href="dashboard.html">Go to dashboard</a><a class="btn btn-lg btn-primary" href="clinic.html?id=${v.id}&tab=sessions">View ${cover ? 'session' : 'clinic'}</a></div>
      </section>`;
  }
  function declined() {
    const a = D.state.inv[v.id];
    $('#inv').innerHTML = `<a class="back" href="clinics.html?tab=invitations"><img class="icon" src="${I}arrow-left.svg" alt="">Invitations</a>
      <section class="inv-card inv-done">
        <h1 class="h1">${cover ? 'Request declined' : 'Invitation declined'}</h1>
        <p>${esc(v.from)} has been told you won’t ${cover ? `cover ${D.short(v.date)}` : `coach ${esc(v.name)}`}${a?.reason ? `, with your reason: “${esc(a.reason)}”` : ''}.${cover ? ` ${first(v.from)} or ${first(v.organizer)} can invite another coach.` : ''}</p>
        <div class="inv-acts center"><a class="btn btn-lg btn-soft" href="clinics.html?tab=invitations">All invitations</a><a class="btn btn-lg btn-primary" href="dashboard.html">Back to dashboard</a></div>
      </section>`;
  }

  $('#dl-lead').textContent = cover ? `${v.from} will be told you can’t cover ${D.day(v.date)}, so they can ask someone else.` : `${v.from} will be told you won’t coach ${v.name}.`;
  const today = D.short(D.TODAY);
  document.addEventListener('click', e => {
    if (e.target.closest('#accept')) { D.state.inv[v.id] = { status: 'accepted', on: today }; D.save(); window.toast(cover ? `Added to your schedule: ${v.name}, ${D.short(v.date)}` : `${v.sessions} sessions added to your schedule`); return accepted(); }
    if (e.target.closest('#dl-go')) {
      const r = $('#dl-reason'); if (!r.value) { r.classList.add('err'); r.focus(); return window.toast('Choose a reason'); }
      D.state.inv[v.id] = { status: 'declined', on: today, reason: r.value + ($('#dl-note').value.trim() ? ` · ${$('#dl-note').value.trim()}` : '') }; D.save();
      $('#decline').hidden = true; document.body.style.overflow = ''; return declined();
    }
    if (e.target.closest('#reset-inv')) { delete D.state.inv[v.id]; D.save(); window.toast('Invitation reset'); return review(); }
  });
  $('#dl-reason').addEventListener('change', e => e.target.classList.remove('err'));
  review();
})();

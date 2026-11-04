/* ClinicSync prototype — change the location of one session (organizer).
   Overrides are kept in localStorage per session (keyed by the October day used in the page ids, e.g. "24").
   Sessions page: adds a Location section to each session details modal + the change/review/revert modals.
   Any page: session cards (.s-card with a datebox) show the overridden venue. */
(() => {
  const KEY = 'cs-session-location-saturday';
  const CLINIC_VENUE = 'Riverside Tennis Center';
  const VENUES = ['Riverside Tennis Center', 'Central Park Courts', 'Lakeside Racquet Club', 'Westfield Sports Complex'];
  const REASONS = ['Venue is hosting an event', 'Court maintenance', 'Weather', 'Other'];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const label = loc => loc.courts ? `${loc.venue} · ${loc.courts}` : loc.venue;
  // Completed sessions can't be changed (same rule as the coach flow)
  const isDone = day => { const CD = window.CoachData; if (!CD) return false; CD.load(); const s = CD.sessions().find(x => x.iso === `2026-10-${String(day).padStart(2, '0')}`); return !!(s && s.done); };

  // ---------- Session cards: show the venue for that session
  function paintCards() {
    const o = load();
    document.querySelectorAll('.s-card').forEach(card => {
      const day = card.querySelector('.datebox b'); if (!day) return;
      const col = [...card.querySelectorAll('.s-col')].find(c => c.querySelector('img[src*="map-pin"]')); if (!col) return;
      const val = col.querySelector('.val');
      if (!val.dataset.base) val.dataset.base = val.textContent.trim();
      const ov = o[day.textContent.trim()];
      val.innerHTML = ov ? `${esc(label(ov))}<span class="loc-tag">Moved for this session</span>` : esc(val.dataset.base);
      col.classList.toggle('moved', !!ov);
    });
  }
  window.SessionLocation = { paintCards, load, label, CLINIC_VENUE };
  paintCards();

  // ---------- Sessions page only: Location section + modals
  const modals = [...document.querySelectorAll('.overlay[id^="session-"]')].filter(m => /^session-\d+$/.test(m.id));
  if (!modals.length) return;

  const baseFor = day => { const card = document.getElementById('card-' + day); const v = card && card.querySelector('.s-col img[src*="map-pin"]'); return v ? v.closest('.s-col').querySelector('.val').dataset.base : CLINIC_VENUE; };
  const sessionName = day => { const c = document.getElementById('card-' + day); return c ? c.querySelector('.s-title h3').textContent.trim() : 'Session'; };
  const dateLabel = day => { const m = document.getElementById('session-' + day); return m ? m.querySelector('.m-head h2').textContent.trim() : ''; };
  const playerCount = day => document.querySelectorAll(`#players-${day} .m-row:not(.out)`).length;

  function paintSection(day) {
    const m = document.getElementById('session-' + day); if (!m) return;
    let sec = m.querySelector('.m-sec.m-loc');
    if (!sec) { sec = document.createElement('section'); sec.className = 'm-sec m-loc'; const hr = document.createElement('hr'); hr.className = 'm-hr'; const first = m.querySelector('.m-sec'); first.before(sec); sec.after(hr); }
    const ov = load()[day], done = isDone(day);
    sec.innerHTML = `<h3>Location</h3>
      <div class="m-row loc${ov ? ' moved' : ''}">
        <span class="loc-ic"><img src="assets/icons/map-pin-24.svg" alt=""></span>
        <div class="m-who"><b>${esc(ov ? label(ov) : baseFor(day))}</b><span>${ov ? `Moved from ${esc(baseFor(day))} · ${esc(ov.reason)}` : 'Clinic location'}</span></div>
        ${ov ? '<span class="badge badge-brand">This session only</span>' : ''}
      </div>
      ${ov && ov.note ? `<p class="loc-note"><b>Directions for players:</b> ${esc(ov.note)}</p>` : ''}
      <div class="m-coach-acts">${done ? '<span>Completed sessions can’t be changed.</span>'
        : ov ? `<button class="btn btn-sm btn-outline" type="button" data-loc-change="${day}">Change again</button><button class="btn btn-sm btn-soft" type="button" data-loc-revert="${day}">Move back to ${esc(baseFor(day))}</button>`
        : `<button class="btn btn-sm btn-outline" type="button" data-loc-change="${day}">Change location for this session</button><span>Every other session stays at ${esc(CLINIC_VENUE)}.</span>`}</div>`;
  }
  modals.forEach(m => paintSection(m.id.split('-')[1]));

  // ---------- Change + review modals (built once)
  document.body.insertAdjacentHTML('beforeend', `
  <div class="overlay" id="loc-edit" hidden role="dialog" aria-modal="true" aria-labelledby="le-title">
    <div class="modal co-like loc-modal">
      <button class="x-btn" type="button" data-loc-cancel aria-label="Close">✕</button>
      <h2 id="le-title">Change location</h2>
      <p class="loc-scope"><span class="scope-pill">This session only</span><span id="le-scope"></span></p>
      <form id="le-form" novalidate>
        <fieldset class="loc-choice"><legend>Where is it moving?</legend>
          <label class="loc-opt"><input type="radio" name="le-kind" value="courts" checked><span><b>Same venue, different courts</b><small>e.g. moving to the outdoor courts while the indoor courts host an event</small></span></label>
          <label class="loc-opt"><input type="radio" name="le-kind" value="venue"><span><b>A different venue</b><small>The session moves to another address</small></span></label>
        </fieldset>
        <div class="field" id="le-venue-field" hidden><label for="le-venue">Venue <span class="req">*</span></label>
          <select class="select" id="le-venue"><option value="">Choose a venue</option>${VENUES.filter(v => v !== CLINIC_VENUE).map(v => `<option>${v}</option>`).join('')}</select></div>
        <div class="field"><label for="le-courts" id="le-courts-label">Courts or area <span class="req">*</span></label>
          <input class="input" id="le-courts" placeholder="e.g. Outdoor Courts 5–6" autocomplete="off"></div>
        <div class="field"><label>Reason <span class="req">*</span></label><div class="rv-chips" id="le-reasons">${REASONS.map(r => `<button type="button" data-reason="${r}">${r}</button>`).join('')}</div></div>
        <div class="field"><label for="le-note">Directions for players <span class="opt">(optional)</span></label>
          <textarea class="textarea" id="le-note" rows="2" placeholder="e.g. The outdoor courts are behind the clubhouse. Park in Lot C."></textarea></div>
        <p class="hint err" id="le-err" hidden></p>
        <p class="loc-preview" id="le-preview"></p>
        <div class="loc-acts"><button class="btn btn-lg btn-soft" type="button" data-loc-cancel>Cancel</button><button class="btn btn-lg btn-primary" type="submit">Review change</button></div>
      </form>
    </div>
  </div>
  <div class="overlay" id="loc-review" hidden role="dialog" aria-modal="true" aria-labelledby="lr-title">
    <div class="modal co-like loc-modal">
      <button class="x-btn" type="button" data-loc-cancel aria-label="Close">✕</button>
      <h2 id="lr-title">Move this session?</h2>
      <div class="loc-swap" id="lr-swap"></div>
      <ul class="loc-impact" id="lr-impact"></ul>
      <p class="loc-notify" id="lr-notify"></p>
      <div class="loc-acts"><button class="btn btn-lg btn-soft" type="button" id="lr-back">Back</button><button class="btn btn-lg btn-primary" type="button" id="lr-go">Confirm change</button></div>
    </div>
  </div>`);

  let day = null, reason = '', pending = null, revert = false;
  const show = id => { document.querySelectorAll('#loc-edit, #loc-review').forEach(o => (o.hidden = o.id !== id)); };
  const hideAll = () => document.querySelectorAll('#loc-edit, #loc-review').forEach(o => (o.hidden = true));
  const kind = () => document.querySelector('input[name="le-kind"]:checked').value;
  const current = () => load()[day] || { venue: baseFor(day), courts: '' };

  function syncKind() {
    const k = kind();
    $('#le-venue-field').hidden = k !== 'venue';
    $('#le-courts-label').innerHTML = k === 'venue' ? 'Courts or area <span class="opt">(optional)</span>' : 'Courts or area <span class="req">*</span>';
    $('#le-courts').placeholder = k === 'venue' ? 'e.g. Courts 1–2' : 'e.g. Outdoor Courts 5–6';
    preview();
  }
  function draft() { const k = kind(); return { venue: k === 'venue' ? $('#le-venue').value : CLINIC_VENUE, courts: $('#le-courts').value.trim(), reason, note: $('#le-note').value.trim() }; }
  function preview() { const d = draft(); $('#le-preview').innerHTML = d.venue && (d.courts || kind() === 'venue') ? `<img src="assets/icons/map-pin-16.svg" alt="">Players will see <b>${esc(label(d))}</b> for this session.` : ''; }

  function openEdit(d) {
    day = d; revert = false; const ov = load()[day];
    $('#le-title').textContent = `Change location for ${sessionName(day)}`;
    $('#le-scope').textContent = `${dateLabel(day)}. Every other session stays at ${CLINIC_VENUE}.`;
    const k = ov && ov.venue !== CLINIC_VENUE ? 'venue' : 'courts';
    document.querySelector(`input[name="le-kind"][value="${k}"]`).checked = true;
    $('#le-venue').value = ov && k === 'venue' ? ov.venue : ''; $('#le-courts').value = ov ? ov.courts : ''; $('#le-note').value = ov ? ov.note || '' : '';
    reason = ov ? ov.reason : '';
    document.querySelectorAll('#le-reasons button').forEach(b => b.classList.toggle('on', b.dataset.reason === reason));
    $('#le-err').hidden = true; syncKind(); show('loc-edit'); setTimeout(() => $('#le-courts').focus(), 30);
  }
  function openReview(next, isRevert) {
    pending = next; revert = isRevert;
    const from = current(), x = sessionName(day), players = playerCount(day);
    $('#lr-title').textContent = isRevert ? `Move ${x} back to ${baseFor(day)}?` : `Move ${x} to ${label(next)}?`;
    const box = (cls, small, loc) => `<div class="sw ${cls}"><span class="loc-ic"><img src="assets/icons/map-pin-24.svg" alt=""></span><div><small>${small}</small><b>${esc(loc)}</b></div></div>`;
    $('#lr-swap').innerHTML = box('from', 'Now', label(from)) + '<span class="sw-arrow">→</span>' + box('to', isRevert ? 'Back to' : 'Moving to', isRevert ? baseFor(day) : label(next));
    const li = [`<b>This session only:</b> ${esc(x)}, ${esc(dateLabel(day))}.`, `Every other session stays at ${esc(CLINIC_VENUE)}.`, 'The time, coach and fees don’t change.'];
    if (!isRevert) { li.push(`<b>Reason:</b> ${esc(next.reason)}`); if (next.note) li.push(`<b>Directions:</b> ${esc(next.note)}`); }
    li.push('Players see the new location in their session details and calendar invite.');
    $('#lr-impact').innerHTML = li.map(l => `<li>${l}</li>`).join('');
    $('#lr-notify').innerHTML = `<img src="assets/icons/bell.svg" alt="">${players} player${players === 1 ? '' : 's'}, substitutes and the coach are notified.`;
    $('#lr-go').textContent = isRevert ? 'Move back' : 'Confirm change';
    show('loc-review');
  }

  document.querySelectorAll('input[name="le-kind"]').forEach(r => r.addEventListener('change', syncKind));
  ['#le-courts', '#le-venue', '#le-note'].forEach(s => $(s).addEventListener('input', () => { $('#le-err').hidden = true; preview(); }));
  $('#le-venue').addEventListener('change', preview);
  $('#le-reasons').addEventListener('click', e => { const b = e.target.closest('[data-reason]'); if (!b) return; reason = b.dataset.reason; document.querySelectorAll('#le-reasons button').forEach(x => x.classList.toggle('on', x === b)); $('#le-err').hidden = true; });
  $('#le-form').addEventListener('submit', e => {
    e.preventDefault();
    const d = draft(), err = m => { $('#le-err').textContent = m; $('#le-err').hidden = false; };
    if (kind() === 'venue' && !d.venue) return err('Choose the venue this session is moving to.');
    if (kind() === 'courts' && !d.courts) return err('Enter the courts or area, e.g. Outdoor Courts 5–6.');
    if (!d.reason) return err('Pick a reason so players know why the session moved.');
    const cur = current();
    if (label(d).toLowerCase() === label(cur).toLowerCase() || d.venue.toLowerCase() === baseFor(day).toLowerCase() && !d.courts) return err('That’s where this session already is. Pick a different location.');
    openReview(d, false);
  });
  $('#lr-back').addEventListener('click', () => (revert ? hideAll() : show('loc-edit')));
  $('#lr-go').addEventListener('click', () => {
    const o = load(), x = sessionName(day);
    if (revert) { delete o[day]; save(o); toast(`${x} is back at ${baseFor(day)} · players, substitutes and coach notified`); }
    else { o[day] = pending; save(o); toast(`${x} moved to ${label(pending)} · players, substitutes and coach notified`); }
    hideAll(); paintSection(day); paintCards();
  });
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-loc-change]'), r = e.target.closest('[data-loc-revert]');
    if (c) openEdit(c.dataset.locChange);
    else if (r) { day = r.dataset.locRevert; openReview({ venue: baseFor(day), courts: '' }, true); }
    else if (e.target.closest('[data-loc-cancel]') || e.target.matches('#loc-edit, #loc-review')) hideAll();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !($('#loc-edit').hidden && $('#loc-review').hidden)) { e.stopPropagation(); hideAll(); } }, true);
})();

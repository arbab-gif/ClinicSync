/* Rename a session: the organizer gives a session its own name (e.g. "Serve & volley clinic").
   The card shows "Session 3 · Serve & volley clinic"; players see the same name in their schedule.
   Names persist in localStorage (cs-session-names), keyed by the card/modal id suffix (e.g. "10"). */
(() => {
  const KEY = 'cs-session-names';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let names = load(), current = null;

  // remember each session's number ("Session 3") so a name can be added or removed
  const cards = [...document.querySelectorAll('.s-card[id^="card-"]')];
  const base = {};
  cards.forEach(c => { const h = c.querySelector('.s-title h3'); if (h) base[c.id.slice(5)] = h.textContent.trim(); });

  // a line under each session modal's title: "Session 3 · Rename"
  document.querySelectorAll('.overlay[id^="session-"]').forEach(ov => {
    const k = ov.id.slice(8); if (!base[k]) return;
    const head = ov.querySelector('.m-head > div'); if (!head) return;
    const line = document.createElement('div'); line.className = 'm-sname';
    line.innerHTML = `<span data-sname="${k}"></span><button class="rn-btn rn-icon" type="button" data-rename="${k}" aria-label="Rename ${base[k]}" title="Rename session"><img src="assets/icons/pencil-simple.svg" alt=""></button>`;
    head.insertBefore(line, head.firstChild);
    // Figma 1553:22575: the time line becomes clock + time and pin + venue
    const p = head.querySelector(':scope > p');
    if (p) { const w = document.createElement('div'); w.className = 'm-when'; w.innerHTML = `<span><img src="assets/icons/clock-brand-24.svg" alt="">${esc(p.textContent.trim())}</span><span><img src="assets/icons/map-pin-brand-24.svg" alt=""><span data-svenue="${k}"></span></span>`; p.replaceWith(w); }
  });
  // the venue follows "Change location" (session-location.js keeps per-session overrides)
  function paintVenue() {
    const SL = window.SessionLocation, o = SL ? SL.load() : {};
    document.querySelectorAll('[data-svenue]').forEach(el => { const ov = o[el.dataset.svenue]; el.textContent = ov ? SL.label(ov) : (SL ? SL.CLINIC_VENUE : 'Riverside Tennis Center'); });
  }
  paintVenue();
  document.addEventListener('click', () => setTimeout(paintVenue, 0));

  // the rename dialog
  const dlg = document.createElement('div');
  dlg.className = 'overlay'; dlg.id = 'rename-session'; dlg.hidden = true; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'rn-title');
  dlg.innerHTML = `<div class="modal rn-modal">
      <button class="x-btn" type="button" data-rn-close aria-label="Close">✕</button>
      <h2 id="rn-title">Rename session</h2>
      <p class="lead" id="rn-lead"></p>
      <div class="field"><label for="rn-input">Session name</label><input class="input" id="rn-input" maxlength="40" autocomplete="off" placeholder="e.g. Serve &amp; volley clinic"><small class="rn-hint">Players see this name in their schedule. Leave it empty to show just the session number.</small></div>
      <div class="rn-acts"><button class="link rn-reset" type="button" id="rn-reset" hidden>Remove name</button><span></span><button class="btn btn-lg btn-soft" type="button" data-rn-close>Cancel</button><button class="btn btn-lg btn-primary" type="button" id="rn-save">Save name</button></div>
    </div>`;
  document.body.appendChild(dlg);
  const $ = s => dlg.querySelector(s);

  function paint() {
    for (const [k, num] of Object.entries(base)) {
      const n = names[k];
      const h = document.querySelector(`#card-${k} .s-title h3`); if (h) h.innerHTML = n ? `${esc(num)} <span class="s-name">· ${esc(n)}</span>` : esc(num);
      const s = document.querySelector(`[data-sname="${k}"]`); if (s) s.textContent = num;
      const card = document.getElementById(`card-${k}`); if (card && n) card.dataset.search = (card.dataset.search || '') + ' ' + n.toLowerCase();
    }
  }
  function open(k) {
    current = k; $('#rn-lead').textContent = `${base[k]} · ${document.getElementById(`sm-title-${k}`)?.textContent || ''}`;
    $('#rn-input').value = names[k] || ''; $('#rn-reset').hidden = !names[k];
    dlg.hidden = false; setTimeout(() => $('#rn-input').focus(), 0);
  }
  const close = () => { dlg.hidden = true; current = null; };
  function commit(value) {
    const v = value.trim();
    if (v) names[current] = v; else delete names[current];
    save(names); paint();
    window.toast && window.toast(v ? `Renamed to “${v}”. Players will see the new name.` : `Back to “${base[current]}”`);
    close();
  }
  document.addEventListener('click', e => {
    const r = e.target.closest('[data-rename]'); if (r) { e.preventDefault(); return open(r.dataset.rename); }
    if (e.target.closest('[data-rn-close]') || e.target === dlg) return close();
    if (e.target.closest('#rn-save')) return commit($('#rn-input').value);
    if (e.target.closest('#rn-reset')) return commit('');
  });
  $('#rn-input').addEventListener('keydown', e => { if (e.key === 'Enter') commit(e.target.value); if (e.key === 'Escape') close(); });
  paint();
})();

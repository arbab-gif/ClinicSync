/* "Exclude specific dates" picker: calendar popover (single dates or a date range) + removable chips.
   Usage: ExcludeDates(fieldEl, { value, schedule, onChange })
     fieldEl  — .wz-field containing [data-ex-open], [data-ex-pop], [data-ex-chips]
     value    — [{ from, to }] ISO date ranges
     schedule — () => clinic object, used to mark session days / skipped sessions on the calendar
     onChange — (ranges) => void
   Needs js/clinic-data.js (ClinicData). */
(() => {
  const D = () => window.ClinicData;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const short = iso => D().parseDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const shortWd = iso => D().parseDate(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Sort and merge overlapping / touching ranges so chips stay tidy
  function normalize(ranges) {
    const out = [];
    [...ranges].sort((a, b) => a.from.localeCompare(b.from)).forEach(r => {
      const last = out[out.length - 1];
      if (last && r.from <= D().addDays(last.to, 1)) { if (r.to > last.to) last.to = r.to; }
      else out.push({ ...r });
    });
    return out;
  }
  const label = r => r.from === r.to ? shortWd(r.from)
    : (r.from.slice(0, 7) === r.to.slice(0, 7) ? `${short(r.from)} – ${+r.to.slice(8)}` : `${short(r.from)} – ${short(r.to)}`);

  window.ExcludeDates = function (field, { value = [], schedule, onChange = () => {} }) {
    const openBtn = field.querySelector('[data-ex-open]'), pop = field.querySelector('[data-ex-pop]'), chips = field.querySelector('[data-ex-chips]');
    let ranges = normalize(value), mode = 'single', pending = null;
    const startIso = () => (schedule && schedule().startDate) || D().isoOf(new Date());
    let view = startIso().slice(0, 7); // YYYY-MM shown in the calendar

    const commit = () => { ranges = normalize(ranges); render(); onChange(ranges.map(r => ({ ...r }))); };

    function toggleDay(iso) {
      if (mode === 'range') {
        if (!pending) { pending = iso; return render(); }
        const [from, to] = pending < iso ? [pending, iso] : [iso, pending];
        pending = null; ranges.push({ from, to }); return commit();
      }
      const i = ranges.findIndex(r => r.from <= iso && iso <= r.to);
      if (i < 0) ranges.push({ from: iso, to: iso });
      else { // clicking an excluded day removes just that day (splits a range if needed)
        const r = ranges.splice(i, 1)[0];
        if (r.from < iso) ranges.push({ from: r.from, to: D().addDays(iso, -1) });
        if (iso < r.to) ranges.push({ from: D().addDays(iso, 1), to: r.to });
      }
      commit();
    }

    function renderCalendar() {
      const [y, m] = view.split('-').map(Number);
      const c = { ...(schedule ? schedule() : {}), excluded: ranges };
      const sess = new Set(D().sessionDates(c).map(D().isoOf)), skip = new Set(D().skippedDates(c).map(D().isoOf));
      const first = new Date(y, m - 1, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m, 0).getDate();
      let cells = '';
      for (let i = 0; i < lead; i++) cells += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const iso = `${view}-${String(d).padStart(2, '0')}`, ex = D().isExcluded(c, iso);
        const cls = [ex && 'ex', sess.has(iso) && 'sess', skip.has(iso) && 'skip', iso === pending && 'pend',
          ex && !D().isExcluded(c, D().addDays(iso, -1)) && 'ex-start', ex && !D().isExcluded(c, D().addDays(iso, 1)) && 'ex-end'].filter(Boolean).join(' ');
        const state = skip.has(iso) ? ', excluded, session skipped' : ex ? ', excluded' : sess.has(iso) ? ', session day' : '';
        cells += `<button type="button" class="${cls}" data-iso="${iso}" aria-pressed="${ex}" aria-label="${shortWd(iso)}${state}">${d}</button>`;
      }
      pop.innerHTML = `
        <div class="ex-mode" role="group" aria-label="Selection mode">
          <button type="button" data-mode="single" aria-pressed="${mode === 'single'}">Single dates</button>
          <button type="button" data-mode="range" aria-pressed="${mode === 'range'}">Date range</button>
        </div>
        <div class="ex-head">
          <button type="button" data-step="-1" aria-label="Previous month"><img src="assets/icons/caret-right.svg" alt="" class="flip"></button>
          <b>${MONTHS[m - 1]} ${y}</b>
          <button type="button" data-step="1" aria-label="Next month"><img src="assets/icons/caret-right.svg" alt=""></button>
        </div>
        <div class="ex-grid" role="grid">${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(w => `<i>${w}</i>`).join('')}${cells}</div>
        <p class="ex-tip">${mode === 'range' ? (pending ? `From ${shortWd(pending)} — now pick the last date.` : 'Pick the first and last date of the range.') : 'Tap dates to exclude them. Tap again to include.'}</p>
        <div class="ex-foot">
          <span class="ex-legend"><i class="l-sess"></i>Session day<i class="l-ex"></i>Excluded</span>
          <button type="button" class="btn btn-sm btn-primary" data-done>Done</button>
        </div>`;
    }

    function renderChips() {
      const c = { ...(schedule ? schedule() : {}), excluded: ranges };
      const skip = D().skippedDates(c).map(D().isoOf);
      chips.innerHTML = ranges.map((r, i) => {
        const n = skip.filter(s => r.from <= s && s <= r.to).length;
        return `<li class="ex-chip${n ? ' hits' : ''}"><img src="assets/icons/calendar-blank-16.svg" alt=""><span>${label(r)}</span>${n ? `<small>${n} session${n > 1 ? 's' : ''} skipped</small>` : ''}<button type="button" data-rm="${i}" aria-label="Remove ${label(r)}"><img src="assets/icons/x-close-sm.svg" alt=""></button></li>`;
      }).join('');
      chips.hidden = !ranges.length;
      const v = openBtn.querySelector('.val');
      const nDays = ranges.reduce((n, r) => n + Math.round((D().parseDate(r.to) - D().parseDate(r.from)) / 864e5) + 1, 0);
      v.textContent = ranges.length ? `${nDays} date${nDays > 1 ? 's' : ''} excluded · add more` : 'Select dates';
      v.classList.toggle('ph', !ranges.length);
    }
    function render() { if (!pop.hidden) renderCalendar(); renderChips(); }

    const setOpen = open => {
      if (!open && pending) { ranges.push({ from: pending, to: pending }); pending = null; commit(); } // half-picked range = that one day
      pop.hidden = !open; openBtn.setAttribute('aria-expanded', String(open)); openBtn.classList.toggle('open', open);
      if (open) { view = (ranges[0] && ranges[0].from >= startIso() ? ranges[0].from : startIso()).slice(0, 7); pending = null; renderCalendar(); place(); }
    };
    // Open upward when there isn't room above the sticky footer
    const place = () => {
      const footer = document.querySelector('.stepbar'), limit = footer ? footer.getBoundingClientRect().top : innerHeight;
      const below = limit - openBtn.getBoundingClientRect().bottom, above = openBtn.getBoundingClientRect().top - 90;
      const up = pop.offsetHeight + 12 > below && above > below;
      pop.style.top = (up ? openBtn.offsetTop - pop.offsetHeight - 6 : openBtn.offsetTop + openBtn.offsetHeight + 6) + 'px';
    };
    openBtn.addEventListener('click', () => setOpen(pop.hidden));
    pop.addEventListener('click', e => {
      const day = e.target.closest('[data-iso]'), step = e.target.closest('[data-step]'), md = e.target.closest('[data-mode]');
      if (day) toggleDay(day.dataset.iso);
      else if (step) { const [y, m] = view.split('-').map(Number), d = new Date(y, m - 1 + Number(step.dataset.step), 1); view = D().isoOf(d).slice(0, 7); renderCalendar(); }
      else if (md) { mode = md.dataset.mode; pending = null; renderCalendar(); }
      else if (e.target.closest('[data-done]')) { setOpen(false); openBtn.focus(); }
    });
    chips.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { ranges.splice(Number(b.dataset.rm), 1); commit(); } });
    // composedPath, not contains(): clicking a day re-renders the calendar, detaching the clicked node
    document.addEventListener('click', e => { if (!pop.hidden && !e.composedPath().includes(field)) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { setOpen(false); openBtn.focus(); } });
    renderChips();

    return { get: () => ranges.map(r => ({ ...r })), add: r => { ranges.push({ ...r }); commit(); }, refresh: render, label };
  };
})();

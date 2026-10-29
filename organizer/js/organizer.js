/* ClinicSync — Organizer portal. Small shared behaviours, driven by data attributes:
   data-open="#id"     opens an overlay (modal/drawer) by id
   data-close          closes the overlay it sits in (also Esc and backdrop click)
   data-menu="#id"     toggles a dropdown menu
   data-group          one ".on" child at a time (segmented controls, pills, tabs inside a page)
   data-toast="text"   shows a toast (used for actions outside the prototype)
   data-href="url"     makes any element navigate on click */

(() => {
  const $ = (s, el = document) => el.querySelector(s);

  function openOverlay(el) {
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    (el.querySelector('[data-autofocus]') || el.querySelector('button, a, input'))?.focus();
  }
  function closeOverlay(el) {
    el.hidden = true;
    if (!document.querySelector('.overlay:not([hidden])')) document.body.style.overflow = '';
  }

  let toastTimer;
  window.toast = msg => {
    let t = $('#toast');
    if (!t) { t = Object.assign(document.createElement('div'), { id: 'toast', className: 'toast', role: 'status' }); document.body.append(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600);
  };

  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open]');
    if (opener) { e.preventDefault(); const el = $(opener.dataset.open); if (el) openOverlay(el); return; }

    const closer = e.target.closest('[data-close]');
    if (closer) { e.preventDefault(); closeOverlay(closer.closest('.overlay')); return; }
    if (e.target.classList.contains('overlay')) { closeOverlay(e.target); return; }

    const menuBtn = e.target.closest('[data-menu]');
    document.querySelectorAll('.menu:not([hidden])').forEach(m => { if (!menuBtn || $(menuBtn.dataset.menu) !== m) m.hidden = true; });
    if (menuBtn) { const m = $(menuBtn.dataset.menu); m.hidden = !m.hidden; menuBtn.setAttribute('aria-expanded', String(!m.hidden)); return; }

    const item = e.target.closest('[data-group] > *');
    if (item && !item.disabled) { [...item.parentElement.children].forEach(c => c.classList.toggle('on', c === item)); }

    const t = e.target.closest('[data-toast]');
    if (t) { e.preventDefault(); window.toast(t.dataset.toast); return; }

    const h = e.target.closest('[data-href]');
    if (h && !e.target.closest('a, button:not([data-href])')) location.href = h.dataset.href;
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = [...document.querySelectorAll('.overlay:not([hidden])')].pop();
    if (open) closeOverlay(open);
    document.querySelectorAll('.menu:not([hidden])').forEach(m => (m.hidden = true));
  });

  // Pages can open an overlay on load with ?open=<id> (handy for linking straight to a modal state)
  const id = new URLSearchParams(location.search).get('open');
  if (id && document.getElementById(id)) openOverlay(document.getElementById(id));
})();

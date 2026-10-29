/* Create-clinic wizard helpers: listbox dropdowns, form state kept in sessionStorage. */
(() => {
  const KEY = 'cs-clinic';
  window.wz = {
    get() { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
    set(patch) { try { sessionStorage.setItem(KEY, JSON.stringify({ ...window.wz.get(), ...patch })); } catch (e) {} }
  };
  // Listbox: <div class="wz-field" data-listbox> <button data-menu="#m"> <span class="val">…</span></button> <div class="menu" id="m"> <button data-value="x">…
  document.addEventListener('click', e => {
    const opt = e.target.closest('[data-listbox] .menu [data-value]');
    if (!opt) return;
    const box = opt.closest('[data-listbox]');
    const val = box.querySelector('.val');
    val.textContent = opt.dataset.label || opt.textContent.trim();
    val.classList.remove('ph');
    const hid = box.querySelector('input[type=hidden]');
    if (hid) hid.value = opt.dataset.value;
    box.querySelector('.wz-input')?.classList.remove('err');
    box.querySelector('.wz-err')?.remove();
  });
  window.wzError = (field, msg) => {
    field.querySelector('.wz-input')?.classList.add('err');
    if (!field.querySelector('.wz-err')) { const p = document.createElement('p'); p.className = 'wz-err'; p.textContent = msg; field.append(p); }
  };
  document.addEventListener('input', e => {
    const f = e.target.closest('.wz-field'); if (!f) return;
    f.querySelector('.wz-input')?.classList.remove('err'); f.querySelector('.wz-err')?.remove();
  });
})();

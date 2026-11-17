/* Coach portal header: the same header as the organizer and player apps (o-header / o-nav pills / bell / account).
   Usage: <header data-coach-header data-active="Dashboard"></header>, loaded before ../organizer/js/organizer.js. */
(() => {
  const host = document.querySelector('[data-coach-header]'); if (!host) return;
  const active = host.dataset.active;
  const O = '/organizer/assets/icons/';
  const TABS = [
    ['Dashboard', 'dashboard.html', O + 'nav-clinics.svg'],
    ['Clinics', 'clinics.html', O + 'court-basketball.svg'],
    ['Messages', 'messages.html', O + 'chat-circle.svg', 3],
  ];
  host.classList.add('o-header', 'p-header');
  host.innerHTML = `
    <a class="o-brand" href="dashboard.html"><img src="/organizer/assets/logo-mark.png" alt=""><span>ClinicSync</span></a>
    <nav class="o-nav" aria-label="Main">${TABS.map(([label, href, ico, count]) => {
      const on = label === active;
      return `<a href="${href}"${on ? ' class="on" aria-current="page"' : ''}><span class="o-nav-ico" style="--ico:url(${ico})" aria-hidden="true"></span><span class="o-nav-label">${label}</span>${count ? `<span class="o-nav-count" aria-label="${count} unread">${count}</span>` : ''}</a>`;
    }).join('')}</nav>
    <div class="o-header-right">
      <button class="o-bell" type="button" aria-label="Notifications, unread" data-toast="Notifications are next on the list"><img src="${O}bell.svg" alt=""><span class="dot"></span></button>
      <div class="o-account">
        <button type="button" data-menu="#account-menu" aria-haspopup="menu" aria-expanded="false">
          <span class="avatar"><img src="${O}user.svg" alt=""></span><span class="name">Maria Lopez</span><img class="icon-24" src="${O}caret-down.svg" alt="">
        </button>
        <div class="menu" id="account-menu" role="menu" hidden>
          <a role="menuitem" href="settings.html">My profile</a>
          <a role="menuitem" href="settings.html?tab=support">Support</a>
          <button role="menuitem" type="button" data-coach-reset>Reset prototype data</button>
          <a role="menuitem" href="sign-up.html">Logout</a>
        </div>
      </div>
    </div>`;
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-coach-reset]')) return;
    try { ['cs-coach', 'cs-dm', 'cs-dm-read'].forEach(k => localStorage.removeItem(k)); } catch {}
    location.reload();
  });
})();

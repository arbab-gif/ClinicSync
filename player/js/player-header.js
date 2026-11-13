/* Player portal header: the organizer's header (o-header / o-nav pills / bell / account), same tabs.
   Usage: <header class="o-header" data-player-header data-active="Messages"></header>, loaded before organizer.js. */

(() => {
  const host = document.querySelector('[data-player-header]'); if (!host) return;
  const active = host.dataset.active;
  const O = '/organizer/assets/icons/', P = '/player/assets/icons/';
  // Same three tabs as the organizer header; sessions, substitutes and payments live inside a clinic
  const TABS = [
    ['Dashboard', 'dashboard.html', O + 'nav-clinics.svg'],
    ['Clinics', 'clinics.html', O + 'court-basketball.svg'],
    ['Messages', 'messages.html', O + 'chat-circle.svg', 3],
  ];
  host.classList.add('o-header', 'p-header');
  host.innerHTML = `
    <a class="o-brand" href="dashboard.html"><img src="../organizer/assets/logo-mark.png" alt=""><span>ClinicSync</span></a>
    <nav class="o-nav" aria-label="Main">${TABS.map(([label, href, ico, count]) => {
      const on = label === active;
      const attrs = href ? `href="${href}"` : `href="#" data-toast="${label} is next on the list"`;
      return `<a ${attrs}${on ? ' class="on" aria-current="page"' : ''}><span class="o-nav-ico" style="--ico:url(${ico})" aria-hidden="true"></span><span class="o-nav-label">${label}</span>${count ? `<span class="o-nav-count" aria-label="${count} unread">${count}</span>` : ''}</a>`;
    }).join('')}</nav>
    <div class="o-header-right">
      <button class="o-bell" type="button" aria-label="Notifications, unread" data-toast="Notifications are next on the list"><img src="../organizer/assets/icons/bell.svg" alt=""><span class="dot"></span></button>
      <div class="o-account">
        <button type="button" data-menu="#account-menu" aria-haspopup="menu" aria-expanded="false">
          <span class="avatar"><img src="../organizer/assets/icons/user.svg" alt=""></span><span class="name">Jessica Lee</span><img class="icon-24" src="../organizer/assets/icons/caret-down.svg" alt="">
        </button>
        <div class="menu" id="account-menu" role="menu" hidden>
          <a role="menuitem" href="settings.html">My profile</a>
          <a role="menuitem" href="settings.html?tab=support">Support</a>
          <button role="menuitem" type="button" id="reset-demo">Reset prototype data</button>
          <a role="menuitem" href="/index.html">Logout</a>
        </div>
      </div>
    </div>`;
})();

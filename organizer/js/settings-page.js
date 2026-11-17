/* Profile & settings: one page, tabs across the top (no left panel, no log out — that lives in the account menu).
   <body data-role="organizer|player|coach">; ?tab=profile|subscription|invite|password|terms|privacy|support */
(() => {
  const role = ['player', 'coach'].includes(document.body.dataset.role) ? document.body.dataset.role : 'organizer';
  const ME = role === 'coach'
    ? { name: 'Maria Lopez', ini: 'ML', line: 'Coach · Riverside, CA · Member since Aug 2026', email: 'maria.lopez@gmail.com', phone: '+1 (951) 555-0163', sports: [['Tennis', 'USPTA certified'], ['Padel', 'Level 2 coach']], plan: 'Pro',
        extra: [['Experience', '5–10 years · Beginner and intermediate players'], ['Usual coaching fee', '$25 per player, per session'], ['Get paid with', 'Stripe · Venmo @maria-coach · Cash'], ['About', 'Patient, drill-first coach. Builds a reliable serve and net game.']] }
    : role === 'player'
    ? { name: 'Jessica Lee', ini: 'JL', line: 'Player · Riverside, CA · Member since Sep 2026', email: 'jessica.lee@gmail.com', phone: '+1 (951) 555-0187', sports: [['Tennis', 'NTRP 3.5'], ['Padel', 'Intermediate']], plan: 'Starter' }
    : { name: 'Albert John', ini: 'AJ', line: 'Organizer · Riverside, CA · Member since Sep 2026', email: 'albert.john@gmail.com', phone: '+1 (951) 555-0142', sports: [['Tennis', 'NTRP 4.0'], ['Padel', 'Intermediate']], plan: 'Plus' };
  const TABS = [['profile', 'My profile'], ['subscription', 'Subscription'], ...(role === 'organizer' ? [['invite', 'Invite a coach']] : []), ['password', 'Change password'], ['terms', 'Terms & Conditions'], ['privacy', 'Privacy Policy']];
  const PLANS = [
    ['Starter', 'For players and substitutes', ['Player', 'Substitute'], 9, ['Join unlimited clinics as a player', 'Play as a substitute', 'Session reminders', 'Group and one-to-one chat', 'Payment tracking']],
    ['Plus', 'For players, substitutes and organizers', ['Player', 'Substitute', 'Organizer'], 19, ['Everything in Starter', 'Organize up to 5 active clinics', 'Invite and manage players and subs', 'Attendance and payment reports']],
    ['Pro', 'For players, substitutes, organizers and coaches', ['Player', 'Substitute', 'Organizer', 'Coach'], 39, ['Everything in Plus', 'Coach clinics and set your fee', 'Unlimited active clinics', 'Coach dashboard and earnings', 'Priority support']],
  ];
  const $ = s => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  let tab = TABS.some(t => t[0] === q.get('tab')) || q.get('tab') === 'support' ? q.get('tab') : 'profile';
  const field = (id, label, type = 'text', ph = '') => `<div class="field"><label for="${id}">${label}</label><input class="input" id="${id}" type="${type}" placeholder="${ph}"></div>`;
  const cur = PLANS.find(p => p[0] === ME.plan);

  const VIEWS = {
    profile: () => `<section class="st-card">
        <div class="st-me"><span class="st-av">${ME.ini}</span><div><h2 class="h2">${ME.name}</h2><p>${ME.line}</p></div><button class="btn btn-md btn-outline" type="button" data-toast="Edit profile is the next screen">Edit profile</button></div>
        <dl class="st-rows">
          <div><dt>Display name</dt><dd>${ME.ini}</dd></div><div><dt>Email</dt><dd>${ME.email}</dd></div><div><dt>Phone</dt><dd>${ME.phone}</dd></div>
          <div><dt>Location</dt><dd>Riverside, California</dd></div>
          <div><dt>Sports</dt><dd class="st-chips">${ME.sports.map(([s, l]) => `<span class="chip">${s} · ${l}</span>`).join('')}</dd></div>
          ${(ME.extra || []).map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}
        </dl></section>`,
    subscription: () => `<section class="st-card st-plan">
        <div><div class="st-plan-t"><b>${ME.plan} plan</b><span class="badge badge-brand">Current</span></div><p>$${cur[3]}/month · Renews Dec 1, 2026</p></div>
        <div class="st-pay"><b>Visa •••• 4242</b><button class="link" type="button" data-toast="Update payment method is the next screen">Update payment method</button></div>
        ${role === 'organizer' ? '<div class="st-usage"><span>Active clinics you organize</span><b>4 of 5</b><i style="--p:80%"></i></div>' : ''}
      </section>
      <div class="st-plans">${PLANS.map(([n, d, roles, price, feats]) => `<article class="st-plancard${n === ME.plan ? ' on' : ''}">
          <h3 class="h3">${n}</h3><p>${d}</p><div class="st-chips">${roles.map(r => `<span class="chip">${r}</span>`).join('')}</div>
          <div class="st-price"><b>$${price}</b><span>/month</span></div>
          <ul>${feats.map(f => `<li>${f}</li>`).join('')}</ul>
          ${n === ME.plan ? '<button class="btn btn-md btn-soft" type="button" disabled>Current plan</button>' : `<button class="btn btn-md ${PLANS.findIndex(p => p[0] === n) > PLANS.indexOf(cur) ? 'btn-primary' : 'btn-outline'}" type="button" data-toast="${n} plan confirmation is the next screen">${PLANS.findIndex(p => p[0] === n) > PLANS.indexOf(cur) ? 'Upgrade' : 'Downgrade'} to ${n}</button>`}
        </article>`).join('')}</div>
      <section class="st-card"><h3 class="h3">Billing history</h3><table class="st-bill"><tbody>
        ${['Nov 1, 2026', 'Oct 1, 2026', 'Sep 1, 2026'].map(d => `<tr><td>${d}</td><td>${ME.plan} · monthly</td><td>$${cur[3]}.00</td><td><span class="st st-green">Paid</span></td><td><button class="link" type="button" data-toast="Receipt downloaded">Download</button></td></tr>`).join('')}
      </tbody></table></section>`,
    invite: () => `<section class="st-card st-narrow"><h3 class="h3">Invite a coach</h3><p class="st-sub">Coaches you invite can be added to your clinics and set their own fee.</p>
        ${field('cx-email', 'Coach email', 'email', 'coach@email.com')}
        <div class="field"><label for="cx-note">Note <span class="opt">(optional)</span></label><textarea class="textarea" id="cx-note" rows="3" placeholder="Say hello and mention the clinics you run"></textarea></div>
        <div class="st-acts"><button class="btn btn-lg btn-primary" type="button" data-toast="Invite sent">Send invite</button></div></section>`,
    password: () => `<section class="st-card st-narrow"><h3 class="h3">Change password</h3>
        ${field('pw-cur', 'Current password', 'password')}${field('pw-new', 'New password', 'password')}${field('pw-again', 'Confirm new password', 'password')}
        <p class="st-sub">At least 8 characters, with a number and a symbol.</p>
        <div class="st-acts"><button class="btn btn-lg btn-primary" type="button" data-toast="Password updated">Update password</button></div></section>`,
    terms: () => `<section class="st-card st-doc"><h3 class="h3">Terms &amp; Conditions</h3><p class="st-sub">Last updated Oct 1, 2026</p>
        <h4>Using ClinicSync</h4><p>Placeholder copy. The legal team will provide the final terms for accounts, clinics, payments and cancellations.</p>
        <h4>Plans and billing</h4><p>Placeholder copy. Plans renew monthly until you cancel. Facility and coach fees are separate from your plan.</p></section>`,
    privacy: () => `<section class="st-card st-doc"><h3 class="h3">Privacy Policy</h3><p class="st-sub">Last updated Oct 1, 2026</p>
        <h4>What we collect</h4><p>Placeholder copy. The legal team will provide the final policy covering profile, clinic and payment data.</p>
        <h4>Who can see your profile</h4><p>Placeholder copy. People in your clinics see your name, photo, sport and level.</p></section>`,
    support: () => `<section class="st-card st-narrow"><h3 class="h3">Support</h3><p class="st-sub">We usually reply within one business day.</p>
        <div class="field"><label for="sp-topic">Topic</label><select class="input" id="sp-topic"><option>Payments</option><option>Clinics and sessions</option><option>My account</option><option>Something else</option></select></div>
        <div class="field"><label for="sp-msg">Message</label><textarea class="textarea" id="sp-msg" rows="4" placeholder="Tell us what happened"></textarea></div>
        <div class="st-acts"><button class="btn btn-lg btn-primary" type="button" data-toast="Message sent to support">Send message</button></div></section>`,
  };
  function render() {
    $('#st-tabs').innerHTML = TABS.map(([k, l]) => `<button type="button" data-tab="${k}" class="${k === tab ? 'on' : ''}" aria-current="${k === tab ? 'page' : 'false'}">${l}</button>`).join('');
    $('#st-body').innerHTML = VIEWS[tab]();
  }
  $('#st-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; const u = new URL(location); u.searchParams.set('tab', tab); history.replaceState(null, '', u); render(); });
  render();
})();

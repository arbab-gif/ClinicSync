/* ClinicSync — Player invitation & onboarding prototype.
   Hash-routed single page app; all state lives in `state` and is kept in sessionStorage. */

const icon = (d, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const I = {
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  court: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M12 6v12M3 9.5h3v5H3M21 9.5h-3v5h3"/>',
  checkc: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  coach: '<rect x="3.5" y="4" width="17" height="14" rx="1.5"/><circle cx="12" cy="10" r="2.5"/><path d="M7.5 18c.6-2.3 2.4-3.5 4.5-3.5s3.9 1.2 4.5 3.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  warn: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16h.01"/>',
  chat: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-3.8 4-6 8-6s7.2 2.2 8 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h2"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z"/>',
  ball: '<circle cx="12" cy="12" r="8.5"/><path d="M5 6.5c3 2 4.5 5 4 11M19 17.5c-3-2-4.5-5-4-11"/>',
  swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
  dollar: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.4-2.5-1.2M12 6.5v11"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 9.5h18M7 15h4"/>',
  cash: '<rect x="2.5" y="6.5" width="19" height="11" rx="1.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>',
  google: '',
};

/* ---------- Data ---------- */
const CLINIC = {
  name: 'Monday Morning Tennis',
  organizer: 'Jenny Wilson',
  venmo: '@jenny-wilson',
  location: 'Riverside Tennis Center',
  schedule: 'Mondays, 9:00–10:30 AM',
  share: 'Half Share',
  allowed: 4,
  total: 8,
  facilityFee: 125,
  coachFee: 50,
  coach: 'Jane Cooper',
};
const SESSIONS = [
  { n: 1, date: '2026-11-02', spots: 4 },
  { n: 2, date: '2026-11-09', spots: 3 },
  { n: 3, date: '2026-11-16', spots: 4 },
  { n: 4, date: '2026-11-23', spots: 2 },
  { n: 5, date: '2026-11-30', spots: 3 },
  { n: 6, date: '2026-12-07', spots: 0 },
  { n: 7, date: '2026-12-14', spots: 1 },
  { n: 8, date: '2026-12-21', spots: 4 },
];
const fmt = (iso, opts) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', opts);
const longDate = iso => fmt(iso, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const shortDate = iso => fmt(iso, { month: 'short', day: 'numeric' });
const money = n => '$' + n.toFixed(2);

const DEFAULT = {
  account: null,          // { name, email }
  verified: false,
  invite: 'pending',      // pending | accepted | declined
  profile: { phone: '', rating: '3.5', venmo: '' },
  selected: [],
  payment: 'outstanding', // outstanding | paid (card) | reported (Venmo) | cash
  method: 'card',        // card | venmo | cash
  rsvp: {},
  intent: null,           // 'accept' when the player tapped Accept in the email before signing up
};
let state = load();
function load() {
  try { return { ...structuredClone(DEFAULT), ...JSON.parse(sessionStorage.getItem('cs-player') || '{}') }; }
  catch { return structuredClone(DEFAULT); }
}
function save() { try { sessionStorage.setItem('cs-player', JSON.stringify(state)); } catch {} }

/* ---------- Helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const go = route => { location.hash = route; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const firstName = () => (state.account?.name || 'Jessica Lee').split(' ')[0];

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

const brand = (href = '#invitation') =>
  `<a class="brand" href="${href}"><img src="assets/logo-mark.png" alt=""><span>ClinicSync</span></a>`;

function renderTopbar(route) {
  const bar = $('#topbar');
  if (route === 'invitation' || route === 'checkout') { bar.hidden = true; return; }
  bar.hidden = false;
  const loggedIn = !!state.account;
  const nav = route === 'dashboard' ? `
    <nav class="topnav" aria-label="Main">
      <a class="on" href="#dashboard">${icon(I.home)}Dashboard</a>
      <a href="#dashboard" data-soon>${icon(I.ball)}My Clinics</a>
      <a href="#dashboard" data-soon>${icon(I.cal)}Sessions</a>
      <a href="#dashboard" data-soon>${icon(I.swap)}Substitutes</a>
      <a href="#dashboard" data-soon>${icon(I.chat)}Messages <span class="count">2</span></a>
      <a href="#dashboard" data-soon>${icon(I.dollar)}Payments</a>
    </nav>` : '';
  bar.innerHTML = `
    ${brand(loggedIn && state.invite === 'accepted' ? '#dashboard' : '#invitation')}
    ${nav}
    <div class="top-right">
      ${route === 'dashboard' ? `<button class="bell" type="button" aria-label="Notifications" data-soon>${icon(I.bell, 24)}<span class="dot">3</span></button>` : ''}
      ${loggedIn ? `
        <div class="user">
          <button class="user-btn" type="button" id="user-btn" aria-haspopup="menu" aria-expanded="false">
            <span class="avatar">${icon(I.user, 26)}</span><span class="name">${esc(state.account.name)}</span>${icon(I.down, 20)}
          </button>
          <div class="menu" id="user-menu" role="menu" hidden>
            <button role="menuitem" type="button" data-soon>Account settings</button>
            <button role="menuitem" type="button" id="restart">Restart demo</button>
          </div>
        </div>`
      : `<span class="hint">Already have an account?</span><a class="signin-link" href="#signup">Sign in</a>`}
    </div>`;
  const btn = $('#user-btn');
  if (btn) {
    btn.onclick = e => { e.stopPropagation(); const m = $('#user-menu'); m.hidden = !m.hidden; btn.setAttribute('aria-expanded', String(!m.hidden)); };
    $('#restart').onclick = () => { state = structuredClone(DEFAULT); save(); go('invitation'); toast('Demo restarted'); };
  }
}
document.addEventListener('click', e => {
  const m = $('#user-menu'); if (m && !m.hidden && !e.target.closest('.user')) m.hidden = true;
  const soon = e.target.closest('[data-soon]');
  if (soon) { e.preventDefault(); toast('Not part of this onboarding prototype'); }
});

function stepbar({ step, back, primary, primaryId = 'next', disabled = false, status = '', extra = '' }) {
  return `
  <div class="stepbar">
    <div><button class="btn btn-secondary" type="button" id="back">Back</button></div>
    <div class="progress" aria-label="Step ${step} of 3">
      <div class="bars">${[1, 2, 3].map(i => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
      <small>Joining ${CLINIC.name} • Step ${step} of 3</small>
    </div>
    <div class="right">
      ${status}
      ${extra}
      <button class="btn btn-primary" type="button" id="${primaryId}" ${disabled ? 'disabled' : ''}>${primary}</button>
    </div>
  </div>`;
}

const detailRows = () => [
  [I.pin, 'Location', CLINIC.location],
  [I.cal, 'Schedule', CLINIC.schedule],
  [I.clock, 'Total Sessions', `${CLINIC.total} sessions`],
  [I.court, 'Your Share', CLINIC.share],
  [I.checkc, 'Sessions Allowed', `${CLINIC.allowed} sessions`],
  [I.user, 'Coach', CLINIC.coach],
  [I.court, 'Facility Fee', money(CLINIC.facilityFee)],
  [I.coach, 'Coach Fee', `$${CLINIC.coachFee} per attending player, per session`],
].map(([ic, k, v]) => `<div class="row"><span class="k">${icon(ic)}${k}</span><span class="v">${v}</span></div>`).join('');

/* ---------- Screens ---------- */
const screens = {};

// 01 — Invitation received: the organizer's HTML email (emails/organizer-invitation-email.js) shown in an inbox
screens.invitation = () => {
  const mail = {
    assets: 'assets/',
    asset: window.EMAIL_ASSETS ? n => window.EMAIL_ASSETS[n] : null,
    firstName: 'Jessica',
    email: 'jessica.lee@email.com',
    expires: 'November 4, 2026',
    inviteUrl: 'https://clinicsync.app/i/MMT-7H2K',
    acceptHref: '#accept', declineHref: '#decline', contactHref: '#contact', prefsHref: '#prefs',
    clinic: {
      name: CLINIC.name, organizer: CLINIC.organizer, organizerFirst: CLINIC.organizer.split(' ')[0],
      location: CLINIC.location, schedule: CLINIC.schedule, total: CLINIC.total, share: CLINIC.share,
      allowed: CLINIC.allowed, coach: CLINIC.coach, facilityFee: money(CLINIC.facilityFee), coachFee: `$${CLINIC.coachFee}`,
      venmo: CLINIC.venmo, firstSession: fmt(SESSIONS[0].date, { weekday: 'short', month: 'short', day: 'numeric' }),
    },
  };
  app.innerHTML = `
  <div class="mail-shell">
    <div class="mail-client">
      <div class="mail-subject">${esc(window.organizerInviteSubject(mail))}</div>
      <div class="mail-meta">
        <span class="from-av">JW</span>
        <div class="who"><b>${CLINIC.organizer} via ClinicSync</b> &lt;invites@clinicsync.app&gt;<br>to jessica.lee@email.com</div>
        <span class="hint">Today, 8:14 AM</span>
      </div>
      <iframe class="mail-frame" id="mail" title="Invitation email from ${CLINIC.organizer}"></iframe>
    </div>
  </div>`;
  const frame = $('#mail');
  frame.srcdoc = window.organizerInviteEmail(mail);
  frame.onload = () => {
    const doc = frame.contentDocument;
    const fit = () => { frame.style.height = doc.documentElement.scrollHeight + 2 + 'px'; }; // +2 for the frame border
    fit(); setTimeout(fit, 400); new ResizeObserver(fit).observe(doc.body);
    // Links in the email open the app, like tapping them in a real inbox.
    doc.addEventListener('click', e => {
      const link = e.target.closest('a'); if (!link) return;
      e.preventDefault();
      const action = link.dataset.action || link.getAttribute('href');
      if (action === 'accept' || action === '#accept') {
        if (state.account && state.verified) { state.invite = 'accepted'; save(); go('profile'); }
        else { state.intent = 'accept'; save(); go('signup'); }
      } else if (action === 'decline' || action === '#decline') { state.openDecline = true; go('review'); }
      else if (link.href.includes('clinicsync.app/i/')) go('review');
      else toast('Not part of this onboarding prototype');
    });
  };
};

// 02 — Sign up
screens.signup = () => {
  app.innerHTML = `
  <div class="split">
    <aside class="split-art">
      <h2>Your court time, <em>sorted.</em> Pick your dates, pay your share and get reminders.</h2>
      <img src="assets/court.png" alt="">
      <div class="chip"><span>You're joining</span><b>${CLINIC.name}</b><span>Invited by ${CLINIC.organizer} · ${CLINIC.share}</span></div>
    </aside>
    <section class="split-form">
      <form class="inner-form" id="form" novalidate>
        <div>
          <h1>Create your account</h1>
          <p class="lede">Sign up to accept your invitation from ${CLINIC.organizer}.</p>
        </div>
        <button class="btn btn-block google" type="button" data-soon>
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Continue with Google
        </button>
        <div class="divider">or sign up with email</div>
        <div class="field">
          <label for="name">Full Name</label>
          <input class="input" id="name" autocomplete="name" placeholder="Your full name" value="Jessica Lee">
          <span class="hint" id="name-hint"></span>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input class="input" id="email" type="email" value="jessica.lee@email.com" readonly>
          <span class="hint">${icon(I.lock, 12)} Matches your invitation</span>
        </div>
        <div class="field">
          <label for="pw">Password</label>
          <div class="input-wrap">
            <input class="input" id="pw" type="password" autocomplete="new-password" placeholder="At least 8 characters">
            <button class="eye" type="button" id="eye" aria-label="Show password">${icon(I.eye, 20)}</button>
          </div>
          <div class="strength" id="strength"><i></i><i></i><i></i><i></i></div>
          <span class="hint" id="pw-hint">Use 8+ characters with a number.</span>
        </div>
        <label class="check"><input type="checkbox" id="terms"> I agree to the ClinicSync Terms of Service and Privacy Policy.</label>
        <button class="btn btn-primary btn-block" type="submit" id="create" disabled>Create Account</button>
        <p class="fine">Already have an account? <a href="#signup" data-soon>Sign in</a></p>
      </form>
    </section>
  </div>`;
  const pw = $('#pw'), terms = $('#terms'), name = $('#name'), create = $('#create');
  const score = v => (v.length >= 8) + /\d/.test(v) + /[A-Z]/.test(v) + /[^A-Za-z0-9]/.test(v);
  const check = () => {
    const s = score(pw.value);
    $('#strength').className = 'strength' + (pw.value ? ' s' + Math.max(1, s) : '');
    $('#pw-hint').textContent = !pw.value ? 'Use 8+ characters with a number.' : s < 2 ? 'Too weak. Add a number and more characters.' : s < 3 ? 'Good. Add a capital or symbol to make it stronger.' : 'Strong password.';
    create.disabled = !(name.value.trim() && pw.value.length >= 8 && /\d/.test(pw.value) && terms.checked);
  };
  [pw, name].forEach(el => el.addEventListener('input', check));
  terms.onchange = check;
  $('#eye').onclick = () => { pw.type = pw.type === 'password' ? 'text' : 'password'; };
  $('#form').onsubmit = e => {
    e.preventDefault(); if (create.disabled) return;
    state.account = { name: name.value.trim(), email: $('#email').value }; save();
    go('verify');
  };
  check();
};

// 03 — Email verification
screens.verify = () => {
  if (!state.account) return go('signup');
  app.innerHTML = `
  <div class="page narrow center">
    <div class="hero">
      <div class="mail-icon">${icon(I.mail, 44)}</div>
      <h1>Check your email</h1>
      <p>We sent a 6-digit code to <b>${esc(state.account.email)}</b>. Enter it below to verify your account.</p>
    </div>
    <form id="form" class="form" novalidate>
      <div class="otp" id="otp">${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}" id="d${i}">`).join('')}</div>
      <p class="fine" id="otp-hint">Demo: any 6 digits will work.</p>
      <button class="btn btn-primary btn-block" id="verify" type="submit" disabled>Verify Email</button>
    </form>
    <div class="center-col">
      <p class="fine">Didn't get it? Check spam, or <button class="btn-link" type="button" id="resend" disabled>resend code in <span id="sec">30</span>s</button></p>
      <a class="btn-link" href="#signup">Use a different email</a>
    </div>
  </div>`;
  const boxes = $$('#otp input');
  const code = () => boxes.map(b => b.value).join('');
  const sync = () => { $('#verify').disabled = !/^\d{6}$/.test(code()); };
  boxes.forEach((b, i) => {
    b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); sync(); });
    b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
    b.addEventListener('paste', e => {
      const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (!t) return; e.preventDefault(); t.split('').forEach((c, j) => { if (boxes[j]) boxes[j].value = c; }); boxes[Math.min(t.length, 5)].focus(); sync();
    });
  });
  boxes[0].focus();
  let s = 30; const sec = $('#sec');
  const timer = setInterval(() => {
    if (!document.body.contains(sec)) return clearInterval(timer);
    s--; sec.textContent = s;
    if (s <= 0) { clearInterval(timer); const r = $('#resend'); r.disabled = false; r.textContent = 'resend code'; }
  }, 1000);
  $('#resend').onclick = () => toast('New code sent to ' + state.account.email);
  $('#form').onsubmit = e => {
    e.preventDefault(); if ($('#verify').disabled) return;
    state.verified = true;
    if (state.intent === 'accept') { state.intent = null; state.invite = 'accepted'; save(); toast('Email verified. Invitation accepted'); go('profile'); }
    else { save(); toast('Email verified'); go('review'); }
  };
};

// 04 — Review clinic invitation (+ 04b decline modal)
screens.review = () => {
  if (state.invite === 'declined') return go('declined');
  app.innerHTML = `
  <div class="page">
    <div class="hero">
      <img class="illus" src="assets/court.png" alt="Isometric tennis court">
      <h1>You've Been Invited!</h1>
      <p>Review your clinic details before accepting the invitation.</p>
    </div>
    <div class="card">
      <div>
        <div class="card-head"><h2>${CLINIC.name}</h2><span class="badge pending">Pending</span></div>
        <p class="card-sub" style="margin-top:6px">Invited by <b>${CLINIC.organizer}</b></p>
      </div>
      <div class="inner">${detailRows()}</div>
      <p class="note">${icon(I.lock, 16)} Your share is assigned by the organizer. Contact ${CLINIC.organizer.split(' ')[0]} to request a change.</p>
    </div>
    <div class="alert info">${icon(I.info)}<span>Your ${CLINIC.share} includes ${CLINIC.allowed} sessions. Coach fees are separate and depend on attendance.</span></div>
    <div class="actions">
      <button class="btn btn-secondary" type="button" id="decline">Decline Invitation</button>
      <button class="btn btn-primary" type="button" id="accept">Accept Invitation</button>
    </div>
    <div class="center-col">
      <button class="btn-link" type="button" data-soon>${icon(I.chat)} Contact Organizer</button>
      <p class="fine">Accepting confirms your participation. You'll choose your session dates in the next steps.</p>
    </div>
  </div>`;
  $('#accept').onclick = () => {
    if (!state.account || !state.verified) { state.intent = 'accept'; save(); return go('signup'); }
    state.invite = 'accepted'; save(); go('profile');
  };
  if (state.openDecline) { delete state.openDecline; openDecline(); }
  $('#decline').onclick = openDecline;
};

function openDecline() {
  const root = $('#modal-root');
  root.innerHTML = `
  <div class="overlay" id="overlay">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <div class="x-icon">${icon(I.x, 30)}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <h2 id="dlg-title">Decline this invitation?</h2>
        <p>${CLINIC.organizer} will be notified that you won't be joining ${CLINIC.name}. You'll need a new invitation to join later.</p>
      </div>
      <div class="field">
        <label for="reason">Reason <span class="opt">(optional)</span></label>
        <input class="input" id="reason" placeholder="Let ${CLINIC.organizer.split(' ')[0]} know why (optional)">
      </div>
      <div class="actions">
        <button class="btn btn-secondary" type="button" id="keep">Keep Invitation</button>
        <button class="btn btn-danger" type="button" id="yes">Yes, Decline</button>
      </div>
    </div>
  </div>`;
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); $('#decline')?.focus(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('#keep').onclick = close;
  $('#overlay').onclick = e => { if (e.target.id === 'overlay') close(); };
  $('#yes').onclick = () => { state.invite = 'declined'; save(); close(); go('declined'); };
  $('#keep').focus();
}

// 04c — Invitation declined
screens.declined = () => {
  app.innerHTML = `
  <div class="page narrow center">
    <div class="hero">
      <div class="mail-icon" style="background:var(--field);color:var(--text-2)">${icon(I.x, 44)}</div>
      <h1>Invitation Declined</h1>
      <p>We've let ${CLINIC.organizer} know you won't be joining ${CLINIC.name}. Changed your mind? Contact your organizer to request a new invitation.</p>
    </div>
    <div class="card" style="flex-direction:row;justify-content:space-between;align-items:center">
      <div><b>${CLINIC.name}</b><p class="card-sub">Organizer: ${CLINIC.organizer} · ${CLINIC.share}</p></div>
      <span class="badge danger">Declined</span>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" type="button" data-soon>Contact Organizer</button>
      <button class="btn btn-primary" type="button" id="undo">Undo (demo)</button>
    </div>
  </div>`;
  $('#undo').onclick = () => { state.invite = 'pending'; save(); go('review'); };
};

// 05 — Complete player profile
screens.profile = () => {
  if (state.invite !== 'accepted') return go('review');
  const p = state.profile;
  const ratings = ['2.5', '3.0', '3.5', '4.0', '4.5', '5.0'];
  app.innerHTML = `
  <div class="page">
    <div class="alert success">${icon(I.checkc)}<span>Invitation accepted! You're joining ${CLINIC.name} · ${CLINIC.share}.</span></div>
    <div class="hero"><h1>Complete Your Player Profile</h1><p>Add a few details to help your organizer manage the clinic.</p></div>
    <form class="form" id="form" novalidate>
      <div class="section">
        <h3>Basics</h3>
        <div class="grid-2">
          <div class="field"><label for="fname">Full Name</label><input class="input" id="fname" value="${esc(state.account.name)}" readonly><span class="hint">From your account</span></div>
          <div class="field"><label for="phone">Phone Number</label><input class="input" id="phone" type="tel" autocomplete="tel" placeholder="+1 (555) 000-0000" value="${esc(p.phone)}"><span class="hint" id="phone-hint">Used for session reminders only</span></div>
        </div>
      </div>
      <div class="section">
        <h3>Your game</h3>
        <div class="field"><label for="rating">USTA/NTRP rating</label>
          <select class="select" id="rating">${ratings.map(r => `<option ${r === p.rating ? 'selected' : ''}>${r}</option>`).join('')}<option value="unsure" ${p.rating === 'unsure' ? 'selected' : ''}>I'm not sure</option></select>
        </div>
      </div>
      <div class="section">
        <h3>Payments</h3>
        <div class="field"><label for="venmo">Venmo Username <span class="opt">(optional)</span></label><input class="input" id="venmo" placeholder="@username" value="${esc(p.venmo)}"><span class="hint">Your Venmo username helps coordinate clinic payments.</span></div>
      </div>
    </form>
  </div>
  ${stepbar({ step: 1, primary: 'Save &amp; Continue' })}`;
  const phone = $('#phone');
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
    phone.value = d ? `+1 (${d.slice(0, 3)}${d.length > 3 ? ') ' + d.slice(3, 6) : ''}${d.length > 6 ? '-' + d.slice(6) : ''}` : '';
    phone.classList.remove('err'); $('#phone-hint').className = 'hint'; $('#phone-hint').textContent = 'Used for session reminders only';
  });
  $('#back').onclick = () => go('review');
  $('#next').onclick = () => {
    if (phone.value.replace(/\D/g, '').length < 11) {
      phone.classList.add('err'); const h = $('#phone-hint'); h.className = 'hint err'; h.textContent = 'Enter a 10-digit phone number so we can send reminders.'; phone.focus(); return;
    }
    let v = $('#venmo').value.trim(); if (v && !v.startsWith('@')) v = '@' + v;
    state.profile = { phone: phone.value, rating: $('#rating').value, venmo: v }; save();
    go('sessions');
  };
};

// 06 — Select sessions (06b all chosen, 06c limit reached)
screens.sessions = () => {
  if (state.invite !== 'accepted') return go('review');
  let limitHit = false;
  const draw = () => {
    const sel = state.selected, done = sel.length === CLINIC.allowed, left = CLINIC.allowed - sel.length;
    app.innerHTML = `
    <div class="page">
      <div class="hero"><h1>Choose Your Sessions</h1><p>Select the ${CLINIC.allowed} sessions you'd like to attend.</p></div>
      <div class="summary">
        <div><span>Clinic</span><b>${CLINIC.name}</b></div>
        <div><span>Share Type</span><b>${CLINIC.share}</b></div>
        <div><span>Session Allowance</span><b>${CLINIC.allowed} of ${CLINIC.total}</b></div>
        <div><span>Selected</span><div class="counter ${done ? 'done' : ''}"><b>${sel.length}/${CLINIC.allowed}</b><span class="pips">${Array.from({ length: CLINIC.allowed }, (_, i) => `<i class="${i < sel.length ? 'on' : ''}"></i>`).join('')}</span></div></div>
      </div>
      ${limitHit && done ? `<div class="alert warn">${icon(I.warn)}<span>You've reached your <b>${CLINIC.share} limit of ${CLINIC.allowed} sessions.</b> Deselect a session to choose a different date.</span></div>` : ''}
      <div class="sessions">
        ${SESSIONS.map(s => {
          const on = sel.includes(s.n), full = s.spots === 0, locked = done && !on && !full;
          const badge = on ? '<span class="badge brand">Selected</span>' : full ? '<span class="badge mute">Full</span>' : locked && limitHit ? '<span class="badge mute">Limit reached</span>' : `<span class="badge ${s.spots === 1 ? 'warn' : 'ok'}">${s.spots} spot${s.spots === 1 ? '' : 's'} left</span>`;
          return `<button type="button" class="sess ${on ? 'on' : ''} ${locked && limitHit ? 'locked' : ''}" data-n="${s.n}" ${full ? 'disabled' : ''} aria-pressed="${on}">
            <span class="box">${on ? icon(I.check, 14) : ''}</span>
            <span class="top"><span class="label">Session ${s.n}</span>${badge}</span>
            <span class="date">${longDate(s.date)}</span>
            <span class="time">${icon(I.clock, 16)}9:00–10:30 AM</span>
          </button>`;
        }).join('')}
      </div>
      <p class="note">${icon(I.info, 16)} Need to change a date after confirming? Your organizer can update your sessions.</p>
    </div>
    ${stepbar({
      step: 2, primary: done ? 'Review &amp; Pay' : 'Confirm My Sessions', disabled: !done,
      status: done ? `<span class="status ok">${CLINIC.allowed} of ${CLINIC.allowed} sessions selected</span>` : `<span class="status">Select <b>${left} more</b> session${left === 1 ? '' : 's'} to continue</span>`,
    })}`;
    $$('.sess').forEach(b => b.onclick = () => {
      const n = +b.dataset.n, i = state.selected.indexOf(n);
      if (i > -1) { state.selected.splice(i, 1); limitHit = false; }
      else if (state.selected.length >= CLINIC.allowed) { limitHit = true; save(); draw(); $(`.sess[data-n="${n}"]`).classList.add('nudge'); return; }
      else state.selected.push(n);
      state.selected.sort((a, b) => a - b); save(); draw();
    });
    $('#back').onclick = () => go('profile');
    $('#next').onclick = () => go('payment');
  };
  draw();
};

// 06d — Pay facility fee: card (Stripe), Venmo or cash
const PAY_METHODS = {
  card: { label: 'Card', sub: 'Pay now via Stripe', icon: I.card },
  venmo: { label: 'Others', sub: 'Pay organizer directly', icon: I.wallet },
  cash: { label: 'Cash', sub: 'Pay at first session', icon: I.cash },
};
const payStatus = () => ({
  paid: `Paid by card`,
  reported: 'Venmo payment reported',
  cash: 'Paying cash at first session',
}[state.payment] || '<span style="color:var(--warn)">Outstanding</span>');

screens.payment = () => {
  if (state.selected.length !== CLINIC.allowed) return go('sessions');
  const first = SESSIONS.find(s => s.n === state.selected[0]);
  const firstDay = fmt(first.date, { weekday: 'short', month: 'short', day: 'numeric' });
  const org = CLINIC.organizer.split(' ')[0];
  let method = PAY_METHODS[state.method] ? state.method : 'card';
  let confirmed = { venmo: state.payment === 'reported', cash: state.payment === 'cash' };

  const panel = {
    card: () => `
      <div class="pay-panel">
        <div class="txt"><b>Pay ${money(CLINIC.facilityFee)} by card</b><span>You'll finish on Stripe's secure checkout. Credit, debit, Apple Pay and Google Pay are accepted. ${org} is paid automatically.</span></div>
        <div class="stripe-mark">${icon(I.lock, 14)} Secured by <b>stripe</b></div>
      </div>`,
    venmo: () => `
      <div class="pay-panel">
        <div class="txt"><b>Pay with Venmo</b><span>Opens Venmo with ${CLINIC.venmo} and ${money(CLINIC.facilityFee)} filled in. You confirm the payment in Venmo.</span></div>
        <a class="btn btn-outline" href="https://account.venmo.com/payment-link?amount=${CLINIC.facilityFee}&note=${encodeURIComponent(CLINIC.name + ' facility fee')}&recipients=${CLINIC.venmo.slice(1)}&txn=pay" target="_blank" rel="noopener">Open Venmo</a>
      </div>
      <label class="check reported"><input type="checkbox" id="ack" ${confirmed.venmo ? 'checked' : ''}> I sent ${money(CLINIC.facilityFee)} to ${CLINIC.venmo} on Venmo</label>`,
    cash: () => `
      <div class="pay-panel">
        <div class="txt"><b>Pay ${org} in cash</b><span>Bring ${money(CLINIC.facilityFee)} to your first session on ${firstDay} at ${CLINIC.location}. Exact change helps.</span></div>
      </div>
      <label class="check reported"><input type="checkbox" id="ack" ${confirmed.cash ? 'checked' : ''}> I'll pay ${money(CLINIC.facilityFee)} in cash to ${org} on ${firstDay}</label>`,
  };
  const note = {
    card: `Payments are processed by Stripe. ClinicSync never sees or stores your card number. Your fee shows as Paid right away.`,
    venmo: `ClinicSync doesn't process Venmo payments. Reporting a payment lets ${org} know to check Venmo. It shows as Payment Reported until ${org} marks it as paid.`,
    cash: `${org} marks cash as received at the session. Until then your fee shows as Cash Pending.`,
  };
  const primary = { card: `Pay ${money(CLINIC.facilityFee)}`, venmo: 'Report Payment &amp; Finish', cash: 'Confirm &amp; Finish' };

  const draw = () => {
    app.innerHTML = `
    <div class="page">
      <div class="hero"><h1>Pay Your Facility Fee</h1><p>Your spot is saved. Pay by card, Venmo or cash, now or later.</p></div>
      <div class="card">
        <div class="card-head"><h2>${CLINIC.name}</h2><span class="badge pending">Outstanding</span></div>
        <div class="inner">
          <div class="row"><span class="k">${icon(I.court)}Facility Fee (${CLINIC.share})</span><span class="v">${money(CLINIC.facilityFee)}</span></div>
          <div class="row"><span class="k">${icon(I.cal)}Due</span><span class="v">Before ${firstDay}</span></div>
          <div class="row"><span class="k">${icon(I.user)}Pay To</span><span class="v">${CLINIC.organizer}</span></div>
          <div class="row"><span class="k">${icon(I.coach)}Coach Fee</span><span class="v">$${CLINIC.coachFee} per attended session · paid after each session</span></div>
        </div>
        <div class="pay-methods" role="radiogroup" aria-label="Payment method">
          ${Object.entries(PAY_METHODS).map(([k, m]) => `
            <button type="button" class="pay-method ${k === method ? 'on' : ''}" role="radio" aria-checked="${k === method}" data-method="${k}">
              <span class="ic">${icon(m.icon, 22)}</span><b>${m.label}</b><small>${m.sub}</small>
            </button>`).join('')}
        </div>
        ${panel[method]()}
      </div>
      <div class="alert info">${icon(I.info)}<span>${note[method]}</span></div>
    </div>
    ${stepbar({ step: 3, primary: primary[method], disabled: method !== 'card' && !confirmed[method], extra: '<button class="btn btn-secondary" type="button" id="later">Pay Later</button>' })}`;

    $$('.pay-method').forEach(b => b.onclick = () => {
      method = b.dataset.method; state.method = method; save(); draw();
      $(`.pay-method[data-method="${method}"]`).focus();
    });
    const ack = $('#ack');
    if (ack) ack.onchange = () => { confirmed[method] = ack.checked; $('#next').disabled = !ack.checked; };
    $('#back').onclick = () => go('sessions');
    $('#later').onclick = () => { state.payment = 'outstanding'; save(); go('success'); };
    $('#next').onclick = () => {
      if (method === 'venmo') { state.payment = 'reported'; save(); return go('success'); }
      if (method === 'cash') { state.payment = 'cash'; save(); return go('success'); }
      // Card: hand off to Stripe Checkout (06e).
      const btn = $('#next');
      btn.disabled = true; btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>Redirecting to Stripe…`;
      setTimeout(() => go('checkout'), 700);
    };
  };
  draw();
};

// 06e — Stripe Checkout (hosted page mock, test mode)
screens.checkout = () => {
  if (state.selected.length !== CLINIC.allowed) return go('sessions');
  if (state.payment === 'paid') return go('success');
  const amount = money(CLINIC.facilityFee);
  app.innerHTML = `
  <div class="checkout">
    <section class="co-summary">
      <div class="co-merchant">
        <a class="co-back" href="#payment" aria-label="Back to ClinicSync">←</a>
        <img src="assets/logo-mark.png" alt=""><b>ClinicSync</b><span class="co-test">TEST MODE</span>
      </div>
      <div class="co-amount"><span>Pay ${esc(CLINIC.organizer)} · ${esc(CLINIC.name)}</span><b>${amount}</b></div>
      <div class="co-items">
        <div class="co-item"><div><b>Facility fee · ${CLINIC.share}</b><small>${CLINIC.allowed} sessions · ${CLINIC.schedule}</small></div><span>${amount}</span></div>
        <div class="co-item total"><span>Total due</span><span>${amount}</span></div>
      </div>
    </section>
    <section class="co-pay">
      <form class="co-form" id="form" novalidate>
        <button class="co-wallet" type="button" id="wallet">Pay with  <b>G Pay</b></button>
        <div class="divider">Or pay with card</div>
        <div class="co-field">
          <label for="co-email">Email</label>
          <input class="co-input" id="co-email" type="email" value="${esc(state.account?.email || '')}" autocomplete="email">
        </div>
        <div class="co-field">
          <label for="co-num">Card information</label>
          <div class="co-group">
            <input class="co-input" id="co-num" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234">
            <div class="co-row">
              <input class="co-input" id="co-exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY">
              <input class="co-input" id="co-cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC">
            </div>
          </div>
        </div>
        <div class="co-field">
          <label for="co-name">Cardholder name</label>
          <input class="co-input" id="co-name" autocomplete="cc-name" placeholder="Full name on card" value="${esc(state.account?.name || '')}">
        </div>
        <div class="co-field">
          <label for="co-zip">Country or region</label>
          <div class="co-group">
            <select class="co-input" id="co-country"><option>United States</option><option>Canada</option><option>United Kingdom</option></select>
            <input class="co-input" id="co-zip" inputmode="numeric" autocomplete="postal-code" placeholder="ZIP">
          </div>
        </div>
        <p class="co-error" id="co-error" role="alert" hidden></p>
        <button class="co-submit" type="submit" id="co-pay">Pay ${amount}</button>
        <p class="co-hint">Test mode: use <button type="button" class="btn-link" data-fill="4242424242424242">4242 4242 4242 4242</button> to succeed or <button type="button" class="btn-link" data-fill="4000000000000002">4000 0000 0000 0002</button> to see a decline. Any future date and CVC.</p>
        <footer class="co-foot">Powered by <b>stripe</b><span>·</span><a href="#checkout" data-soon>Terms</a><a href="#checkout" data-soon>Privacy</a></footer>
      </form>
    </section>
  </div>`;
  const num = $('#co-num'), exp = $('#co-exp'), cvc = $('#co-cvc'), zip = $('#co-zip'), err = $('#co-error'), pay = $('#co-pay');
  const digits = el => el.value.replace(/\D/g, '');
  num.oninput = () => { num.value = digits(num).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); };
  exp.oninput = () => { const d = digits(exp).slice(0, 4); exp.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; };
  cvc.oninput = () => { cvc.value = digits(cvc).slice(0, 4); };
  zip.oninput = () => { zip.value = digits(zip).slice(0, 5); };
  $$('[data-fill]').forEach(b => b.onclick = () => {
    num.value = b.dataset.fill.replace(/(\d{4})(?=\d)/g, '$1 ');
    exp.value = '12 / 29'; cvc.value = '123'; zip.value = '94107'; err.hidden = true; $$('.co-input.err').forEach(i => i.classList.remove('err'));
  });
  const fail = (msg, el) => { err.textContent = msg; err.hidden = false; $$('.co-input.err').forEach(i => i.classList.remove('err')); el?.classList.add('err'); el?.focus(); };
  const succeed = () => {
    pay.disabled = true; pay.innerHTML = `<span class="spinner" aria-hidden="true"></span>Processing…`;
    setTimeout(() => { pay.classList.add('done'); pay.innerHTML = `${icon(I.check, 20)}`; }, 1200);
    setTimeout(() => { state.payment = 'paid'; save(); toast(`Payment of ${amount} received`); go('success'); }, 1900);
  };
  $('#wallet').onclick = () => succeed();
  $('#form').onsubmit = e => {
    e.preventDefault(); err.hidden = true;
    const [mm, yy] = [digits(exp).slice(0, 2), digits(exp).slice(2)];
    const now = new Date(), expired = +('20' + yy) < now.getFullYear() || (+('20' + yy) === now.getFullYear() && +mm < now.getMonth() + 1);
    if (!/\S+@\S+\.\S+/.test($('#co-email').value)) return fail('Your email address is incomplete.', $('#co-email'));
    if (digits(num).length !== 16) return fail('Your card number is incomplete.', num);
    if (digits(exp).length !== 4 || +mm < 1 || +mm > 12) return fail("Your card's expiration date is incomplete.", exp);
    if (expired) return fail("Your card's expiration year is in the past.", exp);
    if (digits(cvc).length < 3) return fail("Your card's security code is incomplete.", cvc);
    if (!$('#co-name').value.trim()) return fail('Enter the name on your card.', $('#co-name'));
    if (digits(zip).length !== 5) return fail('Your ZIP is incomplete.', zip);
    if (digits(num) === '4000000000000002') {
      pay.disabled = true; pay.innerHTML = `<span class="spinner" aria-hidden="true"></span>Processing…`;
      return setTimeout(() => { pay.disabled = false; pay.textContent = `Pay ${amount}`; fail('Your card was declined. Try a different card.', num); }, 1200);
    }
    succeed();
  };
};

// 07 — Onboarding success
screens.success = () => {
  if (state.selected.length !== CLINIC.allowed) return go('sessions');
  const sel = SESSIONS.filter(s => state.selected.includes(s.n));
  const coachTotal = CLINIC.coachFee * sel.length;
  const settled = state.payment !== 'outstanding';
  app.innerHTML = `
  <div class="page">
    <div class="hero">
      <img class="illus-success" src="assets/success.png" alt="">
      <h1>You're All Set!</h1>
      <p>You've successfully joined ${CLINIC.name}. Your sessions are ready to view.</p>
    </div>
    <div class="card">
      <div><h2 style="font-size:20px;font-weight:600">${CLINIC.name}</h2><p class="card-sub" style="margin-top:4px">${CLINIC.schedule} · ${CLINIC.location}</p></div>
      <div class="stats3">
        <div><span>Share Type</span><b>${CLINIC.share}</b></div>
        <div><span>Sessions Selected</span><b>${sel.length} of ${CLINIC.allowed}</b></div>
        <div><span>Next Session</span><b>${fmt(sel[0].date, { weekday: 'short', month: 'short', day: 'numeric' })}</b></div>
      </div>
      <div class="chips">Your sessions ${sel.map(s => `<span class="badge brand">${shortDate(s.date)}</span>`).join('')}</div>
      <div class="totals">
        <div class="row"><span class="k">Facility Fee</span><span class="v">${money(CLINIC.facilityFee)} · ${payStatus()}</span></div>
        <div class="row"><span class="k">Coach Fee</span><span class="v">$${CLINIC.coachFee} x ${sel.length} = ${money(coachTotal)}</span></div>
        <div class="row total"><span class="k">Total fee</span><span class="v">${money(CLINIC.facilityFee + coachTotal)}</span></div>
      </div>
    </div>
    <div class="actions ${settled ? 'single' : ''}">
      ${settled ? '' : '<button class="btn btn-secondary" type="button" id="pay">Pay Facility Fee</button>'}
      <button class="btn btn-primary" type="button" id="dash">Go to Dashboard</button>
    </div>
  </div>`;
  $('#dash').onclick = () => go('dashboard');
  $('#pay')?.addEventListener('click', () => go('payment'));
};

// 08 — Player dashboard
screens.dashboard = () => {
  if (state.selected.length !== CLINIC.allowed) return go('sessions');
  const sel = SESSIONS.filter(s => state.selected.includes(s.n));
  const rs = n => state.rsvp[n] || (n === sel[0].n ? 'going' : 'pending');
  app.innerHTML = `
  <div class="dash">
    <section class="dash-main">
      <div><h1>Welcome, ${esc(firstName())}!</h1><p class="lede">Here's what's happening with your clinics.</p></div>
      <div class="kpis">
        <div><span>Active Clinics</span><b>01</b></div>
        <div><span>Upcoming Sessions</span><b>${String(sel.length).padStart(2, '0')}</b></div>
        <div><span>Sessions Attended</span><b>00</b></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="sec-head"><h2>Upcoming Sessions</h2><button class="btn-link" type="button" data-soon>View schedule ${icon(I.right, 16)}</button></div>
        <div class="upcoming">
          ${sel.map(s => {
            const r = rs(s.n);
            return `<div class="up">
              <div class="datebox"><small>${fmt(s.date, { month: 'short' })}</small><b>${fmt(s.date, { day: 'numeric' })}</b></div>
              <div class="info">
                <div class="t">${CLINIC.name} <span class="badge ${r === 'going' ? 'ok' : r === 'out' ? 'danger' : 'pending'}">RSVP: ${r === 'going' ? 'Going' : r === 'out' ? "Can't go" : 'Pending'}</span></div>
                <div class="meta"><span>${icon(I.clock, 16)}${fmt(s.date, { weekday: 'short' })} · 9:00–10:30 AM</span><span>${icon(I.pin, 16)}${CLINIC.location}</span></div>
                <div class="meta"><span>${icon(I.court, 16)}Session ${s.n} of ${CLINIC.total} · ${CLINIC.share}</span></div>
              </div>
              ${r === 'pending' ? `<div class="rsvp"><button type="button" class="go" data-rsvp="${s.n}:going">Going</button><button type="button" data-rsvp="${s.n}:out">Can't go</button></div>` : `<button class="btn-link" type="button" data-soon>View session ${icon(I.right, 16)}</button>`}
            </div>`;
          }).join('')}
        </div>
      </div>
    </section>
    <aside class="dash-side">
      <div style="display:flex;flex-direction:column;gap:20px">
        <h2 style="font-size:24px;font-weight:600">My Clinics</h2>
        <div class="side-card">
          <div class="card-head"><b style="font-size:17px">${CLINIC.name}</b><span class="badge ok">Active</span></div>
          <span class="line">${icon(I.court, 16)}${CLINIC.share}</span>
          <span class="line">${icon(I.checkc, 16)}${sel.length} of ${CLINIC.allowed} sessions selected</span>
          <span class="line">${icon(I.cal, 16)}${CLINIC.schedule}</span>
          <span class="line">${icon(I.user, 16)}Organizer: ${CLINIC.organizer}</span>
          <span class="line">${icon(I.dollar, 16)}Facility fee: ${payStatus()}</span>
          <hr style="border:0;border-top:1px solid var(--line);margin:4px 0;width:100%">
          <button class="btn-link" type="button" data-soon style="align-self:flex-start">View clinic ${icon(I.right, 16)}</button>
        </div>
      </div>
      <div class="side-card" style="background:var(--card)">
        <div class="card-head"><div><h2 style="font-size:22px;font-weight:600">Recent Activity</h2><p class="card-sub">Latest updates from your clinics.</p></div><span class="badge brand">2 new</span></div>
        <div class="activity">
          <div class="act"><span class="ic" style="background:#fdead7;color:#c4320a">${icon(I.swap, 18)}</span><div><b>Replacement Needed <i class="unread"></i></b><p>Robert Wilson needs coverage for the ${shortDate(SESSIONS[1].date)} session.</p><small>10 minutes ago · <a href="#dashboard" data-soon>View Opportunity</a></small></div></div>
          <div class="act"><span class="ic" style="background:var(--brand-soft);color:var(--brand)">${icon(I.chat, 18)}</span><div><b>New Clinic Message <i class="unread"></i></b><p>${CLINIC.organizer}: "Please arrive 10 minutes early on Monday."</p><small>1 hour ago · <a href="#dashboard" data-soon>View Message</a></small></div></div>
          <div class="act"><span class="ic" style="background:var(--success-bg);color:var(--success)">${icon(I.bell, 18)}</span><div><b>You joined ${CLINIC.name}</b><p>${sel.length} sessions booked. First one is ${fmt(sel[0].date, { weekday: 'long', month: 'short', day: 'numeric' })}.</p><small>Just now</small></div></div>
          <div class="act"><span class="ic" style="background:#f4ebff;color:#6941c6">${icon(I.coach, 18)}</span><div><b>Coach Confirmed</b><p>${CLINIC.coach} is confirmed as your clinic coach.</p><small>Oct 1 · <a href="#dashboard" data-soon>View Clinic</a></small></div></div>
        </div>
      </div>
    </aside>
  </div>`;
  $$('[data-rsvp]').forEach(b => b.onclick = () => {
    const [n, v] = b.dataset.rsvp.split(':'); state.rsvp[n] = v; save(); screens.dashboard();
    toast(v === 'going' ? `RSVP sent: Going on ${shortDate(SESSIONS[n - 1].date)}` : `${CLINIC.organizer} will be told you can't make it`);
  });
};

/* ---------- Router ---------- */
function route() {
  const r = location.hash.slice(1) || 'invitation';
  const name = screens[r] ? r : 'invitation';
  $('#modal-root').innerHTML = '';
  renderTopbar(name);
  screens[name]();
  // A guard inside a screen may have redirected; only reset scroll for the screen we ended on.
  if ((location.hash.slice(1) || 'invitation') === name) { scrollTo(0, 0); if (!app.contains(document.activeElement)) app.focus({ preventScroll: true }); }
}
addEventListener('hashchange', route);
route();

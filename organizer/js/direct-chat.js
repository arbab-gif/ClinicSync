/* Chat drawer shared by the organizer and player portals.
   - One-to-one chats with anyone in a session (participants + coach), with a View profile panel.
   - Clinic group chats (group: true) in the same drawer, with sender names on each message.
   Every .m-row inside a session modal gets a chat button. Pages can also call DirectChat.open(person).
   Conversations are kept per name in localStorage (cs-dm), so they survive reloads.
   A page can set window.DirectChatConfig before this script: { assets, me, seed, profiles, clinic }. */

(() => {
  const KEY = 'cs-dm';
  const CFG = Object.assign({
    assets: 'assets/icons/',
    me: 'Albert',
    clinic: 'Saturday',
    // A couple of people already wrote to the organizer, so the drawer shows a real thread as well as the empty state
    seed: {
      'Maria Lopez': [
        { from: 'them', t: 'Hi Albert, should I bring the ball machine on Saturday?', at: 'Today, 9:40 AM' },
        { from: 'me', t: 'Yes please, courts 2 and 3 are ours.', at: 'Today, 9:45 AM' },
        { from: 'them', t: 'Great, see you then!', at: 'Today, 9:46 AM' },
      ],
      'Olivia Chen': [{ from: 'them', t: 'Is it okay if I leave 10 minutes early this week?', at: 'Today, 8:05 AM' }],
      'Jessica Lee': [{ from: 'them', t: 'Sorry, I can’t make it on Oct 24.', at: 'Mon, 7:50 PM' }, { from: 'me', t: 'No problem, I’ll find you a replacement.', at: 'Mon, 8:02 PM' }],
    },
    // Prototype profile details; anyone not listed gets the player defaults
    profiles: {
      'Maria Lopez': { level: 'Certified tennis coach', since: 'March 2025', email: 'maria.lopez@gmail.com', phone: '(415) 555-0142', fee: '$25 per player, per session', note: 'Clinic coach for Saturday' },
      'Tomas Rivera': { level: 'NTRP 4.5', since: 'June 2025', email: 'tomas.rivera@gmail.com', phone: '(415) 555-0177', note: 'On the substitute list' },
      'Olivia Chen': { level: 'NTRP 3.5', since: 'January 2026', email: 'olivia.chen@gmail.com', phone: '(415) 555-0123' },
      'Marcus Reed': { level: 'NTRP 4.5', since: 'August 2025', email: 'marcus.reed@gmail.com', phone: '(415) 555-0168' },
      'Jessica Lee': { level: 'NTRP 3.5', since: 'September 2025', email: 'jessica.lee@gmail.com', phone: '(415) 555-0131' },
      'Robert Wilson': { level: 'NTRP 4.0', since: 'May 2025', email: 'robert.wilson@gmail.com', phone: '(415) 555-0155' },
      'Priya Nair': { level: 'NTRP 3.5', since: 'July 2025', email: 'priya.nair@gmail.com', phone: '(415) 555-0119', note: 'On the substitute list' },
    },
  }, window.DirectChatConfig || {});
  const A = CFG.assets;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
  const REPLY = { Coach: 'Sounds good, thanks for the heads-up. See you on court.', default: `Thanks ${CFG.me}, got it!` };

  const thread = name => { const s = load(); return s[name] || CFG.seed[name] || []; };
  const push = (name, m) => { const s = load(); s[name] = [...thread(name), m]; save(s); document.dispatchEvent(new CustomEvent('dc:change', { detail: name })); };

  // ---------- drawer (or, with CFG.inline, a panel on the page: the Messages split view) ----------
  const host = CFG.inline ? document.querySelector(CFG.inline) : null;
  const el = document.createElement('div');
  el.className = host ? 'dc-inline' : 'dc-scrim'; el.id = 'dm'; el.hidden = true;
  el.innerHTML = `<aside class="dc" role="dialog" aria-modal="true" aria-labelledby="dc-name">
      <header class="dc-head">
        <span class="dc-av" id="dc-av"></span>
        <div class="dc-who"><h2 id="dc-name"></h2><p><span class="dc-role" id="dc-role"></span><span id="dc-ctx"></span></p></div>
        <button class="dc-prof-btn" type="button" data-dc-profile><img src="${A}user.svg" alt="">View profile</button>
        <span class="dc-prof-btn dc-members" id="dc-members"><img src="${A}users-16.svg" alt=""><span></span></span>
        <button class="dc-x" type="button" data-dc-close aria-label="Close chat"><img src="${A}x-close-sm.svg" alt=""></button>
      </header>
      <div class="dc-list" id="dc-list" aria-live="polite"></div>
      <form class="dc-compose" id="dc-form" autocomplete="off">
        <div class="dc-row">
          <input class="dc-input" id="dc-input" type="text" placeholder="Write a message" aria-label="Message">
          <button class="dc-send" type="submit"><img src="${A}paper-plane-right.svg" alt="">Send</button>
        </div>
        <div class="dc-actions" id="dc-actions" hidden>
          <button class="dc-chip" type="button" data-toast="Reaching Late is shown in the clinic chat flow"><img src="${A}clock-16.svg" alt="">Reaching Late</button>
          <button class="dc-chip" type="button" data-toast="Request Replacement is shown in the clinic chat flow"><img src="${A}user-switch.svg" alt="">Request Replacement</button>
        </div>
      </form>
    </aside>`;
  if (host) { el.querySelector('.dc').removeAttribute('aria-modal'); el.querySelector('.dc').setAttribute('role', 'region'); el.querySelector('[data-dc-close]').hidden = true; host.append(el); }
  else document.body.append(el);
  const $ = s => el.querySelector(s);
  let who = null, timer;

  const avatar = p => p.photo ? `<img src="${p.photo}" alt="">` : esc(p.ini);
  const bubble = (m) => {
    if (m.from === 'me') return `<div class="dc-msg me"><div><p class="dc-bubble">${esc(m.t)}</p><i>${esc(m.at)}</i></div></div>`;
    const sender = who.group ? { ini: m.ini, photo: m.photo || null } : who;
    const name = who.group ? `<span class="dc-sender">${esc(m.who)}${m.role ? `<em>${esc(m.role)}</em>` : ''}</span>` : '';
    return `<div class="dc-msg"><span class="dc-mini">${avatar(sender)}</span><div>${name}<p class="dc-bubble">${esc(m.t)}</p><i>${esc(m.at)}</i></div></div>`;
  };
  function render() {
    const msgs = thread(who.name);
    $('#dc-list').innerHTML = msgs.length
      ? `<div class="dc-day"><span>Conversation</span></div>` + msgs.map(bubble).join('')
      : who.group
        ? `<div class="dc-empty"><b>No messages yet</b><p>The chat opens when the first session is scheduled.</p></div>`
        : `<div class="dc-empty"><span class="dc-av lg">${avatar(who)}</span><b>Start a conversation with ${esc(who.first)}</b><p>Messages here are just between the two of you. The clinic group chat stays in Messages.</p></div>`;
    const l = $('#dc-list'); l.scrollTop = l.scrollHeight;
  }

  // ---------- profile: a modal over the chat ----------
  // Basic profile + the clinics you share. Contact details (email, phone) stay private.
  const pm = document.createElement('div');
  pm.className = 'overlay dc-pm'; pm.id = 'dc-pm'; pm.hidden = true;
  pm.setAttribute('role', 'dialog'); pm.setAttribute('aria-modal', 'true'); pm.setAttribute('aria-labelledby', 'dc-pm-name');
  pm.innerHTML = `<div class="modal dc-pm-box"><button class="x-btn" type="button" data-dc-pm-close aria-label="Close profile">✕</button><div id="dc-pm-body"></div></div>`;
  document.body.append(pm);
  function openProfile() {
    const d = CFG.profiles[who.name] || { level: 'Tennis · NTRP 3.5', since: '2026' };
    const clinics = d.clinics || [{ name: CFG.clinic, when: '', their: who.role }];
    const rows = [
      [who.role === 'Coach' ? 'Sport & qualification' : 'Sport & level', d.level],
      who.role === 'Coach' ? ['Coach fee', d.fee] : null,
      ['Member since', d.since],
    ].filter(r => r && r[1]);
    pm.querySelector('#dc-pm-body').innerHTML = `
      <div class="dc-card"><span class="dc-av xl">${avatar(who)}</span><div><h3 id="dc-pm-name">${esc(who.name)}</h3><span class="dc-role">${esc(who.role)}</span></div></div>
      <dl class="dc-facts">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <section class="dc-together"><h4>Clinics together <span>${clinics.length}</span></h4>
        ${clinics.map(c => `<div class="dc-clinic"><span class="dc-cav">${esc(c.name.split(' ').map(w => w[0]).join('').slice(0, 2))}</span><div><b>${esc(c.name)}</b>${c.when ? `<small>${esc(c.when)}</small>` : ''}</div><span class="dc-role">${esc(c.their)}</span></div>`).join('')}
      </section>
      <button class="btn btn-lg btn-primary btn-block" type="button" data-dc-pm-close>Message ${esc(who.first)}</button>`;
    pm.hidden = false;
    pm.querySelector('.x-btn').focus();
  }
  const closeProfile = () => { pm.hidden = true; if (!el.hidden) $('#dc-input').focus(); };
  pm.addEventListener('click', e => { if (e.target === pm || e.target.closest('[data-dc-pm-close]')) closeProfile(); });

  function view() {
    $('[data-dc-profile]').hidden = !!who.group;
    $('#dc-members').hidden = !who.group;
    $('#dc-actions').hidden = !who.group;
    render(); if (!host) $('#dc-input').focus();
  }

  function open(p) {
    const given = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null));
    who = Object.assign({ first: p.name.split(' ')[0], ini: p.name.split(' ').map(w => w[0]).join('').slice(0, 2), ctx: '' }, given, p.photo ? { photo: p.photo } : {});
    $('#dc-av').innerHTML = who.group ? `<img src="${A}users-16.svg" alt="" class="dc-grp">` : avatar(who);
    $('#dc-av').classList.toggle('grp', !!who.group);
    // On the Messages page a clinic chat shows just its name, as in Figma
    $('#dc-av').hidden = !!(host && who.group);
    $('#dc-name').textContent = who.name;
    $('#dc-role').textContent = who.role; $('#dc-role').hidden = !who.role;
    $('#dc-ctx').textContent = who.ctx;
    $('#dc-members span').textContent = who.members ? `${who.members} ${CFG.membersWord || 'members'}` : '';
    $('#dc-input').placeholder = `Message ${who.group ? who.name : who.first}`;
    el.hidden = false; view();
  }
  function close() { el.hidden = true; pm.hidden = true; clearTimeout(timer); who = null; }

  el.addEventListener('click', e => {
    if ((!host && e.target === el) || e.target.closest('[data-dc-close]')) close();
    else if (e.target.closest('[data-dc-profile]')) openProfile();
  });
  // Esc closes the profile first, then (as a drawer) the chat
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!pm.hidden) { e.stopImmediatePropagation(); closeProfile(); }
    else if (!host && !el.hidden) { e.stopImmediatePropagation(); close(); }
  }, true);
  $('#dc-form').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#dc-input'), t = inp.value.trim(); if (!t || !who) return;
    push(who.name, { from: 'me', t, at: clock() }); inp.value = ''; render();
    if (who.group) return;
    // Prototype: the other person types and answers
    const p = who; clearTimeout(timer);
    timer = setTimeout(() => {
      if (who !== p) return;
      $('#dc-list').insertAdjacentHTML('beforeend', `<div class="dc-msg"><span class="dc-mini">${avatar(p)}</span><p class="dc-bubble dc-dots">• • •</p></div>`);
      $('#dc-list').scrollTop = 1e6;
      timer = setTimeout(() => { if (who !== p) return; push(p.name, { from: 'them', t: REPLY[p.role] || REPLY.default, at: clock() }); render(); }, 1400);
    }, 700);
  });

  // ---------- chat buttons on session rows ----------
  function person(row) {
    const b = row.querySelector('.m-who b'); if (!b || b.hasAttribute('data-me')) return null;
    const name = b.textContent.trim(); if (!name || /^No coach$/i.test(name)) return null;
    const img = row.querySelector('img.avatar-img');
    const role = row.classList.contains('coach') ? 'Coach' : (row.querySelector('.m-tags .tag')?.textContent.trim() || 'Player');
    const modal = row.closest('.session-modal');
    const ctx = modal ? ' · ' + modal.querySelector('.m-head h2').textContent.trim() : '';
    return { name, role, ctx, photo: img ? img.getAttribute('src') : null, ini: row.querySelector('.m-av')?.textContent.trim() || undefined };
  }
  function decorate(root = document) {
    root.querySelectorAll('.session-modal .m-row:not(.loc):not(.out)').forEach(row => {
      if (row.querySelector('.dc-open')) return;
      const p = person(row); if (!p) return;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'dc-open'; btn.setAttribute('aria-label', `Message ${p.name}`); btn.title = `Message ${p.name.split(' ')[0]}`;
      btn.innerHTML = `<img src="${A}chat-circle.svg" alt="">`;
      btn.addEventListener('click', () => open(person(row)));
      // Last in the row, so the chat icons line up in one column whatever the status pill's width
      row.append(btn);
    });
  }
  decorate();
  // Rows are re-rendered (coach section) or added (replacement filled), so keep decorating
  new MutationObserver(() => decorate()).observe(document.body, { childList: true, subtree: true });

  window.DirectChat = { open, thread };
})();

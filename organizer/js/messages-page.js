/* Messages page, shared by the organizer and player portals (Figma "Messages / 01 Group chat"):
   clinic chats and direct messages listed on the left, the open conversation on the right.
   The conversation itself is direct-chat.js in inline mode (DirectChatConfig.inline = '#chat-panel').
   MessagesPage({ groups, people, unread, caret }) — groups: [{ name, ini, tone, role, members, empty }],
   people: [{ name, role, photo, clinic }], unread: { name: count } as in the Figma lists. */

window.MessagesPage = cfg => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const list = document.getElementById('chats'), q = document.getElementById('chat-q'), empty = document.getElementById('chats-empty');
  const READ = 'cs-dm-read';
  const isRead = n => { try { return JSON.parse(localStorage.getItem(READ) || '[]').includes(n); } catch { return false; } };
  const markRead = n => { try { const r = JSON.parse(localStorage.getItem(READ) || '[]'); if (!r.includes(n)) { r.push(n); localStorage.setItem(READ, JSON.stringify(r)); } } catch {} };
  const when = at => at.replace(/^Today, /, '').replace(/^Yesterday, .*/, 'Yesterday').replace(/^(\w{3}), .*/, '$1').replace(/^(\w{3} \d+), .*/, '$1');
  const face = o => o.photo ? `<span class="chat-av photo"><img src="${o.photo}" alt=""></span>` : `<span class="chat-av ${o.tone || ''}">${o.ini}</span>`;
  let show = new URLSearchParams(location.search).get('tab') === 'direct' ? 'dm' : 'group';
  let current = null, role = '';

  function row(kind, o) {
    const m = DirectChat.thread(o.name).at(-1);
    const unread = !isRead(o.name) && (cfg.unread[o.name] || 0);
    const from = !m ? '' : m.from === 'me' ? '<b>You:</b> ' : kind === 'group' ? `<b>${esc(m.who)}:</b> ` : '';
    const text = m ? esc(m.t) : esc(o.empty || 'No messages yet.');
    return `<button type="button" class="chat-row ${kind}${unread ? ' unread' : ''}${current === o.name ? ' on' : ''}" data-name="${esc(o.name)}" data-kind="${kind}">
      ${face(o)}
      <span class="chat-main"><span class="chat-line"><span class="chat-name">${esc(o.name)}</span><span class="chip">${esc(o.role)}</span></span>
        <span class="chat-preview">${from}${text}</span></span>
      <span class="chat-side"><span class="chat-time">${m ? esc(when(m.at)) : '—'}</span>${unread ? `<span class="chat-unread" aria-label="${unread} unread">${unread}</span>` : ''}</span>
    </button>`;
  }
  const dms = () => cfg.people.filter(p => DirectChat.thread(p.name).length);
  function render() {
    list.innerHTML = cfg.groups.map(g => row('group', g)).join('') + dms().map(p => row('dm', p)).join('');
    document.querySelector('[data-show="group"]').textContent = `Clinics (${cfg.groups.length})`;
    document.querySelector('[data-show="dm"]').textContent = `Direct (${dms().length})`;
    document.querySelectorAll('[data-show]').forEach(b => b.classList.toggle('on', b.dataset.show === show));
    const term = q.value.trim().toLowerCase(); let n = 0;
    list.querySelectorAll('.chat-row').forEach(r => { const ok = r.dataset.kind === show && r.dataset.name.toLowerCase().includes(term); r.hidden = !ok; if (ok) n++; });
    empty.hidden = n > 0;
  }
  function open(kind, name, auto) {
    // the chat opened on page load keeps its unread badge (as in Figma); a click reads it
    current = name; if (!auto) markRead(name);
    if (kind === 'group') { const g = cfg.groups.find(x => x.name === name); DirectChat.open({ name: g.name, group: true, members: g.members, role: '', ini: g.ini, ctx: '' }); }
    else { const p = cfg.people.find(x => x.name === name); DirectChat.open({ name: p.name, role: p.role, photo: p.photo, ctx: ' · ' + p.clinic }); }
    render();
  }
  const openFirst = () => { const r = [...list.querySelectorAll('.chat-row')].find(x => !x.hidden); if (r) open(r.dataset.kind, r.dataset.name, true); };

  // New message: one list (photo, name, role) with a role filter
  function renderPicker() {
    const t = document.getElementById('nd-q').value.trim().toLowerCase();
    const ps = cfg.people.filter(p => (!role || p.role === role) && p.name.toLowerCase().includes(t)).sort((x, y) => x.name.localeCompare(y.name));
    document.getElementById('nd-list').innerHTML = ps.map(p => `<button type="button" class="dm-person" data-pick="${esc(p.name)}">${face(p)}<span class="who"><b>${esc(p.name)}</b><span class="chip">${esc(p.role)}</span></span><img src="${cfg.caret}" alt=""></button>`).join('') || '<p class="muted">No one matches that name.</p>';
  }

  list.addEventListener('click', e => { const r = e.target.closest('.chat-row'); if (r) open(r.dataset.kind, r.dataset.name); });
  q.addEventListener('input', render);
  document.querySelectorAll('[data-show]').forEach(b => b.addEventListener('click', () => {
    show = b.dataset.show; render();
    const cur = list.querySelector(`.chat-row.on`); if (!cur || cur.hidden) openFirst();
  }));
  document.querySelector('[data-open="#new-dm"]').addEventListener('click', renderPicker);
  document.getElementById('nd-q').addEventListener('input', renderPicker);
  document.getElementById('nd-filter').addEventListener('click', e => { const b = e.target.closest('[data-role]'); if (!b) return; role = b.dataset.role; document.querySelectorAll('#nd-filter button').forEach(x => x.classList.toggle('on', x === b)); renderPicker(); });
  document.getElementById('nd-list').addEventListener('click', e => {
    const b = e.target.closest('[data-pick]'); if (!b) return;
    document.getElementById('new-dm').hidden = true; document.body.style.overflow = '';
    show = 'dm'; open('dm', b.dataset.pick);
  });
  document.addEventListener('dc:change', render);
  document.addEventListener('click', e => { if (e.target.closest('#reset-demo')) { ['cs-dm', READ].forEach(k => localStorage.removeItem(k)); current = null; render(); openFirst(); window.toast('Prototype data reset'); } });

  render(); openFirst();
};

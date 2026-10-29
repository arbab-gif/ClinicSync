/* ClinicSync design-screen gallery: every screen from the Figma "Final Design" page,
   grouped by flow and section (manifest.json), with a full-size viewer. */

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const file = id => `screens/${id.replace(':', '-')}.png`;
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

let M, flow = 'Organizer', query = '', list = [], cur = -1;
const HIDDEN_FLOWS = ['Player']; // organizer-only for now; remove to show the player screens again

const figmaLink = id => `${M.file.split('?')[0]}?node-id=${id.replace(':', '-')}`;

function groupsFor(f) {
  const q = query.trim().toLowerCase();
  return M.groups
    .filter(g => g.flow === f)
    .map(g => ({ ...g, screens: g.screens.filter(([, name]) => !q || name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)) }))
    .filter(g => g.screens.length);
}

function renderTabs() {
  const flows = [...new Set(M.groups.map(g => g.flow))];
  $('#tabs').innerHTML = flows.map(f => {
    const n = groupsFor(f).reduce((a, g) => a + g.screens.length, 0);
    return `<button type="button" role="tab" aria-selected="${f === flow}" data-flow="${f}">${f}<span class="n">${n}</span></button>`;
  }).join('');
  $('#tabs').onclick = e => { const b = e.target.closest('[data-flow]'); if (b) { flow = b.dataset.flow; location.hash = slug(flow); render(); } };
}

function render() {
  renderTabs();
  const groups = groupsFor(flow);
  list = groups.flatMap(g => g.screens.map(s => ({ id: s[0], name: s[1], w: s[2], h: s[3], group: g.name })));
  $('#side').innerHTML = groups.map(g => `<a href="#${slug(flow)}/${slug(g.name)}" data-sec="${slug(g.name)}">${esc(g.name)}<span class="n">${g.screens.length}</span></a>`).join('');
  let i = 0;
  $('#main').innerHTML = groups.length ? groups.map(g => `
    <section class="group" id="${slug(g.name)}">
      <h2>${esc(g.name)}</h2>
      <p class="sub">${g.screens.length} screen${g.screens.length === 1 ? '' : 's'}</p>
      <div class="grid">
        ${g.screens.map(([id, name]) => `
          <button class="tile" type="button" data-i="${i++}" aria-label="Open ${esc(name)}">
            <span class="thumb"><img loading="lazy" src="${file(id)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'missing',textContent:'Not exported yet'}))"></span>
            <span class="cap"><b>${esc(name)}</b><small>${esc(id)}</small></span>
          </button>`).join('')}
      </div>
    </section>`).join('') : `<p class="empty">No screens match “${esc(query)}”.</p>`;
}

function open(i) {
  cur = (i + list.length) % list.length;
  const s = list[cur];
  $('#v-img').src = file(s.id);
  $('#v-img').alt = s.name;
  $('#v-title').textContent = s.name;
  $('#v-path').textContent = `${flow} · ${s.group}`;
  $('#v-count').textContent = `${cur + 1} / ${list.length}`;
  $('#v-figma').href = figmaLink(s.id);
  $('#v-stage').scrollTop = 0;
  $('#viewer').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#v-close').focus();
}
function close() {
  $('#viewer').hidden = true;
  document.body.style.overflow = '';
  $(`.tile[data-i="${cur}"]`)?.focus();
}

document.addEventListener('click', e => {
  const t = e.target.closest('.tile');
  if (t) open(+t.dataset.i);
});
$('#v-close').onclick = close;
$('#v-prev').onclick = () => open(cur - 1);
$('#v-next').onclick = () => open(cur + 1);
document.addEventListener('keydown', e => {
  if ($('#viewer').hidden) return;
  if (e.key === 'Escape') close();
  else if (e.key === 'ArrowRight') open(cur + 1);
  else if (e.key === 'ArrowLeft') open(cur - 1);
});
$('#search').addEventListener('input', e => { query = e.target.value; render(); });

// Highlight the section in view
const spy = new IntersectionObserver(entries => {
  for (const en of entries) if (en.isIntersecting) {
    document.querySelectorAll('.side a').forEach(a => a.classList.toggle('on', a.dataset.sec === en.target.id));
  }
}, { rootMargin: '-90px 0px -70% 0px' });
new MutationObserver(() => document.querySelectorAll('.group').forEach(g => spy.observe(g))).observe($('#main'), { childList: true });

fetch('manifest.json').then(r => r.json()).then(m => {
  M = { ...m, groups: m.groups.filter(g => !HIDDEN_FLOWS.includes(g.flow)) };
  $('#figma-file').href = M.file;
  const [f, sec] = location.hash.slice(1).split('/');
  flow = [...new Set(M.groups.map(g => g.flow))].find(x => slug(x) === f) || 'Organizer';
  render();
  if (sec) document.getElementById(sec)?.scrollIntoView();
});

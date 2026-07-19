function el(tag, cls, html) {
 const e = document.createElement(tag);
 if (cls) e.className = cls;
 if (html != null) e.innerHTML = html;
 return e;
}

// Names of stops actually scheduled in the week, derived from day events.
// Used to mark Back-pocket entries that are already committed vs genuine spares.
const SCHEDULED_NAMES = (function () {
 const names = [];
 (TRIP.days || []).forEach(d => (d.events || []).forEach(ev => {
  // take the part before a comma or "if"/"?" qualifier so "Lan Xin" matches "Lan Xin, ..."
  const base = ev.title.split(/,| if | \u2013 /)[0].trim();
  if (base) names.push(base);
 }));
 return names;
})();

function makeExpand(label, bodyHtml, dropCap) {
 const wrap = el('div', 'sh26-panel');
 const btn = el('button', 'sh26-panel-btn', `<em class="sh26-chevron">›</em>&nbsp;${label}`);
 const body = el('div', 'sh26-panel-body');
 body.innerHTML = `<div class="prose${dropCap ? ' prose-drop' : ''}">${bodyHtml}</div>`;
 const pid = 'x-' + Math.random().toString(36).slice(2, 8);
 body.id = pid; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', pid);
 btn.addEventListener('click', () => {
 const open = btn.classList.toggle('open');
 body.classList.toggle('open');
 btn.setAttribute('aria-expanded', open ? 'true' : 'false');
 });
 wrap.appendChild(btn);
 wrap.appendChild(body);
 return wrap;
}

function renderMasthead() {
 const m = TRIP.meta;
 document.getElementById('m-title').innerHTML = m.city + (m.monthLabel ? ' <em>' + m.monthLabel + '</em>' : '');
 document.getElementById('m-dates').textContent = m.dates;
}

function renderPlanePiece() {
 const p = TRIP.meta.plane;
 const sec = document.getElementById('plane');
 const previewDiv = el('div', 'prose prose-drop', p.preview);
 sec.appendChild(el('div', 'kicker', p.kicker));
 sec.appendChild(el('h2', null, p.title));
 const sf = el('p', 'standfirst', p.standfirst);
 sec.appendChild(sf);
 sec.appendChild(previewDiv);
 sec.appendChild(makeExpand('Continue reading', p.full, false));
}

function renderChapters() {
 const wrap = document.getElementById('chapters');

 const todayStr = new Date().toLocaleString('en-CA', { timeZone: TRIP.meta.tz }).slice(0, 10);
 const tripActive = todayStr >= TRIP.meta.tripStart && todayStr <= TRIP.meta.tripEnd;
 const chapters = [];

 TRIP.days.forEach(day => {
 const ch = el('section', 'chapter');
 ch.id = day.id;
 const dayDate = day.iso;

 let isToday = false;
 if (tripActive) {
 if (dayDate < todayStr) ch.classList.add('is-past');
 else if (dayDate === todayStr) {
 ch.classList.add('is-today');
 isToday = true;
 ch.appendChild(el('div', 'chapter-label', 'Today'));
 }
 }
 if (isToday) ch.classList.add('open');

 const head = el('div', 'chapter-head');
 const arcTag = day.arc ? `<div class="chapter-arc">${day.arc}</div>` : '';
 const hoodTag = day.hood ? `<div><span class="chapter-hood">${day.hood}</span></div>` : '';
 head.innerHTML = `<div class="chapter-top"><div><div class="chapter-meta">${day.dow} &nbsp;·&nbsp; <span class="date-accent">${day.date}</span></div>${arcTag}<div class="chapter-title">${day.title}</div>${hoodTag}</div><div class="chapter-top-right"><div class="day-weather" id="wx-${day.id}"></div><div class="chapter-toggle"><em class="chev">\u203a</em></div></div></div>`;
 head.setAttribute('role', 'button');
 head.setAttribute('tabindex', '0');
 head.setAttribute('aria-expanded', isToday ? 'true' : 'false');
 function toggleChapter() {
 const nowOpen = ch.classList.toggle('open');
 head.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
 }
 head.addEventListener('click', toggleChapter);
 head.addEventListener('keydown', e => {
 if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChapter(); }
 });
 ch.appendChild(head);

 // Essay: explicit teaser shown; full essay revealed on demand. No prose parsing.
 const essayWrap = el('div', null);
 const teaser = day.teaser || (day.essay.match(/<p>([\s\S]*?)<\/p>/) || [,''])[1];
 const teaserDiv = el('div', 'essay-teaser');
 teaserDiv.innerHTML = `<p>${teaser}</p>`;
 essayWrap.appendChild(teaserDiv);
 if (day.essay) {
 const continueSpan = el('span', 'essay-continue');
 continueSpan.innerHTML = `<button type="button" class="essay-continue-btn">Continue reading</button>`;
 teaserDiv.appendChild(continueSpan);
 const fullBody = el('div', null);
 fullBody.id = 'essay-' + day.id;
 fullBody.style.display = 'none';
 fullBody.innerHTML = `<div class="prose prose-drop" style="margin-top:0.9rem;">${day.essay}</div>`;
 const collapseWrap = el('div', 'essay-collapse');
 collapseWrap.innerHTML = `<button type="button" class="essay-collapse-btn">Collapse</button>`;
 fullBody.appendChild(collapseWrap);
 essayWrap.appendChild(fullBody);
 continueSpan.querySelector('button').addEventListener('click', () => {
 fullBody.style.display = 'block';
 teaserDiv.style.display = 'none';
 ch.classList.add('open');
 head.setAttribute('aria-expanded', 'true');
 });
 collapseWrap.querySelector('button').addEventListener('click', () => {
 fullBody.style.display = 'none';
 teaserDiv.style.display = 'block';
 });
 }
 ch.appendChild(essayWrap);

 // Spine
 const spine = el('div', 'spine');
 day.events.forEach(ev => {
 const stop = el('div', 'stop');
 stop.dataset.kind = ev.kind;

 const tag = ev.state === 'confirmed' ? '<span class="stop-tag confirmed">Booked</span>'
 : ev.state === 'open' ? '<span class="stop-tag open">To book</span>' : '';
 const bibBadge = ev.bib ? (ev.bibUrl ? `<a class="bib-badge" href="${ev.bibUrl}" target="_blank" rel="noopener">Bib Gourmand</a>` : '<span class="bib-badge">Bib Gourmand</span>') : '';

 // Title -- link if url provided
 const titleHtml = ev.url
 ? `<a href="${ev.url}" target="_blank" rel="noopener">${ev.title}</a>`
 : ev.title;

 stop.appendChild(el('div', 'stop-time', ev.time));
 stop.appendChild(el('div', 'stop-head', `<span class="stop-title">${titleHtml}</span>${bibBadge}${tag}`));
 if (ev.note) stop.appendChild(el('div', 'stop-note', ev.note));
 if (ev.ref) stop.appendChild(el('div', 'stop-ref', `<span>${ev.ref}</span>`));
 if (ev.map) {
 const ml = el('a', 'stop-map', '↗ Map');
 ml.href = ev.map; ml.target = '_blank'; ml.rel = 'noopener';
 stop.appendChild(ml);
 }
 if (ev.expand) stop.appendChild(makeExpand(ev.expand.label, ev.expand.body, false));
 spine.appendChild(stop);
 });

 ch.appendChild(spine);
 chapters.push({ el: ch, date: dayDate });
 });

 if (tripActive) {
 chapters.sort((a, b) => {
 const aT = a.date === todayStr, bT = b.date === todayStr;
 const aP = a.date < todayStr, bP = b.date < todayStr;
 if (aT && !bT) return -1; if (bT && !aT) return 1;
 if (!aP && bP) return -1; if (aP && !bP) return 1;
 return a.date < b.date ? -1 : 1;
 });
 }
  chapters.forEach(c => wrap.appendChild(c.el));
}

function renderBookings() {
 const confirmedList = document.getElementById('ledger-confirmed');
 const openList = document.getElementById('ledger-open');
 TRIP.bookings.forEach(b => {
 const row = el('div', 'ledger-row');
 row.innerHTML = `<span class="ldot ${b.state}"></span>
 <div class="ledger-body">
 <div class="ledger-label">${b.label}</div>
 <div class="ledger-sub">${b.sub}</div>
 ${b.ref ? `<div class="ledger-ref"><span>${b.ref}</span></div>` : ''}
 </div>
 <span class="ledger-state ${b.state}">${b.state === 'confirmed' ? 'Booked' : 'To book'}</span>
 ${b.url ? `<a class="ledger-link" href="${b.url}" target="_blank" rel="noopener">↗</a>` : ''}`;
 (b.state === 'confirmed' ? confirmedList : openList).appendChild(row);
 });
}

function renderVoices() {
 const wrap = document.getElementById('site-voices-wrap');
 if (!TRIP.voices || !TRIP.voices.length) {
 document.getElementById('site-voices').style.display = 'none';
 return;
 }
 TRIP.voices.forEach(v => {
 const grp = el('div', 'sh26-row');
 const btn = el('button', 'sh26-row-btn', `${v.author} &middot; <em style="font-style:italic;">${v.title}</em><span class="sh26-chev">&rsaquo;</span>`);
 const body = el('div', 'sh26-row-panel');
 body.innerHTML = `<div class="prose prose-drop" style="padding-top:0.6rem;">${v.body}</div>`;
 const vid = 'v-' + Math.random().toString(36).slice(2, 8);
 body.id = vid; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', vid);
 btn.addEventListener('click', () => { const open = btn.classList.toggle('open'); body.classList.toggle('open'); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); });
 grp.appendChild(btn); grp.appendChild(body); wrap.appendChild(grp);
 });
}

function renderPocket() {
 const wrap = document.getElementById('site-pocket-wrap');
 TRIP.pocket.forEach(g => {
 const grp = el('div', 'sh26-row');
 const btn = el('button', 'sh26-row-btn', `${g.group}<span class="sh26-chev">›</span>`);
 const body = el('div', 'sh26-row-panel');
 g.items.forEach(([n, d, u]) => {
 const link = u ? ` <a class="sh26-item-link" href="${u}" target="_blank" rel="noopener">↗</a>` : '';
 const onWeek = SCHEDULED_NAMES.some(t => n === t || t.indexOf(n) === 0 || n.indexOf(t) === 0);
 const tag = onWeek ? ` <span class="pocket-tag">On the week</span>` : '';
 body.appendChild(el('div', 'sh26-item', `<div class="n">${n}${tag}${link}</div><div class="d">${d}</div>`));
 });
 const gid = 'g-' + Math.random().toString(36).slice(2, 8);
 body.id = gid; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', gid);
 btn.addEventListener('click', () => { const open = btn.classList.toggle('open'); body.classList.toggle('open'); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); });
 grp.appendChild(btn); grp.appendChild(body); wrap.appendChild(grp);
 });
}

const SANDBOX_KEY = 'sandbox_' + (TRIP.meta.slug || TRIP.meta.city.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

function loadSandbox() {
 try { return JSON.parse(localStorage.getItem(SANDBOX_KEY)) || []; }
 catch (e) { return []; }
}
function saveSandbox(items) {
 try { localStorage.setItem(SANDBOX_KEY, JSON.stringify(items)); } catch (e) {}
}
var SandboxUI = { open: null, openEdit: null, close: null };

function sbEsc(s) {
 return String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function sbNormalizeUrl(u) {
 u = (u || '').trim();
 if (!u) return '';
 if (!/^https?:\/\//i.test(u)) {
  if (/^[\w.-]+\.[a-z]{2,}([\/?#]|$)/i.test(u)) u = 'https://' + u;
  else return '';
 }
 return u;
}
function sbIsBareUrl(s) {
 return /^https?:\/\/\S+$/i.test((s || '').trim());
}
function sbDeriveName(rawUrl) {
 var u = sbNormalizeUrl(rawUrl);
 if (!u) return '';
 var parsed;
 try { parsed = new URL(u); } catch (e) { return ''; }
 var host = parsed.hostname.replace(/^www\./, '');
 function dec(x) { try { return decodeURIComponent(x.replace(/\+/g, ' ')).trim(); } catch (e) { return x.replace(/\+/g, ' ').trim(); } }
 if (/(^|\.)instagram\.com$/i.test(host)) {
  var seg = parsed.pathname.split('/').filter(Boolean);
  if (!seg.length) return 'Instagram';
  if (['p', 'reel', 'reels', 'tv', 'explore', 'stories'].indexOf(seg[0].toLowerCase()) !== -1) return 'Instagram post';
  return '@' + seg[0];
 }
 var isGMaps = (/(^|\.)google\.[a-z.]+$/i.test(host) && /\/maps/i.test(parsed.pathname))
  || /(^|\.)maps\.google\./i.test(host)
  || /(^|\.)maps\.app\.goo\.gl$/i.test(host);
 if (isGMaps) {
  var pm = parsed.pathname.match(/\/place\/([^\/]+)/);
  if (pm) return dec(pm[1]);
  var q = parsed.searchParams.get('q');
  if (q && !/^-?\d+(\.\d+)?,-?\d+/.test(q)) return dec(q);
  return 'Google Maps';
 }
 if (/(^|\.)maps\.apple\.com$/i.test(host)) {
  var aq = parsed.searchParams.get('q') || parsed.searchParams.get('name');
  if (aq) return dec(aq);
  return 'Apple Maps';
 }
 return host;
}

function upsertSandboxItem(fields, editId) {
 var url = sbNormalizeUrl(fields.url);
 var name = (fields.name || '').trim();
 var note = (fields.note || '').trim();
 if (!url && !name && !note) return false;
 var items = loadSandbox();
 if (editId) {
  for (var i = 0; i < items.length; i++) {
   if (items[i].id === editId) {
    items[i].url = url; items[i].name = name; items[i].note = note;
    if ('text' in items[i]) delete items[i].text;
    break;
   }
  }
 } else {
  items.push({ id: Date.now() + '' + Math.floor(Math.random() * 1000), created: Date.now(), done: false, url: url, name: name, note: note });
 }
 saveSandbox(items);
 renderSandbox();
 return true;
}

function removeSandboxItem(id) {
 saveSandbox(loadSandbox().filter(function (it) { return it.id !== id; }));
 renderSandbox();
}
function toggleSandboxItem(id) {
 var items = loadSandbox().map(function (it) {
  if (it.id === id) it.done = !it.done;
  return it;
 });
 saveSandbox(items);
 renderSandbox();
}
function clearSandboxAll() {
 if (!confirm('Clear all scratchpad items? This can\'t be undone.')) return;
 saveSandbox([]);
 renderSandbox();
}

function sbItemPlain(it) {
 if (it.url || it.name || it.note) {
  var parts = [];
  if (it.name) parts.push(it.name);
  if (it.url) parts.push(it.url);
  var head = parts.join(' ');
  return it.note ? (head ? head + ' | ' + it.note : it.note) : head;
 }
 return it.text || '';
}
function copyAllSandbox() {
 var items = loadSandbox().slice().sort(function (a, b) { return a.created - b.created; });
 if (!items.length) return;
 var text = items.map(function (it) { return (it.done ? '[done] ' : '') + sbItemPlain(it); }).join('\n');
 var done = function () {
  var btn = document.getElementById('sandbox-copy-btn');
  if (btn) { var t = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = t; }, 1200); }
 };
 if (navigator.clipboard && navigator.clipboard.writeText) {
  navigator.clipboard.writeText(text).then(done).catch(function () { window.prompt('Copy your notes:', text); });
 } else {
  window.prompt('Copy your notes:', text);
 }
}

function sbTitleHtml(it) {
 var url = it.url ? sbNormalizeUrl(it.url) : (sbIsBareUrl(it.text) ? sbNormalizeUrl(it.text) : '');
 if (url) {
  var label = (it.name || '').trim();
  if (!label) label = sbDeriveName(url) || url;
  return '<a class="sandbox-item-link" href="' + sbEsc(url) + '" target="_blank" rel="noopener noreferrer">' + sbEsc(label) + '</a>';
 }
 var t = (it.name || it.text || '').trim();
 return '<span class="sandbox-item-title">' + sbEsc(t) + '</span>';
}

function renderSandbox() {
 var wrap = document.getElementById('site-sandbox-wrap');
 var items = loadSandbox().slice().sort(function (a, b) { return b.created - a.created; });
 wrap.innerHTML = '';
 if (!items.length) {
  wrap.appendChild(el('div', 'sandbox-empty', 'Nothing saved yet. Tap the + button, bottom right, to drop something in.'));
  return;
 }
 items.forEach(function (it) {
  var row = el('div', 'sandbox-item' + (it.done ? ' done' : ''));
  var when = new Date(it.created).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
  var note = (it.note || '').trim();
  var html = sbTitleHtml(it)
   + (note ? '<div class="sandbox-item-note">' + sbEsc(note) + '</div>' : '')
   + '<div class="sandbox-item-date">' + when + '</div>';
  var body = el('div', 'sandbox-item-body', html);
  var actions = el('div', 'sandbox-item-actions');
  var editBtn = el('button', 'sandbox-item-btn', 'edit');
  editBtn.type = 'button';
  editBtn.addEventListener('click', function (e) { e.stopPropagation(); if (SandboxUI.openEdit) SandboxUI.openEdit(it); });
  var doneBtn = el('button', 'sandbox-item-btn', it.done ? 'undo' : 'done');
  doneBtn.type = 'button';
  doneBtn.addEventListener('click', function () { toggleSandboxItem(it.id); });
  var delBtn = el('button', 'sandbox-item-btn', 'delete');
  delBtn.type = 'button';
  delBtn.addEventListener('click', function () { removeSandboxItem(it.id); });
  actions.appendChild(editBtn);
  actions.appendChild(doneBtn);
  actions.appendChild(delBtn);
  row.appendChild(body);
  row.appendChild(actions);
  wrap.appendChild(row);
 });
 var bar = el('div', 'sandbox-toolbar');
 var cpy = el('button', 'sandbox-clear-btn', 'Copy all');
 cpy.type = 'button'; cpy.id = 'sandbox-copy-btn';
 cpy.addEventListener('click', copyAllSandbox);
 var clr = el('button', 'sandbox-clear-btn', 'Clear all');
 clr.type = 'button';
 clr.addEventListener('click', clearSandboxAll);
 bar.appendChild(cpy);
 bar.appendChild(clr);
 wrap.appendChild(bar);
}

function initSandboxCapture() {
 var fab = document.getElementById('fab');
 var box = document.getElementById('sandbox-capture');
 var urlIn = document.getElementById('sandbox-url');
 var nameIn = document.getElementById('sandbox-name');
 var noteIn = document.getElementById('sandbox-note');
 var saveBtn = document.getElementById('sandbox-save');
 if (!fab || !box || !urlIn || !nameIn || !noteIn || !saveBtn) return;
 var editId = null;
 var nameTouched = false;

 function reset() { urlIn.value = ''; nameIn.value = ''; noteIn.value = ''; editId = null; nameTouched = false; }
 function open() { box.classList.add('open'); setTimeout(function () { urlIn.focus(); }, 0); }
 function close() { box.classList.remove('open'); reset(); }
 function openEdit(it) {
  reset();
  editId = it.id;
  if (it.url) { urlIn.value = it.url; nameIn.value = it.name || ''; noteIn.value = it.note || ''; }
  else if (sbIsBareUrl(it.text)) { urlIn.value = it.text; nameIn.value = it.name || ''; noteIn.value = it.note || ''; }
  else { nameIn.value = (it.name || it.text || ''); noteIn.value = it.note || ''; }
  nameTouched = true;
  box.classList.add('open');
  setTimeout(function () { urlIn.focus(); }, 0);
 }
 function commit() {
  var ok = upsertSandboxItem({ url: urlIn.value, name: nameIn.value, note: noteIn.value }, editId);
  if (!ok) return;
  if (editId) { close(); }
  else {
   reset();
   var t = saveBtn.textContent; saveBtn.textContent = 'Saved';
   setTimeout(function () { saveBtn.textContent = t; }, 900);
   urlIn.focus();
  }
 }

 SandboxUI.open = open; SandboxUI.openEdit = openEdit; SandboxUI.close = close;

 fab.addEventListener('click', function () {
  if (box.classList.contains('open')) { close(); } else { open(); }
 });
 urlIn.addEventListener('input', function () {
  if (!nameTouched) { nameIn.value = sbDeriveName(urlIn.value); }
 });
 nameIn.addEventListener('input', function () { nameTouched = true; });
 [urlIn, nameIn, noteIn].forEach(function (inp) {
  inp.addEventListener('keydown', function (e) {
   if (e.key === 'Enter') { e.preventDefault(); commit(); }
   else if (e.key === 'Escape') { close(); }
  });
 });
 saveBtn.addEventListener('click', commit);
 document.addEventListener('click', function (e) {
  if (box.classList.contains('open') && !box.contains(e.target) && e.target !== fab && !fab.contains(e.target)) { close(); }
 });
}

// --- Time helpers (used by the Now strip) ---
const TRIP_START_ISO = TRIP.meta.tripStart;

function parseEventMinutes(ev) {
 if (ev.t && /^\d{1,2}:\d{2}$/.test(ev.t)) {
  const [h, m] = ev.t.split(':').map(Number);
  return h * 60 + m;
 }
 // parse display strings like "6:30pm", "8:15am", "~8:30am", "8:50am Mon"
 const m = (ev.time || '').match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
 if (!m) return null;
 let h = parseInt(m[1], 10);
 const min = parseInt(m[2], 10);
 const ap = m[3].toLowerCase();
 if (ap === 'pm' && h !== 12) h += 12;
 if (ap === 'am' && h === 12) h = 0;
 return h * 60 + min;
}

function dayDiff(isoA, isoB) {
 const a = new Date(isoA + 'T00:00:00Z').getTime();
 const b = new Date(isoB + 'T00:00:00Z').getTime();
 return Math.round((b - a) / 86400000);
}

function getTripNow() {
 // allow test override
 if (typeof window !== 'undefined' && window.__NOW__) return window.__NOW__;
 const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: TRIP.meta.tz, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false
 }).formatToParts(new Date());
 const g = t => (parts.find(p => p.type === t) || {}).value;
 let hh = g('hour'); if (hh === '24') hh = '00';
 return { date: `${g('year')}-${g('month')}-${g('day')}`, minutes: parseInt(hh, 10) * 60 + parseInt(g('minute'), 10) };
}

// Absolute minute key from trip start, so events sort across days (and past midnight)
function eventAbsKey(dayIdx, ev) {
 const mins = parseEventMinutes(ev);
 if (mins == null) return null;
 return (dayIdx + (ev.dayOffset || 0)) * 1440 + mins;
}

function buildFlatEvents() {
 const flat = [];
 TRIP.days.forEach((day, i) => (day.events || []).forEach(ev => {
  const key = eventAbsKey(i, ev);
  if (key != null) flat.push({ key, ev, day, dayIdx: i });
 }));
 flat.sort((a, b) => a.key - b.key);
 return flat;
}

function renderNowStrip(wrap, now) {
 const nowAbs = dayDiff(TRIP_START_ISO, now.date) * 1440 + now.minutes;
 const flat = buildFlatEvents();
 let current = null, next = null;
 for (const item of flat) {
  if (item.key <= nowAbs) current = item;
  else { next = item; break; }
 }
 // Prefer showing the next event; label the just-started one as "Now" if within 90 min.
 let show, label;
 if (current && nowAbs - current.key <= 90) { show = current; label = 'Now'; }
 else if (next) { show = next; label = 'Next'; }
 else if (current) { show = current; label = 'Now'; }
 else return false;

 wrap.classList.add('now-mode');
 const strip = el('button', 'now-strip');
 strip.type = 'button';
 strip.innerHTML =
  '<span class="now-label">' + label + '</span>' +
  '<span class="now-time">' + (show.ev.time || '') + '</span>' +
  '<span class="now-title">' + show.ev.title + '</span>' +
  '<span class="now-day">' + show.day.dow + '</span>';
 strip.addEventListener('click', function () {
  const target = document.getElementById(show.day.id);
  if (target) { target.classList.add('open'); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
 });
 wrap.appendChild(strip);
 return true;
}

function renderChips(wrap) {
 TRIP.days.forEach(function (day, i) {
  const chip = el('a', 'day-chip');
  chip.href = '#' + day.id;
  const shortDate = day.date.replace(/(\d+)\s+(\w{3})\w*/, '$1 $2');
  chip.innerHTML =
   '<span class="dc-num">Ch. ' + (day.chapter || i) + '</span>' +
   '<span class="dc-date">' + shortDate + '</span>' +
   '<span class="dc-hood">' + (day.hoodShort || '') + '</span>';
  chip.addEventListener('click', function (e) {
   e.preventDefault();
   const target = document.getElementById(day.id);
   if (target) { target.classList.add('open'); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  wrap.appendChild(chip);
 });
 // trailing section-jump chips
 [['Bookings', 'bookings-section'], ['Back pocket', 'site-pocket']].forEach(function (pair) {
  const chip = el('a', 'day-chip day-chip-jump');
  chip.href = '#' + pair[1];
  chip.innerHTML = '<span class="dc-jump">' + pair[0] + '</span>';
  chip.addEventListener('click', function (e) {
   e.preventDefault();
   const target = document.getElementById(pair[1]);
   if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  wrap.appendChild(chip);
 });
}

function renderDayIndex() {
 const wrap = document.getElementById('day-index');
 if (!wrap) return;
 wrap.innerHTML = '';
 const now = getTripNow();
 const inTrip = now.date >= TRIP_START_ISO && now.date <= TRIP.meta.tripEnd;
 const controls = document.getElementById('day-controls-wrap');
 if (inTrip && renderNowStrip(wrap, now)) {
  if (controls) controls.style.display = 'none';
  return;
 }
 renderChips(wrap);
}

function initExpandAll() {
 const btn = document.getElementById('expand-all-btn');
 if (!btn) return;
 btn.addEventListener('click', function () {
  const chapters = Array.from(document.querySelectorAll('.chapter'));
  const anyClosed = chapters.some(function (c) { return !c.classList.contains('open'); });
  chapters.forEach(function (c) {
   c.classList.toggle('open', anyClosed);
   const head = c.querySelector('.chapter-head');
   if (head) head.setAttribute('aria-expanded', anyClosed ? 'true' : 'false');
   // reveal any collapsed essay bodies when opening all
   if (anyClosed) {
    const teaser = c.querySelector('.essay-teaser');
    const full = c.querySelector('[id^="essay-"]');
    if (teaser && full) { teaser.style.display = 'none'; full.style.display = 'block'; }
   }
  });
  btn.textContent = anyClosed ? 'Close all days' : 'Open all days';
  btn.setAttribute('aria-pressed', anyClosed ? 'true' : 'false');
 });
}

async function fetchWeather() {
 try {
 // Open-Meteo's forecast window is ~16 days; the masthead's "current" reading only
 // means anything once we're inside that window relative to trip start, otherwise
 // it would show today's real weather next to the trip dates, which
 // reads as wrong no matter how accurate the number technically is.
 const tripStart = new Date(TRIP.meta.tripStartISO);
 const now = new Date();
 const daysUntilTrip = (tripStart - now) / 86400000;
 const showCurrent = daysUntilTrip <= 16 && daysUntilTrip >= -8;

 const wmoIcon = c => c===0?'☀':c<=2?'⛅':c===3?'☁':c<=49?'🌫':c<=59?'🌦':c<=69?'🌧':c<=79?'❄':c<=82?'🌦':'⛈';

 // Two separate requests. The daily range sits in October and will 400 while
 // it is beyond Open-Meteo's ~16-day forecast horizon; keeping it apart from
 // the current-conditions call means a rejected range never blanks the masthead.
 if (showCurrent) {
 try {
 const rc = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${TRIP.meta.geo.lat}&longitude=${TRIP.meta.geo.lon}&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=${encodeURIComponent(TRIP.meta.tz)}`);
 if (rc.ok) {
 const dc = await rc.json();
 if (dc.current) {
 const cur = Math.round(dc.current.temperature_2m);
 const curIcon = wmoIcon(dc.current.weather_code);
 document.getElementById('m-weather').innerHTML =
 `${curIcon} <span class="mast-weather-temp">${cur}°</span>`;
 }
 }
 } catch (e) {}
 }

 // Per-day forecast: only meaningful once the range is inside the horizon.
 const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${TRIP.meta.geo.lat}&longitude=${TRIP.meta.geo.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=${encodeURIComponent(TRIP.meta.tz)}&start_date=${TRIP.meta.tripStart}&end_date=${TRIP.meta.tripEnd}`);
 if (!r.ok) return;
 const d = await r.json();
 if (!d.daily || !d.daily.time) return;

 // Derive date->id from the trip data itself
 const dateToId = {};
 TRIP.days.forEach(dd => { dateToId[dd.iso] = dd.id; });
 d.daily.time.forEach((date, i) => {
 const id = dateToId[date];
 if (!id) return;
 const slot = document.getElementById('wx-' + id);
 if (!slot) return;
 const icon = wmoIcon(d.daily.weather_code[i]);
 const hi = Math.round(d.daily.temperature_2m_max[i]);
 const lo = Math.round(d.daily.temperature_2m_min[i]);
 slot.innerHTML = `<span class="day-weather-icon">${icon}</span><span class="day-weather-temps"><span class="hi">${hi}°</span> / ${lo}°</span>`;
 });
 } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
 renderMasthead();
 renderPlanePiece();
 renderVoices();
 renderChapters();
 renderBookings();
 renderDayIndex();
 initExpandAll();
 renderPocket();
 renderSandbox();
 initSandboxCapture();
 fetchWeather();
});
if ('serviceWorker' in navigator) {
 window.addEventListener('load', function () {
  navigator.serviceWorker.register('sw.js').catch(function () {});
 });
}

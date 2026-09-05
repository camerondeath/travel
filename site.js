function el(tag, cls, html) {
 const e = document.createElement(tag);
 if (cls) e.className = cls;
 if (html != null) e.innerHTML = html;
 return e;
}

// Anything that did not come out of a trip page's own TRIP object goes through
// here before it meets innerHTML. Authored trip copy is deliberate HTML and
// stays raw; the events feed and the scratchpad are plain text written by an
// agent or pasted by hand, and are not trusted to be markup-free.
function esc(s) {
 return String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// ...and only ever put a real web link in an href.
function safeUrl(u) { return /^https?:\/\//i.test(String(u || '')) ? String(u) : ''; }

// Jumps honour prefers-reduced-motion. The stylesheet already switches
// scroll-behavior off for those users, but an explicit behavior:'smooth' here
// overrides the CSS, so the preference has to be read again in script.
function scrollToEl(target, open) {
 if (!target) return;
 if (open) target.classList.add('open');
 const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
}

// One localStorage namespace per trip (hides, pins, scratchpad), and one place
// where a read or write can fail quietly — Safari in private mode throws on
// both, and a full disk throws on write.
const TRIP_SLUG = TRIP.meta.slug || TRIP.meta.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
function lsGet(key, fallback) {
 try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
 catch (e) { return fallback; }
}
function lsSet(key, value) {
 try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
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

// "Tan" should match "Tan, Monday opening hours" but never "Tank Shanghai":
// a prefix only counts when it ends on a word boundary.
function namesMatch(a, b) {
 if (a === b) return true;
 const longer = a.length > b.length ? a : b;
 const shorter = a.length > b.length ? b : a;
 return longer.indexOf(shorter) === 0 && !/[a-z0-9]/i.test(longer.charAt(shorter.length));
}

// One disclosure row (button + collapsible panel) with the aria wiring done
// once. Voices, back-pocket groups, archived events and the bookings ledgers
// all share this shape.
let discSeq = 0;
function makeDisclosureRow(labelHtml, opts) {
 opts = opts || {};
 const grp = el('div', 'sh26-row');
 const btn = el('button', 'sh26-row-btn', `<span class="sh26-row-label">${labelHtml}</span><span class="sh26-chev">›</span>`);
 btn.type = 'button';
 const body = el('div', 'sh26-row-panel');
 body.id = 'disc-' + (++discSeq);
 btn.setAttribute('aria-controls', body.id);
 function setOpen(open) {
  btn.classList.toggle('open', open);
  body.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
 }
 setOpen(!!opts.open);
 btn.addEventListener('click', () => setOpen(!btn.classList.contains('open')));
 grp.appendChild(btn);
 grp.appendChild(body);
 return { grp, body };
}

function makeExpand(label, bodyHtml) {
 const wrap = el('div', 'sh26-panel');
 const btn = el('button', 'sh26-panel-btn', `<em class="sh26-chevron">›</em>&nbsp;${label}`);
 btn.type = 'button';
 const body = el('div', 'sh26-panel-body');
 body.innerHTML = `<div class="prose">${bodyHtml}</div>`;
 // Shares makeDisclosureRow's counter. Two id schemes in one file (a counter
 // there, Math.random here) was a collision waiting to break an aria pair.
 body.id = 'x-' + (++discSeq);
 btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', body.id);
 btn.addEventListener('click', () => {
 const open = btn.classList.toggle('open');
 body.classList.toggle('open');
 btn.setAttribute('aria-expanded', open ? 'true' : 'false');
 });
 wrap.appendChild(btn);
 wrap.appendChild(body);
 return wrap;
}

// Live trip status relative to today, used in the masthead.
function tripStatusMeta() {
 const m = TRIP.meta;
 if (!m.tripStart) return null;
 const today = new Date(); today.setHours(0, 0, 0, 0);
 const start = new Date(m.tripStart + 'T00:00:00');
 const end = new Date((m.tripEnd || m.tripStart) + 'T00:00:00');
 const DAY = 86400000;
 if (today < start) {
  const days = Math.round((start - today) / DAY);
  if (days === 0) return { kind: 'next', label: 'Starts today' };
  if (days === 1) return { kind: 'next', label: 'Starts tomorrow' };
  return { kind: 'next', label: 'In ' + days + ' days' };
 }
 if (today <= end) {
  const dayNum = Math.round((today - start) / DAY) + 1;
  const total = Math.round((end - start) / DAY) + 1;
  return { kind: 'now', label: 'Day ' + dayNum + ' of ' + total };
 }
 return { kind: 'past', label: 'Past' };
}

function renderMasthead() {
 const m = TRIP.meta;
 const title = document.getElementById('m-title');
 const dates = document.getElementById('m-dates');
 if (title) title.innerHTML = m.city + (m.monthLabel ? ' <em>' + m.monthLabel + '</em>' : '');
 if (dates) dates.textContent = m.dates;
 const s = tripStatusMeta();
 const slot = document.getElementById('m-status');
 if (slot && s) { slot.className = 'mast-status ' + s.kind; slot.textContent = s.label; }
}

function renderPlanePiece() {
 const p = TRIP.meta.plane;
 const sec = document.getElementById('plane');
 if (!sec || !p) return;
 const previewDiv = el('div', 'prose prose-drop', p.preview);
 sec.appendChild(el('div', 'kicker', p.kicker));
 sec.appendChild(el('h2', null, p.title));
 const sf = el('p', 'standfirst', p.standfirst);
 sec.appendChild(sf);
 sec.appendChild(previewDiv);
 sec.appendChild(makeExpand('Continue reading', p.full));
}

function renderChapters() {
 const wrap = document.getElementById('chapters');

 const todayStr = new Date().toLocaleString('en-CA', { timeZone: TRIP.meta.tz }).slice(0, 10);
 const tripActive = todayStr >= TRIP.meta.tripStart && todayStr <= TRIP.meta.tripEnd;
 const chapters = [];
 const dayTotal = TRIP.days.length;

 TRIP.days.forEach((day, dayIdx) => {
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

 // Real document outline. The visible title sits inside the role=button head,
 // where its heading semantics would be stripped, so the chapter carries its
 // own heading for assistive tech and reader modes.
 const srHead = el('h2', 'sr-only', [day.title, day.dow, day.date].filter(Boolean).join(' \u00b7 '));
 ch.appendChild(srHead);

 // Weekday leads (it is the useful fact); date and ordinal are whispers below.
 const wdAbbr = (day.dow || '').slice(0, 3);
 const head = el('div', 'chapter-head lg');
 const dataBits = [];
 if (day.hood) dataBits.push(`<span class="hood">${day.hood}</span>`);
 if (day.arc) dataBits.push(`<span class="arc">${day.arc}</span>`);
 // Seasonal average, shown until the live forecast comes into range (fetchWeather).
 const cn = TRIP.meta.climate && TRIP.meta.climate.byId && TRIP.meta.climate.byId[day.id];
 // Sunset, computed per day — dark by ~5:15 this week, and several days
 // are planned backwards from it.
 const sunset = day.iso ? sunTime(day.iso, false) : null;
 const wxInit = cn ? `<span class="day-weather-temps"><span class="hi">${cn[0]}°</span> / ${cn[1]}°</span><span class="wx-avg">avg</span>` : '';
 head.innerHTML =
  `<div class="daymark">`
  + `<span class="wd">${wdAbbr}</span>`
  + `<span class="dt">${day.date}</span>`
  + `<span class="day-weather" id="wx-${day.id}">${wxInit}</span>`
  + (sunset ? `<span class="day-sun" title="Sunset in ${TRIP.meta.city}">\u2193 ${sunset}</span>` : '')
  + `<span class="ord">Day ${dayIdx + 1} / ${dayTotal}</span>`
  + `</div>`
  + `<div class="chapter-content">`
  + `<div class="chapter-top"><div class="chapter-title">${day.title}</div>`
  + `<div class="chapter-toggle"><em class="chev">\u203a</em></div></div>`
  + `<div class="chapter-data">${dataBits.join('')}</div>`
  + `</div>`;
 const content = head.querySelector('.chapter-content');
 head.setAttribute('role', 'button');
 head.setAttribute('tabindex', '0');
 head.setAttribute('aria-expanded', isToday ? 'true' : 'false');
 function toggleChapter() {
 const nowOpen = ch.classList.toggle('open');
 head.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
 // Closing a day puts its essay back to the teaser, so a previously
 // expanded essay can't sit fully open inside a collapsed chapter.
 if (!nowOpen) {
 const full = ch.querySelector('[id^="essay-"]');
 const t = ch.querySelector('.essay-teaser');
 if (full && t) { full.style.display = 'none'; t.style.display = ''; }
 }
 }
 // The essay -- with its own Continue reading / Collapse controls and prose
 // links -- lives inside this clickable head, so a click on any of those would
 // otherwise bubble up here and re-toggle the day, undoing the control's action.
 head.addEventListener('click', e => {
 if (e.target.closest('a, button')) return;
 toggleChapter();
 });
 head.addEventListener('keydown', e => {
 if (e.target.closest('a, button')) return;
 if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChapter(); }
 });
 ch.appendChild(head);

 // Essay: explicit teaser shown; full essay revealed on demand. No prose parsing.
 const essayWrap = el('div', null);
 const teaser = day.teaser || ((day.essay || '').match(/<p>([\s\S]*?)<\/p>/) || [, ''])[1];
 const teaserDiv = el('div', 'essay-teaser');
 teaserDiv.innerHTML = `<p>${teaser}</p>`;
 essayWrap.appendChild(teaserDiv);
 if (day.essay) {
 const continueSpan = el('span', 'essay-continue');
 continueSpan.innerHTML = `<button type="button" class="essay-continue-btn">Continue reading</button>`;
 // A sibling of the teaser, not a child -- the teaser clamps to 2 lines when
 // the day is closed, and a button living inside that clamp only survives
 // truncation by luck (visible for a short teaser, clipped away for a long
 // one). Kept outside, it always renders.
 essayWrap.appendChild(continueSpan);
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
 content.appendChild(essayWrap);

 // Schedule: each stop is a row on the shared gutter grid — the mono time
 // sits in the gutter, aligned under the weekday, the rest in the content.
 const spine = el('div', 'spine');
 day.events.forEach(ev => {
 const stop = el('div', 'lg stop');
 stop.dataset.kind = ev.kind;

 const tag = ev.state === 'confirmed' ? '<span class="stop-tag confirmed">Booked</span>'
 : ev.state === 'open' ? '<span class="stop-tag open">To book</span>' : '';
 const bibBadge = ev.bib ? (ev.bibUrl ? `<a class="bib-badge" href="${ev.bibUrl}" target="_blank" rel="noopener">Bib</a>` : '<span class="bib-badge">Bib</span>') : '';

 // Title -- link if url provided
 const titleHtml = ev.url
 ? `<a href="${ev.url}" target="_blank" rel="noopener">${ev.title}</a>`
 : ev.title;

 const body = el('div', 'stop-body');
 body.appendChild(el('div', 'stop-head', `<span class="stop-title">${titleHtml}</span>${bibBadge}${tag}`));
 if (ev.note) body.appendChild(el('div', 'stop-note', ev.note));
 if (ev.ref) body.appendChild(el('div', 'stop-ref', `<span>${ev.ref}</span>`));
 if (ev.map) {
 const ml = el('a', 'stop-map', '↗ Map');
 ml.href = ev.map; ml.target = '_blank'; ml.rel = 'noopener';
 body.appendChild(ml);
 }
 if (ev.expand) body.appendChild(makeExpand(ev.expand.label, ev.expand.body));
 stop.appendChild(el('div', 'stop-time mono', ev.time));
 stop.appendChild(body);
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
 const section = document.getElementById('bookings-section');
 if (!section) return;
 const bookings = TRIP.bookings || [];
 if (!bookings.length) { section.style.display = 'none'; return; }

 const total = bookings.length;
 const done = bookings.filter(b => b.state === 'confirmed').length;
 const openCount = total - done;
 const pct = Math.round((done / total) * 100);

 // Replace the static scaffold (two labelled empty lists) with one register.
 section.innerHTML = '';
 section.appendChild(el('h2', 'section-label', 'Bookings'));

 const reg = el('div', 'register');
 const prog = el('div', 'ledger-progress');
 prog.innerHTML = '<div class="ledger-progress-text"><b>' + done + '</b> of ' + total + ' booked'
  + (openCount ? ' · <b>' + openCount + '</b> still to book' : ' · all set') + '</div>'
  + '<div class="ledger-progress-bar"><div class="ledger-progress-fill" style="width:' + pct + '%"></div></div>';
 reg.appendChild(prog);

 function bookingRow(b) {
  const row = el('div', 'ledger-row');
  row.innerHTML = '<span class="ldot ' + b.state + '"></span>'
   + '<div class="ledger-body">'
   + '<div class="ledger-label">' + b.label + '</div>'
   + '<div class="ledger-sub">' + b.sub + '</div>'
   + (b.ref ? '<div class="ledger-ref"><span>' + b.ref + '</span></div>' : '')
   + '</div>'
   + '<span class="ledger-state ' + b.state + '">' + (b.state === 'confirmed' ? 'Booked' : 'To book') + '</span>'
   + (b.url ? '<a class="ledger-link" href="' + b.url + '" target="_blank" rel="noopener">↗</a>' : '');
  return row;
 }

 // Each group folds behind a disclosure, closed by default -- the progress
 // line above already gives the at-a-glance status, so the itemised ledger
 // (logistics reference, not something to scan on every visit) stays out of
 // the way until asked for. What still needs action lists first.
 const stillOpen = bookings.filter(b => b.state !== 'confirmed');
 const confirmed = bookings.filter(b => b.state === 'confirmed');
 if (stillOpen.length) {
  const d = makeDisclosureRow('Still to book <span class="sh26-count">' + stillOpen.length + '</span>');
  stillOpen.forEach(b => d.body.appendChild(bookingRow(b)));
  reg.appendChild(d.grp);
 }
 if (confirmed.length) {
  const d = makeDisclosureRow('Booked <span class="sh26-count">' + confirmed.length + '</span>');
  confirmed.forEach(b => d.body.appendChild(bookingRow(b)));
  reg.appendChild(d.grp);
 }
 section.appendChild(reg);
}

// "What's on": dated events from a per-trip events.json, refreshed out of band
// (e.g. by a weekly scheduled agent) from multiple listings sources. Only runs
// on pages that include the section, and hides itself if the file is missing
// or empty.
//
// The model is full-list-then-prune: every find is shown by default, and the ×
// on a row hides it into a "Hidden" disclosure (localStorage, per trip) where
// it can be restored — nothing is opt-in, and a hide is never a delete.
// Listings that run for most of the trip sit together under "Running
// throughout"; anything on for just a day or two slots into a day-by-day
// calendar of the trip window, so the empty days stay visible and each weekly
// refresh has gaps to aim at. An event's place is derived from its `start` /
// `end` dates (either may be omitted for open-ended runs — no dates at all
// means it's on the whole time).
//
// A refresh never deletes: finished listings arrive {archived: true} and move
// to "Earlier finds", and git history holds every past version of the file.
const EVENTS_NEW_DAYS = 14;
const EV_DAY = 86400000;
const EV_WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EV_MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function evDate(s) { return s ? new Date(s + 'T00:00:00').getTime() : NaN; }
function evISO(ms) {
 const d = new Date(ms);
 return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
// A find's identity, used for hides and pins. The URL alone is not enough: a
// single listing article can carry two different events (the opera season page
// announces both Tosca on 24 Oct and Aida on 30 Oct), and an entry that was
// archived and later re-found shares its URL with its own replacement. Sharing
// a key means sharing a hide and a pin, so pinning Tosca to the 24th put Aida
// on the day instead. Title and `added` disambiguate both cases, and `added`
// is the one field the refresh agent is forbidden to rewrite, so the key stays
// stable across every later edit to an entry's dates or blurb.
function eventKey(ev) {
 return ev.id || [ev.url || '', ev.title || '', ev.added || ''].join('|');
}

const EVENTS_HIDDEN_KEY = 'events_hidden_' + TRIP_SLUG;
function loadHiddenEvents() { return lsGet(EVENTS_HIDDEN_KEY, []); }
function saveHiddenEvents(ids) { lsSet(EVENTS_HIDDEN_KEY, ids); }

// "Pins" promote a find into a specific day chapter as a suggestion. Stored as
// { eventKey: dayISO } — one event pins to at most one day. Local and per-trip,
// like the hides; no refresh ever touches them. The find still shows in
// What's on (with an "On <day>" marker); the day chapter echoes it as a
// clearly second-class "suggested" row that can be moved or removed.
const EVENTS_PINNED_KEY = 'events_pinned_' + TRIP_SLUG;
function loadPinned() { return lsGet(EVENTS_PINNED_KEY, {}); }
function savePinned(map) { lsSet(EVENTS_PINNED_KEY, map); }

// --- Sun times -------------------------------------------------------------
// Late-October Shanghai is dark by a quarter past five, and this itinerary
// treats that as a hard constraint on several days ("work the afternoon back
// from it"). The times had been hand-written into three notes, where nothing
// stops them drifting. Compute them instead, from the trip's own coordinates,
// so every day carries its own and none of them can go stale.
// Standard sunrise/sunset almanac algorithm, official zenith 90deg 50'.
function tzOffsetHours(iso, tz) {
 try {
  const d = new Date(iso + 'T12:00:00Z');
  const s = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).format(d);
  const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) + Number(m[3] || 0) / 60);
 } catch (e) { return 0; }
}
function sunTime(iso, rising) {
 const geo = TRIP.meta && TRIP.meta.geo;
 if (!geo || typeof geo.lat !== 'number' || typeof geo.lon !== 'number') return null;
 // The template ships geo 0,0 as a placeholder. Null Island returns a real but
 // meaningless time, so treat it as "not filled in yet" and render nothing.
 if (geo.lat === 0 && geo.lon === 0) return null;
 const parts = iso.split('-').map(Number);
 if (parts.length !== 3 || parts.some(isNaN)) return null;
 const D = Math.PI / 180;
 const start = Date.UTC(parts[0], 0, 0);
 const N = Math.floor((Date.UTC(parts[0], parts[1] - 1, parts[2]) - start) / 86400000);
 const lat = geo.lat * D, lngHour = geo.lon / 15;
 const t = N + ((rising ? 6 : 18) - lngHour) / 24;
 const M = (0.9856 * t) - 3.289;
 let L = M + (1.916 * Math.sin(M * D)) + (0.020 * Math.sin(2 * M * D)) + 282.634;
 L = ((L % 360) + 360) % 360;
 let RA = Math.atan(0.91764 * Math.tan(L * D)) / D;
 RA = ((RA % 360) + 360) % 360;
 RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
 const sinDec = 0.39782 * Math.sin(L * D), cosDec = Math.cos(Math.asin(sinDec));
 const cosH = (Math.cos(90.8333 * D) - (sinDec * Math.sin(lat))) / (cosDec * Math.cos(lat));
 if (cosH > 1 || cosH < -1) return null;   // sun never rises/sets that day
 const H = (rising ? 360 - Math.acos(cosH) / D : Math.acos(cosH) / D) / 15;
 const UT = (((H + RA - (0.06571 * t) - 6.622) - lngHour) % 24 + 24) % 24;
 let local = (UT + tzOffsetHours(iso, TRIP.meta.tz)) % 24;
 if (local < 0) local += 24;
 let h = Math.floor(local), m = Math.round((local - h) * 60);
 if (m === 60) { m = 0; h = (h + 1) % 24; }
 const ampm = h >= 12 ? 'pm' : 'am';
 const h12 = h % 12 === 0 ? 12 : h % 12;
 return h12 + ':' + String(m).padStart(2, '0') + ampm;
}

// "Sat 24 Oct" from an ISO date, matching the calendar's day labels.
function dayLabel(iso) {
 const ms = evDate(iso);
 if (isNaN(ms)) return iso || '';
 const d = new Date(ms);
 return EV_WD[d.getDay()] + ' ' + d.getDate() + ' ' + EV_MO[d.getMonth()];
}

function eventRow(ev, opts) {
 const now = Date.now();
 const addedMs = evDate(ev.added);
 const isNew = opts.mode === 'live' && !isNaN(addedMs) &&
               (now - addedMs) >= 0 && (now - addedMs) <= EVENTS_NEW_DAYS * 86400000;
 const badge = isNew ? '<span class="event-new">New</span>' : '';
 const safeHref = safeUrl(ev.url);
 const link = safeHref ? ' <a class="event-link" href="' + safeHref + '" target="_blank" rel="noopener">↗</a>' : '';
 const kind = ev.kind ? '<span class="event-kind">' + esc(ev.kind) + '</span>' : '';
 // Throughout finds ride the shared gutter grid (run-label in the gutter);
 // calendar/hidden/archived rows stack, the when sitting inline above.
 const row = el('div', 'event-row' +
  (opts.grid ? ' lg' : '') +
  (opts.mode === 'archived' ? ' is-archived' : '') +
  (opts.onHide ? ' can-hide' : ''));
 // Everything here comes from events.json, refreshed by an out-of-band agent
 // rather than authored in this page's TRIP object, so it's escaped like any
 // other untrusted text before it meets innerHTML.
 row.innerHTML =
  '<div class="event-when mono">' + esc(ev.when) + '</div>' +
  '<div class="event-body">' +
   '<div class="event-head"><span class="event-title">' + esc(ev.title) + badge + link + '</span>' + kind + '</div>' +
   (ev.venue ? '<div class="event-venue">' + esc(ev.venue) + '</div>' : '') +
   (ev.blurb ? '<div class="event-blurb">' + esc(ev.blurb) + '</div>' : '') +
  '</div>';
 if (opts.control) row.querySelector('.event-body').appendChild(opts.control);
 if (opts.onHide) {
  const b = el('button', 'event-hide', '×');
  b.type = 'button';
  b.title = 'Hide — not for this trip';
  b.setAttribute('aria-label', 'Hide ' + (ev.title || 'event'));
  b.addEventListener('click', () => opts.onHide(ev));
  row.appendChild(b);
 }
 if (opts.onRestore) {
  const b = el('button', 'event-keep', 'Restore');
  b.type = 'button';
  b.addEventListener('click', () => opts.onRestore(ev));
  row.appendChild(b);
 }
 return row;
}

async function renderEvents() {
 const wrap = document.getElementById('site-events-wrap');
 const section = document.getElementById('site-events');
 if (!wrap || !section) return;
 section.style.display = 'none';
 try {
  const r = await fetch('events.json', { cache: 'no-cache' });
  if (!r.ok) return;
  const data = await r.json();
  const all = (data.events || []).slice();
  if (!all.length) return;

  const tripStart = evDate(TRIP.meta.tripStart), tripEnd = evDate(TRIP.meta.tripEnd);
  const hasWindow = !isNaN(tripStart) && !isNaN(tripEnd) && tripEnd >= tripStart;
  const tripDays = hasWindow ? Math.round((tripEnd - tripStart) / EV_DAY) + 1 : 0;
  // "throughout" = on for most of the trip; short runs get a calendar slot
  const spanMin = Math.max(3, Math.ceil(tripDays * 0.6));

  // null → runs throughout; otherwise the ISO day of its first in-window date
  function slotOf(ev) {
   if (!hasWindow) return null;
   const s = ev.start ? evDate(ev.start) : -Infinity;
   const e = ev.end ? evDate(ev.end) : Infinity;
   const os = Math.max(s, tripStart), oe = Math.min(e, tripEnd);
   if (oe < os) return null; // outside the window — keep it visible up top
   if (Math.round((oe - os) / EV_DAY) + 1 >= spanMin) return null;
   return evISO(os);
  }

  const bySort = (a, b) => String(a.sortDate || a.start || '').localeCompare(String(b.sortDate || b.start || ''));
  const state = { hidden: loadHiddenEvents(), pins: loadPinned(), hiddenOpen: false, earlierOpen: false };

  // Every find keyed for lookup, and the trip's real day chapters (the only
  // days a find can be pinned into — one option per chapter that exists).
  const eventByKey = {};
  all.forEach(ev => { eventByKey[eventKey(ev)] = ev; });
  const tripDayList = (TRIP.days || []).filter(d => d.iso);
  const dayByISO = {};
  tripDayList.forEach(d => { dayByISO[d.iso] = d; });

  function hide(ev) {
   const k = eventKey(ev);
   if (k && state.hidden.indexOf(k) === -1) state.hidden.push(k);
   saveHiddenEvents(state.hidden);
   paint();
  }
  function restore(ev) {
   const k = eventKey(ev);
   state.hidden = state.hidden.filter(x => x !== k);
   saveHiddenEvents(state.hidden);
   paint();
  }
  function setPin(key, iso) { state.pins[key] = iso; savePinned(state.pins); paint(); }
  function clearPin(key) { delete state.pins[key]; savePinned(state.pins); paint(); }

  // The days a find is actually on, restricted to real day chapters. An event
  // may declare `dates` (specific ISO one-offs) or `weekdays` (a recurring
  // pattern like "Wed–Sun"); absent both, eligibility is its `start`/`end` run
  // intersected with the trip. An optional `closed` weekday list (museums shut
  // on Mondays, say) is always subtracted. This is what stops you pinning a
  // Wednesday jazz night onto a Tuesday.
  function wdOf(iso) { const ms = evDate(iso); return isNaN(ms) ? '' : EV_WD[new Date(ms).getDay()]; }
  function eligibleDays(ev) {
   let days = tripDayList.map(d => d.iso);
   if (Array.isArray(ev.dates) && ev.dates.length) {
    const set = {}; ev.dates.forEach(x => { set[x] = true; });
    days = days.filter(iso => set[iso]);
   } else {
    const s = ev.start ? evDate(ev.start) : -Infinity;
    const e = ev.end ? evDate(ev.end) : Infinity;
    days = days.filter(iso => { const ms = evDate(iso); return ms >= s && ms <= e; });
    if (Array.isArray(ev.weekdays) && ev.weekdays.length) {
     const wset = {}; ev.weekdays.forEach(w => { wset[String(w).slice(0, 3)] = true; });
     days = days.filter(iso => wset[wdOf(iso)]);
    }
   }
   if (Array.isArray(ev.closed) && ev.closed.length) {
    const cset = {}; ev.closed.forEach(w => { cset[String(w).slice(0, 3)] = true; });
    days = days.filter(iso => !cset[wdOf(iso)]);
   }
   return days.filter(iso => dayByISO[iso]);
  }
  // A short, human account of when it's on, shown beside a multi-day picker.
  function eligibleHint(ev) {
   if (Array.isArray(ev.weekdays) && ev.weekdays.length) {
    const wd = ev.weekdays.map(w => String(w).slice(0, 3)).join(' · ');
    return wd + (ev.weekdays.length < 7 ? ' only' : '');
   }
   if (Array.isArray(ev.closed) && ev.closed.length) {
    return 'any day except ' + ev.closed.map(w => String(w).slice(0, 3)).join(' · ');
   }
   if (Array.isArray(ev.dates) && ev.dates.length) return 'on set dates';
   return 'any day';
  }

  // A <select> of the eligible days only: pick to pin/move, "Remove" to unpin.
  function daySelect(ev, currentISO) {
   const key = eventKey(ev);
   const elig = eligibleDays(ev);
   const sel = el('select', 'day-pin-control');
   sel.setAttribute('aria-label', (currentISO ? 'Move ' : 'Add ') + (ev.title || 'event') + ' to a day');
   const ph = el('option', null, currentISO ? 'Move to a different day…' : '＋ Add to a day…');
   ph.value = ''; ph.disabled = true; ph.selected = !currentISO;
   sel.appendChild(ph);
   elig.forEach(iso => {
    const o = el('option', null, dayLabel(iso));
    o.value = iso;
    if (iso === currentISO) o.selected = true;
    sel.appendChild(o);
   });
   // A day pinned before its pattern was tightened may no longer be eligible;
   // keep it selectable so the user can still see and move it.
   if (currentISO && elig.indexOf(currentISO) === -1 && dayByISO[currentISO]) {
    const o = el('option', null, dayLabel(currentISO));
    o.value = currentISO; o.selected = true;
    sel.appendChild(o);
   }
   if (currentISO) {
    const rm = el('option', null, 'Remove from day');
    rm.value = '__remove__';
    sel.appendChild(rm);
   }
   sel.addEventListener('change', () => {
    const v = sel.value;
    if (v === '__remove__') clearPin(key);
    else if (v) setPin(key, v);
   });
   return sel;
  }

  // The pin control shown on a live find in the section: a marker + mover once
  // pinned, a one-tap add for single-day finds, a picker otherwise.
  function pinControl(ev) {
   if (!tripDayList.length) return null;
   // Some finds are already in the itinerary proper (the feed keeps scouring
   // whether or not a thing has been planned, so the two overlap). Say so,
   // rather than offering to add what is already on the page.
   if (ev.planned) {
    const d = tripDayList.filter(x => x.id === ev.planned || x.iso === ev.planned)[0];
    if (d) {
     const w = el('div', 'day-pin');
     w.appendChild(el('span', 'day-pin-on', 'Already on ' + dayLabel(d.iso)));
     return w;
    }
   }
   const key = eventKey(ev);
   const currentISO = state.pins[key];
   const w = el('div', 'day-pin');
   if (currentISO) {
    w.appendChild(el('span', 'day-pin-on', 'On ' + dayLabel(currentISO)));
    w.appendChild(daySelect(ev, currentISO));
    return w;
   }
   const elig = eligibleDays(ev);
   if (!elig.length) return null; // not on during the trip — nothing to pin to
   if (elig.length === 1) {
    const b = el('button', 'day-pin-add', '＋ Add to ' + dayLabel(elig[0]));
    b.type = 'button';
    b.addEventListener('click', () => setPin(key, elig[0]));
    w.appendChild(b);
   } else {
    w.appendChild(daySelect(ev, ''));
    w.appendChild(el('span', 'day-pin-eligible', eligibleHint(ev)));
   }
   return w;
  }

  // The echo of a pinned find inside its day chapter — deliberately lighter
  // than an itinerary stop, with its own mover/remover.
  function suggestionRow(ev, dayISO) {
   const safeHref = safeUrl(ev.url);
   const link = safeHref ? ' <a class="event-link" href="' + safeHref + '" target="_blank" rel="noopener">↗</a>' : '';
   const kind = ev.kind ? '<span class="event-kind">' + esc(ev.kind) + '</span>' : '';
   const row = el('div', 'day-suggestion lg');
   row.innerHTML =
    '<div class="day-suggestion-when mono">' + esc(ev.when || 'All day') + '</div>' +
    '<div class="day-suggestion-body">' +
     '<div class="day-suggestion-head"><span class="day-suggestion-title">' + esc(ev.title) + link + '</span>' + kind + '</div>' +
     (ev.venue ? '<div class="event-venue">' + esc(ev.venue) + '</div>' : '') +
    '</div>';
   row.querySelector('.day-suggestion-body').appendChild(daySelect(ev, dayISO));
   return row;
  }

  // Rebuild the "Suggested" block inside each day chapter from the pins.
  function paintDayPins(hiddenSet) {
   tripDayList.forEach(d => {
    const ch = document.getElementById(d.id);
    if (!ch) return;
    const prev = ch.querySelector('.day-suggested');
    if (prev) prev.remove();
    const items = [];
    Object.keys(state.pins).forEach(k => {
     if (state.pins[k] !== d.iso) return;
     const ev = eventByKey[k];
     if (!ev || ev.archived || hiddenSet[k]) return; // ended or hidden → no echo
     items.push(ev);
    });
    if (!items.length) return;
    items.sort(bySort);
    const block = el('div', 'day-suggested');
    block.appendChild(el('div', 'day-suggested-label', 'Suggested · from What’s on'));
    items.forEach(ev => block.appendChild(suggestionRow(ev, d.iso)));
    ch.appendChild(block);
   });
  }

  // Repaints rebuild the disclosures, so remember whether they were open.
  function trackOpen(d, key) {
   const btn = d.grp.querySelector('.sh26-row-btn');
   btn.addEventListener('click', () => { state[key] = btn.classList.contains('open'); });
  }

  function paint() {
   const hiddenSet = {};
   state.hidden.forEach(k => { hiddenSet[k] = true; });
   const live = [], hidden = [], archived = [];
   all.forEach(ev => {
    if (ev.archived) archived.push(ev);
    else if (hiddenSet[eventKey(ev)]) hidden.push(ev);
    else live.push(ev);
   });
   live.sort(bySort); hidden.sort(bySort); archived.sort(bySort);

   const spans = live.filter(ev => slotOf(ev) === null);
   const dayMap = {};
   live.forEach(ev => {
    const s = slotOf(ev);
    if (s) (dayMap[s] = dayMap[s] || []).push(ev);
   });

   wrap.innerHTML = '';

   if (spans.length) {
    if (hasWindow) wrap.appendChild(el('div', 'event-group-label', 'Running throughout'));
    spans.forEach(ev => wrap.appendChild(eventRow(ev, { mode: 'live', grid: true, onHide: hide, control: pinControl(ev) })));
   }

   if (hasWindow) {
    wrap.appendChild(el('div', 'event-group-label', 'Day by day'));
    const cal = el('div', 'event-cal');
    // setDate (not +86400000) so a DST change can't skew the day boundaries
    for (let d = new Date(tripStart); d.getTime() <= tripEnd; d.setDate(d.getDate() + 1)) {
     const items = dayMap[evISO(d.getTime())] || [];
     const day = el('div', 'event-day lg' + (items.length ? '' : ' is-empty'));
     day.appendChild(el('div', 'event-day-date mono', EV_WD[d.getDay()] + ' ' + d.getDate() + ' ' + EV_MO[d.getMonth()]));
     const body = el('div', 'event-day-body');
     if (items.length) items.forEach(ev => body.appendChild(eventRow(ev, { mode: 'live', onHide: hide, control: pinControl(ev) })));
     else body.appendChild(el('div', 'event-day-none', 'Nothing dated yet'));
     day.appendChild(body);
     cal.appendChild(day);
    }
    wrap.appendChild(cal);
   } else if (!live.length) {
    wrap.appendChild(el('div', 'sandbox-empty', 'Nothing current — see earlier finds below.'));
   }

   if (hidden.length) {
    const d = makeDisclosureRow('Hidden <span class="sh26-count">' + hidden.length + '</span>', { open: state.hiddenOpen });
    trackOpen(d, 'hiddenOpen');
    d.grp.style.marginTop = '1.2rem';
    hidden.forEach(ev => d.body.appendChild(eventRow(ev, { mode: 'hidden', onRestore: restore })));
    wrap.appendChild(d.grp);
   }

   if (archived.length) {
    const d = makeDisclosureRow('Earlier finds <span class="sh26-count">' + archived.length + '</span>', { open: state.earlierOpen });
    trackOpen(d, 'earlierOpen');
    d.grp.style.marginTop = hidden.length ? '0.4rem' : '1.2rem';
    archived.forEach(ev => d.body.appendChild(eventRow(ev, { mode: 'archived' })));
    wrap.appendChild(d.grp);
   }

   if (data.updated) wrap.appendChild(el('div', 'event-updated', 'Refreshed ' + data.updated));

   paintDayPins(hiddenSet);
  }

  paint();
  section.style.display = '';

  // The feed is the page's one refreshing section, so give it a jump chip —
  // but only once it has actually loaded, since the section hides otherwise.
  const idx = document.getElementById('day-index');
  if (idx && !idx.classList.contains('now-mode') && !idx.querySelector('[data-jump="site-events"]')) {
   const chip = el('a', 'day-chip day-chip-jump');
   chip.href = '#site-events';
   chip.dataset.jump = 'site-events';
   chip.innerHTML = '<span class="dc-jump">What’s on</span>';
   chip.addEventListener('click', e => {
    e.preventDefault();
    scrollToEl(section, false);
   });
   idx.appendChild(chip);
  }
 } catch (e) { /* leave hidden */ }
}

function renderPocket() {
 const wrap = document.getElementById('site-pocket-wrap');
 if (!wrap || !TRIP.pocket) return;
 TRIP.pocket.forEach(g => {
 const d = makeDisclosureRow(`${g.group} <span class="sh26-count">${g.items.length}</span>`);
 g.items.forEach(([n, desc, u]) => {
 const link = u ? ` <a class="sh26-item-link" href="${u}" target="_blank" rel="noopener">↗</a>` : '';
 const onWeek = SCHEDULED_NAMES.some(t => namesMatch(n, t));
 const tag = onWeek ? ` <span class="pocket-tag">On the week</span>` : '';
 d.body.appendChild(el('div', 'sh26-item', `<div class="n">${n}${tag}${link}</div><div class="d">${desc}</div>`));
 });
 wrap.appendChild(d.grp);
 });
}

const SANDBOX_KEY = 'sandbox_' + TRIP_SLUG;

function loadSandbox() { return lsGet(SANDBOX_KEY, []); }
function saveSandbox(items) { lsSet(SANDBOX_KEY, items); }

// Sandbox notes used to live under a per-page key, before the shared engine
// namespaced them by slug. Anything still sitting under an old key is imported
// here so a rename can never strand someone's notes. Deliberately safe:
//  - the legacy entry is left in localStorage untouched, as a backup
//  - a one-time marker stops re-importing items you have since deleted
//  - merges by id, so running twice can't duplicate
const LEGACY_SANDBOX_KEYS = { 'shanghai-2026': ['sh26_sandbox', 'sha_sandbox'] };

function migrateLegacySandbox() {
 try {
  const slug = (TRIP.meta && TRIP.meta.slug) || '';
  const legacy = LEGACY_SANDBOX_KEYS[slug];
  if (!legacy) return 0;
  const marker = 'sandbox_migrated_' + slug;
  if (localStorage.getItem(marker)) return 0;
  const items = loadSandbox();
  const seen = {};
  items.forEach(function (it) { if (it && it.id) seen[it.id] = true; });
  let added = 0;
  legacy.forEach(function (key) {
   let old;
   try { old = JSON.parse(localStorage.getItem(key)); } catch (e) { return; }
   if (!Array.isArray(old)) return;
   old.forEach(function (it) {
    if (!it || typeof it !== 'object') return;
    if (!it.id) it.id = Date.now() + '' + Math.floor(Math.random() * 1000);
    if (seen[it.id]) return;
    seen[it.id] = true;
    items.push(it);
    added++;
   });
  });
  if (added) saveSandbox(items);
  localStorage.setItem(marker, String(Date.now()));
  return added;
 } catch (e) { return 0; }
}

var SandboxUI = { open: null, openEdit: null, close: null };

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
  return '<a class="sandbox-item-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>';
 }
 var t = (it.name || it.text || '').trim();
 return '<span class="sandbox-item-title">' + esc(t) + '</span>';
}

function renderSandbox() {
 var wrap = document.getElementById('site-sandbox-wrap');
 if (!wrap) return;                       // page opted out of the scratchpad
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
   + (note ? '<div class="sandbox-item-note">' + esc(note) + '</div>' : '')
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

 // The pages are mostly long-form prose, and a fixed button in the bottom
 // corner sits on top of a word or two of every screen on a narrow viewport.
 // Reading scrolls down, so hide it on the way down and bring it back the
 // moment the reader scrolls up (or stops), which is when they'd reach for it.
 var lastY = window.scrollY;
 var idle;
 window.addEventListener('scroll', function () {
  if (box.classList.contains('open')) return;
  var y = window.scrollY;
  if (y > lastY && y > 240) { fab.classList.add('fab-tucked'); }
  else if (y < lastY) { fab.classList.remove('fab-tucked'); }
  lastY = y;
  clearTimeout(idle);
  idle = setTimeout(function () { fab.classList.remove('fab-tucked'); }, 900);
 }, { passive: true });
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
  scrollToEl(document.getElementById(show.day.id), true);
 });
 wrap.appendChild(strip);
 return true;
}

function renderChips(wrap) {
 TRIP.days.forEach(function (day, i) {
  const chip = el('a', 'day-chip');
  chip.href = '#' + day.id;
  // Uppercasing is left to CSS (text-transform) so HTML entities in the date
  // string — china-april's "5 April &middot; v2" — aren't broken into &MIDDOT;.
  const shortDate = day.date.replace(/(\d+)\s+(\w{3})\w*/, '$1 $2');
  chip.innerHTML =
   '<span class="dc-dt">' + shortDate + '</span>' +
   '<span class="dc-wd">' + (day.dow || '').slice(0, 3) + '</span>' +
   '<span class="dc-hood">' + (day.hoodShort || '') + '</span>';
  chip.addEventListener('click', function (e) {
   e.preventDefault();
   scrollToEl(document.getElementById(day.id), true);
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
   scrollToEl(document.getElementById(pair[1]), false);
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
   // reveal any collapsed essay bodies when opening all,
   // and put them back to teasers when closing all
   const teaser = c.querySelector('.essay-teaser');
   const full = c.querySelector('[id^="essay-"]');
   if (teaser && full) {
    teaser.style.display = anyClosed ? 'none' : '';
    full.style.display = anyClosed ? 'block' : 'none';
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
 // A finished trip (or one still months out) can only ever get an error back,
 // so don't spend the request at all.
 const daysPastEnd = (now - new Date(TRIP.meta.tripEnd + 'T23:59:59')) / 86400000;
 if (daysUntilTrip > 16 || daysPastEnd > 0) return;

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
 const hiRaw = d.daily.temperature_2m_max[i];
 const loRaw = d.daily.temperature_2m_min[i];
 // Days past the ~16-day horizon come back null -- keep their seasonal average.
 if (hiRaw == null || loRaw == null) return;
 const icon = wmoIcon(d.daily.weather_code[i]);
 slot.innerHTML = `<span class="day-weather-icon">${icon}</span><span class="day-weather-temps"><span class="hi">${Math.round(hiRaw)}°</span> / ${Math.round(loRaw)}°</span>`;
 });
 } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
 renderMasthead();
 renderPlanePiece();
 renderChapters();
 renderBookings();
 renderDayIndex();
 initExpandAll();
 renderPocket();
 renderEvents();
 migrateLegacySandbox();
 renderSandbox();
 initSandboxCapture();
 fetchWeather();
});
// Only a page that ships a manifest ships a service worker (today, just
// shanghai/). Registering unconditionally made every other trip page request a
// sw.js that is not there; the rejection was swallowed, so the 404 never
// reached the console and showed up only in the network tab.
if ('serviceWorker' in navigator && document.querySelector('link[rel="manifest"]')) {
 window.addEventListener('load', function () {
  navigator.serviceWorker.register('sw.js').catch(function () {});
 });
}

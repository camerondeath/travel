// Gate — loaded by every page, including the hub, which does not use the engine.
//
// A doormat, not a lock. It stops someone who comes across the link from
// reading the trips; it does not stop anyone who opens the page source, since
// the content still ships with the page. That trade is deliberate: the booking
// references, PINs and phone numbers have been stripped out, so what sits
// behind this is an itinerary rather than anything usable. The repo being
// private is what actually keeps this off the open web.
//
// PASSPHRASE_HASH is SHA-256 of the passphrase, trimmed and lower-cased, so the
// word itself is not in the source. Set it with: python3 tools/passphrase.py "…"
(function () {
 var PASSPHRASE_HASH = '0209442e115ad7bc79fd281d91423a86b619e3c711fe574b7cc198d2e3c461c4';
 var KEY = 'trip_unlocked_v1';
 if (!PASSPHRASE_HASH) return;
 try { if (localStorage.getItem(KEY) === PASSPHRASE_HASH) return; } catch (e) {}

 function sha256Hex(str) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
   return Array.prototype.map.call(new Uint8Array(buf), function (b) {
    return b.toString(16).padStart(2, '0');
   }).join('');
  });
 }

 function mount() {
  var shell = document.querySelector('.content');
  if (shell) shell.style.display = 'none';
  var fab = document.getElementById('fab');
  if (fab) fab.style.display = 'none';

  var g = document.createElement('div');
  g.className = 'gate';
  g.innerHTML =
   '<form class="gate-card">'
   + '<div class="gate-mark">Trip notes</div>'
   + '<label class="gate-label" for="gate-input">Passphrase</label>'
   + '<input id="gate-input" class="gate-input" type="password" name="password"'
   + ' autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" required>'
   + '<button class="gate-btn" type="submit">Enter</button>'
   + '<div class="gate-msg" role="status" aria-live="polite"></div>'
   + '</form>';
  document.body.appendChild(g);
  var input = g.querySelector('#gate-input');
  var msg = g.querySelector('.gate-msg');
  input.focus();

  g.querySelector('form').addEventListener('submit', function (e) {
   e.preventDefault();
   sha256Hex(input.value.trim().toLowerCase()).then(function (h) {
    if (h !== PASSPHRASE_HASH) {
     msg.textContent = 'Not that one.';
     input.value = '';
     input.focus();
     return;
    }
    try { localStorage.setItem(KEY, h); } catch (e2) {}
    location.reload();   // simplest correct thing: let the page boot normally
   });
  });
 }

 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
 else mount();
})();

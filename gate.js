// Gate — loaded by every page, including the hub, which does not use the engine.
//
// A doormat, not a lock, and weaker than it looks. It stops someone who comes
// across the link from reading the trips. It stops nobody else:
//
//   - The content ships inside the page, so View Source reads it unlocked.
//   - PASSPHRASE_HASH below is the literal value compared against localStorage,
//     so setting that key to this string walks straight in. No guessing needed.
//   - The hash is unsalted SHA-256 of a single passphrase, published here, so a
//     wordlist recovers a common phrase quickly.
//
// It also does not stop the repository. **camerondeath/travel is a PUBLIC repo**
// (confirmed 2026-09-06) and github.io serves it publicly, so every page and
// every past revision is readable by anyone, gate or no gate.
//
// As of 2026-09-06 the booking *codes* are out of the working tree: every
// `ref` on every trip page is now a pointer to where the booking lives ("In
// the GetYourGuide app", "Collection code in email") rather than the code
// itself. Two Shanghai entries still carried real codes until that date — a
// Lost Plate order number and a GetYourGuide booking reference — and they
// remain in this repo's git history, which is public and cannot be cleaned
// without a force push. Treat them as disclosed.
//
// Still published by design, because an itinerary cannot really avoid it:
// flight numbers, the hotel and its dates, and therefore the dates the house
// is empty. That may be an acceptable trade — but it is a decision to make
// deliberately, not one this file quietly guarantees. Making the repo private
// (Pages then needs a paid plan) is the only fix for that; this gate is not.
//
// **When adding a booking, put a pointer in `ref`, never the code.**
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

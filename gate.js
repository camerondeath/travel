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
// and github.io serves it publicly, so every page and every past revision is
// readable by anyone, gate or no gate. An earlier version of this comment
// claimed the repo was private and that booking references, PINs and phone
// numbers had been stripped; neither is true today. What is actually published
// includes hotel and tour booking references, hotel phone numbers, flight and
// seat numbers, and the dates the house is empty.
//
// That may be an acceptable trade for a personal itinerary — but it is a
// decision to make deliberately, not one this file quietly guarantees. Making
// the repo private (Pages then needs a paid plan) or removing the reference
// strings are the two real fixes; this gate is neither.
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

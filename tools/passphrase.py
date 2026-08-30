#!/usr/bin/env python3
"""Set the site passphrase.

    python3 tools/passphrase.py "my phrase"      # set it
    python3 tools/passphrase.py --off            # remove the gate

Writes the SHA-256 into gate.js, so the phrase itself is never committed. Everyone already unlocked keeps working only if the phrase is
unchanged; changing it locks everyone out again, which is the point.
"""
import hashlib, pathlib, re, sys

if len(sys.argv) != 2:
    sys.exit(__doc__)
root = pathlib.Path(__file__).resolve().parent.parent
js = root / "gate.js"
arg = sys.argv[1]
h = "" if arg == "--off" else hashlib.sha256(arg.strip().lower().encode()).hexdigest()
src = js.read_text(encoding="utf-8")
new, n = re.subn(r"var PASSPHRASE_HASH = '[^']*';", f"var PASSPHRASE_HASH = '{h}';", src, count=1)
if not n:
    sys.exit("PASSPHRASE_HASH line not found in gate.js")
js.write_text(new, encoding="utf-8")
print("gate disabled" if not h else f"passphrase set ({h[:12]}…)")
print("remember to bump CACHE_VERSION in shanghai/sw.js")

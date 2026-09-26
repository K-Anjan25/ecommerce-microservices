#!/usr/bin/env python3
"""Verify every catalog image URL in manifest.json is still alive (link-rot guard).

The catalog hotlinks official brand-CDN studio photography — nothing is stored
locally. Brand CDN URLs occasionally rotate, so run this on demand:

    python3 tools/catalog-media/check_images.py           # report
    python3 tools/catalog-media/check_images.py --write   # also stamp alive:true/false into the manifest

Exits 1 when any URL is dead (so it can gate a CI job). Stdlib only.
"""
import json
import sys
import urllib.request
import urllib.error

MANIFEST = "tools/catalog-media/manifest.json"
TIMEOUT = 15
UA = {"User-Agent": "Mozilla/5.0 (Cartly link check)"}


def alive(url: str) -> int:
    """Return HTTP status (0 = network failure). HEAD first, GET fallback."""
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, headers=UA, method=method)
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return resp.status
        except urllib.error.HTTPError as e:
            if e.code in (403, 405) and method == "HEAD":
                continue  # some CDNs reject HEAD; retry with GET
            return e.code
        except Exception:
            return 0
    return 0


def main() -> int:
    write = "--write" in sys.argv
    manifest = json.load(open(MANIFEST))
    dead = []
    checked = 0
    for slug, entry in sorted(manifest.get("products", {}).items()):
        for i, img in enumerate(entry.get("images", [])):
            for kind in ("thumb", "full"):
                url = img.get(kind)
                if not url or not str(url).startswith("http"):
                    continue
                checked += 1
                status = alive(url)
                img[f"{kind}_status"] = status
                img[f"{kind}_alive"] = status == 200
                mark = "ok " if status == 200 else "DEAD"
                print(f"[{mark}] {status:3d}  {slug} #{i} {kind}  {url[:110]}")
                if status != 200:
                    dead.append((slug, i, kind, url))
    if write:
        json.dump(manifest, open(MANIFEST, "w"), indent=2)
        print(f"\nwrote alive-flags back to {MANIFEST}")
    print(f"\nchecked {checked} URLs — {len(dead)} dead")
    for slug, i, kind, url in dead:
        print(f"  DEAD: {slug} image[{i}].{kind} = {url}")
    return 1 if dead else 0


if __name__ == "__main__":
    sys.exit(main())

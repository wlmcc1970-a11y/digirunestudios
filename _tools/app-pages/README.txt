DigiRune app info pages (digirunestudios.com/<slug>/), built 2026-10-05.
Folder starts with "_" so GitHub Pages (Jekyll) does not publish it.
Rebuild: python3 _tools/app-pages/build.py .   (from the repo root)
Content: data.py (every fact from the LIVE App Store listing; no em dashes in DigiRune copy).
Look: page.css + base tokens/nav/footer lifted from portfolio/index.html at build time.
Screenshots: assets/apps/<slug>-shot-N.webp pulled from the live Google Play listing (in store order).
guardtest.js = the store-only guard test (real hostnames served from local repo copies; 23/23 pass).
To add a future app: add an entry to data.py, drop assets/apps/<slug>-*.webp, run build, add Learn More on / and /portfolio/.

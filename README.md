# Margin Calc

A simple, installable margin calculator for your phone. No app store, no build step — it's a Progressive Web App (PWA) that runs from a single `index.html`.

## What it does

Three modes, switchable by tab:

- **Margin** — enter cost and selling price, get profit, margin %, and markup %.
- **Find Price** — enter cost and a target margin %, get the price to charge.
- **Find Cost** — enter selling price and a target margin %, get the most you can pay for it.

Margin and markup are calculated correctly and separately (margin = profit ÷ price, markup = profit ÷ cost), since they're commonly confused.

## Get it on your phone

### Option A: GitHub Pages (recommended — gives you a real installable app)

1. On GitHub, go to this repo's **Settings → Pages**.
2. Under "Build and deployment", set **Source** to "Deploy from a branch", pick this branch (or `main` after merging), and folder `/ (root)`.
3. Save. GitHub will give you a URL like `https://<username>.github.io/ltcalc/`.
4. Open that URL on your phone in Safari (iOS) or Chrome (Android).
5. **iOS Safari:** tap the Share icon → "Add to Home Screen".
   **Android Chrome:** tap the ⋮ menu → "Add to Home screen" / "Install app".
6. It now appears as a full-screen app icon on your home screen and works offline.

### Option B: Open locally

Open `index.html` directly in a mobile browser (e.g. host it with any static server, or transfer the folder to your phone and open it). The "Add to Home Screen" step above works the same way.

## Files

- `index.html` — layout and styles
- `app.js` — calculator logic
- `manifest.json` — PWA metadata (name, icon, colors)
- `sw.js` — service worker for offline caching
- `icons/` — app icons

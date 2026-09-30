# Pantone Explorer

A bilingual (English/Arabic) Pantone color reference and ink-mixing tool built for **Uni Color for Printing & Packaging**. It's a single self-contained HTML file — installable as a PWA, synced across devices via Firebase, and gated behind role-based logins for admin, manager, and printer-floor use.

## What it does

- **Color reference library** — ~5,500 Solid Coated Pantone reference codes plus a "Custom / Unlisted" collection for products that don't have an official Pantone match.
- **Your own mixes** — for any color, save one or more mix "cards" (product code, product name, company/client, ingredient list with amounts, notes). The same Pantone color can carry several different mixes for different products/clients.
- **Bilingual, full RTL support** — toggle between English and Arabic; the whole UI (including layout direction) switches with it.
- **Cross-device sync** — mixes, custom colors, and the curated name lists sync in real time through Firebase Firestore, so the same data shows up on every computer/phone that opens the app.
- **Installable PWA** — add-to-home-screen / installable app with offline app-shell caching via a service worker.
- **Role-based accounts:**
  | Role | Add/edit/delete mixes | Create new colors | Import bulk mixes | Delete a custom color | Manage curated lists |
  |---|---|---|---|---|---|
  | **Admin** | ✅ | ✅ (free text) | ✅ | ✅ | ✅ |
  | **Manager** | ✅ | ✅ (must pick from admin-curated color list) | ❌ | ❌ | ❌ |
  | **Printer (read-only)** | ❌ (view only) | ❌ | ❌ | ❌ | ❌ |
- **Admin-curated pick lists** — to stop typos and inconsistent naming from the shop floor, the manager role can't type free text for either:
  - a **new color name** (must pick from the admin's curated color list), or
  - the **base ink / component name** inside a mix's ingredient rows (must pick from the admin's curated ink/component list).

  The admin manages both lists from the "Color List" and "Ink List" buttons and can still type freely.
- **Hex/RGB/CMYK and the computed "reference mixing guide" are intentionally hidden** from the color detail view for every role. Those numbers were only ever a rough approximation computed from the hex value — not Pantone's official ink formulas — and didn't match a physical Pantone Formula Guide closely enough to be trusted on the shop floor. The underlying data is still in the code (unused), so it can be brought back with a one-line change if it's ever needed again.

## Tech stack

- Single HTML file (`index.html`) — no build step, no framework. Plain JS, inline CSS.
- **Firebase** (Auth + Firestore) for login and cross-device sync — project `printingink`.
  - Auth: email/password, with a "username" login UI that maps to `<username>@printingink-login.app` internally.
  - Firestore: one document (`pantoneMixes/printingink-mixes`) holding mixes, custom colors, and both curated lists; a realtime listener keeps every open tab in sync, and local data is merged by a per-record `updated` timestamp so nothing gets clobbered by a stale write.
- **Service worker** (`sw.js`) — network-first for the page, cache-first for static assets, so the app still opens offline after the first load. Bump `CACHE_NAME` in `sw.js` any time `index.html` changes, or installed copies won't see the update.
- LocalStorage as the local persistence layer, with Firestore as the sync source of truth.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire app — UI, logic, embedded color data, Firebase config |
| `sw.js` | Service worker for offline caching / PWA installability |
| `manifest.json` | PWA manifest (name, icons, start URL, theme) |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon.png` | App icons |

## Deploying

This is built to run as a static site (e.g. GitHub Pages):

1. Push all the files above to the root of the repo (or the folder your Pages source points at).
2. Make sure `index.html` is served at the site root so `sw.js` and the manifest resolve correctly.
3. Every time `index.html` is updated, bump `CACHE_NAME` in `sw.js` (e.g. `pantone-explorer-v13`) — otherwise browsers that already installed the PWA will keep serving the old cached version.

## Accounts

Team members sign in with a username/password created in the Firebase Auth console (as `<username>@printingink-login.app`). Which of the three roles (admin / manager / printer) an account gets is determined by matching the signed-in username against the hardcoded `admin`/`manager` usernames in `index.html` — anyone else who signs in falls back to read-only.

Firestore security rules enforce the **admin/manager vs. read-only** write boundary server-side. The finer **admin vs. manager** restrictions (import, delete color, manage curated lists) are UI-only — worth knowing if that boundary ever needs to be hardened further.

## Data & accuracy notes

- The reference color library is drawn from widely circulated, community-published PMS-to-hex conversion tables — not Pantone Inc.'s own certified digital standard. Pantone's full commercial system (TCX, metallics, pastels & neons, skin tones, specialty finishes) is proprietary and isn't available as an open dataset at any size, which is why this covers Solid Coated only.
- CMYK/RGB values computed from hex are not reliable substitutes for a physical Pantone Formula Guide and are hidden from the UI for that reason (see above).

# WEHOST – Airbnb Accounts Manager

A Chrome (Manifest V3) extension that lets WeHost property managers view their roster of
Airbnb host accounts and **auto-login to any of them in a clean, isolated incognito
session** — one click, no manual typing, no leftover sessions bleeding between accounts.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![React 18](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-6-646cff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)
![Vercel](https://img.shields.io/badge/Backend-Vercel%20Functions-black)

> **Note:** This repository is public for portfolio purposes. The code is proprietary —
> see [LICENSE](LICENSE).

<p align="center">
  <img src="docs/screenshot.png" alt="WEHOST – Airbnb Accounts Manager popup" width="400" />
</p>

## Features

- **One-click auto-login** — pick an account and the extension opens a fresh incognito
  window and drives the Airbnb login form end-to-end.
- **Clean session isolation** — before each login it wipes all Airbnb cookies and tears
  down the incognito profile, so no remembered email or session survives between accounts.
- **Search & city filter** — quickly find an account by email or property name, filter by city.
- **Favorites & drag-to-reorder** — pin the accounts you use most and arrange them in your
  own order; favorites stay grouped at the top. Order persists locally.
- **Copy email / password** to clipboard with one tap.
- **On-demand sync** — account data is pulled from the team's Monday.com board only when
  you press Sync; nothing runs in the background.

## Architecture

```mermaid
flowchart LR
    subgraph Browser["Chrome Extension (MV3)"]
        P["Popup\nReact + Vite + Tailwind"]
        SW["Service Worker\nauto-login + session isolation"]
    end
    P -- "GET /api/accounts\n(x-api-key)" --> V["Vercel Serverless Proxy"]
    V -- "GraphQL" --> M["Monday.com Board"]
    P -- "OPEN_LOGIN msg" --> SW
    SW -- "incognito window +\nchrome.scripting" --> A["airbnb.com/login"]
```

- **Popup** renders the account list and talks only to the Vercel proxy (the Monday.com
  token never touches the client).
- **Vercel function** ([`api/accounts.js`](api/accounts.js)) authenticates the request,
  queries the Monday.com board, and returns a de-duplicated, grouped account list.
- **Service worker** ([`src/background/service_worker.js`](src/background/service_worker.js))
  handles the login automation and incognito session lifecycle.

## Engineering highlights

A few parts that were more interesting than they look:

- **Two-pass Vite build for MV3.** MV3 service workers must be a single self-contained
  IIFE, but the popup is a normal ESM React app. The build runs Vite twice — once for the
  popup, once (`BUILD_TARGET=sw`) for the worker as an IIFE library. See
  [`vite.config.js`](vite.config.js).
- **Resilient auto-login.** Airbnb ships multiple login UIs (old vs. 2024+), and some
  accounts hit a "Confirm it's you" challenge instead of a password field. The injected
  script detects the variant, waits on selectors/text, and routes through the challenge
  ("Try another way" → password) when needed.
- **True session isolation.** Rather than navigating to `/logout` (which fails silently
  when CSRF tokens are missing), the worker deletes Airbnb cookies directly from the
  incognito cookie store and destroys the profile by closing its last window.
- **Grouped drag-to-reorder.** Custom ordering is stored as a flat email list in
  `chrome.storage.local`; sort keeps favorites grouped while honoring the user's order
  within each group, and new accounts append to the end after a sync.

## Tech stack

| Layer | Tech |
|---|---|
| UI | React 18, Vite 6, Tailwind CSS 3 |
| Extension | Chrome Manifest V3 (popup + service worker) |
| Backend | Vercel Serverless Functions |
| Data source | Monday.com GraphQL API |

## Project structure

```
├── api/accounts.js                 # Vercel serverless proxy → Monday.com
├── public/
│   ├── manifest.json               # MV3 manifest
│   └── icons/                      # Generated extension icons
├── popup.html                      # Popup entry
├── src/
│   ├── App.jsx                     # Popup shell, filtering, drag-reorder
│   ├── components/                 # AccountCard, SearchBar, FilterBar, SyncBar
│   ├── hooks/useAccounts.js        # Storage + sync + favorites/order state
│   └── background/service_worker.js # Auto-login + session isolation
├── scripts/create-icons.js         # Generates PNG icons from an embedded SVG
├── vite.config.js                  # Two-pass build (popup ESM + worker IIFE)
└── vercel.json
```

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values
```

Environment variables:

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `.env` (build-time) | Base URL of the Vercel proxy |
| `VITE_EXTENSION_API_KEY` | `.env` (build-time) | Key the extension sends to the proxy |
| `EXTENSION_API_KEY` | Vercel dashboard | Key the proxy validates against |
| `MONDAY_API_TOKEN` | Vercel dashboard | Monday.com API token (server-side only) |
| `MONDAY_BOARD_ID` | Vercel dashboard | Monday.com board to read from |

## Development & build

```bash
npm run dev      # Vite dev server (popup only)
npm run build    # Two-pass production build → dist/
```

### Load the extension

1. `npm run build`
2. Open `chrome://extensions`, enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder

## Security

This is an internal tool, and its security model reflects that:

- The Monday.com token and board ID live **only** in Vercel environment variables and are
  never shipped to the client.
- The proxy validates a shared API key (constant-time comparison), restricts CORS to the
  extension origin, sends `Cache-Control: no-store`, and applies best-effort rate limiting.
- **Known tradeoff:** because the extension is a distributed client, its API key is present
  in the shipped bundle and is therefore not a true secret. For this low-sensitivity
  internal use that is an accepted limitation; a hardened version would replace the shared
  key with per-user authentication (e.g. Google sign-in) and move rate limiting to a
  persistent store (Vercel KV / Upstash).

## License

Proprietary — All Rights Reserved. See [LICENSE](LICENSE).

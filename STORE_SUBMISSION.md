# Chrome Web Store — Submission Reference

Copy/paste answers for the Developer Dashboard. Keep this file updated when permissions
or behavior change.

---

## Listing basics

- **Name:** WEHOST – Airbnb Accounts Manager
- **Category:** Workflow & Planning
- **Visibility:** Private (only allowlisted Google accounts can install)
- **Privacy policy URL:** https://github.com/nikoGogiberidze/wehost-airbnb-extension/blob/master/PRIVACY.md
- **Support email:** gogiberidze.19@gmail.com

### Short description (max 132 chars)
> View and auto-login to multiple Airbnb host accounts in an isolated incognito session. Built for WeHost property managers.

### Detailed description (store listing body, ~1.8k chars — well under the 16k limit)

> WEHOST – Airbnb Accounts Manager is a productivity tool for WeHost property managers
> who work across many Airbnb host accounts every day. Instead of hunting for credentials
> in a spreadsheet, copy-pasting them, and manually clearing sessions between logins, you
> get your entire roster of accounts in one place and sign in to any of them with a single
> click.
>
> WHAT IT DOES
> • One-click auto-login — pick an account and the extension opens a fresh incognito window
>   and signs you into Airbnb automatically.
> • Clean session isolation — before every login it clears Airbnb cookies and tears down the
>   previous incognito session, so accounts never bleed into one another and you never end up
>   logged into the wrong one.
> • Search & filter — instantly find an account by email or property name, or filter by city.
> • Favorites & custom order — pin the accounts you use most and drag them into the order you
>   want; your layout is saved.
> • Copy email or password to the clipboard in one tap.
> • On-demand sync — your account list is fetched only when you press Sync. Nothing runs in
>   the background.
>
> WHY INSTALL IT
> Managing dozens of Airbnb accounts by hand is slow and error-prone — wrong logins, lingering
> sessions, and constant credential lookups. This extension removes that friction: every
> account is one click away, and each login starts from a clean, isolated session.
>
> PRIVACY
> Account data is stored locally in your browser and is used only to display your accounts and
> fill the Airbnb login form. It is never sent anywhere except Airbnb (to sign you in) and your
> team's secure backend (to fetch the list). No analytics, no tracking, no third-party sharing.
>
> This is an internal tool intended for authorized WeHost staff.

### Single purpose (required field)
> WEHOST – Airbnb Accounts Manager lets authorized WeHost property managers view their
> Airbnb host accounts and securely auto-login to any one of them in an isolated incognito
> browser session.

### Test instructions (required — the extension is gated behind a login)

The extension requires sign-in. Provide the **test** login, which returns only synthetic
demo data (no real credentials are ever shown to the reviewer):

- **Username:** `reviewer@wehost.com`
- **Password:** `wehost-review-2026`
- **Additional instructions:**
  > Sign in with the credentials above, then press "Sync" to load the account list (this is
  > demo data — this test login never sees real accounts). Try search, the city filters, the
  > favorite star, drag-to-reorder, and the Copy Email / Copy Pass buttons. Clicking "Login"
  > on a demo account opens a fresh incognito window — for review you can stop there.

---

## Permission justifications

The dashboard requires a justification for each permission. Paste these:

- **storage** — Caches the synced account list and the user's favorites and custom
  ordering locally so the popup loads instantly and preferences persist.

- **scripting** — Injects the auto-login script into the Airbnb login page to fill the
  selected account's email and password on the user's behalf.

- **tabs** — Monitors the Airbnb login tab's load state (`onUpdated`) so the auto-login
  script is injected only after the page has finished loading, and reloads the tab if it
  lands on a transient error page.

- **cookies** — Deletes Airbnb session cookies from the incognito cookie store before
  logging into a different account, guaranteeing clean session isolation between accounts.

- **clipboardWrite** — Copies an account's email or password to the clipboard when the
  user clicks the Copy Email / Copy Pass buttons.

- **Host permission `https://www.airbnb.com/*`** — Required to run the auto-login content
  script on the Airbnb login page. The extension does not access any other website.

- **Remote code — answer: NO.** The extension executes only code bundled in the package.
  It loads Google Fonts (stylesheet + font files) and fetches account data from the Vercel
  proxy, but fonts/CSS/JSON data are resources, not executable remote code. Select
  "No, I am not using remote code." (If the reviewer flags the Google Fonts CDN link anyway,
  self-host the fonts to remove the external request — see note in chat.)

---

## Data use disclosures (Privacy practices tab)

Answer the checkboxes as follows:

**What user data do you collect?**
- ☑ Authentication information (Airbnb passwords)
- ☑ Personally identifiable information (Airbnb account email addresses)
- ☐ Everything else: No

**Certifications (check all three):**
- ☑ I do not sell or transfer user data to third parties, outside of approved use cases.
- ☑ I do not use or transfer user data for purposes unrelated to the item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Where the data goes (use in the "data handling" notes):**
- Stored locally in the browser (`chrome.storage.local`); never transmitted to the developer.
- Sent only to (1) WeHost's private Vercel proxy to authenticate the user and fetch the
  account list from Monday.com (account data is released only after a valid per-user login),
  and (2) airbnb.com to perform login. No analytics or third-party sharing.

---

## Pre-upload checklist

- [ ] `AUTH_USERS`, `AUTH_PEPPER`, `AUTH_JWT_SECRET` set in Vercel and deployed
- [ ] `npm run build` produces a clean `dist/`
- [ ] `dist/manifest.json` shows the correct `name`, `version`, and `default_width: 480`
- [ ] Version bumped from the previously uploaded version (every re-upload needs a higher `version`)
- [ ] Zip the **contents** of `dist/` (not the folder itself) for upload
- [ ] Privacy policy URL is live and reachable
- [ ] At least one 1280×800 or 640×400 screenshot prepared for the listing
- [ ] Test login (`reviewer@wehost.com`) entered in the Test Instructions field

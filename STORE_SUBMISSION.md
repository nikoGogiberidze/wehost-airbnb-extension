# Chrome Web Store — Submission Reference

Copy/paste answers for the Developer Dashboard. Keep this file updated when permissions
or behavior change.

---

## Listing basics

- **Name:** WEHOST – Airbnb Accounts Manager
- **Category:** Productivity
- **Visibility:** Unlisted (private team tool — only people with the link can install)
- **Privacy policy URL:** https://github.com/nikoGogiberidze/wehost-airbnb-extension/blob/master/PRIVACY.md
- **Support email:** gogiberidze.19@gmail.com

### Short description (max 132 chars)
> View and auto-login to multiple Airbnb host accounts in an isolated incognito session. Built for WeHost property managers.

### Single purpose (required field)
> WEHOST – Airbnb Accounts Manager lets authorized WeHost property managers view their
> Airbnb host accounts and securely auto-login to any one of them in an isolated incognito
> browser session.

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
- Sent only to (1) WeHost's private Vercel proxy to fetch the account list from Monday.com,
  and (2) airbnb.com to perform login. No analytics or third-party sharing.

---

## Pre-upload checklist

- [ ] `npm run build` produces a clean `dist/`
- [ ] `dist/manifest.json` shows the correct `name`, `version`, and `default_width: 480`
- [ ] Version bumped from the previously uploaded version (every re-upload needs a higher `version`)
- [ ] Zip the **contents** of `dist/` (not the folder itself) for upload
- [ ] Privacy policy URL is live and reachable
- [ ] At least one 1280×800 or 640×400 screenshot prepared for the listing

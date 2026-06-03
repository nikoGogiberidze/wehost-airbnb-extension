# Privacy Policy — WEHOST – Airbnb Accounts Manager

_Last updated: June 3, 2026_

WEHOST – Airbnb Accounts Manager ("the Extension") is a productivity tool that lets
authorized WeHost property managers view a list of Airbnb host accounts and auto-login
to any of them in an isolated incognito browser session. This policy explains exactly
what data the Extension handles, where it goes, and what it does **not** do.

## What data the Extension handles

- **Your sign-in credentials** (the email and password issued to you by WeHost to access the
  Extension). These are sent to WeHost's backend only to authenticate you; on success a
  signed, time-limited session token is stored locally and used for subsequent requests.
- **Airbnb account credentials** (email addresses and passwords). These are fetched from
  WeHost's internal Monday.com board through a private backend proxy **only after you sign
  in**, and are used solely to display the account list and to fill the Airbnb login form on
  your behalf.
- **Local preferences** — which accounts you have marked as favorites and your custom
  account ordering.

## Where the data is stored

- The session token, account data, and preferences are stored **locally in your browser**
  using Chrome's `chrome.storage.local`. They are not transmitted to the developer or to any
  third party. Signing out clears the token and the cached account data.
- Account data is only refreshed when you explicitly press the **Sync** button. There is
  no automatic background collection.

## Where the data is sent

The Extension transmits data to only two destinations, and only for the purposes described:

1. **WeHost's backend proxy** (hosted on Vercel) — to sign you in and to retrieve the
   account list from the company's Monday.com board. Requests require both an API key and a
   valid per-user session token.
2. **airbnb.com** — credentials are entered into Airbnb's official login form so you can
   sign in, exactly as if you typed them yourself.

The Extension does **not** send your data anywhere else.

## What the Extension does NOT do

- It does **not** use analytics, tracking, or advertising.
- It does **not** sell or share your data with third parties.
- It does **not** collect browsing history or activity on sites other than the Airbnb
  login page.
- It does **not** transmit your stored data to the developer.

## Permissions and why they are needed

| Permission | Why it is used |
|---|---|
| `storage` | Cache the account list and your favorites/ordering preferences locally. |
| `scripting` | Inject the auto-login script into the Airbnb login page to fill credentials. |
| `tabs` | Detect when the Airbnb login tab has finished loading so login runs at the right time. |
| `cookies` | Clear Airbnb session cookies in the incognito window before switching accounts, so sessions stay cleanly isolated. |
| `clipboardWrite` | Copy an account's email or password to your clipboard via the Copy buttons. |
| Host access to `airbnb.com` | Required to run the auto-login script on the Airbnb login page. |

## Data retention and deletion

Because data lives only in your browser's local storage, you can remove it at any time by
removing/uninstalling the Extension, or by clearing the extension's storage from
`chrome://extensions`.

## Security note

Account data is released only to authenticated, allowlisted users: the backend requires a
valid per-user login before returning any account data. Cached account data is held in
Chrome's extension storage, which is sandboxed to your browser profile, and is cleared when
you sign out. The Extension is intended for use on trusted, personal work devices by
authorized WeHost staff only.

## Contact

For any questions about this policy or the Extension, contact: **gogiberidze.19@gmail.com**

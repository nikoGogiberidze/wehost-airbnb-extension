// Wehost Airbnb Manager - Service Worker (MV3)

function autoLogin(email, password) {
  // --- Helpers ---
  function waitForSelector(selector, timeout = 25000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(tick);
          resolve(el);
        } else if (Date.now() - start > timeout) {
          clearInterval(tick);
          reject(new Error(`Timeout waiting for selector: ${selector}`));
        }
      }, 100);
    });
  }

  // Matches any element whose innerText CONTAINS `text` (case-insensitive)
  function waitForTextMatch(selector, text, timeout = 25000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const lower = text.toLowerCase();
      const tick = setInterval(() => {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (el.innerText && el.innerText.toLowerCase().includes(lower)) {
            clearInterval(tick);
            resolve(el.closest('button') || el);
            return;
          }
        }
        if (Date.now() - start > timeout) {
          clearInterval(tick);
          reject(new Error(`Timeout waiting for text: ${text}`));
        }
      }, 100);
    });
  }

  // Matches an element whose innerText is EXACTLY `text` (case-insensitive, trimmed).
  // Used to distinguish a bare "Continue" button from "Continue with email/Google/etc."
  function waitForExactText(selector, text, timeout = 7000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const pattern = new RegExp(`^${text}$`, 'i');
      const tick = setInterval(() => {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (pattern.test((el.innerText || '').trim())) {
            clearInterval(tick);
            resolve(el.closest('button') || el);
            return;
          }
        }
        if (Date.now() - start > timeout) {
          clearInterval(tick);
          reject(new Error(`Timeout waiting for exact text: ${text}`));
        }
      }, 100);
    });
  }

  function setReactValue(el, text) {
    el.focus();
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function waitForEnabled(el, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = setInterval(() => {
        if (!el.disabled && el.getAttribute('aria-disabled') !== 'true') {
          clearInterval(tick);
          resolve(el);
        } else if (Date.now() - start > timeout) {
          clearInterval(tick);
          reject(new Error('Timeout waiting for element to be enabled'));
        }
      }, 100);
    });
  }

  // Polls until either a password <input> appears (normal flow) OR the
  // "Confirm it's you" challenge screen appears (some accounts skip straight
  // to an email/SMS code instead of the password field).
  function waitForPasswordOrChallenge(timeout = 20000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = setInterval(() => {
        // Normal: password input visible
        const passEl = document.querySelector(
          'input[name="user[password]"], input[type="password"]'
        );
        if (passEl) {
          clearInterval(tick);
          resolve({ type: 'password', el: passEl });
          return;
        }
        // Challenge: "Try another way" button visible (Confirm it's you screen)
        const btns = document.querySelectorAll("button, div[role='button']");
        for (const btn of btns) {
          if ((btn.innerText || '').toLowerCase().includes('try another way')) {
            clearInterval(tick);
            resolve({ type: 'challenge', el: btn });
            return;
          }
        }
        if (Date.now() - start > timeout) {
          clearInterval(tick);
          reject(new Error('Timeout waiting for password step or challenge screen'));
        }
      }, 100);
    });
  }

  // --- Main login flow ---
  (async () => {
    try {
      await new Promise((r) => setTimeout(r, 800));

      // ---- Step 1: detect UI variant and reach the email input ----
      //
      // NEW UI (2024+): a single "Phone number or email" input is already visible
      //   on the page — no button click needed.
      //
      // OLD UI: the email input is hidden behind a "Continue with email" button.
      //   Clicking that button reveals the input. Some accounts also show a bare
      //   "Continue" button (remembered-email state) as a fallback.
      //
      // We detect by checking for any recognisable email/phone input up-front.
      // Selectors ranked by reliability:
      // New UI: id="phone-or-email" | inputmode="email" (type is "text", no name attr)
      // Old UI: name="user[email]"  | type="email"
      const EMAIL_INPUT_SEL =
        'input#phone-or-email, input[inputmode="email"], input[name="user[email]"], input[type="email"]';

      const immediateInput = document.querySelector(EMAIL_INPUT_SEL);

      if (!immediateInput) {
        // Old UI — the input is hidden behind a "Continue with email" button
        try {
          const btn = await waitForTextMatch(
            "button, div[role='button']",
            'Continue with email',
            7000
          );
          btn.click();
        } catch {
          // Fallback: bare "Continue" button (remembered-email state on old UI)
          const btn = await waitForExactText("button, div[role='button']", 'Continue', 7000);
          btn.click();
        }
      }

      const emailInput = await waitForSelector(EMAIL_INPUT_SEL, 10000);
      setReactValue(emailInput, email);

      // ---- Step 2: submit ----
      const submit1 = await waitForSelector('button[type="submit"]', 5000);
      await waitForEnabled(submit1);
      submit1.click();

      // ---- Step 3: handle what appears next ----
      // Normal flow  → password input appears
      // Some accounts → "Confirm it's you" challenge screen appears instead;
      //                 we click "Try another way" then the password option
      const step = await waitForPasswordOrChallenge(20000);

      let passEl;
      if (step.type === 'challenge') {
        step.el.click();
        await new Promise((r) => setTimeout(r, 800));

        const passwordOption = await waitForTextMatch(
          "button, div[role='button']",
          'password',
          10000
        );
        passwordOption.click();
        await new Promise((r) => setTimeout(r, 500));

        passEl = await waitForSelector(
          'input[name="user[password]"], input[type="password"]',
          15000
        );
      } else {
        passEl = step.el;
      }

      await new Promise((r) => setTimeout(r, 300));
      setReactValue(passEl, password);
      const submit2 = await waitForSelector('button[type="submit"]');
      await waitForEnabled(submit2);
      submit2.click();
    } catch (err) {
      console.error('[Wehost AutoLogin] Error:', err);
    }
  })();
}

// --- Service-worker helpers ---

// Injects autoLogin once the given tab finishes loading any airbnb.com page.
// Handles the "Frame with ID 0 is showing error page" case that occurs when
// the new incognito tab briefly lands on a Chrome network-error page before
// Airbnb's page fully loads — Chrome still reports tab.url as airbnb.com in
// that state, so the URL check passes but executeScript rejects. We catch it
// and reload once to let the page try again.
function injectLoginOnReady(tabId, email, password) {
  let attempts = 0;

  function onTabUpdated(id, changeInfo, tab) {
    if (id !== tabId) return;
    if (changeInfo.status !== 'complete') return;
    // Strict hostname check — never inject credentials into a page whose URL merely
    // contains the substring "airbnb.com" (e.g. airbnb.com.evil.com or evil.com/?airbnb.com).
    if (!tab.url) return;
    let host;
    try { host = new URL(tab.url).hostname; } catch { return; }
    if (host !== 'airbnb.com' && !host.endsWith('.airbnb.com')) return;

    chrome.tabs.onUpdated.removeListener(onTabUpdated);

    chrome.scripting
      .executeScript({
        target: { tabId },
        func: autoLogin,
        args: [email, password],
      })
      .catch((err) => {
        attempts++;
        if (attempts < 3 && err.message && err.message.includes('error page')) {
          // Tab is on a transient error page — reload and wait for the next complete event
          setTimeout(() => {
            chrome.tabs.onUpdated.addListener(onTabUpdated);
            chrome.tabs.reload(tabId);
          }, 1500);
        } else {
          console.error('[Wehost AutoLogin] executeScript failed:', err.message);
        }
      });
  }

  chrome.tabs.onUpdated.addListener(onTabUpdated);
}

// Deletes every airbnb.com cookie from the incognito cookie store.
// Direct deletion is more reliable than navigating to /logout, which can
// fail silently when CSRF tokens are missing or when Airbnb changes redirect behaviour.
async function clearIncognitoAirbnbCookies(incognitoWindows) {
  const incognitoTabId = incognitoWindows[0].tabs[0].id;

  // Identify the incognito cookie store by finding the store that owns one of our tabs
  const stores = await new Promise((r) => chrome.cookies.getAllCookieStores(r));
  const store = stores.find((s) => s.tabIds.includes(incognitoTabId));
  if (!store) return;

  // Fetch and remove all airbnb.com cookies (session, auth, "remember-me", email recall…)
  const cookies = await new Promise((r) =>
    chrome.cookies.getAll({ domain: 'airbnb.com', storeId: store.id }, r)
  );

  await Promise.all(
    cookies.map((c) =>
      new Promise((r) =>
        chrome.cookies.remove(
          { url: `https://www.airbnb.com${c.path}`, name: c.name, storeId: store.id },
          r
        )
      )
    )
  );
}

// --- Message listener ---
chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'OPEN_LOGIN') return;

  const { email, password } = message;

  // All incognito tabs in the same Chrome session share one cookie store.
  // If another account is active we must fully clear that session first.
  chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, async (windows) => {
    const incognitoWindows = windows.filter((w) => w.incognito);

    if (incognitoWindows.length > 0) {
      // 1. Directly delete all Airbnb cookies from the incognito store.
      //    This clears session tokens, auth cookies, AND the "remember email" cookie
      //    — something /logout navigation often misses.
      await clearIncognitoAirbnbCookies(incognitoWindows);

      // 2. Close every incognito window. Chrome destroys the entire incognito profile
      //    (localStorage, sessionStorage, cache) when the last window closes,
      //    guaranteeing no remembered-email data survives into the new session.
      await Promise.all(
        incognitoWindows.map((w) => new Promise((r) => chrome.windows.remove(w.id, r)))
      );

      // 3. Pause so Chrome finishes tearing down the old incognito profile before
      //    we create a new one. 300ms was sometimes too short — the new window's
      //    first navigation could hit a transient error while the profile init raced.
      await new Promise((r) => setTimeout(r, 600));
    }

    // Open a brand-new incognito window at the Airbnb login page.
    // A fresh window always performs a full page load, so the inject listener
    // fires reliably and the login modal is always in the clean standard state.
    const win = await new Promise((r) =>
      chrome.windows.create(
        { url: 'https://www.airbnb.com/login', incognito: true, type: 'normal' },
        r
      )
    );
    injectLoginOnReady(win.tabs[0].id, email, password);
  });
});

// Standalone autoLogin function — also used directly by the service worker via executeScript.
// This file is kept for reference/testing purposes.

export function autoLogin(email, password) {
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

  function waitForPasswordOrChallenge(timeout = 20000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = setInterval(() => {
        const passEl = document.querySelector(
          'input[name="user[password]"], input[type="password"]'
        );
        if (passEl) {
          clearInterval(tick);
          resolve({ type: 'password', el: passEl });
          return;
        }
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

  (async () => {
    try {
      await new Promise((r) => setTimeout(r, 800));

      // New UI (2024+): id="phone-or-email", inputmode="email", type="text" — no name attr
      // Old UI: name="user[email]", type="email"
      const EMAIL_INPUT_SEL =
        'input#phone-or-email, input[inputmode="email"], input[name="user[email]"], input[type="email"]';

      const immediateInput = document.querySelector(EMAIL_INPUT_SEL);

      if (!immediateInput) {
        // Old UI — click the button that reveals the email input
        try {
          const btn = await waitForTextMatch(
            "button, div[role='button']",
            'Continue with email',
            7000
          );
          btn.click();
        } catch {
          const btn = await waitForExactText("button, div[role='button']", 'Continue', 7000);
          btn.click();
        }
      }

      const input1 = await waitForSelector(EMAIL_INPUT_SEL, 10000);

      setReactValue(input1, email);
      const submit1 = await waitForSelector('button[type="submit"]');
      await waitForEnabled(submit1);
      submit1.click();

      // After email submit: password field (normal) OR challenge screen (some accounts)
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

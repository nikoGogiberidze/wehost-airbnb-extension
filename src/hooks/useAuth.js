import { useState, useEffect, useCallback } from 'react';

const TOKEN_KEY = 'wehost_token';
// Cleared on logout so cached credentials never outlive a session.
const ACCOUNT_KEYS = ['wehost_accounts', 'wehost_favorites', 'wehost_last_synced', 'wehost_order'];

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_EXTENSION_API_KEY || '';

function read(keys) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(keys, resolve);
    } else {
      const result = {};
      keys.forEach((k) => {
        const v = localStorage.getItem(k);
        result[k] = v ? JSON.parse(v) : undefined;
      });
      resolve(result);
    }
  });
}

function write(obj) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set(obj, resolve);
    } else {
      Object.entries(obj).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
      resolve();
    }
  });
}

function remove(keys) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(keys, resolve);
    } else {
      keys.forEach((k) => localStorage.removeItem(k));
      resolve();
    }
  });
}

// Decode a HS256 token payload (no verification — just to read exp/role/email
// for UI state; the server is the source of truth on every request).
function decodePayload(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { email, role }
  const [ready, setReady] = useState(false); // initial storage load complete
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    read([TOKEN_KEY]).then((r) => {
      const t = r[TOKEN_KEY];
      if (t) {
        const p = decodePayload(t);
        if (p && p.exp && Date.now() < p.exp) {
          setToken(t);
          setUser({ email: p.email, role: p.role });
        } else {
          remove([TOKEN_KEY]);
        }
      }
      setReady(true);
    });
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 401) throw new Error('Invalid email or password');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      await write({ [TOKEN_KEY]: data.token });
      setToken(data.token);
      setUser({ email: data.email, role: data.role });
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await remove([TOKEN_KEY, ...ACCOUNT_KEYS]);
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  return {
    token,
    user,
    isAuthenticated: !!token,
    ready,
    authError,
    authLoading,
    login,
    logout,
  };
}

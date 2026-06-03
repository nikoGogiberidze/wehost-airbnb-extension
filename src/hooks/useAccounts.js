import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wehost_accounts';
const FAVORITES_KEY = 'wehost_favorites';
const LAST_SYNCED_KEY = 'wehost_last_synced';
const ORDER_KEY = 'wehost_order';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_EXTENSION_API_KEY || '';

function readStorage(keys) {
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

function writeStorage(obj) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set(obj, resolve);
    } else {
      Object.entries(obj).forEach(([k, v]) => {
        localStorage.setItem(k, JSON.stringify(v));
      });
      resolve();
    }
  });
}

export function useAccounts({ token, onAuthError } = {}) {
  const [accounts, setAccounts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [order, setOrder] = useState([]);
  const [lastSynced, setLastSynced] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // On mount: load from cache only — no API call
  useEffect(() => {
    readStorage([STORAGE_KEY, FAVORITES_KEY, LAST_SYNCED_KEY, ORDER_KEY]).then((result) => {
      if (result[STORAGE_KEY]) setAccounts(result[STORAGE_KEY]);
      if (result[FAVORITES_KEY]) setFavorites(result[FAVORITES_KEY]);
      if (result[ORDER_KEY]) setOrder(result[ORDER_KEY]);
      if (result[LAST_SYNCED_KEY]) setLastSynced(result[LAST_SYNCED_KEY]);
    });
  }, []);

  // sync() — only called on user button press
  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/accounts`, {
        headers: { 'x-api-key': API_KEY, Authorization: `Bearer ${token || ''}` },
      });
      if (res.status === 401) {
        onAuthError?.();
        throw new Error('Session expired — please sign in again');
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const now = Date.now();
      await writeStorage({ [STORAGE_KEY]: data, [LAST_SYNCED_KEY]: now });
      setAccounts(data);
      setLastSynced(now);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, onAuthError]);

  const reorder = useCallback(async (newOrder) => {
    setOrder(newOrder);
    await writeStorage({ [ORDER_KEY]: newOrder });
  }, []);

  // Favorites keyed by email
  const toggleFavorite = useCallback(
    async (email) => {
      const updated = favorites.includes(email)
        ? favorites.filter((f) => f !== email)
        : [...favorites, email];
      setFavorites(updated);
      await writeStorage({ [FAVORITES_KEY]: updated });
    },
    [favorites]
  );

  return { accounts, favorites, order, lastSynced, loading, error, sync, toggleFavorite, reorder };
}

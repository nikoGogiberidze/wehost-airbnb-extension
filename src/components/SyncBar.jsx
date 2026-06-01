import React, { useState, useEffect } from 'react';

function timeAgo(ts) {
  if (!ts) return 'Never synced';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SyncBar({ lastSynced, loading, onSync }) {
  const [synced, setSynced] = useState(false);

  // Refresh the "X minutes ago" text every 30s
  useEffect(() => {
    const id = setInterval(() => setSynced((s) => s), 30000);
    return () => clearInterval(id);
  }, []);

  const handleSync = async () => {
    await onSync();
    setSynced(true);
    setTimeout(() => setSynced(false), 2000);
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#333]">
      <span className="text-xs text-gray-400">
        {lastSynced ? `Last synced: ${timeAgo(lastSynced)}` : 'Never synced'}
      </span>
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-accent hover:bg-[#c94745] text-white disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Syncing…
          </>
        ) : synced ? (
          <span>✓ Synced</span>
        ) : (
          <>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115-2.7M20 15a9 9 0 01-15 2.7" />
            </svg>
            Sync
          </>
        )}
      </button>
    </div>
  );
}

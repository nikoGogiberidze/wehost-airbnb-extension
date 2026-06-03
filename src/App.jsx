import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAccounts } from './hooks/useAccounts';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import SyncBar from './components/SyncBar';
import AccountCard from './components/AccountCard';

export default function App() {
  const { accounts, favorites, order, lastSynced, loading, error, sync, toggleFavorite, reorder } = useAccounts();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [dragEmail, setDragEmail] = useState(null);
  const [dragOverEmail, setDragOverEmail] = useState(null);

  // Debounce search by 200ms so filtering doesn't run on every keystroke
  const debounceRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    let result = accounts.filter((a) => {
      const matchesSearch =
        !q ||
        a.email.toLowerCase().includes(q) ||
        a.properties?.some(
          (p) =>
            p.guestyName?.toLowerCase().includes(q) ||
            p.georgianName?.toLowerCase().includes(q)
        );

      const matchesCity = cityFilter === 'All' || a.city === cityFilter;

      return matchesSearch && matchesCity;
    });

    result.sort((a, b) => {
      const aFav = favorites.includes(a.email) ? 0 : 1;
      const bFav = favorites.includes(b.email) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      // Within same group use custom order; new accounts (not in order) go to the end
      const aIdx = order.indexOf(a.email);
      const bIdx = order.indexOf(b.email);
      if (aIdx === -1 && bIdx === -1) return (a.properties?.[0]?.guestyName || a.email).localeCompare(b.properties?.[0]?.guestyName || b.email);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });

    return result;
  }, [accounts, favorites, order, search, cityFilter]);

  const canDrag = search === '';

  const handleDragStart = useCallback((email) => {
    setDragEmail(email);
  }, []);

  const handleDragOver = useCallback((email) => {
    if (!dragEmail || email === dragEmail) return;
    if (favorites.includes(dragEmail) !== favorites.includes(email)) return;
    setDragOverEmail(email);
  }, [dragEmail, favorites]);

  const handleDrop = useCallback((email) => {
    if (!dragEmail || email === dragEmail) return;
    if (favorites.includes(dragEmail) !== favorites.includes(email)) return;

    const allEmails = accounts.map((a) => a.email);
    const base = [...order];
    allEmails.forEach((e) => { if (!base.includes(e)) base.push(e); });

    const fromIdx = base.indexOf(dragEmail);
    base.splice(fromIdx, 1);
    const toIdx = base.indexOf(email);
    base.splice(toIdx, 0, dragEmail);

    reorder(base);
    setDragEmail(null);
    setDragOverEmail(null);
  }, [dragEmail, favorites, accounts, order, reorder]);

  const handleDragEnd = useCallback(() => {
    setDragEmail(null);
    setDragOverEmail(null);
  }, []);

  return (
    <div
      className="flex flex-col text-gray-100"
      style={{ width: 480, height: 580, backgroundColor: '#1a1a1a' }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-1 border-b border-[#333]">
        <h1 className="text-sm text-gray-100 tracking-wide" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800 }}>Wehost Airbnb Manager</h1>
      </div>

      <SearchBar value={searchInput} onChange={handleSearchChange} />
      <FilterBar value={cityFilter} onChange={setCityFilter} />

      {/* Error banner */}
      {error && (
        <div className="mx-3 my-1 px-3 py-2 bg-red-900/50 border border-red-700 rounded text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Account list — min-h-0 lets flex-1 shrink properly so SyncBar is never covered */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && accounts.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            Syncing…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-1 text-gray-500 text-sm">
            {accounts.length === 0 ? (
              <>
                <span>No data yet</span>
                <span className="text-xs">Press Sync to load accounts</span>
              </>
            ) : (
              'No results found.'
            )}
          </div>
        ) : (
          filtered.map((account) => (
            <AccountCard
              key={account.email}
              account={account}
              isFavorited={favorites.includes(account.email)}
              onToggleFavorite={toggleFavorite}
              canDrag={canDrag}
              isDragging={dragEmail === account.email}
              isDragOver={dragOverEmail === account.email}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>

      <SyncBar lastSynced={lastSynced} loading={loading} onSync={sync} />
    </div>
  );
}

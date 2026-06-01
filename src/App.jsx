import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAccounts } from './hooks/useAccounts';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import SyncBar from './components/SyncBar';
import AccountCard from './components/AccountCard';

export default function App() {
  const { accounts, favorites, lastSynced, loading, error, sync, toggleFavorite } = useAccounts();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');

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

    // Sort: favorited (by email) first, then alphabetical by first property's guestyName
    result.sort((a, b) => {
      const aFav = favorites.includes(a.email) ? 0 : 1;
      const bFav = favorites.includes(b.email) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      const aName = a.properties?.[0]?.guestyName || a.email;
      const bName = b.properties?.[0]?.guestyName || b.email;
      return aName.localeCompare(bName);
    });

    return result;
  }, [accounts, favorites, search, cityFilter]);

  return (
    <div
      className="flex flex-col text-gray-100"
      style={{ width: 400, height: 580, backgroundColor: '#1a1a1a' }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-1 border-b border-[#333]">
        <h1 className="text-sm font-bold text-gray-100 tracking-wide">Wehost Airbnb Manager</h1>
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
            />
          ))
        )}
      </div>

      <SyncBar lastSynced={lastSynced} loading={loading} onSync={sync} />
    </div>
  );
}

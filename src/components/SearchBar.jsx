import React from 'react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="px-3 pt-3 pb-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, email..."
        className="w-full text-gray-100 placeholder-gray-500 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        style={{ backgroundColor: '#2a2a2a' }}
      />
    </div>
  );
}

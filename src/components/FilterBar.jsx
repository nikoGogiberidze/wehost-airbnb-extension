import React from 'react';

const CITIES = ['All', 'Tbilisi', 'Batumi', 'Gudauri'];

export default function FilterBar({ value, onChange }) {
  return (
    <div className="flex gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-none">
      {CITIES.map((city) => {
        const isActive = value === city;
        return (
          <button
            key={city}
            onClick={() => onChange(city)}
            style={
              isActive
                ? { backgroundColor: '#e05553', color: '#fff' }
                : { backgroundColor: '#2a2a2a', color: '#d1d5db' }
            }
            className="inline-flex items-center justify-center shrink-0 h-6 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80"
          >
            {city}
          </button>
        );
      })}
    </div>
  );
}

import React from 'react';

export default function FilterBar({ value, onChange, cities }) {
  return (
    <div className="flex gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-none">
      {cities.map((city) => {
        const isActive = value === city;
        return (
          <button
            key={city}
            onClick={() => onChange(city)}
            className={`inline-flex items-center justify-center shrink-0 h-6 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80 ${
              isActive ? 'bg-accent text-white' : 'bg-surface text-gray-300'
            }`}
          >
            {city}
          </button>
        );
      })}
    </div>
  );
}

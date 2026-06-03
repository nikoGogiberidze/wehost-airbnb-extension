/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './popup.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic design tokens — use these instead of raw hex / arbitrary values.
        accent: '#e05553',
        'accent-hover': '#c94745',
        base: '#1a1a1a',          // app background
        surface: '#2a2a2a',       // cards, inputs, buttons, filter chips
        'surface-hover': '#383838',
        drag: '#3a3a3a',          // row highlight while dragging over
        divider: '#333333',       // borders / separators
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

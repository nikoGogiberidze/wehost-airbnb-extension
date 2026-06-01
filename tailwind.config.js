/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './popup.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#e05553',
        'card-dark': '#2a2a2a',
        'bg-dark': '#1a1a1a',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bitwarden: {
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#bad5ff',
          500: '#175ddc', // Classic Bitwarden primary blue
          600: '#124ebb',
          700: '#0c3b94',
          800: '#0b2e73',
          900: '#0b1d3a',
          darkBg: '#0f172a',
          darkPanel: '#1e293b',
          darkSidebar: '#0b1526',
          darkBorder: '#334155',
        }
      }
    },
  },
  plugins: [],
}


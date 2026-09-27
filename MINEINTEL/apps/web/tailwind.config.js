/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mining: {
          50: '#f4f6f8',
          100: '#e5e9ef',
          200: '#cbd4e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#0f172a',
          900: '#090d16',
          amber: '#f59e0b',
          emerald: '#10b981',
          cyan: '#06b6d4',
        },
      },
    },
  },
  plugins: [],
}

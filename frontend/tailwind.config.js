/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f19',
        cardBg: 'rgba(20, 26, 42, 0.75)',
        cyanAccent: '#06b6d4',
        emeraldAccent: '#10b981',
        blueAccent: '#3b82f6',
        roseAccent: '#f43f5e',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

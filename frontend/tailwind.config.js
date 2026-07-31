/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        medicalBg: '#f8fafc',
        medicalSurface: '#ffffff',
        medicalSubtle: '#f1f5f9',
        clinicalTeal: {
          50: '#f0fdf4',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        medicalCyan: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        slateText: {
          primary: '#0f172a',
          secondary: '#334155',
          muted: '#64748b',
        },
        // Backwards compatibility mappings for smooth migration
        darkBg: '#f8fafc',
        cardBg: '#ffffff',
        cyanAccent: '#0284c7',
        emeraldAccent: '#059669',
        blueAccent: '#2563eb',
        roseAccent: '#e11d48',
      },
      boxShadow: {
        medical: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
        medicalHover: '0 12px 32px -4px rgba(15, 23, 42, 0.12)',
        medicalGlow: '0 0 15px rgba(13, 148, 136, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

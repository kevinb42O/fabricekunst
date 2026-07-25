/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FAF7F2',
          surface: '#F4EFE6',
          card: '#FFFFFF',
          border: '#D8CEB8',
          dark: '#EBE2D0',
        },
        ink: {
          DEFAULT: '#111111',
          light: '#222222',
          muted: '#444444',
          soft: '#666666',
        },
        gold: {
          DEFAULT: '#B8860B',
          light: '#D4AF37',
          dark: '#8E7035',
          border: 'rgba(184, 134, 11, 0.3)',
        },
        shagreen: {
          DEFAULT: '#8B2635',
          dark: '#541520',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Cinzel', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'clean': '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'card': '0 10px 30px rgba(0, 0, 0, 0.08)',
        'strong': '0 20px 40px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}

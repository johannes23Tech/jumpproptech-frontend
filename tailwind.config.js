/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#0A0A0A',
        charcoal: '#171717',
        gold: '#C5A059',
        'gold-light': '#D9BD83',
        ivory: '#FAF7F2',
        'ivory-dark': '#F2ECE1',
        success: '#2E7D32',
        warning: '#B26A00',
        danger: '#B3261E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'premium-hover': '0 20px 40px -10px rgba(0,0,0,0.12)',
        'gold': '0 4px 14px 0 rgba(197, 160, 89, 0.39)',
        'card': '0 1px 2px rgba(10,10,10,0.04), 0 8px 24px -12px rgba(10,10,10,0.12)',
        'raised': '0 2px 6px rgba(10,10,10,0.05), 0 18px 40px -18px rgba(10,10,10,0.22)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
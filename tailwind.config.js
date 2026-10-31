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
      }
    },
  },
  plugins: [],
}
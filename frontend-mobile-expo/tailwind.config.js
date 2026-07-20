/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dark: '#6D28D9',
        },
        accent: {
          DEFAULT: '#10B981',
          blue: '#0EA5E9',
        },
      },
      borderRadius: {
        card: '16px',
        hero: '24px',
      },
    },
  },
  plugins: [],
}

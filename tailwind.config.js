/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};

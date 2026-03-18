/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', '"DM Sans"', 'sans-serif'],
        mono: ['"Geist Mono"', '"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

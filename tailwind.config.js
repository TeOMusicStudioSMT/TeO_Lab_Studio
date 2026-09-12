/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'lab-dark': '#070b14',
        'lab-panel': '#0e1526',
        'lab-primary': '#38bdf8',
        'lab-accent': '#a3e635',
        'lab-warn': '#fbbf24',
      },
    },
  },
  plugins: [],
}

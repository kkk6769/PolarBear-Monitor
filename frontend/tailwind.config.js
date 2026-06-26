/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f19',
        surface: '#141b2a',
        border: '#1e2a3e',
        text: '#c8d6e5',
        'text-dim': '#6b7d95',
        accent: '#4f8cff',
        green: '#2ed573',
        yellow: '#ffa502',
        red: '#ff4757',
      },
    },
  },
  plugins: [],
}

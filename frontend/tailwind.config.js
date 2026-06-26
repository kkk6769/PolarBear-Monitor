/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1e',
        foreground: '#e4ecf7',
        card: '#111827',
        'card-foreground': '#e4ecf7',
        muted: '#1e293b',
        'muted-foreground': '#94a3b8',
        border: '#1e2d4a',
        ring: '#334155',
      },
      borderRadius: {
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
}

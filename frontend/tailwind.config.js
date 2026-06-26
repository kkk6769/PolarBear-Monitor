/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-fg)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-fg)',
        border: 'var(--border)',
        ring: '#00D4FF',
      },
      borderRadius: { lg: '0.5rem' },
    },
  },
  plugins: [],
}

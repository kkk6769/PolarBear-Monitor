/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#f5f5f7',
        foreground: '#1a1a21',
        card: '#ffffff',
        'card-foreground': '#1a1a21',
        muted: '#f0f0f3',
        'muted-foreground': '#6e6e78',
        border: '#e0e0e5',
        ring: '#00D4FF',
      },
      borderRadius: { lg: '0.5rem' },
    },
  },
  plugins: [],
}

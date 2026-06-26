/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#2C2C34',
        foreground: '#e8e8ed',
        card: '#363641',
        'card-foreground': '#e8e8ed',
        muted: '#1e1e24',
        'muted-foreground': '#8e8e99',
        border: '#4a4a55',
        ring: '#00D4FF',
      },
      borderRadius: {
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
}

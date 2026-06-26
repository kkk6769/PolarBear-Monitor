/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#171412',
        foreground: '#FAFAF8',
        card: '#0A0A09',
        'card-foreground': '#FAFAF8',
        muted: '#292524',
        'muted-foreground': '#A8A29E',
        border: '#292524',
        ring: '#44403C',
      },
      borderRadius: {
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
}

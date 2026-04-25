/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00D4FF',
        correct: '#00FF88',
        wrong: '#FF4444',
        hint: '#FFD700',
        dark: '#0D0221',
        card: '#1a1a2e',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

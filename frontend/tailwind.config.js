/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10b981', // emerald-500
        secondary: '#6366f1', // indigo-500
        correct: '#10b981',
        wrong: '#ef4444', // red-500
        hint: '#f59e0b', // amber-500
        dark: '#09090b', // obsidian
        card: '#18181b', // zinc-900
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

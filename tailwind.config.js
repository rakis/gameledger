/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tm: {
          dark: '#0f0608',
          darker: '#080304',
          card: '#1a0b0f',
          cardBorder: '#3d1822',
          red: '#8b111e',
          redBright: '#b81428',
          redDark: '#56070f',
          wax: '#a81324',
          gold: '#cba052',
          goldBright: '#ffd700',
          goldMuted: '#9e7b33',
          goldLight: '#f6e4b8',
          parchment: '#f7f1df',
          parchmentDark: '#e8dcba',
          ink: '#221b14',
          seal: '#931322'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        typewriter: ['"Courier Prime"', 'Courier', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 0 15px rgba(203, 160, 82, 0.35)',
        'gold-lg': '0 0 25px rgba(203, 160, 82, 0.55)',
        'wax': '0 4px 10px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
        'parchment': '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}

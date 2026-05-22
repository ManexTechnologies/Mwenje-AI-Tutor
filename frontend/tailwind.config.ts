import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#FDFAF6',
          secondary: '#F5EFE6'
        },
        accent: {
          primary: '#C9682A',
          secondary: '#E8A44A'
        },
        text: {
          primary: '#1C1917',
          secondary: '#6B5E52'
        },
        success: '#2D7A5F'
      },
      boxShadow: {
        soft: '0 24px 60px rgba(28, 25, 23, 0.08)'
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}

export default config

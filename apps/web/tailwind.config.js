/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        defence: {
          bg: '#0a0d14',
          card: '#121722',
          border: '#1f293d',
          sidebar: '#0d111a',
          cyan: '#00f0ff',
          amber: '#ffb703',
          red: '#ff2a5f',
          green: '#00e676',
          purple: '#9d4edd',
          text: '#94a3b8',
          heading: '#f8fafc'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}

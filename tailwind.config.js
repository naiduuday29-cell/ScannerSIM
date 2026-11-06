/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#0a0d14',
          900: '#0f1420',
          850: '#151b2c',
          800: '#1b2339',
          700: '#283454',
          600: '#384873',
          500: '#4c629c',
          400: '#6983c5',
          accent: '#00f0ff',
          safety: '#ffaa00',
          pass: '#10b981',
          fail: '#ef4444'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}

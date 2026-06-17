/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        holo: {
          cyan: '#00f5ff',
          magenta: '#ff00ff',
          blue: '#0066ff',
          purple: '#8b00ff',
          green: '#00ff88',
          orange: '#ff8800',
          dark: '#0a0a12',
          card: 'rgba(15, 15, 30, 0.8)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'holo-float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        holoFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 245, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 245, 255, 0.8), 0 0 40px rgba(0, 102, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};

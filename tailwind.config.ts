import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#1A1A1A',
        surface: '#222222',
        elevated: '#2C2C2C',
        'surface-high': '#2C2C2C',
        border: '#333333',
        'border-light': 'rgba(240, 237, 232, 0.12)',
        primary: '#C8C8C8',
        'primary-dim': '#9A9590',
        'primary-glow': 'rgba(200, 200, 200, 0.12)',
        accent: '#D4A84B',
        success: '#7AB87A',
        error: '#C0604A',
        warning: '#D4A84B',
        rose: '#C0604A',
        text: '#F0EDE8',
        'text-secondary': '#9A9590',
        'text-dim': '#5A5550',
      },
      borderRadius: {
        card: '24px',
        button: '50px',
        input: '50px',
      },
      fontFamily: {
        heading: ['var(--font-architects-daughter)', 'cursive'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212, 168, 75, 0.2), 0 0 40px rgba(212, 168, 75, 0.1)',
        'glow-white': '0 0 20px rgba(200, 200, 200, 0.15), 0 0 40px rgba(200, 200, 200, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

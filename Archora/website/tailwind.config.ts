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
        background: '#061A1A',
        surface: '#0C2424',
        elevated: '#122E2E',
        'surface-top': '#193535',
        border: 'rgba(201, 255, 253, 0.12)',
        'border-light': 'rgba(201, 255, 253, 0.20)',
        primary: '#C9FFFD',
        'primary-dim': '#8ADEDD',
        'primary-ghost': 'rgba(201, 255, 253, 0.30)',
        accent: '#FFEE8C',
        success: '#7AB87A',
        error: '#FF8C9A',
        rose: '#FF8C9A',
        text: '#FEFFFD',
        'text-secondary': '#8ADEDD',
        'text-dim': '#4A8080',
        'glass-bg': 'rgba(201, 255, 253, 0.06)',
        'glass-border': 'rgba(201, 255, 253, 0.12)',
        'glass-prominent': 'rgba(201, 255, 253, 0.10)',
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
    },
  },
  plugins: [],
};

export default config;

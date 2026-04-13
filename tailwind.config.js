/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Base — dark drafting paper
        background: '#1A1A1A',
        surface: '#222222',
        'surface-high': '#2C2C2C',
        border: '#333333',
        // Accent — graphite (default theme)
        primary: 'var(--color-primary, #C8C8C8)',
        'primary-dim': '#8A8A8A',
        'primary-glow': '#E8E8E8',
        'scratch-line': '#D4D4D4',
        // Text
        'text-primary': '#F0EDE8',
        'text-secondary': '#9A9590',
        'text-dim': '#5A5550',
        // Semantic
        success: '#7AB87A',
        warning: '#D4A84B',
        error: '#C0604A',
      },
      fontFamily: {
        heading: ['ArchitectsDaughter_400Regular'],
        body: ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-bold': ['Inter_700Bold'],
        mono: ['JetBrainsMono_400Regular'],
        'mono-bold': ['JetBrainsMono_700Bold'],
      },
      spacing: {
        // 4px base unit scale
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        input: '8px',
        card: '12px',
        button: '24px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};

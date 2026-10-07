import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Vellum ground
        paper: v('paper'),
        'paper-deep': v('paper-deep'),
        sheet: v('sheet'),
        'sheet-raised': v('sheet-raised'),
        rule: v('rule'),
        'rule-soft': v('rule-soft'),
        ink: v('ink'),
        'ink-2': v('ink-2'),
        'ink-3': v('ink-3'),
        // Pigments: base (fill), edge (lip), ink (text on its own tint), on (text on the fill)
        action: v('action'), 'action-edge': v('action-edge'), 'action-ink': v('action-ink'), 'action-on': v('action-on'),
        structure: v('structure'), 'structure-edge': v('structure-edge'), 'structure-ink': v('structure-ink'), 'structure-on': v('structure-on'),
        ai: v('ai'), 'ai-edge': v('ai-edge'), 'ai-ink': v('ai-ink'), 'ai-on': v('ai-on'),
        success: v('success'), 'success-edge': v('success-edge'), 'success-ink': v('success-ink'), 'success-on': v('success-on'),
        error: v('error'), 'error-edge': v('error-edge'), 'error-ink': v('error-ink'), 'error-on': v('error-on'),
        fresh: v('fresh'), 'fresh-edge': v('fresh-edge'), 'fresh-ink': v('fresh-ink'), 'fresh-on': v('fresh-on'),

        // Legacy names kept so any page not yet rewritten stays legible in the new palette.
        background: v('paper'),
        surface: v('sheet'),
        elevated: v('sheet-raised'),
        'surface-high': v('sheet-raised'),
        border: v('rule'),
        text: v('ink'),
        'text-secondary': v('ink-2'),
        'text-dim': v('ink-3'),
        primary: v('structure-ink'),
        'primary-dim': v('ink-2'),
        accent: v('action-ink'),
        warning: v('error-ink'),
        rose: v('error-ink'),
      },
      // Vellum radii by hierarchy: no pills.
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '22px',
        card: '18px',
        button: '16px',
        input: '14px',
      },
      fontFamily: {
        display: ['var(--font-inter-tight)', 'var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-inter-tight)', 'var(--font-inter)', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

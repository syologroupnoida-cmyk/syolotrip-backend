/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── SS Journey Brand Palette ──
        // Derived from logo: deep navy SS letters, royal blue gradient, orange swoosh accent

        // Primary = Deep Navy Blue (the "SS" letterforms)
        'primary': '#0c2d6b',
        'on-primary': '#ffffff',
        'primary-container': '#143d8a',
        'on-primary-container': '#d4e3ff',
        'inverse-primary': '#a4c8ff',

        // Secondary = Orange/Amber (the swoosh & location pin)
        'secondary': '#c05d00',
        'on-secondary': '#ffffff',
        'secondary-container': '#f28c1c',
        'on-secondary-container': '#4a2200',

        // Tertiary = Royal Blue (the gradient highlights on S)
        'tertiary': '#1a6fb5',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#2988d4',
        'on-tertiary-container': '#d0e8ff',

        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // Surfaces – cool-tinted to complement navy
        'surface': '#f7f9ff',
        'on-surface': '#0c1b33',
        'surface-variant': '#d5dff2',
        'on-surface-variant': '#3a4456',
        'surface-dim': '#cdd5ea',
        'surface-bright': '#f7f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f0f4ff',
        'surface-container': '#e8edfb',
        'surface-container-high': '#dfe6f7',
        'surface-container-highest': '#d5dff2',
        'surface-tint': '#1a5eb5',

        'inverse-surface': '#1a2640',
        'inverse-on-surface': '#edf0ff',
        'outline': '#667590',
        'outline-variant': '#b4c0d6',
        'background': '#f7f9ff',
        'on-background': '#0c1b33',

        // Fixed / Dim tokens
        'primary-fixed': '#d4e3ff',
        'primary-fixed-dim': '#a4c8ff',
        'on-primary-fixed': '#001d3d',
        'on-primary-fixed-variant': '#0a2760',
        'secondary-fixed': '#ffdcc4',
        'secondary-fixed-dim': '#ffb77c',
        'on-secondary-fixed': '#2d1200',
        'on-secondary-fixed-variant': '#944800',
        'tertiary-fixed': '#d0e8ff',
        'tertiary-fixed-dim': '#96c9f7',
        'on-tertiary-fixed': '#001e36',
        'on-tertiary-fixed-variant': '#0f5a99',

        // Brand scale (navy-to-lighter blues)
        brand: {
          50:  '#edf3ff',
          100: '#d4e3ff',
          200: '#a4c8ff',
          300: '#6ca8f7',
          400: '#3d8ae6',
          500: '#1a6fb5',
          600: '#1457a0',
          700: '#0c2d6b',
          800: '#0a2354',
          900: '#071a3d',
          950: '#040e24',
        },
        accent: {
          orange: '#f28c1c',
          amber:  '#f59e0b',
          gold:   '#e8811a',
          red:    '#e11d48',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        'display-hero': ['"Plus Jakarta Sans"'],
        'headline': ['"Plus Jakarta Sans"'],
        'body': ['"Plus Jakarta Sans"'],
        'label': ['"Plus Jakarta Sans"'],
      },
      fontSize: {
        'display-hero': ['56px', { lineHeight: '64px', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-hero-mobile': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'headline-xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-xl-mobile': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '26px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', letterSpacing: '-0.005em', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '20px', letterSpacing: '0.005em', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.04em', fontWeight: '700' }],
      },
      spacing: {
        'gutter': '1.5rem',
        'gutter-sm': '1rem',
        'gutter-lg': '2rem',
        'margin': '1rem',
        'margin-md': '2rem',
        'margin-lg': '4rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
      },
      borderRadius: {
        'DEFAULT': '0.5rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(12, 27, 51, 0.06), 0 1px 2px -1px rgba(12, 27, 51, 0.04)',
        'card-hover': '0 10px 15px -3px rgba(12, 27, 51, 0.1), 0 4px 6px -4px rgba(12, 27, 51, 0.05)',
        'float': '0 20px 25px -5px rgba(12, 27, 51, 0.12), 0 8px 10px -6px rgba(12, 27, 51, 0.06)',
        'modal': '0 25px 50px -12px rgba(12, 27, 51, 0.28)',
        'glow-orange': '0 0 20px rgba(242, 140, 28, 0.3)',
        'glow-blue': '0 0 20px rgba(26, 111, 181, 0.25)',
      },
    },
  },
  plugins: [],
}

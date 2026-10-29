/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mandatory Core Palette
        obsidian: {
          DEFAULT: '#1F1D20',
          light: '#2B292C',
          dark: '#141215',
        },
        burgundy: {
          DEFAULT: '#4A2427',
          hover: '#3D1E20',
          light: '#5E2F33',
        },
        terracotta: {
          DEFAULT: '#803E2F',
          hover: '#6B3326',
          light: '#9E5140',
          subtle: '#F6ECE9',
        },
        taupe: {
          DEFAULT: '#A79986',
          light: '#BFB4A4',
          dark: '#8C7D6A',
        },
        charcoal: {
          DEFAULT: '#38302D',
          dark: '#2B2422',
        },
        stone: {
          charcoal: '#3E3D38',
        },
        // Supporting Warm Neutrals & Surfaces
        page: '#F3EEE6',
        surface: {
          DEFAULT: '#FBF8F3',
          alt: '#E9E2D6',
          muted: '#E2D9CB',
        },
        secondary: {
          text: '#6B5E55',
        },
        border: {
          input: '#857762',
          hairline: '#D6CCBC',
        },
        // Status Indicators
        status: {
          success: '#3F6B4A',
          'success-bg': '#EAF2EC',
          warning: '#855710',
          'warning-bg': '#F9F3E5',
          error: '#A32D2D',
          'error-bg': '#FBEBEB',
          info: '#3D5A80',
          'info-bg': '#EBF2F7',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        'container': '1200px',
      },
      borderRadius: {
        'panel': '12px',
        'btn': '6px',
      },
      spacing: {
        'inset': '14px',
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(31, 29, 32, 0.05)',
        'elevated': '0 8px 24px -4px rgba(31, 29, 32, 0.08)',
        'hero': '0 12px 32px -8px rgba(31, 29, 32, 0.20)',
      },
    },
  },
  plugins: [],
};


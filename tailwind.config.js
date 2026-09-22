/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b0b8c9',
          400: '#8591aa',
          500: '#65728f',
          600: '#505b76',
          700: '#414a60',
          800: '#383f51',
          900: '#0e1220',
          950: '#080b15',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(14 18 32 / 0.04), 0 1px 3px 0 rgb(14 18 32 / 0.06)',
        lift: '0 8px 24px -8px rgb(14 18 32 / 0.16), 0 2px 8px -2px rgb(14 18 32 / 0.08)',
        widget: '0 24px 64px -16px rgb(14 18 32 / 0.28), 0 8px 24px -12px rgb(14 18 32 / 0.16)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'widget-in': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        blink: {
          '0%, 60%, 100%': { opacity: '.25', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-2px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(.9)', opacity: '.5' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up .32s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in .3s ease-out both',
        'scale-in': 'scale-in .24s cubic-bezier(.16,1,.3,1) both',
        'slide-in-right': 'slide-in-right .3s cubic-bezier(.16,1,.3,1) both',
        'widget-in': 'widget-in .38s cubic-bezier(.16,1,.3,1) both',
        blink: 'blink 1.2s infinite',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(.24,.6,.36,1) infinite',
      },
    },
  },
  plugins: [],
}

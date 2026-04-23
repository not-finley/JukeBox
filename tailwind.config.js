/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme.js';
import tailwindAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx,html}',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        'primary-500': '#877EFF',
        'primary-600': '#5D5FEF',
        'secondary-500': '#FFB620',
        'off-white': '#D0DFFF',
        'red': '#FF5A5A',
        'dark-1': 'rgb(var(--color-dark-1) / <alpha-value>)',
        'dark-2': 'rgb(var(--color-dark-2) / <alpha-value>)',
        'dark-3': 'rgb(var(--color-dark-3) / <alpha-value>)',
        'dark-4': 'rgb(var(--color-dark-4) / <alpha-value>)',
        'light-1': 'rgb(var(--color-light-1) / <alpha-value>)',
        'light-2': 'rgb(var(--color-light-2) / <alpha-value>)',
        'light-3': 'rgb(var(--color-light-3) / <alpha-value>)',
        'light-4': 'rgb(var(--color-light-4) / <alpha-value>)',
      },
      screens: {
        xs: '480px',
      },
      width: {
        '420': '420px',
        '465': '465px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindAnimate],
};
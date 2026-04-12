/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#111111',
        card: '#161616',
        border: '#2a2a2a',
        accent: '#c8f135',
        'text-primary': '#f0f0f0',
        'text-muted': '#666666',
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

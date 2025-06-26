/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Custom colors for dark mode
        dark: {
          50: '#1a1a1a',
          100: '#2d2d2d',
          200: '#3d3d3d',
          300: '#4d4d4d',
          400: '#5d5d5d',
          500: '#6d6d6d',
          600: '#7d7d7d',
          700: '#8d8d8d',
          800: '#9d9d9d',
          900: '#adadad',
        }
      }
    },
  },
  plugins: [],
};

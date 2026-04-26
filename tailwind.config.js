/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./pages/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Elegant wedding jewelry palette
        ivory: '#FFFEF7',
        champagne: '#F7E7CE',
        gold: {
          50: '#FBF8F1',
          100: '#F5EDD8',
          200: '#E8D5A3',
          300: '#D4B96A',
          400: '#C9A227',
          500: '#B8860B',
          600: '#996515',
          700: '#7A4F14',
          800: '#654118',
          900: '#553719',
        },
        rose: {
          50: '#FFF5F5',
          100: '#FFE8E8',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Cormorant Garamond', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

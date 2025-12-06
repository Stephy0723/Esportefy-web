/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Aquí conectamos las fuentes que pusiste en el HTML
        sans: ['Inter', 'sans-serif'], 
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        // Colores personalizados
        primary: '#000000', 
        secondary: '#1a1a1a',
      }
    },
  },
  plugins: [],
}
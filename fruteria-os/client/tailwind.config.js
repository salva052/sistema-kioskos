/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de la fruteria, anclada en el logo (granja + campos verdes)
        campo:   { DEFAULT: '#4A7C2F', dark: '#2D5016', light: '#6B9A4D' },
        crema:   '#F7F5EF',
        hueso:   '#FFFFFF',
        tierra:  '#A6612C',
        carbon:  '#2A2A28',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        suave: '0 1px 3px rgba(45,80,22,0.08), 0 1px 2px rgba(45,80,22,0.04)',
        tarjeta: '0 2px 12px rgba(45,80,22,0.07)',
      },
    },
  },
  plugins: [],
};

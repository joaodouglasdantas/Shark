const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './public/*.html',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.js',
    './app/views/**/*.{erb,haml,html,slim}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Paleta Lavix — dark com laranja neon
        neon: {
          DEFAULT: '#FF6B00',
          50: '#FFF3E6',
          100: '#FFE0BF',
          200: '#FFBF7F',
          300: '#FF9F40',
          400: '#FF8515',
          500: '#FF6B00',
          600: '#CC5600',
          700: '#994000',
          800: '#662B00',
          900: '#331500',
        },
        ink: {
          50:  '#F4F4F5',
          100: '#E4E4E7',
          200: '#A1A1AA',
          300: '#71717A',
          400: '#52525B',
          500: '#3F3F46',
          600: '#27272A',
          700: '#1F1F23',
          800: '#18181B',
          900: '#0B0B0F',
        },
      },
      boxShadow: {
        'neon': '0 0 0 1px rgba(255, 107, 0, 0.35), 0 10px 30px -10px rgba(255, 107, 0, 0.45)',
        'glow': '0 0 20px rgba(255, 107, 0, 0.25)',
      },
      backgroundImage: {
        'radial-fade': 'radial-gradient(ellipse at top, rgba(255,107,0,0.10), transparent 60%)',
      },
    },
  },
  plugins: []
}

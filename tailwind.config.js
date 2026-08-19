/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
        display: ['var(--font-display)', 'serif'],
        cinzel: ['var(--font-cinzel)', 'serif'],
        script: ['var(--font-script)', 'cursive'],
        italiana: ['var(--font-italiana)', 'serif'],
        marcellus: ['var(--font-marcellus)', 'serif'],
        vibes: ['var(--font-vibes)', 'cursive'],
        lora: ['var(--font-lora)', 'serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        allura: ['var(--font-allura)', 'cursive'],
        mrs: ['var(--font-mrs-saint)', 'cursive'],
        jost: ['var(--font-jost)', 'sans-serif'],
        amiri: ['var(--font-amiri)', 'serif'],
        malayalam: ['var(--font-malayalam)', 'serif'],
      },
    },
  },
  plugins: [],
};

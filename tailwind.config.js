export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4fd1c5',
          DEFAULT: '#38b2ac',
          dark: '#319795',
        },
        secondary: {
          light: '#f7fafc',
          DEFAULT: '#edf2f7',
          dark: '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
};

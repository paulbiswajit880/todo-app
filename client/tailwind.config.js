/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Colours taken from the Figma design.
      colors: {
        primary: {
          DEFAULT: '#4566EC', // buttons, selected day, checkboxes
          dark: '#2B3DA6', // progress bar fill
          light: '#D6DCFB', // progress track, icon backgrounds
          soft: '#EEF1FE', // "Task Complete" card
        },
        danger: {
          DEFAULT: '#E5484D',
          soft: '#FDE4E4', // "Task Pending" card
        },
        ink: '#1C1C1E',
        muted: '#9B9BA3',
        line: '#ECECF0',
        canvas: '#FAFAFC',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
      boxShadow: {
        sheet: '0 -8px 32px rgb(28 28 30 / 0.12)',
        fab: '0 8px 20px rgb(69 102 236 / 0.4)',
      },
    },
  },
  plugins: [],
};

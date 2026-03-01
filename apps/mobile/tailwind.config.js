/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins-Regular'],
        poppinsMedium: ['Poppins-Medium'],
        poppinsSemiBold: ['Poppins-SemiBold'],
        dmserif: ['DMSerifText-Regular'],
        inter: ['Inter_24pt-Regular'],
        interMedium: ['Inter_24pt-Medium'],
        interSemiBold: ['Inter_24pt-SemiBold'],
      },
      colors: {
        primary: '#376BF5',
        lightBlue: '#EFF6FF',
        secondary: '#FFA500',
        darkerWhite: '#F8F9FA',
        text: '#333333',
        grey: {
          100: '#E5E7EB',
          200: '#D1D5DB',
          300: '#BDBDBD',
          400: '#9CA3AF',
          500: '#6C757D',
        },
        greenHulk: {
          100: '#E6F4EA',
          200: '#22C55E',
        },
        redHead: {
          50: '#FDA4AF',
          100: '#FF4B4B',
          200: '#E50914',
        },
        yellowish: {
          100: '#FFF8E1',
          200: '#FACC15',
        }
      }
    },
  },
  plugins: [],
}

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
      }
    },
  },
  plugins: [],
}
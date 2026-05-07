/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        youtube: {
          red: "#FF0000",
          black: "#0F0F0F",
          dark: "#030303",
          light: "#F1F1F1",
          gray: "#AAAAAA",
        },
      },
    },
  },
  plugins: [],
};

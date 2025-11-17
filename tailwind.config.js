/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.js"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'colab-med': ['ColabMed'],
        'colab-reg': ['ColabReg'],
        'colab-bold': ['ColabBol'],
        'colab-light': ['ColabLig'],
        'colab-thin': ['ColabThi'],
      },
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        black: "#181818",
        // blue: "#7bcefa",
        green: "#145D3E",
        "green-light": "#238358",
        "green-bright": "#52DC90",
        "green-pale": "#ecf1ec",
        // grey: "#F2F2F2",
        // "grey-dark": "#262626",
        // "grey-medium": "#3E3E3E",
        orange: "#D6A241",
        yellow: "#FFD660",
        background: "#ffffff",
        foreground: "#3E3E3E",
        inset: "#262626",
        outset: "#3f3e3e",
        "inset-border": "#3e3e3e",
        danger: "#bf5a5a",
        ticket: "#D6A241",
        warning: "#D6A241",
        "button-disabled": "#145D3E",
        primary: "#238358"
      },
      fontFamily: {
        sans: ["Titillium Web", defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#238358",
          "secondary": "#D6A241",
          "accent": "#52DC90",
          "neutral": "#2b3440",
          "base-100": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#D6A241",
          "error": "#bf5a5a",
        },
        dark: {
          "primary": "#238358",
          "secondary": "#D6A241",
          "accent": "#52DC90",
          "base-100": "#2b3440",
          "neutral": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#D6A241",
          "error": "#bf5a5a",
        },
      },
    ],
  }
}

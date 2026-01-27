import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FBF8F4",
          100: "#F5EFE7",
          200: "#E8DDD0",
          300: "#D9C9B4",
          400: "#C8B095",
          500: "#B79B7A",
          600: "#A28666",
          700: "#816B52",
          800: "#5E4F3D",
          900: "#3F352B",
        },
        ink: {
          50: "#F7F7F7",
          100: "#EDEDED",
          200: "#D6D6D6",
          300: "#B8B8B8",
          400: "#8F8F8F",
          500: "#6E6E6E",
          600: "#585858",
          700: "#444444",
          800: "#2F2F2F",
          900: "#1F1F1F",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

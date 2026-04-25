/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        adminBlue: "#1e3a8a",
        adminYellow: "#fbbf24",
        memberBlue: "#1e40af",
        memberOrange: "#f97316",
      },
    },
  },
  plugins: [],
};

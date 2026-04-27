/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        adminBlue: "#3b82f6",
        adminOrange: "#f97316",
        memberBlue: "#1e40af",
        memberOrange: "#f97316",
      },
    },
  },
  plugins: [],
};

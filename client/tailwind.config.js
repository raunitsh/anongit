/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#04131f",
        mist: "#d9e7f5",
        accent: "#f97316",
        teal: "#2dd4bf"
      },
      boxShadow: {
        panel: "0 20px 60px rgba(4, 19, 31, 0.35)"
      }
    }
  },
  plugins: []
};

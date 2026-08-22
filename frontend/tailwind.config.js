/** @type {import('tailwindcss').Config} */
export default {
  // "content" tells Tailwind: "Look inside these files to find class names"
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        // I added custom colors so you can use bg-primary, text-danger easily
        primary: '#2563EB',
        danger: '#DC2626',
        success: '#16A34A',
      }
    },
  },
  plugins: [],
}
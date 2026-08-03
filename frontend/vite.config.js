/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef1f8",
          100: "#d7deee",
          200: "#aebddc",
          300: "#8299c8",
          400: "#5c78af",
          500: "#3d5a94",
          600: "#2c4a7c",
          700: "#22375c",
          DEFAULT: "#1a2b4c",
          800: "#16233d",
          900: "#0f1829"
        },
        success: { 50: "#ecfdf3", 100: "#d1fae5", 600: "#16a34a", 700: "#15803d" },
        warning: { 50: "#fffbeb", 100: "#fef3c7", 600: "#d97706", 700: "#b45309" },
        danger:  { 50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c" },
        info:    { 50: "#eff6ff", 100: "#dbeafe", 600: "#2563eb", 700: "#1d4ed8" }
      },
      fontFamily: {
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"]
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.875rem", { lineHeight: "1.4rem" }],
        lg: ["1rem", { lineHeight: "1.5rem" }],
        xl: ["1.125rem", { lineHeight: "1.65rem" }],
        "2xl": ["1.375rem", { lineHeight: "1.85rem" }],
        "3xl": ["1.75rem", { lineHeight: "2.1rem" }]
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 24, 41, 0.04), 0 1px 3px rgba(15, 24, 41, 0.06)",
        "card-hover": "0 4px 12px rgba(15, 24, 41, 0.08)",
        modal: "0 20px 40px -8px rgba(15, 24, 41, 0.25)"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" }
        }
      },
      animation: {
        shimmer: "shimmer 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
}
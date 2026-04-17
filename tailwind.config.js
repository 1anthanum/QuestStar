/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "bounce-slow": "bounce-slow 0.6s ease-in-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "scale-in": "scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "float-up": "float-up 1.2s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "stamp": "stamp 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "breathe": "breathe 3s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.35s ease-out forwards",
        "pop": "pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
      },
      keyframes: {
        "bounce-slow": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "float-up": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "70%": { opacity: "1", transform: "translateY(-60px) scale(1.2)" },
          "100%": { opacity: "0", transform: "translateY(-90px) scale(0.8)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(251,191,36,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.2)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "stamp": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.3)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.02)", opacity: "1" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "70%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        foreground: "#f8fafc",
        card: "#0f172a",
        muted: "#0b1220",
        border: "#1e293b",
        primary: "#2563eb",
        success: "#34d399",
        warning: "#f59e0b",
        danger: "#f87171",
        free: "#94a3b8",
        pro: "#fbbf24",
        expert: "#a78bfa",
        institutional: "#fb7185",
        admin: "#60a5fa",
      },
      boxShadow: {
        glow: "0 18px 60px rgba(37, 99, 235, 0.18)",
        card: "0 20px 50px rgba(2, 6, 23, 0.38)",
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"],
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top right, rgba(59,130,246,0.22), transparent 28%), radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 22%), linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,1))",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(-12px) translateX(12px)" },
          "100%": { opacity: "1", transform: "translateY(0) translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.25s ease-out",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

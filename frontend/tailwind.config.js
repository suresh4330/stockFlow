/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        // Spec-driven sizes
        "label": ["12px", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        "body": ["14px", { lineHeight: "1.6" }],
        "section": ["15px", { lineHeight: "1.4" }],
        "page": ["20px", { lineHeight: "1.3" }],
        "metric": ["24px", { lineHeight: "1.2" }],
      },
      letterSpacing: {
        label: "0.01em",
      },
      borderRadius: {
        DEFAULT: "6px",
        card: "8px",
        modal: "10px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        micro: "120ms",
        standard: "200ms",
        page: "300ms",
      },
      keyframes: {
        "skeleton-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "status-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.4)", opacity: "0.35" },
        },
      },
      animation: {
        "skeleton-pulse": "skeleton-pulse 1.5s ease-in-out infinite",
        "status-pulse": "status-pulse 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")({ strategy: "class" })],
};

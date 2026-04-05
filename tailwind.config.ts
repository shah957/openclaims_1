import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-text)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(108, 99, 255, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;

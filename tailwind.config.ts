import type { Config } from "tailwindcss";

/** Every colour resolves to a theme token, so light/dark swap in one place. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        subtle: token("subtle"),
        fill: token("fill"),
        line: token("line"),
        "line-strong": token("line-strong"),

        ink: token("ink"),
        "ink-soft": token("ink-soft"),
        "ink-muted": token("ink-muted"),
        "ink-faint": token("ink-faint"),

        accent: token("accent"),
        "on-accent": token("on-accent"),

        "good-soft": token("good-soft"),
        "good-strong": token("good-strong"),
        "warn-soft": token("warn-soft"),
        "warn-strong": token("warn-strong"),
        "bad-soft": token("bad-soft"),
        "bad-strong": token("bad-strong")
      },
      borderColor: {
        DEFAULT: token("line")
      }
    }
  },
  plugins: []
};

export default config;

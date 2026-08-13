"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ThemeChoice = "dark" | "light" | "system";

export const THEME_KEY = "availability-roster-planner.theme";

/** Dark is this app's default, so an unset preference resolves to dark. */
export const DEFAULT_THEME: ThemeChoice = "dark";

export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }
}

const options: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "Match my device", icon: Monitor }
];

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY) as ThemeChoice | null;
    setChoice(
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : DEFAULT_THEME
    );
    setReady(true);
  }, []);

  function pick(next: ThemeChoice) {
    setChoice(next);
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 rounded-xl border border-line-strong bg-surface p-1"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = ready && option.id === choice;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.label}
            onClick={() => pick(option.id)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              selected
                ? "bg-accent text-on-accent"
                : "text-ink-muted hover:bg-fill hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

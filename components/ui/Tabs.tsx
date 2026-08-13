"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  /** Small count or status shown after the label. */
  badge?: string;
  /** Turns the badge amber to flag something needing attention. */
  badgeAlert?: boolean;
};

type Props<T extends string> = {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
};

export function Tabs<T extends string>({ tabs, active, onChange, ariaLabel }: Props<T>) {
  return (
    // min-w-0 stops the scroller's content from widening the whole page on mobile.
    <div className="-mx-4 min-w-0 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="inline-flex min-w-full gap-1 rounded-xl border border-line bg-surface p-1 sm:min-w-0"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                selected
                  ? "bg-accent text-on-accent"
                  : "text-ink-soft hover:bg-fill hover:text-ink"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                    selected
                      ? "bg-surface/20 text-white"
                      : tab.badgeAlert
                        ? "bg-warn-soft text-warn-strong"
                        : "bg-fill text-ink-soft"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

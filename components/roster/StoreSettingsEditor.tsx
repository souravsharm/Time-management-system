"use client";

import { Clock, Store, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { hoursLabel } from "@/lib/roster/analytics";
import { DAY_MINUTES } from "@/lib/scheduling/shiftTime";
import { dayNames, orderedWeek, parseTimeToMinutes } from "@/lib/scheduling/time";
import type { DayOfWeek, StoreSettings } from "@/lib/scheduling/types";
import { cn } from "@/lib/utils";

type Props = {
  store: StoreSettings;
  onChange: (patch: Partial<StoreSettings>) => void;
};

function toTimeValue(minutes: number): string {
  const clamped = Math.min(DAY_MINUTES, Math.max(0, minutes));
  if (clamped === DAY_MINUTES) return "23:59";
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(
    clamped % 60
  ).padStart(2, "0")}`;
}

export function StoreSettingsEditor({ store, onChange }: Props) {
  function setDayHours(day: DayOfWeek, patch: { open?: string; close?: string }) {
    const current = store.hours[day] ?? { openMinutes: 9 * 60, closeMinutes: 17 * 60 };
    let openMinutes = current.openMinutes;
    let closeMinutes = current.closeMinutes;

    try {
      if (patch.open !== undefined) openMinutes = parseTimeToMinutes(patch.open);
      if (patch.close !== undefined) {
        closeMinutes =
          patch.close === "23:59" ? DAY_MINUTES : parseTimeToMinutes(patch.close);
      }
    } catch {
      return;
    }

    onChange({ hours: { ...store.hours, [day]: { openMinutes, closeMinutes } } });
  }

  function toggleClosed(day: DayOfWeek) {
    onChange({
      hours: {
        ...store.hours,
        [day]: store.hours[day] ? null : { openMinutes: 9 * 60, closeMinutes: 17 * 60 }
      }
    });
  }

  const weeklyOpen = store.alwaysOpen
    ? DAY_MINUTES * 7
    : orderedWeek.reduce<number>((total, day) => {
        const hours = store.hours[day];
        return total + (hours ? hours.closeMinutes - hours.openMinutes : 0);
      }, 0);

  return (
    <div className="grid gap-4">
      <Card
        title="When is the store open?"
        hint="This sets the hours the charts measure against, and how far the availability grid stretches."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={store.alwaysOpen}
            onClick={() => onChange({ alwaysOpen: true })}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              store.alwaysOpen
                ? "border-accent bg-surface ring-1 ring-accent"
                : "border-line-strong bg-surface hover:bg-subtle"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                store.alwaysOpen ? "bg-accent text-on-accent" : "bg-fill text-ink-muted"
              )}
            >
              <Clock className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold text-ink">
                Open 24 hours, 7 days
              </span>
              <span className="block text-sm text-ink-muted">
                Round-the-clock trading. Overnight shifts are expected.
              </span>
            </span>
          </button>

          <button
            type="button"
            aria-pressed={!store.alwaysOpen}
            onClick={() => onChange({ alwaysOpen: false })}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              !store.alwaysOpen
                ? "border-accent bg-surface ring-1 ring-accent"
                : "border-line-strong bg-surface hover:bg-subtle"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                !store.alwaysOpen ? "bg-accent text-on-accent" : "bg-fill text-ink-muted"
              )}
            >
              <Store className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold text-ink">
                Set my opening hours
              </span>
              <span className="block text-sm text-ink-muted">
                Different hours per day, or closed on some days.
              </span>
            </span>
          </button>
        </div>

        {!store.alwaysOpen && (
          <div className="mt-4 grid gap-2">
            {orderedWeek.map((day) => {
              const hours = store.hours[day];
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3"
                >
                  <span className="w-24 shrink-0 text-sm font-bold text-ink">
                    {dayNames[day]}
                  </span>

                  {hours ? (
                    <>
                      <label className="flex items-center gap-2 text-sm text-ink-soft">
                        Opens
                        <input
                          type="time"
                          value={toTimeValue(hours.openMinutes)}
                          onChange={(event) =>
                            setDayHours(day, { open: event.target.value })
                          }
                          className="h-10 rounded-lg border border-line-strong bg-surface px-2.5 text-sm outline-none focus:border-accent"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-ink-soft">
                        Closes
                        <input
                          type="time"
                          value={toTimeValue(hours.closeMinutes)}
                          onChange={(event) =>
                            setDayHours(day, { close: event.target.value })
                          }
                          className="h-10 rounded-lg border border-line-strong bg-surface px-2.5 text-sm outline-none focus:border-accent"
                        />
                      </label>
                      {hours.closeMinutes <= hours.openMinutes && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-bad-strong">
                          <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                          Closing time must be after opening
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-ink-muted">Closed</span>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => toggleClosed(day)}
                  >
                    {hours ? "Mark closed" : "Mark open"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 rounded-xl bg-subtle px-4 py-3 text-sm text-ink-soft">
          That&rsquo;s <strong>{hoursLabel(weeklyOpen)}</strong> of trading a week to cover.
        </p>
      </Card>

      <Card
        title="Your staffing rules"
        hint="Rules the planner enforces when you add or edit a shift."
      >
        <label className="grid max-w-xs gap-1.5 text-sm font-medium text-ink-soft">
          Longest a single shift can be
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={24}
              value={store.maxShiftHours}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value)) {
                  onChange({ maxShiftHours: Math.min(24, Math.max(1, value)) });
                }
              }}
              className="h-11 w-24 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-line"
            />
            <span className="text-sm text-ink-soft">hours</span>
          </div>
        </label>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Adding a shift longer than this is blocked — so a 12am–11:59pm shift gets
          stopped before it ever reaches the roster. Split long stretches into separate
          shifts instead.
        </p>
        <p className="mt-3 max-w-prose text-sm text-ink-muted">
          Per-person limits (weekly hours, days a week, contracted hours) live on the{" "}
          <strong>Team</strong> tab.
        </p>
      </Card>
    </div>
  );
}

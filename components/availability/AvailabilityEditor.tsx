"use client";

import { Check, Eraser, MousePointerClick, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { AvailabilityGrid } from "@/components/grid/AvailabilityGrid";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  slotSetToWindows,
  windowsToSlotSet
} from "@/lib/grid";
import { hoursLabel } from "@/lib/roster/analytics";
import { personColor } from "@/lib/theme/palette";
import type { AvailabilityWindow, Person } from "@/lib/scheduling/types";
import { cn } from "@/lib/utils";

type Props = {
  people: Person[];
  availability: AvailabilityWindow[];
  /** Grid range, driven by the store's trading hours (0–24 for a 24/7 store). */
  startHour?: number;
  endHour?: number;
  onSetAvailability: (personId: string, windows: Omit<AvailabilityWindow, "id">[]) => void;
};

export function AvailabilityEditor({
  people,
  availability,
  startHour = GRID_START_HOUR,
  endHour = GRID_END_HOUR,
  onSetAvailability
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(people[0]?.id ?? null);

  const resolvedId =
    activeId && people.some((person) => person.id === activeId)
      ? activeId
      : (people[0]?.id ?? null);

  const activeIndex = people.findIndex((person) => person.id === resolvedId);
  const activePerson = activeIndex >= 0 ? people[activeIndex] : null;

  const slotSet = useMemo(
    () =>
      resolvedId
        ? windowsToSlotSet(availability, resolvedId, startHour, endHour)
        : new Set<string>(),
    [availability, endHour, resolvedId, startHour]
  );

  const minutesByPerson = useMemo(() => {
    const map = new Map<string, number>();
    for (const person of people) {
      const total = availability
        .filter((window) => window.participantId === person.id)
        .reduce((sum, window) => sum + (window.endMinutes - window.startMinutes), 0);
      map.set(person.id, total);
    }
    return map;
  }, [availability, people]);

  const withHours = people.filter((person) => (minutesByPerson.get(person.id) ?? 0) > 0).length;

  function handleChange(next: Set<string>) {
    if (!resolvedId) return;
    onSetAvailability(resolvedId, slotSetToWindows(next, resolvedId, startHour));
  }

  if (people.length === 0) {
    return (
      <Card>
        <EmptyState icon={<UserPlus className="h-5 w-5" />} title="Add your team first">
          Once people are on the list you can shade in the hours each of them can work.
        </EmptyState>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card
        title="Who are you filling in for?"
        hint={`${withHours} of ${people.length} have hours marked in.`}
      >
        <div className="flex flex-wrap gap-2">
          {people.map((person, index) => {
            const minutes = minutesByPerson.get(person.id) ?? 0;
            const selected = person.id === resolvedId;
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => setActiveId(person.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  selected
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line-strong bg-surface text-ink-soft hover:bg-subtle"
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: personColor(index) }}
                />
                {person.name}
                {minutes > 0 && (
                  <Check
                    className={cn("h-4 w-4", selected ? "text-on-accent/70" : "text-good-strong")}
                    aria-label="hours marked"
                  />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {activePerson && (
        <Card
          title={`When can ${activePerson.name} work?`}
          hint="Click and drag down a column to shade the free hours. Drag over shaded cells to rub them out."
          action={
            <Button
              size="sm"
              variant="ghost"
              icon={<Eraser className="h-4 w-4" />}
              onClick={() => handleChange(new Set())}
              disabled={slotSet.size === 0}
            >
              Clear
            </Button>
          }
        >
          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 rounded-[3px]"
                style={{ backgroundColor: personColor(activeIndex) }}
              />
              Available
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 rounded-[3px] border border-line-strong bg-surface"
              />
              Not available
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <MousePointerClick className="h-4 w-4" aria-hidden="true" />
              {hoursLabel(minutesByPerson.get(activePerson.id) ?? 0)} marked in
            </span>
          </div>

          <AvailabilityGrid
            selected={slotSet}
            onChange={handleChange}
            startHour={startHour}
            endHour={endHour}
            color={personColor(activeIndex)}
          />
        </Card>
      )}
    </div>
  );
}

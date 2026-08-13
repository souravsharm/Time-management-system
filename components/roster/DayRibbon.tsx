"use client";

import { AlertTriangle, CheckCircle2, CircleSlash, MoonStar } from "lucide-react";
import { useMemo } from "react";
import {
  buildCoverageBands,
  buildDayRibbon,
  friendlyRange,
  friendlyTime,
  segmentsForDay,
  type RosterInsights
} from "@/lib/roster/analytics";
import { personColor, personFill, statusColors } from "@/lib/theme/palette";
import type { DayOfWeek, Person, ShiftRequirement } from "@/lib/scheduling/types";

type Props = {
  /** All shifts — the ribbon picks out whatever touches this day, overnight included. */
  shifts: ShiftRequirement[];
  day: DayOfWeek;
  people: Person[];
  insights: RosterInsights;
};

const bandColor = {
  full: statusColors.good,
  short: statusColors.warning,
  empty: statusColors.critical
} as const;

const bandWord = {
  full: "Fully staffed",
  short: "Short-staffed",
  empty: "Nobody on"
} as const;

/**
 * The store's trading day as one horizontal track: a coverage band on top, then a
 * lane per person showing exactly which part of the day is theirs.
 */
export function DayRibbon({ shifts, day, people, insights }: Props) {
  const onDay = useMemo(() => segmentsForDay(shifts, day), [day, shifts]);
  const stats = insights.perDay.find((entry) => entry.day === day);

  const bounds = useMemo(() => {
    if (stats?.openStart !== null && stats?.openEnd != null && stats.openStart != null) {
      return { openStart: stats.openStart, openEnd: stats.openEnd };
    }
    if (onDay.length === 0) return null;
    return {
      openStart: Math.min(...onDay.map((entry) => entry.segment.startMinutes)),
      openEnd: Math.max(...onDay.map((entry) => entry.segment.endMinutes))
    };
  }, [onDay, stats]);

  const bands = useMemo(
    () => (bounds ? buildCoverageBands(shifts, day, insights, bounds) : []),
    [bounds, day, insights, shifts]
  );
  const lanes = useMemo(() => buildDayRibbon(shifts, day, insights), [day, insights, shifts]);

  if (onDay.length === 0 || !bounds) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-subtle p-8 text-center text-sm text-ink-muted">
        Nothing is rostered on this day yet.
      </div>
    );
  }

  const span = Math.max(1, bounds.openEnd - bounds.openStart);
  const ticks: number[] = [];
  for (
    let time = Math.ceil(bounds.openStart / 120) * 120;
    time <= bounds.openEnd;
    time += 120
  ) {
    ticks.push(time);
  }

  const left = (minutes: number) => ((minutes - bounds.openStart) / span) * 100;
  const width = (start: number, end: number) => ((end - start) / span) * 100;

  const orderedPeople = people
    .map((person, index) => ({ person, index, blocks: lanes.get(person.id) ?? [] }))
    .filter((lane) => lane.blocks.length > 0)
    .sort((a, b) => a.blocks[0].startMinutes - b.blocks[0].startMinutes);

  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Time axis */}
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <div />
          <div className="relative h-5 text-xs font-medium text-ink-muted">
            {ticks.map((tick) => {
              const position = left(tick);
              // Keep the first and last labels inside the track instead of clipping.
              const nudge =
                position > 96 ? "-100%" : position < 4 ? "0%" : "-50%";
              return (
                <span
                  key={tick}
                  className="absolute top-0 whitespace-nowrap tabular-nums"
                  style={{ left: `${position}%`, transform: `translateX(${nudge})` }}
                >
                  {friendlyTime(tick)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Store coverage band */}
        <div className="mt-1 grid grid-cols-[120px_1fr] items-center gap-3">
          <span className="text-sm font-bold text-ink">Store open</span>
          <div className="relative h-7 rounded-lg bg-fill">
            {bands.map((band) => (
              <div
                key={`${band.startMinutes}-${band.state}`}
                className="absolute inset-y-0 rounded-[4px]"
                style={{
                  left: `${left(band.startMinutes)}%`,
                  width: `${width(band.startMinutes, band.endMinutes)}%`,
                  backgroundColor: bandColor[band.state],
                  boxShadow: "0 0 0 2px rgb(var(--surface))"
                }}
                title={`${friendlyRange(band.startMinutes, band.endMinutes)} — ${bandWord[band.state]}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-3 pl-[132px] text-xs font-medium text-ink-soft">
          <LegendChip color={bandColor.full} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
            Fully staffed
          </LegendChip>
          <LegendChip color={bandColor.short} icon={<AlertTriangle className="h-3.5 w-3.5" />}>
            Short-staffed
          </LegendChip>
          <LegendChip color={bandColor.empty} icon={<CircleSlash className="h-3.5 w-3.5" />}>
            Nobody on
          </LegendChip>
        </div>

        {/* Person lanes */}
        <div className="mt-4 grid gap-1.5 border-t border-line pt-4">
          {orderedPeople.length === 0 ? (
            <p className="pl-[132px] text-sm text-ink-muted">
              Nobody could be rostered for this day.
            </p>
          ) : (
            orderedPeople.map(({ person, index, blocks }) => (
              <div key={person.id} className="grid grid-cols-[120px_1fr] items-center gap-3">
                <span className="flex items-center gap-2 overflow-hidden">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: personColor(index) }}
                  />
                  <span className="truncate text-sm font-medium text-ink">
                    {person.name}
                  </span>
                </span>
                <div className="relative h-8 rounded-lg bg-subtle">
                  {blocks.map((block) => {
                    const blockWidth = width(block.startMinutes, block.endMinutes);
                    const overnight =
                      block.continuedFromPreviousDay || block.continuesIntoNextDay;
                    return (
                      <div
                        key={`${block.shiftId}-${block.startMinutes}`}
                        className="absolute inset-y-0 flex items-center justify-center gap-1 overflow-hidden rounded-md px-1.5"
                        style={{
                          left: `${left(block.startMinutes)}%`,
                          width: `${blockWidth}%`,
                          ...personFill(index),
                          boxShadow: "0 0 0 2px rgb(var(--surface))"
                        }}
                        title={`${person.name}: ${friendlyRange(block.startMinutes, block.endMinutes)}${
                          block.continuedFromPreviousDay
                            ? " (started the night before)"
                            : block.continuesIntoNextDay
                              ? " (runs into the next day)"
                              : ""
                        }`}
                      >
                        {overnight && blockWidth >= 10 && (
                          <MoonStar
                            className="h-3 w-3 shrink-0 text-white"
                            aria-hidden="true"
                          />
                        )}
                        {blockWidth >= 18 && (
                          <span className="truncate text-[11px] font-bold text-white tabular-nums">
                            {friendlyRange(block.startMinutes, block.endMinutes)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <p className="mt-3 pl-[132px] text-xs text-ink-muted">
          <MoonStar className="mb-0.5 inline h-3.5 w-3.5" aria-hidden="true" /> marks a block
          that carries over midnight.
        </p>
      </div>
    </div>
  );
}

function LegendChip({
  color,
  icon,
  children
}: {
  color: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  // Status colour never carries the meaning alone: swatch + icon + word.
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 rounded-[3px]"
        style={{ backgroundColor: color }}
      />
      <span aria-hidden="true" className="text-ink-muted">
        {icon}
      </span>
      {children}
    </span>
  );
}

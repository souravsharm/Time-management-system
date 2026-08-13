"use client";

import { useRef, useState } from "react";
import { dayNames, orderedWeek } from "@/lib/scheduling/time";
import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  numSlots,
  slotKey,
  slotLabel
} from "@/lib/grid";
import { heatSteps } from "@/lib/theme/palette";
import type { DayOfWeek } from "@/lib/scheduling/types";

type Props = {
  counts: Map<string, number>;
  maxCount: number;
  days?: DayOfWeek[];
  startHour?: number;
  endHour?: number;
};

const CELL_H = 18;
const LABEL_W = 54;

/** Sequential encoding: one hue, light → dark. Steps from the blue ramp. */
function heatColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "transparent";
  const ratio = count / max;
  if (ratio <= 0.25) return heatSteps[0];
  if (ratio <= 0.5) return heatSteps[1];
  if (ratio <= 0.75) return heatSteps[2];
  return heatSteps[3];
}

export function HeatmapGrid({
  counts,
  maxCount,
  days = orderedWeek,
  startHour = GRID_START_HOUR,
  endHour = GRID_END_HOUR
}: Props) {
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const slots = numSlots(startHour, endHour);

  return (
    <div className="relative overflow-x-auto rounded-xl border border-line bg-surface">
      <div style={{ userSelect: "none" }}>
        {/* Header */}
        <div className="flex border-b border-line bg-subtle">
          <div style={{ width: LABEL_W, minWidth: LABEL_W }} />
          {days.map((day) => (
            <div
              key={day}
              className="flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-ink-soft"
            >
              {dayNames[day].slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Slot rows */}
        {Array.from({ length: slots }, (_, i) => {
          const isHour = i % 2 === 0;
          return (
            <div key={i} className="flex" style={{ height: CELL_H }}>
              <div
                style={{ width: LABEL_W, minWidth: LABEL_W, height: CELL_H }}
                className="shrink-0 flex items-center justify-end pr-2"
              >
                {isHour && (
                  <span className="text-[11px] font-medium leading-none text-ink-faint">
                    {slotLabel(i, startHour)}
                  </span>
                )}
              </div>

              {days.map((day) => {
                const key = slotKey(day, i);
                const count = counts.get(key) ?? 0;
                return (
                  <div
                    key={key}
                    style={{ height: CELL_H, backgroundColor: heatColor(count, maxCount) }}
                    className={[
                      "flex-1 border-r border-line",
                      isHour ? "border-t border-t-line-strong" : "border-t border-t-line",
                      count > 0 ? "cursor-default" : ""
                    ].join(" ")}
                    onMouseEnter={(e) => {
                      if (count > 0) {
                        setTooltip({
                          label: `${slotLabel(i, startHour)} — ${count}/${maxCount} free`,
                          x: e.clientX,
                          y: e.clientY
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Scale legend */}
      <div className="flex items-center gap-2 border-t border-line bg-subtle px-4 py-2.5">
        <span className="text-xs font-medium text-ink-muted">Nobody free</span>
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <div
            key={ratio}
            className="h-3.5 w-7 rounded-sm border border-line"
            style={{
              backgroundColor: heatColor(
                Math.round(ratio * Math.max(maxCount, 1)),
                Math.max(maxCount, 1)
              )
            }}
          />
        ))}
        <span className="text-xs font-medium text-ink-muted">Everyone free</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-accent px-2 py-1 text-xs font-medium text-white shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { dayNames, orderedWeek } from "@/lib/scheduling/time";
import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  numSlots,
  slotKey,
  slotLabel
} from "@/lib/grid";
import type { DayOfWeek } from "@/lib/scheduling/types";

type Props = {
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  days?: DayOfWeek[];
  startHour?: number;
  endHour?: number;
  disabled?: boolean;
  /** Fill colour for shaded cells — matches the person's colour on the charts. */
  color?: string;
};

// A 24/7 store renders 48 rows, so keep each one compact.
const CELL_H = 15;
const LABEL_W = 54;

export function AvailabilityGrid({
  selected,
  onChange,
  days = orderedWeek,
  startHour = GRID_START_HOUR,
  endHour = GRID_END_HOUR,
  disabled = false,
  color = "rgb(var(--series-1))"
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [paintMode, setPaintMode] = useState<"add" | "remove">("add");
  const visited = useRef(new Set<string>());
  const slots = numSlots(startHour, endHour);

  useEffect(() => {
    function end() {
      setIsDragging(false);
      visited.current.clear();
    }
    window.addEventListener("mouseup", end);
    window.addEventListener("touchend", end);
    return () => {
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchend", end);
    };
  }, []);

  function startDrag(key: string) {
    if (disabled) return;
    const mode = selected.has(key) ? "remove" : "add";
    setPaintMode(mode);
    setIsDragging(true);
    visited.current = new Set([key]);
    const next = new Set(selected);
    mode === "add" ? next.add(key) : next.delete(key);
    onChange(next);
  }

  function continueDrag(key: string) {
    if (!isDragging || disabled || visited.current.has(key)) return;
    visited.current.add(key);
    const next = new Set(selected);
    paintMode === "add" ? next.add(key) : next.delete(key);
    onChange(next);
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-line bg-surface"
      style={{ userSelect: "none", WebkitUserSelect: "none" as "none" }}
    >
      {/* Day header */}
      <div className="sticky top-0 z-10 flex border-b border-line bg-subtle">
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
              const on = selected.has(key);
              return (
                <div
                  key={key}
                  data-key={key}
                  style={{
                    height: CELL_H,
                    backgroundColor: on ? color : undefined
                  }}
                  className={[
                    "flex-1 border-r border-line transition-colors duration-75",
                    isHour ? "border-t border-t-line-strong" : "border-t border-t-line",
                    on ? "" : disabled ? "bg-surface" : "bg-surface hover:bg-line",
                    disabled ? "cursor-default" : "cursor-pointer"
                  ].join(" ")}
                  onMouseDown={() => startDrag(key)}
                  onMouseEnter={() => continueDrag(key)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    startDrag(key);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const t = e.touches[0];
                    const el = document.elementFromPoint(t.clientX, t.clientY);
                    const k = el?.getAttribute("data-key");
                    if (k) continueDrag(k);
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { gapDegrees, ringSegmentPath } from "@/components/charts/arc";
import { chartInk } from "@/lib/theme/palette";

export type ShareSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
  /** Shown under the name in the list, e.g. "3 shifts". */
  detail?: string;
  /** For a list row folded into a ring slice: which slice it belongs to. */
  groupId?: string;
};

type Props = {
  /** Ring segments. Keep this to ~6 so the donut stays readable. */
  slices: ShareSlice[];
  /**
   * The full ranked list beside the ring. Every entity appears here even when the
   * ring folds a tail into "Everyone else", so no value is hidden behind the fold.
   * Defaults to `slices`.
   */
  rows?: ShareSlice[];
  format: (value: number) => string;
  centerTitle: string;
  centerSubtitle?: string;
  emptyMessage?: string;
};

const SIZE = 200;
const OUTER = 92;
const INNER = 60;

/**
 * Part-to-whole at a glance. The donut is the quick read; the ranked list beside it
 * is the honest comparison and doubles as the table view, so no value is reachable
 * only by colour or only by hover.
 */
export function ShareDonut({
  slices,
  rows,
  format,
  centerTitle,
  centerSubtitle,
  emptyMessage = "Nothing scheduled yet."
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const visible = slices.filter((slice) => slice.value > 0);
  const listRows = (rows ?? slices).filter((row) => row.value > 0);

  if (total <= 0 || visible.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-subtle p-8 text-center text-sm text-ink-muted">
        {emptyMessage}
      </div>
    );
  }

  const gap = visible.length > 1 ? gapDegrees(OUTER, 2) : 0;
  let cursor = 0;

  const arcs = visible.map((slice) => {
    const sweep = (slice.value / total) * 360;
    const start = cursor;
    cursor += sweep;
    return {
      slice,
      path: ringSegmentPath(
        100,
        100,
        OUTER,
        INNER,
        start + gap / 2,
        Math.max(start + gap / 2, start + sweep - gap / 2)
      )
    };
  });

  const activeSlice = arcs.find((arc) => arc.slice.id === activeId)?.slice ?? null;
  const biggestRow = Math.max(...listRows.map((row) => row.value), 1);

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[auto_1fr] lg:items-start">
      <div className="mx-auto shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox="0 0 200 200"
          role="img"
          aria-label={centerTitle}
        >
          {arcs.map(({ slice, path }) => (
            <path
              key={slice.id}
              d={path}
              fill={slice.color}
              opacity={activeId && activeId !== slice.id ? 0.3 : 1}
              style={{ transition: "opacity 120ms" }}
              onMouseEnter={() => setActiveId(slice.id)}
              onMouseLeave={() => setActiveId(null)}
            >
              <title>{`${slice.label}: ${format(slice.value)}`}</title>
            </path>
          ))}

          <text
            x="100"
            y={centerSubtitle ? 96 : 103}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={chartInk.primary}
            style={{ fontSize: 21, fontWeight: 700 }}
          >
            {activeSlice ? format(activeSlice.value) : centerTitle}
          </text>
          {centerSubtitle && (
            <text
              x="100"
              y="116"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={chartInk.secondary}
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {activeSlice ? activeSlice.label : centerSubtitle}
            </text>
          )}
        </svg>
      </div>

      <ul className="grid min-w-0 gap-1">
        {listRows.map((row) => {
          const ringId = row.groupId ?? row.id;
          const pct = (row.value / total) * 100;
          return (
            <li key={row.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveId(ringId)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(ringId)}
                onBlur={() => setActiveId(null)}
                className={[
                  "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
                  activeId === ringId ? "bg-fill" : "hover:bg-subtle"
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {row.label}
                  </span>
                  {row.detail && (
                    <span className="block truncate text-xs text-ink-muted">{row.detail}</span>
                  )}
                </span>
                {/* Bar length is the honest comparison the ring can only hint at. */}
                <span
                  aria-hidden="true"
                  className="hidden h-2 w-24 shrink-0 overflow-hidden rounded-full bg-fill sm:block"
                >
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${(row.value / biggestRow) * 100}%`,
                      backgroundColor: row.color
                    }}
                  />
                </span>
                <span className="w-20 shrink-0 text-right">
                  <span className="block text-sm font-semibold text-ink tabular-nums">
                    {format(row.value)}
                  </span>
                  <span className="block text-xs text-ink-muted tabular-nums">
                    {pct < 1 ? "<1" : Math.round(pct)}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

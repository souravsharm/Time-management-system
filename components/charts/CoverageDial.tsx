"use client";

import { chartInk, coverageColor } from "@/lib/theme/palette";

type Props = {
  /** 0–100. */
  value: number;
  size?: number;
  /** Big text in the middle. Defaults to the rounded percentage. */
  centerLabel?: string;
  caption?: string;
  thickness?: number;
};

/**
 * A single ratio against a limit, so this is a meter rather than a two-slice pie:
 * one track, one fill, and the number itself does the talking.
 */
export function CoverageDial({
  value,
  size = 168,
  centerLabel,
  caption,
  thickness = 14
}: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const rounded = Math.round(clamped);
  const radius = 50 - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;
  const color = coverageColor(clamped);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${rounded}% covered`}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={chartInk.track}
          strokeWidth={thickness}
        />
        {clamped > 0 && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        )}
        <text
          x="50"
          y={caption ? 48 : 52}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={chartInk.primary}
          style={{ fontSize: 23, fontWeight: 700 }}
        >
          {centerLabel ?? `${rounded}%`}
        </text>
        {caption && (
          <text
            x="50"
            y="63"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={chartInk.secondary}
            style={{ fontSize: 8, fontWeight: 600 }}
          >
            {caption}
          </text>
        )}
      </svg>
    </div>
  );
}

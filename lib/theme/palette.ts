/**
 * Chart palette, expressed as theme tokens so light and dark swap in one place
 * (see app/globals.css). SVG `fill`/`stroke` accept these just like CSS does.
 *
 * Both modes are selected sets, each validated against its own surface:
 *   light on #ffffff — band PASS, chroma PASS, adjacent CVD ΔE 9.1, normal-vision 19.6
 *   dark  on #1c1c1b — band PASS, chroma PASS, adjacent CVD ΔE 8.4, normal-vision 19.3
 * Three light slots sit below 3:1 contrast, so every coloured mark in this app also
 * carries a visible name label or a legend row — colour never encodes alone.
 */

const SERIES_SLOTS = 8;

export const seriesColors = Array.from(
  { length: SERIES_SLOTS },
  (_, index) => `rgb(var(--series-${index + 1}))`
);

/** Reserved state colours — never used as a series identity. */
export const statusColors = {
  good: "rgb(var(--status-good))",
  warning: "rgb(var(--status-warning))",
  serious: "rgb(var(--status-serious))",
  critical: "rgb(var(--status-critical))"
} as const;

export const chartInk = {
  surface: "rgb(var(--surface))",
  track: "rgb(var(--fill))",
  gridline: "rgb(var(--line))",
  baseline: "rgb(var(--line-strong))",
  muted: "rgb(var(--ink-muted))",
  secondary: "rgb(var(--ink-soft))",
  primary: "rgb(var(--ink))",
  faint: "rgb(var(--ink-faint))"
} as const;

/** Sequential ramp for the availability heatmap: one hue, light → dark. */
export const heatSteps = [
  "rgb(var(--heat-1))",
  "rgb(var(--heat-2))",
  "rgb(var(--heat-3))",
  "rgb(var(--heat-4))"
] as const;

/** Colour follows the person, assigned in slot order. */
export function personColor(index: number): string {
  return seriesColors[index % SERIES_SLOTS];
}

/**
 * Past eight people the slots repeat rather than inventing a ninth hue. The repeat
 * carries a 45° texture so a duplicated colour is still distinguishable — composite
 * encoding, on marks big enough to show it. Names label every mark regardless.
 */
export function personFill(index: number): {
  backgroundColor: string;
  backgroundImage?: string;
} {
  const backgroundColor = personColor(index);
  if (index < SERIES_SLOTS) return { backgroundColor };

  return {
    backgroundColor,
    backgroundImage:
      "repeating-linear-gradient(45deg, rgb(var(--on-accent) / 0.42) 0 4px, rgb(var(--on-accent) / 0) 4px 9px)"
  };
}

export type CoverageLevel = "full" | "most" | "some" | "none";

export function coverageLevel(pct: number): CoverageLevel {
  if (pct >= 100) return "full";
  if (pct >= 75) return "most";
  if (pct > 0) return "some";
  return "none";
}

export function coverageColor(pct: number): string {
  const level = coverageLevel(pct);
  if (level === "full") return statusColors.good;
  if (level === "most") return statusColors.warning;
  if (level === "some") return statusColors.serious;
  return statusColors.critical;
}

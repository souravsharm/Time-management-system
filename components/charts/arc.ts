/** Shared SVG ring-arc geometry for the donut charts. */

export function polarPoint(
  cx: number,
  cy: number,
  radius: number,
  degrees: number
): { x: number; y: number } {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

/**
 * A filled donut segment between two radii. Sweeps are clamped just under a full
 * turn so the arc command never collapses to a zero-length path.
 */
export function ringSegmentPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startDegrees: number,
  endDegrees: number
): string {
  const sweep = Math.min(359.99, Math.max(0, endDegrees - startDegrees));
  const end = startDegrees + sweep;
  const largeArc = sweep > 180 ? 1 : 0;

  const outerStart = polarPoint(cx, cy, outerRadius, startDegrees);
  const outerEnd = polarPoint(cx, cy, outerRadius, end);
  const innerEnd = polarPoint(cx, cy, innerRadius, end);
  const innerStart = polarPoint(cx, cy, innerRadius, startDegrees);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z"
  ].join(" ");
}

/** Degrees of gap that keep a 2px surface gap at the given radius. */
export function gapDegrees(radius: number, pixels = 2): number {
  return (pixels / (2 * Math.PI * radius)) * 360;
}

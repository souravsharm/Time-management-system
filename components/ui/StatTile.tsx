import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string;
  note?: string;
  /** Small colour chip tying the tile to a chart mark. Never the only cue. */
  accent?: string;
  icon?: ReactNode;
};

/**
 * A headline number is a stat tile, not a one-bar chart. Proportional figures on
 * the value; tabular only where numbers stack in a column.
 */
export function StatTile({ label, value, note, accent, icon }: Props) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-muted">
        {accent && (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
          />
        )}
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1.5 text-3xl font-bold tracking-tight text-ink">{value}</p>
      {note && <p className="mt-1 text-sm text-ink-muted">{note}</p>}
    </div>
  );
}

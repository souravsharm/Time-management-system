"use client";

import { AlertTriangle, CheckCircle2, Copy, Download, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { DayRibbon } from "@/components/roster/DayRibbon";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import {
  friendlyRange,
  hoursLabel,
  shiftStatus,
  type RosterInsights
} from "@/lib/roster/analytics";
import { dayNames, formatWindow, orderedWeek } from "@/lib/scheduling/time";
import { chartInk, personColor, statusColors } from "@/lib/theme/palette";
import type { DayOfWeek, Person, ShiftRequirement } from "@/lib/scheduling/types";
import { cn } from "@/lib/utils";

type Props = {
  people: Person[];
  shifts: ShiftRequirement[];
  insights: RosterInsights;
};

export function RosterSchedule({ people, shifts, insights }: Props) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => {
    const firstWithShifts = orderedWeek.find((day) =>
      shifts.some((shift) => shift.dayOfWeek === day)
    );
    return firstWithShifts ?? 1;
  });
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const colorByPersonId = useMemo(
    () => new Map(people.map((person, index) => [person.id, personColor(index)])),
    [people]
  );
  const peopleById = useMemo(
    () => new Map(people.map((person) => [person.id, person])),
    [people]
  );

  const dayShifts = useMemo(
    () =>
      shifts
        .filter((shift) => shift.dayOfWeek === selectedDay)
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [selectedDay, shifts]
  );

  const detailsByShiftId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const assignment of insights.result.assignments) {
      const bucket = map.get(assignment.shiftRequirementId);
      if (bucket) bucket.push(assignment.participantId);
      else map.set(assignment.shiftRequirementId, [assignment.participantId]);
    }
    return map;
  }, [insights]);

  const dayStats = insights.perDay.find((day) => day.day === selectedDay);

  function namesFor(shiftId: string): string[] {
    return (detailsByShiftId.get(shiftId) ?? []).map(
      (id) => peopleById.get(id)?.name ?? "Unknown"
    );
  }

  async function copyWeek() {
    const lines: string[] = [];
    for (const day of orderedWeek) {
      const forDay = shifts
        .filter((shift) => shift.dayOfWeek === day)
        .sort((a, b) => a.startMinutes - b.startMinutes);
      if (forDay.length === 0) continue;
      lines.push(dayNames[day]);
      for (const shift of forDay) {
        const names = namesFor(shift.id);
        lines.push(
          `  ${friendlyRange(shift.startMinutes, shift.endMinutes)} — ${
            names.join(", ") || "NOBODY"
          } (${names.length}/${shift.requiredPeople})`
        );
      }
      lines.push("");
    }
    await navigator.clipboard.writeText(lines.join("\n").trim() || "No shifts yet.");
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 1500);
  }

  function downloadCsv() {
    const rows = [
      ["day", "start", "end", "people_needed", "people_rostered", "names"],
      ...[...shifts]
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinutes - b.startMinutes)
        .map((shift) => {
          const names = namesFor(shift.id);
          const [start, end] = formatWindow(shift.startMinutes, shift.endMinutes).split("-");
          return [
            dayNames[shift.dayOfWeek],
            start,
            end,
            String(shift.requiredPeople),
            String(names.length),
            names.join("; ")
          ];
        })
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "roster.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (shifts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No schedule yet"

        >
          Add some shifts on the <strong>Shifts</strong> tab and the planner will fill
          them in from everyone&rsquo;s availability.
        </EmptyState>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Day picker */}
      <Card
        title="Pick a day"
        hint="The dot shows how that day is looking."
        action={
          <>
            <Button size="sm" icon={<Copy className="h-4 w-4" />} onClick={copyWeek}>
              {copyState === "copied" ? "Copied!" : "Copy week"}
            </Button>
            <Button size="sm" icon={<Download className="h-4 w-4" />} onClick={downloadCsv}>
              Download
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {orderedWeek.map((day) => {
            const stats = insights.perDay.find((entry) => entry.day === day);
            const has = (stats?.shiftCount ?? 0) > 0;
            const selected = day === selectedDay;
            const dotColor = !has
              ? chartInk.baseline
              : (stats?.coveragePct ?? 0) >= 100
                ? statusColors.good
                : (stats?.coveragePct ?? 0) > 0
                  ? statusColors.warning
                  : statusColors.critical;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
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
                  style={{ backgroundColor: dotColor }}
                />
                {dayNames[day].slice(0, 3)}
                {has && (
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      selected ? "text-on-accent/70" : "text-ink-muted"
                    )}
                  >
                    {stats?.slotsFilled}/{stats?.slotsRequired}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* The day itself */}
      <Card
        title={`${dayNames[selectedDay]} — who works when`}
        hint="Each coloured bar is one person's time on the floor."
      >
        <DayRibbon shifts={shifts} day={selectedDay} people={people} insights={insights} />

        {dayStats && dayStats.openGaps.length > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad-strong">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>Store left empty:</strong>{" "}
              {dayStats.openGaps
                .map((gap) => friendlyRange(gap.startMinutes, gap.endMinutes))
                .join(", ")}
              . Nobody is rostered during that time.
            </span>
          </p>
        )}
      </Card>

      {/* Shift-by-shift list */}
      <Card title={`${dayNames[selectedDay]} shift by shift`}>
        <ul className="grid gap-2">
          {dayShifts.map((shift) => {
            const ids = detailsByShiftId.get(shift.id) ?? [];
            const status = shiftStatus(ids.length, shift.requiredPeople);
            return (
              <li
                key={shift.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line px-4 py-3"
              >
                <div className="w-36 shrink-0">
                  <p className="text-sm font-bold text-ink tabular-nums">
                    {friendlyRange(shift.startMinutes, shift.endMinutes)}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {hoursLabel(shift.endMinutes - shift.startMinutes)} · needs{" "}
                    {shift.requiredPeople}
                  </p>
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {ids.length === 0 ? (
                    <span className="text-sm text-ink-faint">Nobody rostered</span>
                  ) : (
                    ids.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-fill py-1 pl-1.5 pr-2.5 text-sm font-medium text-ink"
                      >
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: colorByPersonId.get(id) }}
                        />
                        {peopleById.get(id)?.name ?? "Unknown"}
                      </span>
                    ))
                  )}
                </div>

                <StatusPill status={status} filled={ids.length} needed={shift.requiredPeople} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function StatusPill({
  status,
  filled,
  needed
}: {
  status: "full" | "short" | "empty";
  filled: number;
  needed: number;
}) {
  const style =
    status === "full"
      ? { color: "rgb(var(--good-strong))", backgroundColor: "rgb(var(--good-soft))" }
      : status === "short"
        ? { color: "rgb(var(--warn-strong))", backgroundColor: "rgb(var(--warn-soft))" }
        : { color: "rgb(var(--bad-strong))", backgroundColor: "rgb(var(--bad-soft))" };

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums"
      style={style}
    >
      {status === "full" ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {filled}/{needed} on
    </span>
  );
}

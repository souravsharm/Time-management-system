"use client";

import { Copy, Download, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { HeatmapGrid } from "@/components/grid/HeatmapGrid";
import { findCommonAvailability } from "@/lib/scheduling/commonAvailability";
import { dayNames, durationLabel, formatWindow } from "@/lib/scheduling/time";
import { friendlyRange } from "@/lib/roster/analytics";
import { buildHeatmap } from "@/lib/grid";
import type { AvailabilityWindow, Person } from "@/lib/scheduling/types";
import { cn } from "@/lib/utils";

type Props = {
  people: Person[];
  availability: AvailabilityWindow[];
};

const durationChoices = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "Half a day", value: 240 }
];

export function CommonTimeResults({ people, availability }: Props) {
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [requireEveryone, setRequireEveryone] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const minParticipants = Math.max(2, Math.ceil(people.length / 2));

  const suggestions = useMemo(
    () =>
      findCommonAvailability(people, availability, {
        durationMinutes,
        requireEveryone,
        minParticipants: Math.min(minParticipants, Math.max(people.length, 1)),
        maxSuggestions: 10
      }),
    [availability, durationMinutes, minParticipants, people, requireEveryone]
  );

  const heatmap = useMemo(
    () => buildHeatmap(availability, people.map((person) => person.id)),
    [availability, people]
  );

  const peopleById = useMemo(
    () => new Map(people.map((person) => [person.id, person])),
    [people]
  );

  function nameList(ids: string[]): string[] {
    return ids.map((id) => peopleById.get(id)?.name ?? "Unknown");
  }

  async function copyResults() {
    const text = suggestions
      .map(
        (slot, index) =>
          `${index + 1}. ${dayNames[slot.dayOfWeek]} ${friendlyRange(
            slot.startMinutes,
            slot.endMinutes
          )} — ${slot.availableParticipantIds.length} of ${people.length} free\n` +
          `   Free: ${nameList(slot.availableParticipantIds).join(", ") || "nobody"}\n` +
          `   Busy: ${nameList(slot.unavailableParticipantIds).join(", ") || "nobody"}`
      )
      .join("\n\n");
    await navigator.clipboard.writeText(text || "No times work yet.");
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 1500);
  }

  function downloadCsv() {
    const rows = [
      ["day", "start", "end", "match_percent", "free", "busy"],
      ...suggestions.map((slot) => {
        const [start, end] = formatWindow(slot.startMinutes, slot.endMinutes).split("-");
        return [
          dayNames[slot.dayOfWeek],
          start,
          end,
          String(slot.matchPercentage),
          nameList(slot.availableParticipantIds).join("; "),
          nameList(slot.unavailableParticipantIds).join("; ")
        ];
      })
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "common-times.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (people.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Users className="h-5 w-5" />} title="Add the group first">
          Add everyone on the <strong>Group</strong> tab, mark their free hours, and the
          best times will show up here.
        </EmptyState>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card title="What are you looking for?">
        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">How long do you need?</p>
            <div className="flex flex-wrap gap-2">
              {durationChoices.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  aria-pressed={durationMinutes === choice.value}
                  onClick={() => setDurationMinutes(choice.value)}
                  className={cn(
                    "rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    durationMinutes === choice.value
                      ? "border-accent bg-accent text-on-accent"
                      : "border-line-strong bg-surface text-ink-soft hover:bg-subtle"
                  )}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Who needs to be there?</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={!requireEveryone}
                onClick={() => setRequireEveryone(false)}
                className={cn(
                  "rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  !requireEveryone
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line-strong bg-surface text-ink-soft hover:bg-subtle"
                )}
              >
                Most people
              </button>
              <button
                type="button"
                aria-pressed={requireEveryone}
                onClick={() => setRequireEveryone(true)}
                className={cn(
                  "rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  requireEveryone
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line-strong bg-surface text-ink-soft hover:bg-subtle"
                )}
              >
                Everyone
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Best times to meet"
        hint={`${suggestions.length} option${suggestions.length === 1 ? "" : "s"} found.`}
        action={
          <>
            <Button
              size="sm"
              icon={<Copy className="h-4 w-4" />}
              onClick={copyResults}
              disabled={suggestions.length === 0}
            >
              {copyState === "copied" ? "Copied!" : "Copy"}
            </Button>
            <Button
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={downloadCsv}
              disabled={suggestions.length === 0}
            >
              Download
            </Button>
          </>
        }
      >
        {suggestions.length === 0 ? (
          <EmptyState title="Nothing lines up yet">
            Try a shorter meeting, switch to &ldquo;Most people&rdquo;, or add more free
            hours on the <strong>Free hours</strong> tab.
          </EmptyState>
        ) : (
          <ol className="grid gap-2">
            {suggestions.map((slot, index) => {
              const free = nameList(slot.availableParticipantIds);
              const busy = nameList(slot.unavailableParticipantIds);
              return (
                <li
                  key={`${slot.dayOfWeek}-${slot.startMinutes}`}
                  className="rounded-xl border border-line px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-ink">
                        {index + 1}. {dayNames[slot.dayOfWeek]}{" "}
                        <span className="font-semibold text-ink-soft tabular-nums">
                          {friendlyRange(slot.startMinutes, slot.endMinutes)}
                        </span>
                      </p>
                      <p className="text-xs text-ink-muted">
                        {durationLabel(slot.endMinutes - slot.startMinutes)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums",
                        slot.matchPercentage === 100
                          ? "bg-good-soft text-good-strong"
                          : slot.matchPercentage >= 60
                            ? "bg-warn-soft text-warn-strong"
                            : "bg-fill text-ink-soft"
                      )}
                    >
                      {free.length} of {people.length} free
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">
                    <span className="font-semibold">Free:</span> {free.join(", ") || "nobody"}
                  </p>
                  {busy.length > 0 && (
                    <p className="mt-0.5 text-sm text-ink-muted">
                      <span className="font-semibold">Can&rsquo;t make it:</span>{" "}
                      {busy.join(", ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card
        title="When the group is free"
        hint="Darker means more people are free at that time."
      >
        <HeatmapGrid counts={heatmap} maxCount={people.length} />
      </Card>
    </div>
  );
}

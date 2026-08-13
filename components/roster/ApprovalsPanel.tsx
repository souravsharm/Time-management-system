"use client";

import { Check, Inbox, MailCheck, Undo2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AvailabilityGrid } from "@/components/grid/AvailabilityGrid";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { hoursLabel } from "@/lib/roster/analytics";
import { slotKey, GRID_INTERVAL_MINUTES } from "@/lib/grid";
import { dayNames, orderedWeek } from "@/lib/scheduling/time";
import { personColor } from "@/lib/theme/palette";
import type {
  AvailabilitySubmission,
  AvailabilityWindow,
  Person
} from "@/lib/scheduling/types";
import { cn } from "@/lib/utils";

type Props = {
  submissions: AvailabilitySubmission[];
  people: Person[];
  availability: AvailabilityWindow[];
  gridStartHour: number;
  gridEndHour: number;
  onApprove: (submissionId: string) => void;
  onDecline: (submissionId: string) => void;
  onUndo: (submissionId: string) => void;
};

export function ApprovalsPanel({
  submissions,
  people,
  availability,
  gridStartHour,
  gridEndHour,
  onApprove,
  onDecline,
  onUndo
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const pending = submissions.filter((entry) => entry.status === "pending");
  const decided = submissions
    .filter((entry) => entry.status !== "pending")
    .slice()
    .reverse();

  return (
    <div className="grid gap-4">
      <Card
        title="Waiting for your approval"
        hint="Nothing your team sends back goes into the roster until you say yes."
      >
        {pending.length === 0 ? (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title="Nothing waiting">
            When someone fills in the link from <strong>Ask the team</strong> and sends it
            back, their hours land here for you to check first.
          </EmptyState>
        ) : (
          <ul className="grid gap-3">
            {pending.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                people={people}
                availability={availability}
                gridStartHour={gridStartHour}
                gridEndHour={gridEndHour}
                expanded={openId === submission.id}
                onToggle={() =>
                  setOpenId((current) => (current === submission.id ? null : submission.id))
                }
                onApprove={() => onApprove(submission.id)}
                onDecline={() => onDecline(submission.id)}
              />
            ))}
          </ul>
        )}
      </Card>

      {decided.length > 0 && (
        <Card title="Already dealt with" hint="Changed your mind? Put it back in the queue.">
          <ul className="grid gap-2">
            {decided.slice(0, 12).map((submission) => (
              <li
                key={submission.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3"
              >
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold",
                    submission.status === "approved"
                      ? "bg-good-soft text-good-strong"
                      : "bg-fill text-ink-soft"
                  )}
                >
                  {submission.status === "approved" ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {submission.status === "approved" ? "Approved" : "Declined"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {submission.personName}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {formatWhen(submission.decidedAt ?? submission.receivedAt)}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Undo2 className="h-4 w-4" />}
                  onClick={() => onUndo(submission.id)}
                >
                  Move back
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function SubmissionCard({
  submission,
  people,
  availability,
  gridStartHour,
  gridEndHour,
  expanded,
  onToggle,
  onApprove,
  onDecline
}: {
  submission: AvailabilitySubmission;
  people: Person[];
  availability: AvailabilityWindow[];
  gridStartHour: number;
  gridEndHour: number;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const proposedMinutes = submission.windows.reduce(
    (sum, window) => sum + (window.endMinutes - window.startMinutes),
    0
  );
  const proposedDays = new Set(submission.windows.map((window) => window.dayOfWeek));

  const matchedIndex = people.findIndex((person) => person.id === submission.matchedPersonId);
  const matched = matchedIndex >= 0 ? people[matchedIndex] : null;

  const currentMinutes = matched
    ? availability
        .filter((window) => window.participantId === matched.id)
        .reduce((sum, window) => sum + (window.endMinutes - window.startMinutes), 0)
    : 0;

  const previewSlots = useMemo(() => {
    const slots = new Set<string>();
    for (const window of submission.windows) {
      const first = Math.floor(window.startMinutes / GRID_INTERVAL_MINUTES);
      const last = Math.ceil(window.endMinutes / GRID_INTERVAL_MINUTES) - 1;
      for (let index = first; index <= last; index += 1) {
        const gridIndex = index - (gridStartHour * 60) / GRID_INTERVAL_MINUTES;
        if (gridIndex >= 0) slots.add(slotKey(window.dayOfWeek, gridIndex));
      }
    }
    return slots;
  }, [gridStartHour, submission.windows]);

  const color = matchedIndex >= 0 ? personColor(matchedIndex) : personColor(people.length);

  return (
    <li className="rounded-xl border border-line">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill text-ink-muted"
        >
          <MailCheck className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold text-ink">
            {submission.personName}
          </span>
          <span className="block text-sm text-ink-muted">
            {hoursLabel(proposedMinutes)} across {proposedDays.size}{" "}
            {proposedDays.size === 1 ? "day" : "days"} · sent{" "}
            {formatWhen(submission.receivedAt)}
          </span>
          <span className="mt-0.5 block text-xs font-medium text-ink-muted">
            {matched
              ? currentMinutes > 0
                ? `Replaces their current ${hoursLabel(currentMinutes)}`
                : "First time they've sent hours"
              : "New person — approving adds them to the team"}
          </span>
        </span>

        <Button size="sm" variant="secondary" onClick={onToggle}>
          {expanded ? "Hide hours" : "See hours"}
        </Button>
        <Button
          size="sm"
          variant="primary"
          icon={<Check className="h-4 w-4" />}
          onClick={onApprove}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<X className="h-4 w-4" />}
          onClick={onDecline}
        >
          Decline
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-line px-4 py-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {orderedWeek
              .filter((day) => proposedDays.has(day))
              .map((day) => (
                <span
                  key={day}
                  className="rounded-lg bg-fill px-2.5 py-1 text-xs font-semibold text-ink-soft"
                >
                  {dayNames[day].slice(0, 3)}
                </span>
              ))}
          </div>
          <AvailabilityGrid
            selected={previewSlots}
            onChange={() => undefined}
            disabled
            startHour={gridStartHour}
            endHour={gridEndHour}
            color={color}
          />
          <p className="mt-2 text-xs text-ink-muted">
            Read-only preview of what they sent. Approving overwrites whatever hours they
            had before.
          </p>
        </div>
      )}
    </li>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "recently";

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 60 * 24) return `${Math.round(diffMinutes / 60)} hr ago`;

  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

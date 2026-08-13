"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  UserPlus,
  Users
} from "lucide-react";
import { CoverageDial } from "@/components/charts/CoverageDial";
import { ShareDonut, type ShareSlice } from "@/components/charts/ShareDonut";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import {
  friendlyRange,
  hoursLabel,
  type RosterInsights
} from "@/lib/roster/analytics";
import { dayNames } from "@/lib/scheduling/time";
import { chartInk, personColor, statusColors } from "@/lib/theme/palette";
import type { Person } from "@/lib/scheduling/types";
import type { RosterTab } from "@/components/roster/RosterWorkspace";

type Props = {
  people: Person[];
  insights: RosterInsights;
  onGoToTab: (tab: RosterTab) => void;
};

/** Slices past this fold into "Everyone else" so the donut stays readable. */
const MAX_SLICES = 5;

export function RosterOverview({ people, insights, onGoToTab }: Props) {
  const setupDone = people.length > 0 && insights.shiftCount > 0;

  if (!setupDone) {
    return (
      <div className="grid gap-4">
        <Card
          title="Let's get your roster started"
          hint="Three short steps. You can change anything later."
        >
          <ol className="grid gap-3">
            <SetupStep
              number={1}
              done={people.length > 0}
              icon={<Users className="h-5 w-5" />}
              title="Add your team"
              detail={
                people.length > 0
                  ? `${people.length} ${people.length === 1 ? "person" : "people"} added`
                  : "Type in the names of everyone who can work"
              }
              actionLabel={people.length > 0 ? "Edit team" : "Add people"}
              onAction={() => onGoToTab("team")}
            />
            <SetupStep
              number={2}
              done={insights.result.assignments.length > 0 || people.length > 0}
              icon={<CalendarClock className="h-5 w-5" />}
              title="Mark when they can work"
              detail="Drag across the grid to shade the hours each person is free"
              actionLabel="Set availability"
              onAction={() => onGoToTab("availability")}
              disabled={people.length === 0}
            />
            <SetupStep
              number={3}
              done={insights.shiftCount > 0}
              icon={<ClipboardList className="h-5 w-5" />}
              title="Say what the store needs"
              detail={
                insights.shiftCount > 0
                  ? `${insights.shiftCount} shifts set up`
                  : "Add the shifts to cover and how many people each one needs"
              }
              actionLabel="Add shifts"
              onAction={() => onGoToTab("shifts")}
            />
          </ol>
        </Card>
      </div>
    );
  }

  const slices = buildShareSlices(insights);
  const uncoveredMinutes = Math.max(0, insights.openMinutes - insights.staffedMinutes);
  const daysWithShifts = insights.perDay.filter((day) => day.shiftCount > 0);

  return (
    <div className="grid gap-4">
      {/* Headline: is the store's time actually scheduled? */}
      <Card
        title="Is the week covered?"
        hint="The two dials answer the two questions that matter most."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <DialBlock
            value={insights.storeCoveragePct}
            title="Store hours with someone on"
            explainer={
              uncoveredMinutes === 0
                ? "Someone is rostered for every hour the store is open."
                : `${hoursLabel(uncoveredMinutes)} of opening hours have nobody rostered.`
            }
            footnote={`${hoursLabel(insights.staffedMinutes)} of ${hoursLabel(insights.openMinutes)} open hours`}
          />
          <DialBlock
            value={insights.slotCoveragePct}
            title="Staffing you asked for"
            explainer={
              insights.slotsFilled >= insights.slotsRequired
                ? "Every shift has the number of people you wanted."
                : `${insights.slotsRequired - insights.slotsFilled} spots on the roster are still empty.`
            }
            footnote={`${insights.slotsFilled} of ${insights.slotsRequired} people-spots filled`}
          />
        </div>
      </Card>

      {/* Quick numbers */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Hours rostered"
          value={hoursLabel(insights.filledMinutes)}
          note={`out of ${hoursLabel(insights.requiredMinutes)} needed`}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatTile
          label="Shifts fully staffed"
          value={`${insights.shiftsFull}`}
          note={`of ${insights.shiftCount} shifts`}
          accent={statusColors.good}
        />
        <StatTile
          label="Shifts short of people"
          value={`${insights.shiftsShort}`}
          note={insights.shiftsShort === 0 ? "Nothing short" : "Need one or more extra"}
          accent={statusColors.warning}
        />
        <StatTile
          label="Shifts with nobody"
          value={`${insights.shiftsEmpty}`}
          note={insights.shiftsEmpty === 0 ? "All shifts have a name" : "Nobody could be rostered"}
          accent={statusColors.critical}
        />
      </div>

      {/* Who the hours go to */}
      <Card
        title="Who is doing the work"
        hint="Share of the rostered hours. Hover a slice or a name to highlight it."
        action={
          <Button size="sm" icon={<Users className="h-4 w-4" />} onClick={() => onGoToTab("team")}>
            Manage team
          </Button>
        }
      >
        <ShareDonut
          slices={slices.ring}
          rows={slices.rows}
          format={hoursLabel}
          centerTitle={hoursLabel(insights.filledMinutes)}
          centerSubtitle="rostered this week"
          emptyMessage="Nobody is rostered yet — add availability so the planner has someone to pick."
        />

        {insights.shortOfContract.length > 0 && (
          <div className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn-strong">
            <p className="font-semibold">Permanent staff below their contracted hours</p>
            <ul className="mt-1.5 grid gap-1">
              {insights.shortOfContract.map((load) => (
                <li key={load.person.id} className="tabular-nums">
                  {load.person.name} — {hoursLabel(load.minutes)} of{" "}
                  {hoursLabel(load.targetMinutes)} (
                  {hoursLabel(load.targetMinutes - load.minutes)} short)
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-warn-strong">
              Usually they aren&rsquo;t free for enough shifts, or a weekly hours/days
              limit is stopping them. Check their <strong>Free hours</strong> and their
              limits on the <strong>Team</strong> tab.
            </p>
          </div>
        )}

        {insights.unusedPeople.length > 0 && (
          <p className="mt-4 rounded-xl bg-subtle px-4 py-3 text-sm text-ink-soft">
            <span className="font-semibold text-ink">
              Not rostered at all:{" "}
            </span>
            {insights.unusedPeople.map((person) => person.name).join(", ")}. Usually this
            means their available hours don&rsquo;t line up with any shift.
          </p>
        )}
      </Card>

      {/* Day by day */}
      <Card
        title="Day by day"
        hint="A full green ring means that day has everyone it needs."
      >
        {daysWithShifts.length === 0 ? (
          <EmptyState title="No shifts on any day yet." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {daysWithShifts.map((day) => (
              <button
                key={day.day}
                type="button"
                onClick={() => onGoToTab("schedule")}
                className="rounded-xl border border-line p-3 text-center transition-colors hover:border-line-strong hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <p className="text-sm font-bold text-ink">
                  {dayNames[day.day].slice(0, 3)}
                </p>
                <div className="my-1 flex justify-center">
                  <CoverageDial value={day.coveragePct} size={82} thickness={16} />
                </div>
                <p className="text-xs font-medium text-ink-soft tabular-nums">
                  {day.slotsFilled}/{day.slotsRequired} spots
                </p>
                <p className="text-xs text-ink-muted">
                  {day.openStart !== null && day.openEnd !== null
                    ? friendlyRange(day.openStart, day.openEnd)
                    : "—"}
                </p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* What to fix */}
      <Card
        title="What still needs fixing"
        hint="Sorted by how many people are missing."
        action={
          <Button
            size="sm"
            icon={<ArrowRight className="h-4 w-4" />}
            onClick={() => onGoToTab("schedule")}
          >
            Open schedule
          </Button>
        }
      >
        {insights.problemShifts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-good-soft px-4 py-4">
            <CheckCircle2
              className="h-5 w-5 shrink-0"
              style={{ color: statusColors.good }}
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-good-strong">
              Nothing to fix — every shift has the people it asked for.
            </p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {insights.problemShifts.slice(0, 8).map((detail) => (
              <li
                key={detail.shift.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {dayNames[detail.shift.dayOfWeek]}{" "}
                    <span className="font-normal text-ink-muted">
                      {friendlyRange(detail.shift.startMinutes, detail.shift.endMinutes)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {detail.nobodyFree
                      ? "Nobody on the team is free for this one."
                      : `Needs ${detail.missing} more ${detail.missing === 1 ? "person" : "people"}.`}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold"
                  style={{
                    color: `rgb(var(--${detail.status === "empty" ? "bad" : "warn"}-strong))`,
                    backgroundColor: `rgb(var(--${detail.status === "empty" ? "bad" : "warn"}-soft))`
                  }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {detail.assignedIds.length}/{detail.shift.requiredPeople} on
                </span>
              </li>
            ))}
            {insights.problemShifts.length > 8 && (
              <li className="px-1 pt-1 text-sm text-ink-muted">
                …and {insights.problemShifts.length - 8} more.
              </li>
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}

function DialBlock({
  value,
  title,
  explainer,
  footnote
}: {
  value: number;
  title: string;
  explainer: string;
  footnote: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-subtle p-5 text-center sm:flex-row sm:text-left">
      <CoverageDial value={value} size={140} />
      <div className="min-w-0">
        <p className="text-base font-bold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-soft">{explainer}</p>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-faint tabular-nums">
          {footnote}
        </p>
      </div>
    </div>
  );
}

function SetupStep({
  number,
  done,
  icon,
  title,
  detail,
  actionLabel,
  onAction,
  disabled
}: {
  number: number;
  done: boolean;
  icon: React.ReactNode;
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-4">
      <span
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          done ? "bg-good-soft text-good-strong" : "bg-fill text-ink-soft"
        ].join(" ")}
      >
        {done ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-base font-bold text-ink">
          <span aria-hidden="true" className="text-ink-faint">
            {icon}
          </span>
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-ink-muted">{detail}</span>
      </span>
      <Button
        variant={done ? "secondary" : "primary"}
        onClick={onAction}
        disabled={disabled}
        icon={done ? undefined : <UserPlus className="h-4 w-4" />}
      >
        {actionLabel}
      </Button>
    </li>
  );
}

/**
 * The ring folds a long tail so it stays readable; the list keeps every person, so
 * the fold never hides anyone's hours.
 */
function buildShareSlices(insights: RosterInsights): {
  ring: ShareSlice[];
  rows: ShareSlice[];
} {
  const working = insights.perPerson.filter((load) => load.minutes > 0);

  const toSlice = (load: (typeof working)[number]): ShareSlice => ({
    id: load.person.id,
    label: load.person.name,
    value: load.minutes,
    color: personColor(load.index),
    detail: `${load.shiftCount} ${load.shiftCount === 1 ? "shift" : "shifts"} · ${load.dayCount} ${
      load.dayCount === 1 ? "day" : "days"
    }`
  });

  const rows = working.map(toSlice);
  const tail = working.slice(MAX_SLICES);

  if (tail.length === 0) {
    return { ring: rows, rows };
  }

  const othersId = "__others";
  const ring: ShareSlice[] = [
    ...working.slice(0, MAX_SLICES).map(toSlice),
    {
      id: othersId,
      label: `Everyone else (${tail.length})`,
      value: tail.reduce((sum, load) => sum + load.minutes, 0),
      color: chartInk.faint
    }
  ];

  const tailIds = new Set(tail.map((load) => load.person.id));

  return {
    ring,
    rows: rows.map((row) =>
      tailIds.has(row.id) ? { ...row, groupId: othersId } : row
    )
  };
}

"use client";

import { Check, MoonStar, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { hoursLabel } from "@/lib/roster/analytics";
import {
  DAY_MINUTES,
  crossesMidnight,
  formatShiftRange,
  shiftDuration,
  shiftOutsideTrading,
  toShiftRange,
  validateShift
} from "@/lib/scheduling/shiftTime";
import { dayNames, orderedWeek, parseTimeToMinutes } from "@/lib/scheduling/time";
import type { DayOfWeek, ShiftRequirement, StoreSettings } from "@/lib/scheduling/types";
import { cn } from "@/lib/utils";

type Props = {
  shifts: ShiftRequirement[];
  store: StoreSettings;
  onAddShift: (shift: Omit<ShiftRequirement, "id">) => void;
  onUpdateShift: (shiftId: string, patch: Omit<ShiftRequirement, "id">) => void;
  onRemoveShift: (shiftId: string) => void;
  onRemoveDay: (day: DayOfWeek) => void;
};

const presets = [
  { label: "Morning", start: "06:00", end: "14:00" },
  { label: "Evening", start: "14:00", end: "22:00" },
  { label: "Overnight", start: "22:00", end: "06:00" },
  { label: "Day", start: "09:00", end: "17:00" }
];

const WEEKDAYS: DayOfWeek[] = [1, 2, 3, 4, 5];
const WEEKEND: DayOfWeek[] = [6, 0];

function toTimeValue(minutes: number): string {
  const withinDay = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(withinDay / 60)).padStart(2, "0")}:${String(
    withinDay % 60
  ).padStart(2, "0")}`;
}

export function ShiftsEditor({
  shifts,
  store,
  onAddShift,
  onUpdateShift,
  onRemoveShift,
  onRemoveDay
}: Props) {
  const [days, setDays] = useState<DayOfWeek[]>([1]);
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("14:00");
  const [label, setLabel] = useState("");
  const [peopleNeeded, setPeopleNeeded] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const previewRange = safeRange(startTime, endTime);
  const previewDuration = previewRange ? previewRange.endMinutes - previewRange.startMinutes : 0;

  function addShifts() {
    if (days.length === 0) {
      setError("Pick at least one day.");
      return;
    }
    if (!previewRange) {
      setError("Those times don't look right.");
      return;
    }

    const issue = validateShift(
      { ...previewRange, requiredPeople: peopleNeeded },
      store
    );
    if (issue) {
      setError(issue.message);
      return;
    }

    for (const day of days) {
      onAddShift({
        dayOfWeek: day,
        startMinutes: previewRange.startMinutes,
        endMinutes: previewRange.endMinutes,
        requiredPeople: peopleNeeded,
        label: label.trim() || undefined
      });
    }

    setError(null);
    setJustAdded(
      `Added ${formatShiftRange({
        id: "",
        dayOfWeek: 1,
        requiredPeople: 1,
        ...previewRange
      })} to ${days.map((day) => dayNames[day].slice(0, 3)).join(", ")}.`
    );
    setTimeout(() => setJustAdded(null), 3500);
  }

  const daysWithShifts = orderedWeek
    .map((day) => ({
      day,
      items: shifts
        .filter((shift) => shift.dayOfWeek === day)
        .sort((a, b) => a.startMinutes - b.startMinutes)
    }))
    .filter((entry) => entry.items.length > 0);

  return (
    <div className="grid gap-4">
      <Card
        title="Add the hours you need covered"
        hint={`Pick the days, set the time, say how many people. Company rule: no single shift longer than ${store.maxShiftHours} hours.`}
      >
        <div className="grid gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">1. Which days?</p>
            <div className="flex flex-wrap gap-2">
              {orderedWeek.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setDays((current) =>
                      current.includes(day)
                        ? current.filter((d) => d !== day)
                        : [...current, day]
                    )
                  }
                  aria-pressed={days.includes(day)}
                  className={cn(
                    "min-w-[62px] rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    days.includes(day)
                      ? "border-accent bg-accent text-on-accent"
                      : "border-line-strong bg-surface text-ink-soft hover:bg-subtle"
                  )}
                >
                  {dayNames[day].slice(0, 3)}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDays(WEEKDAYS)}>
                Mon–Fri
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDays(WEEKEND)}>
                Weekend
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDays([...orderedWeek])}>
                Every day
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">2. What time?</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => {
                const selected = preset.start === startTime && preset.end === endTime;
                const range = safeRange(preset.start, preset.end);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setStartTime(preset.start);
                      setEndTime(preset.end);
                      setError(null);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      selected
                        ? "border-accent bg-fill text-ink"
                        : "border-line-strong bg-surface text-ink-soft hover:bg-subtle"
                    )}
                  >
                    {range && range.endMinutes > DAY_MINUTES && (
                      <MoonStar className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                    )}
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
                Starts
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    setError(null);
                  }}
                  className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-line"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
                Finishes
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setError(null);
                  }}
                  className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-line"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
                Name it (optional)
                <input
                  type="text"
                  value={label}
                  placeholder="e.g. Night"
                  onChange={(event) => setLabel(event.target.value)}
                  className="h-11 w-40 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-line"
                />
              </label>
            </div>

            {previewRange && (
              <p className="mt-2 text-sm text-ink-soft">
                That&rsquo;s <strong>{hoursLabel(previewDuration)}</strong>
                {previewRange.endMinutes > DAY_MINUTES && (
                  <>
                    {" "}
                    and it finishes{" "}
                    <strong className="whitespace-nowrap">the next morning</strong>
                  </>
                )}
                .
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">
              3. How many people on at once?
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface p-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label="One fewer person"
                onClick={() => setPeopleNeeded((n) => Math.max(1, n - 1))}
              >
                −
              </Button>
              <span className="w-10 text-center text-xl font-bold text-ink tabular-nums">
                {peopleNeeded}
              </span>
              <Button
                variant="ghost"
                size="sm"
                aria-label="One more person"
                onClick={() => setPeopleNeeded((n) => Math.min(20, n + 1))}
              >
                +
              </Button>
            </div>
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad-strong">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          {justAdded && (
            <p className="rounded-xl bg-good-soft px-4 py-3 text-sm font-medium text-good-strong">
              {justAdded}
            </p>
          )}

          <div>
            <Button variant="primary" size="lg" icon={<Plus className="h-5 w-5" />} onClick={addShifts}>
              Add {days.length > 1 ? `${days.length} shifts` : "shift"}
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Shifts you've set up" hint={`${shifts.length} in total.`}>
        {daysWithShifts.length === 0 ? (
          <EmptyState title="No shifts yet">
            Add your first one above. A 24-hour store usually needs three: overnight,
            morning and evening.
          </EmptyState>
        ) : (
          <div className="grid gap-4">
            {daysWithShifts.map(({ day, items }) => (
              <div key={day}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                    {dayNames[day]}
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => onRemoveDay(day)}>
                    Clear day
                  </Button>
                </div>
                <ul className="grid gap-2">
                  {items.map((shift) =>
                    editingId === shift.id ? (
                      <li key={shift.id}>
                        <ShiftEditRow
                          shift={shift}
                          store={store}
                          onCancel={() => setEditingId(null)}
                          onSave={(patch) => {
                            onUpdateShift(shift.id, patch);
                            setEditingId(null);
                          }}
                        />
                      </li>
                    ) : (
                      <li
                        key={shift.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-ink tabular-nums">
                            {crossesMidnight(shift) && (
                              <MoonStar
                                className="h-3.5 w-3.5 shrink-0 text-ink-muted"
                                aria-hidden="true"
                              />
                            )}
                            {formatShiftRange(shift)}
                            {shift.label && (
                              <span className="rounded-md bg-fill px-1.5 py-0.5 text-xs font-semibold text-ink-soft">
                                {shift.label}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-muted">
                            {hoursLabel(shiftDuration(shift))} · {shift.requiredPeople}{" "}
                            {shift.requiredPeople === 1 ? "person" : "people"} needed
                          </span>
                          {shiftOutsideTrading(shift, store) && (
                            <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-warn-strong">
                              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                              Runs outside your opening hours
                            </span>
                          )}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Pencil className="h-4 w-4" />}
                          onClick={() => setEditingId(shift.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Remove the ${dayNames[day]} ${formatShiftRange(shift)} shift`}
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => onRemoveShift(shift.id)}
                        />
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ShiftEditRow({
  shift,
  store,
  onSave,
  onCancel
}: {
  shift: ShiftRequirement;
  store: StoreSettings;
  onSave: (patch: Omit<ShiftRequirement, "id">) => void;
  onCancel: () => void;
}) {
  const [day, setDay] = useState<DayOfWeek>(shift.dayOfWeek);
  const [startTime, setStartTime] = useState(toTimeValue(shift.startMinutes));
  const [endTime, setEndTime] = useState(toTimeValue(shift.endMinutes));
  const [people, setPeople] = useState(shift.requiredPeople);
  const [label, setLabel] = useState(shift.label ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    const range = safeRange(startTime, endTime);
    if (!range) {
      setError("Those times don't look right.");
      return;
    }
    const issue = validateShift({ ...range, requiredPeople: people }, store);
    if (issue) {
      setError(issue.message);
      return;
    }
    onSave({
      dayOfWeek: day,
      startMinutes: range.startMinutes,
      endMinutes: range.endMinutes,
      requiredPeople: people,
      label: label.trim() || undefined
    });
  }

  return (
    <div className="rounded-xl border-2 border-accent bg-subtle p-4">
      <p className="mb-3 text-sm font-bold text-ink">Editing this shift</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
          Day
          <select
            value={day}
            onChange={(event) => setDay(Number(event.target.value) as DayOfWeek)}
            className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none focus:border-accent"
          >
            {orderedWeek.map((entry) => (
              <option key={entry} value={entry}>
                {dayNames[entry]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
          Starts
          <input
            type="time"
            value={startTime}
            onChange={(event) => {
              setStartTime(event.target.value);
              setError(null);
            }}
            className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none focus:border-accent"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
          Finishes
          <input
            type="time"
            value={endTime}
            onChange={(event) => {
              setEndTime(event.target.value);
              setError(null);
            }}
            className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none focus:border-accent"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
          People
          <input
            type="number"
            min={1}
            max={50}
            value={people}
            onChange={(event) => {
              setPeople(Number(event.target.value));
              setError(null);
            }}
            className="h-11 w-24 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none focus:border-accent"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
          Name
          <input
            type="text"
            value={label}
            placeholder="optional"
            onChange={(event) => setLabel(event.target.value)}
            className="h-11 w-36 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad-strong">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button variant="primary" icon={<Check className="h-4 w-4" />} onClick={save}>
          Save changes
        </Button>
        <Button variant="ghost" icon={<X className="h-4 w-4" />} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** Parses two `<input type="time">` values, treating an earlier finish as overnight. */
function safeRange(
  startTime: string,
  endTime: string
): { startMinutes: number; endMinutes: number } | null {
  try {
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);
    if (start === end) return null;
    return toShiftRange(start, end);
  } catch {
    return null;
  }
}

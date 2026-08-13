"use client";

import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { hoursLabel, type RosterInsights } from "@/lib/roster/analytics";
import { personFill } from "@/lib/theme/palette";
import type {
  AvailabilityWindow,
  EmploymentType,
  Person
} from "@/lib/scheduling/types";
import { cn } from "@/lib/utils";

type Props = {
  people: Person[];
  availability: AvailabilityWindow[];
  insights: RosterInsights | null;
  onAddPerson: (person: Omit<Person, "id">) => void;
  onUpdatePerson: (personId: string, patch: Partial<Omit<Person, "id">>) => void;
  onRemovePerson: (personId: string) => void;
};

export function TeamEditor({
  people,
  availability,
  insights,
  onAddPerson,
  onUpdatePerson,
  onRemovePerson
}: Props) {
  const [name, setName] = useState("");
  const [employment, setEmployment] = useState<EmploymentType>("casual");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Type a name with at least two letters.");
      return;
    }
    if (people.some((person) => person.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError(`${trimmed} is already on the list.`);
      return;
    }

    onAddPerson(
      employment === "permanent"
        ? {
            name: trimmed,
            employment,
            targetHoursPerWeek: 38,
            maxHoursPerWeek: 38,
            maxDaysPerWeek: 5
          }
        : { name: trimmed, employment }
    );
    setName("");
    setError(null);
  }

  const minutesByPerson = new Map(
    (insights?.perPerson ?? []).map((load) => [load.person.id, load.minutes])
  );

  return (
    <div className="grid gap-4">
      <Card
        title="Add someone to the team"
        hint="Permanent staff get their contracted hours first; casuals fill in around them."
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-[220px] flex-1 gap-1.5 text-sm font-medium text-ink-soft">
              Name
              <input
                type="text"
                value={name}
                placeholder="e.g. Sam Taylor"
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
                className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-line"
              />
            </label>
            <Button
              variant="primary"
              size="lg"
              icon={<Plus className="h-5 w-5" />}
              onClick={submit}
            >
              Add
            </Button>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">What sort of staff?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <EmploymentChoice
                selected={employment === "permanent"}
                title="Permanent"
                detail="Guaranteed hours each week — the roster fills their contract first."
                onSelect={() => setEmployment("permanent")}
              />
              <EmploymentChoice
                selected={employment === "casual"}
                title="Casual"
                detail="Only works the hours they're free for, once permanents are covered."
                onSelect={() => setEmployment("casual")}
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-bad-strong">{error}</p>}
        </div>
      </Card>

      <Card
        title="Your team"
        hint={`${people.length} ${people.length === 1 ? "person" : "people"}. The colour beside each name is the one used on the charts.`}
      >
        {people.length === 0 ? (
          <EmptyState icon={<UserPlus className="h-5 w-5" />} title="Nobody added yet">
            Add everyone who could work a shift. You can always remove them later.
          </EmptyState>
        ) : (
          <ul className="grid gap-2">
            {people.map((person, index) => {
              const freeMinutes = availability
                .filter((window) => window.participantId === person.id)
                .reduce((sum, window) => sum + (window.endMinutes - window.startMinutes), 0);
              const rosteredMinutes = minutesByPerson.get(person.id) ?? 0;
              const target = (person.targetHoursPerWeek ?? 0) * 60;
              const shortOfContract =
                person.employment === "permanent" && target > 0 && rosteredMinutes < target;

              if (editingId === person.id) {
                return (
                  <li key={person.id}>
                    <PersonEditRow
                      person={person}
                      onCancel={() => setEditingId(null)}
                      onSave={(patch) => {
                        onUpdatePerson(person.id, patch);
                        setEditingId(null);
                      }}
                    />
                  </li>
                );
              }

              return (
                <li
                  key={person.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3"
                >
                  <span
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={personFill(index)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-ink">
                        {person.name}
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-xs font-semibold",
                          person.employment === "permanent"
                            ? "bg-accent text-on-accent"
                            : "bg-fill text-ink-soft"
                        )}
                      >
                        {person.employment === "permanent" ? "Permanent" : "Casual"}
                      </span>
                      {person.role && (
                        <span className="truncate text-xs text-ink-muted">{person.role}</span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-muted">
                      {freeMinutes === 0
                        ? "No available hours set yet"
                        : insights
                          ? `${hoursLabel(rosteredMinutes)} rostered · ${hoursLabel(freeMinutes)} free`
                          : `${hoursLabel(freeMinutes)} free`}
                      {person.employment === "permanent" && target > 0 && (
                        <> · contract {hoursLabel(target)}</>
                      )}
                      {person.maxHoursPerWeek !== undefined && (
                        <> · max {person.maxHoursPerWeek}h</>
                      )}
                    </span>
                    {shortOfContract && insights && (
                      <span className="mt-1 block text-xs font-medium text-warn-strong">
                        {hoursLabel(target - rosteredMinutes)} short of their contract
                      </span>
                    )}
                  </span>

                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={() => setEditingId(person.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove ${person.name}`}
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => onRemovePerson(person.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function EmploymentChoice({
  selected,
  title,
  detail,
  onSelect
}: {
  selected: boolean;
  title: string;
  detail: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        selected
          ? "border-accent bg-surface ring-1 ring-accent"
          : "border-line-strong bg-surface hover:bg-subtle"
      )}
    >
      <span className="block text-sm font-bold text-ink">{title}</span>
      <span className="mt-0.5 block text-xs text-ink-muted">{detail}</span>
    </button>
  );
}

function PersonEditRow({
  person,
  onSave,
  onCancel
}: {
  person: Person;
  onSave: (patch: Partial<Omit<Person, "id">>) => void;
  onCancel: () => void;
}) {
  const [employment, setEmployment] = useState<EmploymentType>(person.employment);
  const [role, setRole] = useState(person.role ?? "");
  const [target, setTarget] = useState(String(person.targetHoursPerWeek ?? 38));
  const [maxHours, setMaxHours] = useState(
    person.maxHoursPerWeek === undefined ? "" : String(person.maxHoursPerWeek)
  );
  const [maxDays, setMaxDays] = useState(
    person.maxDaysPerWeek === undefined ? "" : String(person.maxDaysPerWeek)
  );

  function save() {
    const optionalNumber = (value: string) => {
      const parsed = Number(value);
      return value.trim() === "" || !Number.isFinite(parsed) || parsed <= 0
        ? undefined
        : parsed;
    };

    onSave({
      employment,
      role: role.trim() || undefined,
      targetHoursPerWeek:
        employment === "permanent" ? (optionalNumber(target) ?? 38) : undefined,
      maxHoursPerWeek: optionalNumber(maxHours),
      maxDaysPerWeek: optionalNumber(maxDays)
    });
  }

  return (
    <div className="rounded-xl border-2 border-accent bg-subtle p-4">
      <p className="mb-3 text-sm font-bold text-ink">Editing {person.name}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <EmploymentChoice
          selected={employment === "permanent"}
          title="Permanent"
          detail="Gets contracted hours first."
          onSelect={() => setEmployment("permanent")}
        />
        <EmploymentChoice
          selected={employment === "casual"}
          title="Casual"
          detail="Works to availability only."
          onSelect={() => setEmployment("casual")}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
          Role (optional)
          <input
            type="text"
            value={role}
            placeholder="e.g. Store manager"
            onChange={(event) => setRole(event.target.value)}
            className="h-11 w-44 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </label>

        {employment === "permanent" && (
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            Contracted hours a week
            <input
              type="number"
              min={1}
              max={60}
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="h-11 w-32 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none focus:border-accent"
            />
          </label>
        )}

        <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
          Max hours a week
          <input
            type="number"
            min={1}
            max={80}
            value={maxHours}
            placeholder="no limit"
            onChange={(event) => setMaxHours(event.target.value)}
            className="h-11 w-32 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
          Max days a week
          <input
            type="number"
            min={1}
            max={7}
            value={maxDays}
            placeholder="no limit"
            onChange={(event) => setMaxDays(event.target.value)}
            className="h-11 w-32 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </label>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="primary" onClick={save}>
          Save changes
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

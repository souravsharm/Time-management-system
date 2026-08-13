"use client";

import {
  CalendarCheck,
  CalendarDays,
  Copy,
  GraduationCap,
  Inbox,
  Link2,
  RotateCcw,
  Store,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CommonTimeWorkspace } from "@/components/availability/CommonTimeWorkspace";
import { HowToGuide } from "@/components/HowToGuide";
import { RosterWorkspace, type RosterTab } from "@/components/roster/RosterWorkspace";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { sampleWorkspace } from "@/lib/scheduling/sampleData";
import { tradingBounds } from "@/lib/scheduling/shiftTime";
import { dayNames, orderedWeek } from "@/lib/scheduling/time";
import type {
  AvailabilityWindow,
  DayOfWeek,
  Person,
  PlannerMode,
  ShiftRequirement,
  StoreSettings,
  WorkspaceDraft
} from "@/lib/scheduling/types";
import { decodeFillResponse, encodeFillSession } from "@/lib/session";
import { slotSetToWindows } from "@/lib/grid";
import { emptyWorkspace, normalizeWorkspace, STORAGE_KEY } from "@/lib/workspace";
import { cn } from "@/lib/utils";

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function PlannerApp() {
  const [workspace, setWorkspace] = useState<WorkspaceDraft>(sampleWorkspace);
  const [mounted, setMounted] = useState(false);
  const [importBanner, setImportBanner] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [rosterTab, setRosterTab] = useState<RosterTab>("overview");

  useEffect(() => {
    const url = new URL(window.location.href);
    const addParam = url.searchParams.get("add");

    if (addParam) {
      const response = decodeFillResponse(addParam);
      if (response) {
        // Queue it for the manager. Nothing touches the roster without approval.
        setWorkspace((current) => {
          const matched = current.people.find(
            (person) => person.name.toLowerCase() === response.name.toLowerCase()
          );

          const slotSet = new Set<string>();
          for (const [day, indices] of Object.entries(response.slots)) {
            for (const index of indices) slotSet.add(`${day}-${index}`);
          }
          const bounds = tradingBounds(current.store);
          const windows = slotSetToWindows(slotSet, "pending", bounds.startHour).map(
            ({ dayOfWeek, startMinutes, endMinutes }) => ({
              dayOfWeek,
              startMinutes,
              endMinutes
            })
          );

          return {
            ...current,
            submissions: [
              ...current.submissions,
              {
                id: makeId("submission"),
                personName: response.name,
                matchedPersonId: matched?.id,
                receivedAt: new Date().toISOString(),
                windows,
                status: "pending" as const
              }
            ]
          };
        });
        setImportBanner(response.name);
      }
      url.searchParams.delete("add");
      window.history.replaceState({}, "", url);
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    const restored = saved ? normalizeWorkspace(safeParse(saved)) : null;

    if (restored && !addParam) {
      setWorkspace(restored);
    } else if (restored) {
      setWorkspace((current) => ({ ...restored, submissions: [...restored.submissions, ...current.submissions] }));
    } else if (!addParam) {
      // First visit: open the tour rather than dropping them into a full dashboard.
      setShowGuide(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    }
  }, [mounted, workspace]);

  const pendingCount = workspace.submissions.filter(
    (entry) => entry.status === "pending"
  ).length;

  function updateWorkspace(patch: Partial<WorkspaceDraft>) {
    setWorkspace((current) => ({ ...current, ...patch }));
  }

  function updateStore(patch: Partial<StoreSettings>) {
    setWorkspace((current) => ({ ...current, store: { ...current.store, ...patch } }));
  }

  function addPerson(person: Omit<Person, "id">) {
    setWorkspace((current) => ({
      ...current,
      people: [...current.people, { ...person, id: makeId("person") }]
    }));
  }

  function updatePerson(personId: string, patch: Partial<Omit<Person, "id">>) {
    setWorkspace((current) => ({
      ...current,
      people: current.people.map((person) =>
        person.id === personId ? { ...person, ...patch } : person
      )
    }));
  }

  function removePerson(personId: string) {
    setWorkspace((current) => ({
      ...current,
      people: current.people.filter((person) => person.id !== personId),
      availability: current.availability.filter((w) => w.participantId !== personId)
    }));
  }

  function setAvailability(personId: string, windows: Omit<AvailabilityWindow, "id">[]) {
    setWorkspace((current) => ({
      ...current,
      availability: [
        ...current.availability.filter((w) => w.participantId !== personId),
        ...windows.map((window) => ({ ...window, id: makeId("avail") }))
      ]
    }));
  }

  function addShift(shift: Omit<ShiftRequirement, "id">) {
    setWorkspace((current) => ({
      ...current,
      shifts: [...current.shifts, { ...shift, id: makeId("shift") }]
    }));
  }

  function updateShift(shiftId: string, patch: Omit<ShiftRequirement, "id">) {
    setWorkspace((current) => ({
      ...current,
      shifts: current.shifts.map((shift) =>
        shift.id === shiftId ? { ...patch, id: shiftId } : shift
      )
    }));
  }

  function removeShift(shiftId: string) {
    setWorkspace((current) => ({
      ...current,
      shifts: current.shifts.filter((shift) => shift.id !== shiftId)
    }));
  }

  function removeShiftDay(day: DayOfWeek) {
    setWorkspace((current) => ({
      ...current,
      shifts: current.shifts.filter((shift) => shift.dayOfWeek !== day)
    }));
  }

  /** Approving is the only path from a submission into the live roster. */
  function approveSubmission(submissionId: string) {
    setWorkspace((current) => {
      const submission = current.submissions.find((entry) => entry.id === submissionId);
      if (!submission) return current;

      const matched =
        current.people.find((person) => person.id === submission.matchedPersonId) ??
        current.people.find(
          (person) => person.name.toLowerCase() === submission.personName.toLowerCase()
        );

      const personId = matched?.id ?? makeId("person");
      const people = matched
        ? current.people
        : [
            ...current.people,
            { id: personId, name: submission.personName, employment: "casual" as const }
          ];

      return {
        ...current,
        people,
        availability: [
          ...current.availability.filter((window) => window.participantId !== personId),
          ...submission.windows.map((window) => ({
            ...window,
            id: makeId("avail"),
            participantId: personId
          }))
        ],
        submissions: current.submissions.map((entry) =>
          entry.id === submissionId
            ? {
                ...entry,
                status: "approved" as const,
                matchedPersonId: personId,
                decidedAt: new Date().toISOString()
              }
            : entry
        )
      };
    });
  }

  function declineSubmission(submissionId: string) {
    setWorkspace((current) => ({
      ...current,
      submissions: current.submissions.map((entry) =>
        entry.id === submissionId
          ? { ...entry, status: "declined" as const, decidedAt: new Date().toISOString() }
          : entry
      )
    }));
  }

  function reopenSubmission(submissionId: string) {
    setWorkspace((current) => ({
      ...current,
      submissions: current.submissions.map((entry) =>
        entry.id === submissionId
          ? { ...entry, status: "pending" as const, decidedAt: undefined }
          : entry
      )
    }));
  }

  function goToRequests() {
    updateWorkspace({ mode: "roster" });
    setRosterTab("requests");
    setImportBanner(null);
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fill">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fill text-ink">
      {importBanner && (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-accent px-4 py-3 text-sm font-semibold text-on-accent">
          <span className="inline-flex items-center gap-2">
            <Inbox className="h-4 w-4" aria-hidden="true" />
            {importBanner} sent their hours — they need your approval before they count.
          </span>
          <span className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={goToRequests}>
              Review now
            </Button>
            <button
              type="button"
              onClick={() => setImportBanner(null)}
              aria-label="Dismiss"
              className="rounded-lg p-1 hover:bg-surface/15"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        </div>
      )}

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent">
              <Store className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={workspace.title}
                onChange={(event) => updateWorkspace({ title: event.target.value })}
                aria-label="Planner name"
                className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-xl font-bold tracking-tight text-ink outline-none hover:border-line focus:border-accent focus:bg-surface"
              />
              <p className="px-1 text-sm text-ink-muted">Saved on this device automatically</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Button
              variant="primary"
              icon={<GraduationCap className="h-4 w-4" />}
              onClick={() => setShowGuide(true)}
            >
              How to use this
            </Button>
            {pendingCount > 0 && (
              <Button icon={<Inbox className="h-4 w-4" />} onClick={goToRequests}>
                {pendingCount} to approve
              </Button>
            )}
            <Button icon={<Link2 className="h-4 w-4" />} onClick={() => setShowShare((v) => !v)}>
              Ask the team
            </Button>
            <Button
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => setWorkspace(sampleWorkspace)}
            >
              Load example
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setWorkspace({ ...emptyWorkspace, mode: workspace.mode })}
            >
              Start over
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:px-6">
        {showShare && (
          <SharePanel
            title={workspace.title}
            store={workspace.store}
            onClose={() => setShowShare(false)}
          />
        )}

        <ModeSwitcher mode={workspace.mode} onSelect={(mode) => updateWorkspace({ mode })} />

        {workspace.mode === "roster" ? (
          <RosterWorkspace
            people={workspace.people}
            availability={workspace.availability}
            shifts={workspace.shifts}
            store={workspace.store}
            submissions={workspace.submissions}
            tab={rosterTab}
            onTabChange={setRosterTab}
            onStoreChange={updateStore}
            onAddPerson={addPerson}
            onUpdatePerson={updatePerson}
            onRemovePerson={removePerson}
            onSetAvailability={setAvailability}
            onAddShift={addShift}
            onUpdateShift={updateShift}
            onRemoveShift={removeShift}
            onRemoveShiftDay={removeShiftDay}
            onApproveSubmission={approveSubmission}
            onDeclineSubmission={declineSubmission}
            onReopenSubmission={reopenSubmission}
          />
        ) : (
          <CommonTimeWorkspace
            people={workspace.people}
            availability={workspace.availability}
            onAddPerson={addPerson}
            onUpdatePerson={updatePerson}
            onRemovePerson={removePerson}
            onSetAvailability={setAvailability}
          />
        )}
      </main>

      {showGuide && (
        <HowToGuide
          onClose={() => setShowGuide(false)}
          onJumpTo={(tab) => {
            updateWorkspace({ mode: "roster" });
            setRosterTab(tab);
            setShowGuide(false);
          }}
          onLoadExample={() => setWorkspace(sampleWorkspace)}
        />
      )}
    </div>
  );
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function ModeSwitcher({
  mode,
  onSelect
}: {
  mode: PlannerMode;
  onSelect: (mode: PlannerMode) => void;
}) {
  const options = [
    {
      mode: "roster" as const,
      icon: <CalendarDays className="h-5 w-5" aria-hidden="true" />,
      title: "Staff roster",
      description: "Work out who covers each shift"
    },
    {
      mode: "common_time" as const,
      icon: <CalendarCheck className="h-5 w-5" aria-hidden="true" />,
      title: "Find a time to meet",
      description: "Find a slot that suits the whole group"
    }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const active = option.mode === mode;
        return (
          <button
            key={option.mode}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.mode)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              active
                ? "border-accent bg-surface ring-1 ring-accent"
                : "border-line bg-surface/60 hover:bg-surface"
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                active ? "bg-accent text-on-accent" : "bg-fill text-ink-muted"
              )}
            >
              {option.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-ink">{option.title}</span>
              <span className="block text-sm text-ink-muted">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SharePanel({
  title,
  store,
  onClose
}: {
  title: string;
  store: StoreSettings;
  onClose: () => void;
}) {
  const bounds = useMemo(() => tradingBounds(store), [store]);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([...orderedWeek]);
  const [startHour, setStartHour] = useState(bounds.startHour);
  const [endHour, setEndHour] = useState(bounds.endHour);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hourOptions = useMemo(() => Array.from({ length: 25 }, (_, i) => i), []);

  function generate() {
    setLink(
      `${window.location.origin}/fill?s=${encodeFillSession({
        title,
        days: selectedDays,
        startHour,
        endHour
      })}`
    );
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card
      title="Ask the team for their hours"
      hint="Send everyone a link. They shade in when they're free and send a link back — you approve it before it counts."
      action={
        <Button size="sm" variant="ghost" icon={<X className="h-4 w-4" />} onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="grid gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Days to ask about</p>
          <div className="flex flex-wrap gap-2">
            {orderedWeek.map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={selectedDays.includes(day)}
                onClick={() => {
                  setSelectedDays((current) =>
                    current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
                  );
                  setLink(null);
                }}
                className={cn(
                  "min-w-[62px] rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  selectedDays.includes(day)
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line-strong bg-surface text-ink-soft hover:bg-subtle"
                )}
              >
                {dayNames[day].slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            Earliest
            <select
              value={startHour}
              onChange={(event) => {
                setStartHour(Number(event.target.value));
                setLink(null);
              }}
              className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none focus:border-accent"
            >
              {hourOptions.slice(0, 24).map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
            Latest
            <select
              value={endHour}
              onChange={(event) => {
                setEndHour(Number(event.target.value));
                setLink(null);
              }}
              className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-base outline-none focus:border-accent"
            >
              {hourOptions.slice(1).map((hour) => (
                <option key={hour} value={hour}>
                  {hour === 24 ? "midnight" : `${String(hour).padStart(2, "0")}:00`}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="primary"
            onClick={generate}
            disabled={selectedDays.length === 0 || startHour >= endHour}
          >
            Make the link
          </Button>
          {store.alwaysOpen && (
            <p className="text-sm text-ink-muted">
              Your store is 24/7, so this defaults to the full day.
            </p>
          )}
        </div>

        {link && (
          <div className="grid gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 break-all rounded-xl border border-line-strong bg-subtle px-3 py-2.5 text-xs text-ink-soft">
                {link}
              </code>
              <Button variant="primary" icon={<Copy className="h-4 w-4" />} onClick={copy}>
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </div>
            <p className="rounded-xl bg-subtle px-4 py-3 text-sm text-ink-soft">
              When they send their link back, open it and their hours land in{" "}
              <strong>Requests</strong> for you to approve or decline. Nothing changes the
              roster until you approve it.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

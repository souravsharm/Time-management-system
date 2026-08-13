import { defaultStore } from "@/lib/scheduling/sampleData";
import { DAY_MINUTES } from "@/lib/scheduling/shiftTime";
import type {
  AvailabilitySubmission,
  AvailabilityWindow,
  DayOfWeek,
  Person,
  ShiftRequirement,
  StoreSettings,
  WorkspaceDraft
} from "@/lib/scheduling/types";

export const STORAGE_KEY = "availability-roster-planner.workspace.v3";

export const emptyWorkspace: WorkspaceDraft = {
  title: "My roster",
  mode: "roster",
  timezone: "UTC",
  store: defaultStore,
  people: [],
  availability: [],
  shifts: [],
  submissions: []
};

/**
 * Saved workspaces predate store settings, contract types and the approval queue.
 * Anything missing gets a sensible default rather than crashing the app.
 */
export function normalizeWorkspace(raw: unknown): WorkspaceDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const draft = raw as Partial<WorkspaceDraft>;

  if (!Array.isArray(draft.people) || !Array.isArray(draft.availability)) return null;

  return {
    title: typeof draft.title === "string" ? draft.title : emptyWorkspace.title,
    mode: draft.mode === "common_time" ? "common_time" : "roster",
    timezone: typeof draft.timezone === "string" ? draft.timezone : "UTC",
    store: normalizeStore(draft.store),
    people: draft.people.map(normalizePerson),
    availability: draft.availability.filter(isAvailabilityWindow),
    shifts: Array.isArray(draft.shifts) ? draft.shifts.filter(isShift) : [],
    submissions: Array.isArray(draft.submissions)
      ? draft.submissions.filter(isSubmission)
      : []
  };
}

function normalizeStore(store: unknown): StoreSettings {
  if (!store || typeof store !== "object") return defaultStore;
  const draft = store as Partial<StoreSettings>;

  const hours = { ...defaultStore.hours };
  if (draft.hours && typeof draft.hours === "object") {
    for (const day of [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]) {
      const entry = draft.hours[day];
      if (entry === null) {
        hours[day] = null;
      } else if (
        entry &&
        typeof entry.openMinutes === "number" &&
        typeof entry.closeMinutes === "number"
      ) {
        hours[day] = {
          openMinutes: clamp(entry.openMinutes, 0, DAY_MINUTES),
          closeMinutes: clamp(entry.closeMinutes, 0, DAY_MINUTES)
        };
      }
    }
  }

  return {
    alwaysOpen: draft.alwaysOpen === true,
    hours,
    maxShiftHours:
      typeof draft.maxShiftHours === "number" && draft.maxShiftHours > 0
        ? clamp(draft.maxShiftHours, 1, 24)
        : defaultStore.maxShiftHours
  };
}

function normalizePerson(person: Person): Person {
  return {
    ...person,
    // Anyone saved before contract types existed is treated as a casual.
    employment: person.employment === "permanent" ? "permanent" : "casual"
  };
}

function isAvailabilityWindow(value: unknown): value is AvailabilityWindow {
  const window = value as AvailabilityWindow;
  return (
    !!window &&
    typeof window.participantId === "string" &&
    typeof window.startMinutes === "number" &&
    typeof window.endMinutes === "number"
  );
}

function isShift(value: unknown): value is ShiftRequirement {
  const shift = value as ShiftRequirement;
  return (
    !!shift &&
    typeof shift.id === "string" &&
    typeof shift.startMinutes === "number" &&
    typeof shift.endMinutes === "number" &&
    shift.endMinutes > shift.startMinutes
  );
}

function isSubmission(value: unknown): value is AvailabilitySubmission {
  const submission = value as AvailabilitySubmission;
  return (
    !!submission &&
    typeof submission.id === "string" &&
    typeof submission.personName === "string" &&
    Array.isArray(submission.windows)
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

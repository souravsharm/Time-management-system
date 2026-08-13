import { DAY_MINUTES } from "./shiftTime";
import { parseTimeToMinutes } from "./time";
import type {
  AvailabilityWindow,
  DayOfWeek,
  Person,
  ShiftRequirement,
  StoreSettings,
  WorkspaceDraft
} from "./types";

const ALL_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export const defaultStore: StoreSettings = {
  alwaysOpen: false,
  hours: {
    0: { openMinutes: 10 * 60, closeMinutes: 18 * 60 },
    1: { openMinutes: 9 * 60, closeMinutes: 21 * 60 },
    2: { openMinutes: 9 * 60, closeMinutes: 21 * 60 },
    3: { openMinutes: 9 * 60, closeMinutes: 21 * 60 },
    4: { openMinutes: 9 * 60, closeMinutes: 21 * 60 },
    5: { openMinutes: 9 * 60, closeMinutes: 21 * 60 },
    6: { openMinutes: 9 * 60, closeMinutes: 21 * 60 }
  },
  maxShiftHours: 10
};

/** A 24/7 convenience store: nights, mornings and evenings, every day. */
export const sampleStore: StoreSettings = {
  alwaysOpen: true,
  hours: defaultStore.hours,
  maxShiftHours: 10
};

export const samplePeople: Person[] = [
  {
    id: "person-maya",
    name: "Maya Chen",
    role: "Store manager",
    employment: "permanent",
    targetHoursPerWeek: 40,
    maxHoursPerWeek: 40,
    maxDaysPerWeek: 5
  },
  {
    id: "person-jordan",
    name: "Jordan Patel",
    role: "Assistant manager",
    employment: "permanent",
    targetHoursPerWeek: 40,
    maxHoursPerWeek: 40,
    maxDaysPerWeek: 5
  },
  {
    id: "person-noah",
    name: "Noah Williams",
    role: "Night supervisor",
    employment: "permanent",
    targetHoursPerWeek: 40,
    maxHoursPerWeek: 40,
    maxDaysPerWeek: 5
  },
  {
    id: "person-sofia",
    name: "Sofia Garcia",
    role: "Night attendant",
    employment: "permanent",
    targetHoursPerWeek: 32,
    maxHoursPerWeek: 40,
    maxDaysPerWeek: 4
  },
  {
    id: "person-olivia",
    name: "Olivia Nguyen",
    role: "Console operator",
    employment: "casual",
    maxHoursPerWeek: 30
  },
  {
    id: "person-ethan",
    name: "Ethan Brooks",
    role: "Console operator",
    employment: "casual",
    maxHoursPerWeek: 30
  },
  {
    id: "person-priya",
    name: "Priya Shah",
    role: "Student casual",
    employment: "casual",
    maxHoursPerWeek: 20
  },
  {
    id: "person-liam",
    name: "Liam OConnor",
    role: "Night casual",
    employment: "casual",
    maxHoursPerWeek: 25
  },
  {
    id: "person-ava",
    name: "Ava Thompson",
    role: "Weekend casual",
    employment: "casual",
    maxHoursPerWeek: 20
  },
  {
    id: "person-ben",
    name: "Ben Martin",
    role: "Morning casual",
    employment: "casual",
    maxHoursPerWeek: 25
  }
];

/**
 * Availability is written as plain windows. Overnight people are marked free late
 * on one day and early on the next, which is exactly what an overnight shift needs.
 */
export const sampleAvailability: AvailabilityWindow[] = [
  // Permanents — broad weekday availability across the clock.
  ...availabilityFor("person-maya", [
    ...ALL_DAYS.slice(0, 5).map((day) => [day, "05:00", "16:00"] as const)
  ]),
  ...availabilityFor("person-jordan", [
    ...ALL_DAYS.slice(0, 5).map((day) => [day, "12:00", "23:59"] as const),
    [6, "12:00", "23:59"]
  ]),
  // Night supervisor: free from the evening through to the next morning.
  ...availabilityFor("person-noah", [
    ...ALL_DAYS.map((day) => [day, "20:00", "24:00"] as const),
    ...ALL_DAYS.map((day) => [day, "00:00", "08:00"] as const)
  ]),
  ...availabilityFor("person-sofia", [
    ...[2, 3, 4, 5, 6].map((day) => [day as DayOfWeek, "20:00", "24:00"] as const),
    ...[3, 4, 5, 6, 0].map((day) => [day as DayOfWeek, "00:00", "08:00"] as const)
  ]),
  // Casuals.
  ...availabilityFor("person-olivia", [
    [1, "05:00", "15:00"],
    [2, "05:00", "15:00"],
    [3, "05:00", "15:00"],
    [5, "05:00", "15:00"],
    [6, "05:00", "15:00"]
  ]),
  ...availabilityFor("person-ethan", [
    [2, "13:00", "23:00"],
    [3, "13:00", "23:00"],
    [4, "13:00", "23:00"],
    [5, "13:00", "23:00"],
    [0, "10:00", "23:00"]
  ]),
  ...availabilityFor("person-priya", [
    [1, "13:00", "23:00"],
    [3, "13:00", "23:00"],
    [4, "13:00", "23:00"],
    [5, "13:00", "23:00"],
    [6, "10:00", "23:00"],
    [0, "10:00", "22:00"]
  ]),
  ...availabilityFor("person-liam", [
    ...[5, 6, 0].map((day) => [day as DayOfWeek, "20:00", "24:00"] as const),
    ...[6, 0, 1].map((day) => [day as DayOfWeek, "00:00", "08:00"] as const)
  ]),
  ...availabilityFor("person-ava", [
    [6, "05:00", "23:00"],
    [0, "05:00", "23:00"],
    [5, "16:00", "23:00"]
  ]),
  ...availabilityFor("person-ben", [
    [1, "05:00", "14:00"],
    [2, "05:00", "14:00"],
    [4, "05:00", "14:00"],
    [6, "05:00", "14:00"],
    [0, "05:00", "14:00"]
  ])
];

/**
 * Three 8-hour shifts a day, round the clock: one overnight, two on the morning,
 * one on the evening — with an extra pair of hands on the weekend rush.
 */
export const sampleShifts: ShiftRequirement[] = ALL_DAYS.flatMap((day) => {
  const busyDay = day === 5 || day === 6;

  return [
    overnight(`shift-${day}-night`, day, "22:00", "06:00", 1, "Night"),
    shift(`shift-${day}-morning`, day, "06:00", "14:00", 2, "Morning"),
    shift(`shift-${day}-evening`, day, "14:00", "22:00", busyDay ? 2 : 1, "Evening")
  ];
});

export const sampleWorkspace: WorkspaceDraft = {
  title: "Corner Store — 24/7 roster",
  mode: "roster",
  timezone: "Australia/Sydney",
  store: sampleStore,
  people: samplePeople,
  availability: sampleAvailability,
  shifts: sampleShifts,
  submissions: []
};

export const emptyStore: StoreSettings = defaultStore;

function availabilityFor(
  participantId: string,
  windows: ReadonlyArray<readonly [DayOfWeek, string, string]>
): AvailabilityWindow[] {
  return windows.map(([dayOfWeek, start, end], index) => ({
    id: `${participantId}-avail-${index + 1}`,
    participantId,
    dayOfWeek,
    startMinutes: parseTimeToMinutes(start),
    endMinutes: end === "24:00" ? DAY_MINUTES : parseTimeToMinutes(end)
  }));
}

function shift(
  id: string,
  dayOfWeek: DayOfWeek,
  start: string,
  end: string,
  requiredPeople: number,
  label: string
): ShiftRequirement {
  return {
    id,
    dayOfWeek,
    startMinutes: parseTimeToMinutes(start),
    endMinutes: end === "24:00" ? DAY_MINUTES : parseTimeToMinutes(end),
    requiredPeople,
    label
  };
}

/** Finishes on the following day, so endMinutes runs past 1440. */
function overnight(
  id: string,
  dayOfWeek: DayOfWeek,
  start: string,
  end: string,
  requiredPeople: number,
  label: string
): ShiftRequirement {
  return {
    id,
    dayOfWeek,
    startMinutes: parseTimeToMinutes(start),
    endMinutes: parseTimeToMinutes(end) + DAY_MINUTES,
    requiredPeople,
    label
  };
}

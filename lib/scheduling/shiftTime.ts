import type {
  AvailabilityWindow,
  DayOfWeek,
  ShiftRequirement,
  StoreSettings
} from "./types";

export const DAY_MINUTES = 1440;
export const WEEK_MINUTES = DAY_MINUTES * 7;

/**
 * A shift clipped to a single calendar day. An overnight shift produces two of
 * these — everything downstream (availability matching, coverage sweeps, the day
 * view) works on segments so midnight is never a special case.
 */
export type DaySegment = {
  day: DayOfWeek;
  startMinutes: number;
  endMinutes: number;
};

export function nextDay(day: DayOfWeek): DayOfWeek {
  return ((day + 1) % 7) as DayOfWeek;
}

export function previousDay(day: DayOfWeek): DayOfWeek {
  return ((day + 6) % 7) as DayOfWeek;
}

export function shiftDuration(shift: ShiftRequirement): number {
  return shift.endMinutes - shift.startMinutes;
}

export function crossesMidnight(shift: ShiftRequirement): boolean {
  return shift.endMinutes > DAY_MINUTES;
}

export function shiftSegments(shift: ShiftRequirement): DaySegment[] {
  if (shift.endMinutes <= DAY_MINUTES) {
    return [
      {
        day: shift.dayOfWeek,
        startMinutes: shift.startMinutes,
        endMinutes: shift.endMinutes
      }
    ];
  }

  return [
    {
      day: shift.dayOfWeek,
      startMinutes: shift.startMinutes,
      endMinutes: DAY_MINUTES
    },
    {
      day: nextDay(shift.dayOfWeek),
      startMinutes: 0,
      endMinutes: shift.endMinutes - DAY_MINUTES
    }
  ];
}

/** The part of a shift that falls on one particular day, if any. */
export function segmentOnDay(
  shift: ShiftRequirement,
  day: DayOfWeek
): DaySegment | null {
  return shiftSegments(shift).find((segment) => segment.day === day) ?? null;
}

/** Absolute minute range inside the week, used for clash detection. */
export function weekRange(shift: ShiftRequirement): { start: number; end: number } {
  const start = shift.dayOfWeek * DAY_MINUTES + shift.startMinutes;
  return { start, end: start + shiftDuration(shift) };
}

/** Overlap test that still works when a Sunday-night shift wraps into Monday. */
export function shiftsOverlap(a: ShiftRequirement, b: ShiftRequirement): boolean {
  const rangeA = weekRange(a);
  const rangeB = weekRange(b);

  for (const offset of [-WEEK_MINUTES, 0, WEEK_MINUTES]) {
    if (rangeA.start < rangeB.end + offset && rangeB.start + offset < rangeA.end) {
      return true;
    }
  }
  return false;
}

/** True when the person marked themselves free for every minute of the shift. */
export function personCoversShift(
  availability: AvailabilityWindow[],
  participantId: string,
  shift: ShiftRequirement
): boolean {
  return shiftSegments(shift).every((segment) =>
    availability.some(
      (window) =>
        window.participantId === participantId &&
        window.dayOfWeek === segment.day &&
        window.startMinutes <= segment.startMinutes &&
        window.endMinutes >= segment.endMinutes
    )
  );
}

export function formatShiftTime(totalMinutes: number): string {
  const withinDay = ((totalMinutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours = Math.floor(withinDay / 60);
  const minutes = withinDay % 60;
  const period = hours < 12 ? "am" : "pm";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0
    ? `${display}${period}`
    : `${display}:${String(minutes).padStart(2, "0")}${period}`;
}

/** "10pm – 6am (next day)" so an overnight shift is never ambiguous. */
export function formatShiftRange(shift: ShiftRequirement): string {
  const base = `${formatShiftTime(shift.startMinutes)} – ${formatShiftTime(shift.endMinutes)}`;
  return crossesMidnight(shift) ? `${base} (next day)` : base;
}

/** Converts an `<input type="time">` pair into a shift range, handling overnight. */
export function toShiftRange(
  startMinutes: number,
  endMinutes: number
): { startMinutes: number; endMinutes: number } {
  return {
    startMinutes,
    endMinutes: endMinutes > startMinutes ? endMinutes : endMinutes + DAY_MINUTES
  };
}

export type ShiftRuleIssue = {
  field: "time" | "people";
  message: string;
};

/**
 * The company rules a shift has to satisfy before it can be saved. Catches the
 * "midnight to 11:59pm" case that would otherwise ask one person for a 24h day.
 */
export function validateShift(
  draft: { startMinutes: number; endMinutes: number; requiredPeople: number },
  store: StoreSettings
): ShiftRuleIssue | null {
  const duration = draft.endMinutes - draft.startMinutes;

  if (duration <= 0) {
    return { field: "time", message: "The finish time has to be after the start time." };
  }
  if (duration > DAY_MINUTES) {
    return { field: "time", message: "A shift can't run longer than 24 hours." };
  }

  const maxMinutes = store.maxShiftHours * 60;
  if (duration > maxMinutes) {
    return {
      field: "time",
      message: `That's ${formatHours(duration)} long. Your rule caps a single shift at ${store.maxShiftHours} hours — split it into two shifts.`
    };
  }
  if (draft.requiredPeople < 1) {
    return { field: "people", message: "A shift needs at least one person." };
  }
  if (draft.requiredPeople > 50) {
    return { field: "people", message: "That's more people than this planner handles." };
  }

  return null;
}

/** True when the shift runs outside the hours the store is actually open. */
export function shiftOutsideTrading(
  shift: ShiftRequirement,
  store: StoreSettings
): boolean {
  if (store.alwaysOpen) return false;

  return shiftSegments(shift).some((segment) => {
    const hours = store.hours[segment.day];
    if (!hours) return true;
    return (
      segment.startMinutes < hours.openMinutes || segment.endMinutes > hours.closeMinutes
    );
  });
}

export function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** The trading window the availability grid and charts should span. */
export function tradingBounds(store: StoreSettings): {
  startHour: number;
  endHour: number;
} {
  if (store.alwaysOpen) return { startHour: 0, endHour: 24 };

  const windows = Object.values(store.hours).filter(
    (entry): entry is OpeningHoursValue => entry !== null
  );
  if (windows.length === 0) return { startHour: 6, endHour: 23 };

  const earliest = Math.min(...windows.map((entry) => entry.openMinutes));
  const latest = Math.max(...windows.map((entry) => entry.closeMinutes));

  return {
    startHour: Math.max(0, Math.floor(earliest / 60)),
    endHour: Math.min(24, Math.ceil(latest / 60))
  };
}

type OpeningHoursValue = { openMinutes: number; closeMinutes: number };

import { buildRoster } from "@/lib/scheduling/rosterBuilder";
import {
  DAY_MINUTES,
  personCoversShift,
  segmentOnDay,
  shiftDuration,
  shiftSegments,
  type DaySegment
} from "@/lib/scheduling/shiftTime";
import { orderedWeek } from "@/lib/scheduling/time";
import type {
  AvailabilityWindow,
  DayOfWeek,
  Person,
  RosterBuildResult,
  ShiftRequirement,
  StoreSettings
} from "@/lib/scheduling/types";

/** Sweep resolution for "is the store actually staffed at this moment?". */
const BUCKET_MINUTES = 15;

export type PersonLoad = {
  person: Person;
  index: number;
  minutes: number;
  sharePct: number;
  shiftCount: number;
  dayCount: number;
  /** Contracted hours for permanents; 0 for casuals. */
  targetMinutes: number;
};

export type OpenGap = {
  startMinutes: number;
  endMinutes: number;
};

export type DayStats = {
  day: DayOfWeek;
  shiftCount: number;
  slotsRequired: number;
  slotsFilled: number;
  coveragePct: number;
  /** The store's trading window for the day. */
  openStart: number | null;
  openEnd: number | null;
  openMinutes: number;
  staffedMinutes: number;
  fullyStaffedMinutes: number;
  /** Stretches inside the trading window with nobody rostered at all. */
  openGaps: OpenGap[];
  peopleOn: string[];
};

export type ShiftStatus = "full" | "short" | "empty";

export type ShiftDetail = {
  shift: ShiftRequirement;
  assignedIds: string[];
  missing: number;
  status: ShiftStatus;
  nobodyFree: boolean;
};

export type PersonRibbonBlock = {
  personId: string;
  shiftId: string;
  startMinutes: number;
  endMinutes: number;
  /** True when this block is the tail of a shift that started the day before. */
  continuedFromPreviousDay: boolean;
  /** True when this block runs past midnight into the next day. */
  continuesIntoNextDay: boolean;
};

export type RosterInsights = {
  result: RosterBuildResult;
  shiftCount: number;
  slotsRequired: number;
  slotsFilled: number;
  slotCoveragePct: number;
  requiredMinutes: number;
  filledMinutes: number;
  missingMinutes: number;
  openMinutes: number;
  staffedMinutes: number;
  fullyStaffedMinutes: number;
  storeCoveragePct: number;
  shiftsFull: number;
  shiftsShort: number;
  shiftsEmpty: number;
  perPerson: PersonLoad[];
  perDay: DayStats[];
  problemShifts: ShiftDetail[];
  unusedPeople: Person[];
  /** Permanent staff who didn't get their contracted hours. */
  shortOfContract: PersonLoad[];
};

export function shiftStatus(assigned: number, required: number): ShiftStatus {
  if (assigned === 0) return "empty";
  if (assigned < required) return "short";
  return "full";
}

/** The store's trading window for a day, or null when it's closed. */
export function tradingWindow(
  store: StoreSettings,
  day: DayOfWeek
): { openMinutes: number; closeMinutes: number } | null {
  if (store.alwaysOpen) return { openMinutes: 0, closeMinutes: DAY_MINUTES };
  return store.hours[day];
}

export function analyseRoster(
  people: Person[],
  availability: AvailabilityWindow[],
  shifts: ShiftRequirement[],
  store: StoreSettings
): RosterInsights {
  const result = buildRoster(people, availability, shifts);

  const assignedByShift = new Map<string, string[]>();
  for (const assignment of result.assignments) {
    const bucket = assignedByShift.get(assignment.shiftRequirementId);
    if (bucket) bucket.push(assignment.participantId);
    else assignedByShift.set(assignment.shiftRequirementId, [assignment.participantId]);
  }

  const details: ShiftDetail[] = shifts.map((shift) => {
    const assignedIds = assignedByShift.get(shift.id) ?? [];
    return {
      shift,
      assignedIds,
      missing: Math.max(0, shift.requiredPeople - assignedIds.length),
      status: shiftStatus(assignedIds.length, shift.requiredPeople),
      nobodyFree:
        assignedIds.length === 0 &&
        !people.some((person) => personCoversShift(availability, person.id, shift))
    };
  });

  const detailByShiftId = new Map(details.map((detail) => [detail.shift.id, detail]));

  let slotsRequired = 0;
  let slotsFilled = 0;
  let requiredMinutes = 0;
  let filledMinutes = 0;
  let shiftsFull = 0;
  let shiftsShort = 0;
  let shiftsEmpty = 0;

  for (const detail of details) {
    const duration = shiftDuration(detail.shift);
    slotsRequired += detail.shift.requiredPeople;
    slotsFilled += detail.assignedIds.length;
    requiredMinutes += duration * detail.shift.requiredPeople;
    filledMinutes += duration * detail.assignedIds.length;
    if (detail.status === "full") shiftsFull += 1;
    else if (detail.status === "short") shiftsShort += 1;
    else shiftsEmpty += 1;
  }

  const perDay = orderedWeek.map((day) => analyseDay(day, shifts, detailByShiftId, store));

  const openMinutes = perDay.reduce((total, day) => total + day.openMinutes, 0);
  const staffedMinutes = perDay.reduce((total, day) => total + day.staffedMinutes, 0);
  const fullyStaffedMinutes = perDay.reduce(
    (total, day) => total + day.fullyStaffedMinutes,
    0
  );

  const shiftCountByPerson = new Map<string, number>();
  const daysByPerson = new Map<string, Set<DayOfWeek>>();
  for (const detail of details) {
    for (const personId of detail.assignedIds) {
      shiftCountByPerson.set(personId, (shiftCountByPerson.get(personId) ?? 0) + 1);
      const days = daysByPerson.get(personId) ?? new Set<DayOfWeek>();
      for (const segment of shiftSegments(detail.shift)) days.add(segment.day);
      daysByPerson.set(personId, days);
    }
  }

  const perPerson: PersonLoad[] = people
    .map((person, index) => {
      const minutes = result.assignedMinutesByParticipant[person.id] ?? 0;
      return {
        person,
        index,
        minutes,
        sharePct: filledMinutes === 0 ? 0 : (minutes / filledMinutes) * 100,
        shiftCount: shiftCountByPerson.get(person.id) ?? 0,
        dayCount: daysByPerson.get(person.id)?.size ?? 0,
        targetMinutes:
          person.employment === "permanent" ? (person.targetHoursPerWeek ?? 38) * 60 : 0
      };
    })
    .sort((a, b) => b.minutes - a.minutes || a.person.name.localeCompare(b.person.name));

  return {
    result,
    shiftCount: shifts.length,
    slotsRequired,
    slotsFilled,
    slotCoveragePct: slotsRequired === 0 ? 0 : (slotsFilled / slotsRequired) * 100,
    requiredMinutes,
    filledMinutes,
    missingMinutes: Math.max(0, requiredMinutes - filledMinutes),
    openMinutes,
    staffedMinutes,
    fullyStaffedMinutes,
    storeCoveragePct: openMinutes === 0 ? 0 : (staffedMinutes / openMinutes) * 100,
    shiftsFull,
    shiftsShort,
    shiftsEmpty,
    perPerson,
    perDay,
    problemShifts: details
      .filter((detail) => detail.status !== "full")
      .sort(
        (a, b) =>
          b.missing - a.missing ||
          a.shift.dayOfWeek - b.shift.dayOfWeek ||
          a.shift.startMinutes - b.shift.startMinutes
      ),
    unusedPeople: perPerson.filter((load) => load.minutes === 0).map((load) => load.person),
    shortOfContract: perPerson.filter(
      (load) => load.targetMinutes > 0 && load.minutes < load.targetMinutes
    )
  };
}

/** Every shift segment that touches this day, including overnight tails. */
export function segmentsForDay(
  shifts: ShiftRequirement[],
  day: DayOfWeek
): { shift: ShiftRequirement; segment: DaySegment }[] {
  const result: { shift: ShiftRequirement; segment: DaySegment }[] = [];
  for (const shift of shifts) {
    const segment = segmentOnDay(shift, day);
    if (segment) result.push({ shift, segment });
  }
  return result.sort((a, b) => a.segment.startMinutes - b.segment.startMinutes);
}

function analyseDay(
  day: DayOfWeek,
  shifts: ShiftRequirement[],
  detailByShiftId: Map<string, ShiftDetail>,
  store: StoreSettings
): DayStats {
  const onDay = segmentsForDay(shifts, day);
  const startingToday = shifts.filter((shift) => shift.dayOfWeek === day);

  const peopleOn = new Set<string>();
  let slotsRequired = 0;
  let slotsFilled = 0;

  for (const shift of startingToday) {
    const detail = detailByShiftId.get(shift.id);
    slotsRequired += shift.requiredPeople;
    slotsFilled += detail?.assignedIds.length ?? 0;
  }
  for (const { shift } of onDay) {
    for (const personId of detailByShiftId.get(shift.id)?.assignedIds ?? []) {
      peopleOn.add(personId);
    }
  }

  const trading = tradingWindow(store, day);
  // With no configured hours, fall back to the span the shifts themselves imply.
  const fallback =
    onDay.length === 0
      ? null
      : {
          openMinutes: Math.min(...onDay.map((entry) => entry.segment.startMinutes)),
          closeMinutes: Math.max(...onDay.map((entry) => entry.segment.endMinutes))
        };
  const window = trading ?? fallback;

  if (!window || window.closeMinutes <= window.openMinutes) {
    return {
      day,
      shiftCount: startingToday.length,
      slotsRequired,
      slotsFilled,
      coveragePct: slotsRequired === 0 ? 0 : (slotsFilled / slotsRequired) * 100,
      openStart: null,
      openEnd: null,
      openMinutes: 0,
      staffedMinutes: 0,
      fullyStaffedMinutes: 0,
      openGaps: [],
      peopleOn: [...peopleOn]
    };
  }

  let staffedMinutes = 0;
  let fullyStaffedMinutes = 0;
  const openGaps: OpenGap[] = [];
  let gapStart: number | null = null;

  for (let time = window.openMinutes; time < window.closeMinutes; time += BUCKET_MINUTES) {
    const span = Math.min(BUCKET_MINUTES, window.closeMinutes - time);
    let required = 0;
    let assigned = 0;

    for (const { shift, segment } of onDay) {
      if (segment.startMinutes <= time && time < segment.endMinutes) {
        required += shift.requiredPeople;
        assigned += detailByShiftId.get(shift.id)?.assignedIds.length ?? 0;
      }
    }

    if (assigned > 0) {
      staffedMinutes += span;
      if (gapStart !== null) {
        openGaps.push({ startMinutes: gapStart, endMinutes: time });
        gapStart = null;
      }
    } else if (gapStart === null) {
      gapStart = time;
    }

    if (required > 0 && assigned >= required) {
      fullyStaffedMinutes += span;
    }
  }

  if (gapStart !== null) {
    openGaps.push({ startMinutes: gapStart, endMinutes: window.closeMinutes });
  }

  return {
    day,
    shiftCount: startingToday.length,
    slotsRequired,
    slotsFilled,
    coveragePct: slotsRequired === 0 ? 0 : (slotsFilled / slotsRequired) * 100,
    openStart: window.openMinutes,
    openEnd: window.closeMinutes,
    openMinutes: window.closeMinutes - window.openMinutes,
    staffedMinutes,
    fullyStaffedMinutes,
    openGaps,
    peopleOn: [...peopleOn]
  };
}

export type CoverageBand = {
  startMinutes: number;
  endMinutes: number;
  state: ShiftStatus;
};

/** The trading window split into runs of the same staffing state. */
export function buildCoverageBands(
  shifts: ShiftRequirement[],
  day: DayOfWeek,
  insights: RosterInsights,
  bounds: { openStart: number; openEnd: number }
): CoverageBand[] {
  const onDay = segmentsForDay(shifts, day);
  if (onDay.length === 0 && bounds.openEnd <= bounds.openStart) return [];

  const assignedCount = new Map<string, number>();
  for (const assignment of insights.result.assignments) {
    assignedCount.set(
      assignment.shiftRequirementId,
      (assignedCount.get(assignment.shiftRequirementId) ?? 0) + 1
    );
  }

  const bands: CoverageBand[] = [];

  for (let time = bounds.openStart; time < bounds.openEnd; time += BUCKET_MINUTES) {
    const span = Math.min(BUCKET_MINUTES, bounds.openEnd - time);
    let required = 0;
    let assigned = 0;

    for (const { shift, segment } of onDay) {
      if (segment.startMinutes <= time && time < segment.endMinutes) {
        required += shift.requiredPeople;
        assigned += assignedCount.get(shift.id) ?? 0;
      }
    }

    const state: ShiftStatus =
      assigned === 0 ? "empty" : required > 0 && assigned < required ? "short" : "full";
    const previous = bands.at(-1);

    if (previous && previous.state === state && previous.endMinutes === time) {
      previous.endMinutes = time + span;
    } else {
      bands.push({ startMinutes: time, endMinutes: time + span, state });
    }
  }

  return bands;
}

/** One horizontal lane per person for the day view, clipped to that day. */
export function buildDayRibbon(
  shifts: ShiftRequirement[],
  day: DayOfWeek,
  insights: RosterInsights
): Map<string, PersonRibbonBlock[]> {
  const lanes = new Map<string, PersonRibbonBlock[]>();
  const assignedByShift = new Map<string, string[]>();

  for (const assignment of insights.result.assignments) {
    const bucket = assignedByShift.get(assignment.shiftRequirementId);
    if (bucket) bucket.push(assignment.participantId);
    else assignedByShift.set(assignment.shiftRequirementId, [assignment.participantId]);
  }

  for (const { shift, segment } of segmentsForDay(shifts, day)) {
    for (const personId of assignedByShift.get(shift.id) ?? []) {
      const blocks = lanes.get(personId) ?? [];
      blocks.push({
        personId,
        shiftId: shift.id,
        startMinutes: segment.startMinutes,
        endMinutes: segment.endMinutes,
        continuedFromPreviousDay: shift.dayOfWeek !== day,
        continuesIntoNextDay: shift.dayOfWeek === day && shift.endMinutes > DAY_MINUTES
      });
      lanes.set(personId, blocks);
    }
  }

  for (const blocks of lanes.values()) {
    blocks.sort((a, b) => a.startMinutes - b.startMinutes);
  }

  return lanes;
}

export function hoursLabel(minutes: number): string {
  if (minutes <= 0) return "0h";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function friendlyTime(totalMinutes: number): string {
  const withinDay = ((totalMinutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours = Math.floor(withinDay / 60);
  const minutes = withinDay % 60;
  const period = hours < 12 ? "am" : "pm";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0
    ? `${display}${period}`
    : `${display}:${String(minutes).padStart(2, "0")}${period}`;
}

export function friendlyRange(startMinutes: number, endMinutes: number): string {
  const end = endMinutes === DAY_MINUTES ? "12am" : friendlyTime(endMinutes);
  return `${friendlyTime(startMinutes)} – ${end}`;
}

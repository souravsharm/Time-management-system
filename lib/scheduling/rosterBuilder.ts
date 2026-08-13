import { dayNames } from "./time";
import {
  formatShiftRange,
  personCoversShift,
  shiftDuration,
  shiftSegments,
  shiftsOverlap
} from "./shiftTime";
import type {
  AvailabilityWindow,
  DayOfWeek,
  Person,
  RosterAssignment,
  RosterBuildResult,
  RosterWarning,
  ShiftRequirement
} from "./types";

const DEFAULT_PERMANENT_TARGET_HOURS = 38;

type Ledger = {
  minutes: number;
  days: Set<DayOfWeek>;
  shifts: ShiftRequirement[];
};

export function buildRoster(
  people: Person[],
  availability: AvailabilityWindow[],
  shifts: ShiftRequirement[]
): RosterBuildResult {
  const assignments: RosterAssignment[] = [];
  const warnings: RosterWarning[] = [];

  const ledgers = new Map<string, Ledger>(
    people.map((person) => [person.id, { minutes: 0, days: new Set(), shifts: [] }])
  );

  // Hardest-to-fill shifts first, so scarce availability isn't spent on easy ones.
  const ordered = [...shifts].sort((a, b) => {
    const eligibleA = eligibleFor(people, availability, a).length;
    const eligibleB = eligibleFor(people, availability, b).length;
    if (eligibleA !== eligibleB) return eligibleA - eligibleB;
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startMinutes - b.startMinutes;
  });

  for (const shift of ordered) {
    const eligible = eligibleFor(people, availability, shift);
    const duration = shiftDuration(shift);

    const selectable = eligible.filter((person) => {
      const ledger = ledgers.get(person.id);
      if (!ledger) return false;
      if (ledger.shifts.some((other) => shiftsOverlap(other, shift))) return false;
      if (exceedsWeeklyHours(person, ledger, duration)) return false;
      if (exceedsWeeklyDays(person, ledger, shift)) return false;
      return true;
    });

    const ranked = selectable.sort((a, b) =>
      compareCandidates(a, b, ledgers.get(a.id)!, ledgers.get(b.id)!)
    );

    for (const person of ranked.slice(0, shift.requiredPeople)) {
      assignments.push({ shiftRequirementId: shift.id, participantId: person.id });

      const ledger = ledgers.get(person.id)!;
      ledger.minutes += duration;
      ledger.shifts.push(shift);
      for (const segment of shiftSegments(shift)) {
        ledger.days.add(segment.day);
      }
    }

    const filled = Math.min(ranked.length, shift.requiredPeople);
    if (filled < shift.requiredPeople) {
      warnings.push(
        buildWarning(shift, filled, eligible.length, selectable.length)
      );
    }
  }

  const assignedMinutesByParticipant = Object.fromEntries(
    people.map((person) => [person.id, ledgers.get(person.id)?.minutes ?? 0])
  ) as Record<string, number>;

  return {
    assignments: assignments.sort((a, b) => {
      const shiftA = shifts.find((shift) => shift.id === a.shiftRequirementId);
      const shiftB = shifts.find((shift) => shift.id === b.shiftRequirementId);
      if (!shiftA || !shiftB) return 0;
      if (shiftA.dayOfWeek !== shiftB.dayOfWeek) return shiftA.dayOfWeek - shiftB.dayOfWeek;
      return shiftA.startMinutes - shiftB.startMinutes;
    }),
    warnings,
    assignedMinutesByParticipant
  };
}

/**
 * Permanent staff owed contracted hours come first, ordered by how far short they
 * are. Once everyone's contract is met it falls back to spreading hours evenly, so
 * casuals share what's left.
 */
function compareCandidates(a: Person, b: Person, ledgerA: Ledger, ledgerB: Ledger): number {
  const deficitA = contractDeficit(a, ledgerA);
  const deficitB = contractDeficit(b, ledgerB);

  if (deficitA > 0 || deficitB > 0) {
    if (deficitA !== deficitB) return deficitB - deficitA;
  }

  if (ledgerA.minutes !== ledgerB.minutes) return ledgerA.minutes - ledgerB.minutes;
  return a.name.localeCompare(b.name);
}

function contractDeficit(person: Person, ledger: Ledger): number {
  if (person.employment !== "permanent") return 0;
  const target = (person.targetHoursPerWeek ?? DEFAULT_PERMANENT_TARGET_HOURS) * 60;
  return Math.max(0, target - ledger.minutes);
}

function exceedsWeeklyHours(person: Person, ledger: Ledger, duration: number): boolean {
  if (person.maxHoursPerWeek === undefined) return false;
  return ledger.minutes + duration > person.maxHoursPerWeek * 60;
}

function exceedsWeeklyDays(
  person: Person,
  ledger: Ledger,
  shift: ShiftRequirement
): boolean {
  if (person.maxDaysPerWeek === undefined) return false;

  const days = new Set(ledger.days);
  for (const segment of shiftSegments(shift)) {
    days.add(segment.day);
  }
  return days.size > person.maxDaysPerWeek;
}

function eligibleFor(
  people: Person[],
  availability: AvailabilityWindow[],
  shift: ShiftRequirement
): Person[] {
  return people.filter((person) =>
    personCoversShift(availability, person.id, shift)
  );
}

function buildWarning(
  shift: ShiftRequirement,
  assignedCount: number,
  eligibleCount: number,
  selectableCount: number
): RosterWarning {
  const missing = shift.requiredPeople - assignedCount;
  const when = `${dayNames[shift.dayOfWeek]} ${formatShiftRange(shift)}`;

  if (eligibleCount === 0) {
    return {
      shiftRequirementId: shift.id,
      message: `${when} has nobody free. Check who's marked available for those hours.`
    };
  }

  if (selectableCount < eligibleCount) {
    return {
      shiftRequirementId: shift.id,
      message: `${when} still needs ${missing} more. Everyone else who's free is already on another shift or has hit their hours limit.`
    };
  }

  return {
    shiftRequirementId: shift.id,
    message: `${when} still needs ${missing} more ${missing === 1 ? "person" : "people"}.`
  };
}

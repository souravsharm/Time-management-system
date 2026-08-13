import type { DayOfWeek } from "./types";

export const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
] as const;

export const orderedWeek: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export function parseTimeToMinutes(value: string): number {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time value: ${value}`);
  }

  return hours * 60 + minutes;
}

export function formatMinutes(totalMinutes: number): string {
  const bounded = Math.max(0, Math.min(24 * 60, totalMinutes));
  const hours = Math.floor(bounded / 60);
  const minutes = bounded % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatWindow(startMinutes: number, endMinutes: number): string {
  return `${formatMinutes(startMinutes)}-${formatMinutes(endMinutes)}`;
}

export function durationLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function containsWindow(
  containerStart: number,
  containerEnd: number,
  targetStart: number,
  targetEnd: number
): boolean {
  return containerStart <= targetStart && containerEnd >= targetEnd;
}

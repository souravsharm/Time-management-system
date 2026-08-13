import type { AvailabilityWindow, DayOfWeek } from "./scheduling/types";

export const GRID_START_HOUR = 6;
export const GRID_END_HOUR = 23;
export const GRID_INTERVAL_MINUTES = 30;

export function numSlots(
  startHour = GRID_START_HOUR,
  endHour = GRID_END_HOUR
): number {
  return ((endHour - startHour) * 60) / GRID_INTERVAL_MINUTES;
}

export function slotToMinutes(
  slotIndex: number,
  startHour = GRID_START_HOUR
): number {
  return startHour * 60 + slotIndex * GRID_INTERVAL_MINUTES;
}

export function slotKey(day: number, slotIndex: number): string {
  return `${day}-${slotIndex}`;
}

export function parseSlotKey(key: string): { day: DayOfWeek; slotIndex: number } {
  const [dayStr, slotStr] = key.split("-");
  return { day: Number(dayStr) as DayOfWeek, slotIndex: Number(slotStr) };
}

export function slotLabel(
  slotIndex: number,
  startHour = GRID_START_HOUR
): string {
  const totalMinutes = slotToMinutes(slotIndex, startHour);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours < 12 ? "am" : "pm";
  const h = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return minutes === 0 ? `${h}${period}` : `${h}:${String(minutes).padStart(2, "0")}${period}`;
}

export function windowsToSlotSet(
  windows: AvailabilityWindow[],
  personId?: string,
  startHour = GRID_START_HOUR,
  endHour = GRID_END_HOUR
): Set<string> {
  const slots = new Set<string>();
  const src = personId ? windows.filter((w) => w.participantId === personId) : windows;
  const gridStart = startHour * 60;
  const gridEnd = endHour * 60;
  const total = numSlots(startHour, endHour);

  for (const w of src) {
    const clampStart = Math.max(w.startMinutes, gridStart);
    const clampEnd = Math.min(w.endMinutes, gridEnd);
    if (clampStart >= clampEnd) continue;
    const first = Math.round((clampStart - gridStart) / GRID_INTERVAL_MINUTES);
    const last = Math.round((clampEnd - gridStart) / GRID_INTERVAL_MINUTES) - 1;
    for (let i = Math.max(0, first); i <= Math.min(total - 1, last); i++) {
      slots.add(slotKey(w.dayOfWeek, i));
    }
  }
  return slots;
}

export function slotSetToWindows(
  slots: Set<string>,
  personId: string,
  startHour = GRID_START_HOUR
): Omit<AvailabilityWindow, "id">[] {
  const byDay = new Map<DayOfWeek, number[]>();
  for (const key of slots) {
    const { day, slotIndex } = parseSlotKey(key);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(slotIndex);
  }

  const windows: Omit<AvailabilityWindow, "id">[] = [];
  for (const [day, daySlots] of byDay) {
    const sorted = [...daySlots].sort((a, b) => a - b);
    let i = 0;
    while (i < sorted.length) {
      let start = sorted[i];
      let end = sorted[i];
      while (i + 1 < sorted.length && sorted[i + 1] === sorted[i] + 1) {
        end = sorted[++i];
      }
      windows.push({
        participantId: personId,
        dayOfWeek: day,
        startMinutes: slotToMinutes(start, startHour),
        endMinutes: slotToMinutes(end + 1, startHour)
      });
      i++;
    }
  }
  return windows;
}

export function buildHeatmap(
  windows: AvailabilityWindow[],
  personIds: string[],
  startHour = GRID_START_HOUR,
  endHour = GRID_END_HOUR
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of personIds) {
    for (const key of windowsToSlotSet(windows, id, startHour, endHour)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

import { containsWindow, orderedWeek } from "./time";
import { scoreCommonSlot } from "./scoring";
import type {
  AvailabilityWindow,
  CommonAvailabilityOptions,
  CommonSlotSuggestion,
  DayOfWeek,
  Person
} from "./types";

const DAY_MINUTES = 24 * 60;

export function findCommonAvailability(
  people: Person[],
  availability: AvailabilityWindow[],
  options: CommonAvailabilityOptions
): CommonSlotSuggestion[] {
  const durationMinutes = Math.max(15, options.durationMinutes);
  const intervalMinutes = options.intervalMinutes ?? 30;
  const maxSuggestions = options.maxSuggestions ?? 12;

  if (people.length === 0 || availability.length === 0) {
    return [];
  }

  const minParticipants = options.requireEveryone
    ? people.length
    : Math.max(1, Math.min(options.minParticipants ?? 1, people.length));

  const suggestions: CommonSlotSuggestion[] = [];

  for (const dayOfWeek of orderedWeek) {
    const dayAvailability = availability.filter((window) => window.dayOfWeek === dayOfWeek);
    const candidateStarts = collectCandidateStarts(dayAvailability, durationMinutes, intervalMinutes);

    for (const startMinutes of candidateStarts) {
      const endMinutes = startMinutes + durationMinutes;
      const availableParticipantIds = people
        .filter((person) =>
          dayAvailability.some(
            (window) =>
              window.participantId === person.id &&
              containsWindow(
                window.startMinutes,
                window.endMinutes,
                startMinutes,
                endMinutes
              )
          )
        )
        .map((person) => person.id);

      if (availableParticipantIds.length < minParticipants) {
        continue;
      }

      const unavailableParticipantIds = people
        .filter((person) => !availableParticipantIds.includes(person.id))
        .map((person) => person.id);

      const baseSuggestion = {
        dayOfWeek,
        startMinutes,
        endMinutes,
        availableParticipantIds,
        unavailableParticipantIds,
        matchPercentage: Math.round((availableParticipantIds.length / people.length) * 100)
      };

      suggestions.push({
        ...baseSuggestion,
        score: scoreCommonSlot(baseSuggestion)
      });
    }
  }

  return suggestions
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.dayOfWeek !== b.dayOfWeek) return orderIndex(a.dayOfWeek) - orderIndex(b.dayOfWeek);
      return a.startMinutes - b.startMinutes;
    })
    .slice(0, maxSuggestions);
}

function collectCandidateStarts(
  availability: AvailabilityWindow[],
  durationMinutes: number,
  intervalMinutes: number
): number[] {
  const starts = new Set<number>();

  for (const window of availability) {
    const latestStart = Math.min(window.endMinutes - durationMinutes, DAY_MINUTES - durationMinutes);

    for (
      let start = roundUpToInterval(window.startMinutes, intervalMinutes);
      start <= latestStart;
      start += intervalMinutes
    ) {
      starts.add(start);
    }
  }

  return [...starts].sort((a, b) => a - b);
}

function roundUpToInterval(value: number, interval: number): number {
  return Math.ceil(value / interval) * interval;
}

function orderIndex(dayOfWeek: DayOfWeek): number {
  return orderedWeek.indexOf(dayOfWeek);
}

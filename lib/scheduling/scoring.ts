import type { CommonSlotSuggestion } from "./types";

export function scoreCommonSlot(
  suggestion: Omit<CommonSlotSuggestion, "score">
): number {
  const participantWeight = suggestion.availableParticipantIds.length * 100;
  const matchWeight = suggestion.matchPercentage * 10;
  const lengthWeight = (suggestion.endMinutes - suggestion.startMinutes) / 30;
  const earlierDayTiebreaker = 7 - suggestion.dayOfWeek;

  return participantWeight + matchWeight + lengthWeight + earlierDayTiebreaker;
}

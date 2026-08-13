import { describe, expect, it } from "vitest";
import { findCommonAvailability } from "@/lib/scheduling/commonAvailability";
import { parseTimeToMinutes } from "@/lib/scheduling/time";
import type { AvailabilityWindow, Person } from "@/lib/scheduling/types";

const people: Person[] = [
  { id: "a", name: "Aman", employment: "casual" },
  { id: "r", name: "Riya", employment: "casual" },
  { id: "s", name: "Sam", employment: "casual" }
];

describe("findCommonAvailability", () => {
  it("returns a full-match slot when everyone overlaps", () => {
    const availability: AvailabilityWindow[] = [
      window("1", "a", "10:00", "16:00"),
      window("2", "r", "12:00", "18:00"),
      window("3", "s", "13:00", "15:00")
    ];

    const suggestions = findCommonAvailability(people, availability, {
      durationMinutes: 120,
      requireEveryone: true
    });

    expect(suggestions[0]).toMatchObject({
      dayOfWeek: 6,
      startMinutes: parseTimeToMinutes("13:00"),
      endMinutes: parseTimeToMinutes("15:00"),
      matchPercentage: 100
    });
  });

  it("can return partial matches when a minimum is used", () => {
    const availability: AvailabilityWindow[] = [
      window("1", "a", "09:00", "17:00"),
      window("2", "r", "13:00", "18:00")
    ];

    const suggestions = findCommonAvailability(people, availability, {
      durationMinutes: 120,
      minParticipants: 2
    });

    expect(suggestions[0].availableParticipantIds).toEqual(["a", "r"]);
    expect(suggestions[0].unavailableParticipantIds).toEqual(["s"]);
  });

  it("returns no suggestions when duration cannot fit", () => {
    const availability: AvailabilityWindow[] = [
      window("1", "a", "10:00", "11:00"),
      window("2", "r", "10:00", "11:00"),
      window("3", "s", "10:00", "11:00")
    ];

    const suggestions = findCommonAvailability(people, availability, {
      durationMinutes: 120,
      requireEveryone: true
    });

    expect(suggestions).toEqual([]);
  });
});

function window(
  id: string,
  participantId: string,
  start: string,
  end: string
): AvailabilityWindow {
  return {
    id,
    participantId,
    dayOfWeek: 6,
    startMinutes: parseTimeToMinutes(start),
    endMinutes: parseTimeToMinutes(end)
  };
}

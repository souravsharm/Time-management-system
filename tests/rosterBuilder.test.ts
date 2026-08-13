import { describe, expect, it } from "vitest";
import { buildRoster } from "@/lib/scheduling/rosterBuilder";
import { DAY_MINUTES, validateShift } from "@/lib/scheduling/shiftTime";
import { parseTimeToMinutes } from "@/lib/scheduling/time";
import type {
  AvailabilityWindow,
  DayOfWeek,
  Person,
  ShiftRequirement,
  StoreSettings
} from "@/lib/scheduling/types";

const people: Person[] = [
  { id: "a", name: "Aman", employment: "casual" },
  { id: "r", name: "Riya", employment: "casual" },
  { id: "s", name: "Sam", employment: "casual" }
];

const store: StoreSettings = {
  alwaysOpen: true,
  hours: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
  maxShiftHours: 10
};

describe("buildRoster", () => {
  it("assigns an available person to a shift", () => {
    const result = buildRoster(
      people,
      [availableOn("1", "a", "09:00", "17:00")],
      [shift("morning", "10:00", "14:00", 1)]
    );

    expect(result.assignments).toEqual([
      { shiftRequirementId: "morning", participantId: "a" }
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("warns when no person is available", () => {
    const result = buildRoster(
      people,
      [availableOn("1", "a", "09:00", "12:00")],
      [shift("late", "14:00", "18:00", 1)]
    );

    expect(result.assignments).toEqual([]);
    expect(result.warnings[0].message).toContain("nobody free");
  });

  it("avoids assigning one person to clashing shifts", () => {
    const result = buildRoster(
      people,
      [availableOn("1", "a", "09:00", "17:00")],
      [shift("one", "10:00", "14:00", 1), shift("two", "12:00", "16:00", 1)]
    );

    expect(result.assignments).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
  });

  it("prefers the person with fewer assigned minutes", () => {
    const result = buildRoster(
      people,
      [availableOn("1", "a", "09:00", "18:00"), availableOn("2", "r", "09:00", "18:00")],
      [shift("one", "09:00", "13:00", 1), shift("two", "13:00", "17:00", 1)]
    );

    const assigned = result.assignments.map((assignment) => assignment.participantId);
    expect(new Set(assigned)).toEqual(new Set(["a", "r"]));
  });
});

describe("overnight shifts", () => {
  const overnight: ShiftRequirement = {
    id: "night",
    dayOfWeek: 1,
    startMinutes: parseTimeToMinutes("22:00"),
    endMinutes: parseTimeToMinutes("06:00") + DAY_MINUTES,
    requiredPeople: 1
  };

  it("needs availability on both sides of midnight", () => {
    const onlyMonday = buildRoster(
      people,
      [availableOn("1", "a", "20:00", "24:00", 1)],
      [overnight]
    );
    expect(onlyMonday.assignments).toEqual([]);

    const bothDays = buildRoster(
      people,
      [
        availableOn("1", "a", "20:00", "24:00", 1),
        availableOn("2", "a", "00:00", "08:00", 2)
      ],
      [overnight]
    );
    expect(bothDays.assignments).toEqual([
      { shiftRequirementId: "night", participantId: "a" }
    ]);
  });

  it("counts the full length across midnight", () => {
    const result = buildRoster(
      people,
      [
        availableOn("1", "a", "20:00", "24:00", 1),
        availableOn("2", "a", "00:00", "08:00", 2)
      ],
      [overnight]
    );
    expect(result.assignedMinutesByParticipant.a).toBe(8 * 60);
  });

  it("treats the next morning as a clash", () => {
    const result = buildRoster(
      people,
      [
        availableOn("1", "a", "20:00", "24:00", 1),
        availableOn("2", "a", "00:00", "12:00", 2)
      ],
      [overnight, { ...shift("tue-morning", "05:00", "09:00", 1), dayOfWeek: 2 }]
    );

    expect(result.assignments).toHaveLength(1);
  });
});

describe("contracts and limits", () => {
  const permanent: Person = {
    id: "p",
    name: "Priya",
    employment: "permanent",
    targetHoursPerWeek: 8
  };
  const casual: Person = { id: "c", name: "Casey", employment: "casual" };

  it("fills a permanent's contracted hours before a casual gets any", () => {
    const result = buildRoster(
      [casual, permanent],
      [availableOn("1", "p", "06:00", "22:00"), availableOn("2", "c", "06:00", "22:00")],
      [shift("one", "09:00", "17:00", 1)]
    );

    expect(result.assignments).toEqual([
      { shiftRequirementId: "one", participantId: "p" }
    ]);
  });

  it("stops handing out shifts once a weekly hours cap is hit", () => {
    const capped: Person = {
      id: "k",
      name: "Kim",
      employment: "casual",
      maxHoursPerWeek: 4
    };

    const result = buildRoster(
      [capped],
      [availableOn("1", "k", "06:00", "22:00")],
      [shift("one", "09:00", "13:00", 1), shift("two", "14:00", "18:00", 1)]
    );

    expect(result.assignments).toHaveLength(1);
    expect(result.assignedMinutesByParticipant.k).toBe(4 * 60);
  });

  it("respects a maximum number of days a week", () => {
    const limited: Person = {
      id: "d",
      name: "Dana",
      employment: "casual",
      maxDaysPerWeek: 1
    };

    const result = buildRoster(
      [limited],
      [
        availableOn("1", "d", "06:00", "22:00", 1),
        availableOn("2", "d", "06:00", "22:00", 2)
      ],
      [
        shift("mon", "09:00", "13:00", 1),
        { ...shift("tue", "09:00", "13:00", 1), dayOfWeek: 2 }
      ]
    );

    expect(result.assignments).toHaveLength(1);
  });
});

describe("validateShift", () => {
  it("blocks a shift longer than the company cap", () => {
    const issue = validateShift(
      { startMinutes: 0, endMinutes: parseTimeToMinutes("23:59"), requiredPeople: 1 },
      store
    );

    expect(issue?.field).toBe("time");
    expect(issue?.message).toContain("10 hours");
  });

  it("allows a legal overnight shift", () => {
    expect(
      validateShift(
        {
          startMinutes: parseTimeToMinutes("22:00"),
          endMinutes: parseTimeToMinutes("06:00") + DAY_MINUTES,
          requiredPeople: 1
        },
        store
      )
    ).toBeNull();
  });

  it("rejects a finish time that matches the start", () => {
    expect(
      validateShift({ startMinutes: 540, endMinutes: 540, requiredPeople: 1 }, store)
    ).not.toBeNull();
  });
});

function availableOn(
  id: string,
  participantId: string,
  start: string,
  end: string,
  dayOfWeek: DayOfWeek = 1
): AvailabilityWindow {
  return {
    id,
    participantId,
    dayOfWeek,
    startMinutes: parseTimeToMinutes(start),
    endMinutes: end === "24:00" ? DAY_MINUTES : parseTimeToMinutes(end)
  };
}

function shift(
  id: string,
  start: string,
  end: string,
  requiredPeople: number
): ShiftRequirement {
  return {
    id,
    dayOfWeek: 1,
    startMinutes: parseTimeToMinutes(start),
    endMinutes: parseTimeToMinutes(end),
    requiredPeople
  };
}

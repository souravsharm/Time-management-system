"use client";

import { CalendarClock, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { AvailabilityEditor } from "@/components/availability/AvailabilityEditor";
import { CommonTimeResults } from "@/components/availability/CommonTimeResults";
import { TeamEditor } from "@/components/roster/TeamEditor";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import type { AvailabilityWindow, Person } from "@/lib/scheduling/types";

type CommonTab = "group" | "availability" | "results";

type Props = {
  people: Person[];
  availability: AvailabilityWindow[];
  onAddPerson: (person: Omit<Person, "id">) => void;
  onUpdatePerson: (personId: string, patch: Partial<Omit<Person, "id">>) => void;
  onRemovePerson: (personId: string) => void;
  onSetAvailability: (personId: string, windows: Omit<AvailabilityWindow, "id">[]) => void;
};

export function CommonTimeWorkspace({
  people,
  availability,
  onAddPerson,
  onUpdatePerson,
  onRemovePerson,
  onSetAvailability
}: Props) {
  const [tab, setTab] = useState<CommonTab>("results");

  const tabs: TabItem<CommonTab>[] = [
    {
      id: "group",
      label: "Group",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      badge: people.length > 0 ? String(people.length) : undefined
    },
    {
      id: "availability",
      label: "Free hours",
      icon: <CalendarClock className="h-4 w-4" aria-hidden="true" />
    },
    {
      id: "results",
      label: "Best times",
      icon: <Sparkles className="h-4 w-4" aria-hidden="true" />
    }
  ];

  return (
    <div className="grid gap-4">
      <Tabs tabs={tabs} active={tab} onChange={setTab} ariaLabel="Meeting planner sections" />

      {tab === "group" && (
        <TeamEditor
          people={people}
          availability={availability}
          insights={null}
          onAddPerson={onAddPerson}
          onUpdatePerson={onUpdatePerson}
          onRemovePerson={onRemovePerson}
        />
      )}

      {tab === "availability" && (
        <AvailabilityEditor
          people={people}
          availability={availability}
          onSetAvailability={onSetAvailability}
        />
      )}

      {tab === "results" && (
        <CommonTimeResults people={people} availability={availability} />
      )}
    </div>
  );
}

"use client";

import {
  CalendarClock,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Store,
  Users
} from "lucide-react";
import { useMemo } from "react";
import { AvailabilityEditor } from "@/components/availability/AvailabilityEditor";
import { ApprovalsPanel } from "@/components/roster/ApprovalsPanel";
import { RosterOverview } from "@/components/roster/RosterOverview";
import { RosterSchedule } from "@/components/roster/RosterSchedule";
import { ShiftsEditor } from "@/components/roster/ShiftsEditor";
import { StoreSettingsEditor } from "@/components/roster/StoreSettingsEditor";
import { TeamEditor } from "@/components/roster/TeamEditor";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { analyseRoster } from "@/lib/roster/analytics";
import { tradingBounds } from "@/lib/scheduling/shiftTime";
import type {
  AvailabilitySubmission,
  AvailabilityWindow,
  DayOfWeek,
  Person,
  ShiftRequirement,
  StoreSettings
} from "@/lib/scheduling/types";

export type RosterTab =
  | "overview"
  | "store"
  | "team"
  | "availability"
  | "requests"
  | "shifts"
  | "schedule";

type Props = {
  people: Person[];
  availability: AvailabilityWindow[];
  shifts: ShiftRequirement[];
  store: StoreSettings;
  submissions: AvailabilitySubmission[];
  tab: RosterTab;
  onTabChange: (tab: RosterTab) => void;
  onStoreChange: (patch: Partial<StoreSettings>) => void;
  onAddPerson: (person: Omit<Person, "id">) => void;
  onUpdatePerson: (personId: string, patch: Partial<Omit<Person, "id">>) => void;
  onRemovePerson: (personId: string) => void;
  onSetAvailability: (personId: string, windows: Omit<AvailabilityWindow, "id">[]) => void;
  onAddShift: (shift: Omit<ShiftRequirement, "id">) => void;
  onUpdateShift: (shiftId: string, patch: Omit<ShiftRequirement, "id">) => void;
  onRemoveShift: (shiftId: string) => void;
  onRemoveShiftDay: (day: DayOfWeek) => void;
  onApproveSubmission: (submissionId: string) => void;
  onDeclineSubmission: (submissionId: string) => void;
  onReopenSubmission: (submissionId: string) => void;
};

export function RosterWorkspace({
  people,
  availability,
  shifts,
  store,
  submissions,
  tab,
  onTabChange,
  onStoreChange,
  onAddPerson,
  onUpdatePerson,
  onRemovePerson,
  onSetAvailability,
  onAddShift,
  onUpdateShift,
  onRemoveShift,
  onRemoveShiftDay,
  onApproveSubmission,
  onDeclineSubmission,
  onReopenSubmission
}: Props) {
  const insights = useMemo(
    () => analyseRoster(people, availability, shifts, store),
    [availability, people, shifts, store]
  );

  const bounds = useMemo(() => tradingBounds(store), [store]);
  const openProblems = insights.shiftsShort + insights.shiftsEmpty;
  const pendingCount = submissions.filter((entry) => entry.status === "pending").length;

  const tabs: TabItem<RosterTab>[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
    },
    {
      id: "store",
      label: "Store hours",
      icon: <Store className="h-4 w-4" aria-hidden="true" />,
      badge: store.alwaysOpen ? "24/7" : undefined
    },
    {
      id: "team",
      label: "Team",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      badge: people.length > 0 ? String(people.length) : undefined
    },
    {
      id: "availability",
      label: "Free hours",
      icon: <CalendarClock className="h-4 w-4" aria-hidden="true" />
    },
    {
      id: "requests",
      label: "Requests",
      icon: <Inbox className="h-4 w-4" aria-hidden="true" />,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
      badgeAlert: pendingCount > 0
    },
    {
      id: "shifts",
      label: "Shifts",
      icon: <ClipboardList className="h-4 w-4" aria-hidden="true" />,
      badge: shifts.length > 0 ? String(shifts.length) : undefined
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: <ListChecks className="h-4 w-4" aria-hidden="true" />,
      badge: openProblems > 0 ? String(openProblems) : undefined,
      badgeAlert: openProblems > 0
    }
  ];

  return (
    <div className="grid gap-4">
      <Tabs tabs={tabs} active={tab} onChange={onTabChange} ariaLabel="Roster sections" />

      {tab === "overview" && (
        <RosterOverview people={people} insights={insights} onGoToTab={onTabChange} />
      )}

      {tab === "store" && <StoreSettingsEditor store={store} onChange={onStoreChange} />}

      {tab === "team" && (
        <TeamEditor
          people={people}
          availability={availability}
          insights={insights}
          onAddPerson={onAddPerson}
          onUpdatePerson={onUpdatePerson}
          onRemovePerson={onRemovePerson}
        />
      )}

      {tab === "availability" && (
        <AvailabilityEditor
          people={people}
          availability={availability}
          startHour={bounds.startHour}
          endHour={bounds.endHour}
          onSetAvailability={onSetAvailability}
        />
      )}

      {tab === "requests" && (
        <ApprovalsPanel
          submissions={submissions}
          people={people}
          availability={availability}
          gridStartHour={bounds.startHour}
          gridEndHour={bounds.endHour}
          onApprove={onApproveSubmission}
          onDecline={onDeclineSubmission}
          onUndo={onReopenSubmission}
        />
      )}

      {tab === "shifts" && (
        <ShiftsEditor
          shifts={shifts}
          store={store}
          onAddShift={onAddShift}
          onUpdateShift={onUpdateShift}
          onRemoveShift={onRemoveShift}
          onRemoveDay={onRemoveShiftDay}
        />
      )}

      {tab === "schedule" && (
        <RosterSchedule people={people} shifts={shifts} insights={insights} />
      )}
    </div>
  );
}

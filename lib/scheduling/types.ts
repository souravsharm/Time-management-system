export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PlannerMode = "common_time" | "roster";

/** Permanent staff get guaranteed hours; casuals only work what they're free for. */
export type EmploymentType = "permanent" | "casual";

export type Person = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  employment: EmploymentType;
  /** Permanent staff: hours a week the roster should try to give them. */
  targetHoursPerWeek?: number;
  /** Hard ceiling for anyone. Undefined means no personal ceiling. */
  maxHoursPerWeek?: number;
  /** Hard ceiling on distinct days worked. Undefined means no ceiling. */
  maxDaysPerWeek?: number;
};

export type AvailabilityWindow = {
  id: string;
  participantId: string;
  dayOfWeek: DayOfWeek;
  startMinutes: number;
  endMinutes: number;
};

export type OpeningHours = {
  openMinutes: number;
  closeMinutes: number;
};

export type StoreSettings = {
  /** 24/7 trading. When true `hours` is ignored. */
  alwaysOpen: boolean;
  /** Per-day trading window. null means closed that day. */
  hours: Record<DayOfWeek, OpeningHours | null>;
  /** Company rule: nobody works a single shift longer than this. */
  maxShiftHours: number;
};

export type CommonAvailabilityOptions = {
  durationMinutes: number;
  intervalMinutes?: number;
  requireEveryone?: boolean;
  minParticipants?: number;
  maxSuggestions?: number;
};

export type CommonSlotSuggestion = {
  dayOfWeek: DayOfWeek;
  startMinutes: number;
  endMinutes: number;
  availableParticipantIds: string[];
  unavailableParticipantIds: string[];
  matchPercentage: number;
  score: number;
};

export type ShiftRequirement = {
  id: string;
  /** The day the shift *starts* on. */
  dayOfWeek: DayOfWeek;
  /** 0–1439. */
  startMinutes: number;
  /** Greater than startMinutes. Values above 1440 finish on the following day. */
  endMinutes: number;
  requiredPeople: number;
  /** Optional label, e.g. "Night". */
  label?: string;
};

export type RosterAssignment = {
  shiftRequirementId: string;
  participantId: string;
};

export type RosterWarning = {
  shiftRequirementId: string;
  message: string;
};

export type RosterBuildResult = {
  assignments: RosterAssignment[];
  warnings: RosterWarning[];
  assignedMinutesByParticipant: Record<string, number>;
};

export type SubmissionStatus = "pending" | "approved" | "declined";

/**
 * Hours a team member sent back via a share link. Nothing reaches the roster until
 * the manager approves it — the submission sits here until then.
 */
export type AvailabilitySubmission = {
  id: string;
  personName: string;
  /** Set when the name matched somebody already on the team. */
  matchedPersonId?: string;
  receivedAt: string;
  windows: Omit<AvailabilityWindow, "id" | "participantId">[];
  status: SubmissionStatus;
  decidedAt?: string;
};

export type WorkspaceDraft = {
  title: string;
  mode: PlannerMode;
  timezone: string;
  store: StoreSettings;
  people: Person[];
  availability: AvailabilityWindow[];
  shifts: ShiftRequirement[];
  submissions: AvailabilitySubmission[];
};

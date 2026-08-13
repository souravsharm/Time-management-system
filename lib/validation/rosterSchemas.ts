import { z } from "zod";
import { parseTimeToMinutes } from "@/lib/scheduling/time";

export const shiftRequirementFormSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    requiredPeople: z.coerce.number().int().min(1, "At least 1 person is required")
  })
  .refine((value) => parseTimeToMinutes(value.endTime) > parseTimeToMinutes(value.startTime), {
    path: ["endTime"],
    message: "End time must be after start time"
  });

export const commonTimeOptionsSchema = z.object({
  durationMinutes: z.coerce.number().int().min(15).max(720),
  requireEveryone: z.coerce.boolean(),
  minParticipants: z.coerce.number().int().min(1)
});

export type ShiftRequirementFormInput = z.infer<typeof shiftRequirementFormSchema>;

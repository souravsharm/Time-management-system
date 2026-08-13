import { z } from "zod";
import { parseTimeToMinutes } from "@/lib/scheduling/time";

export const personSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Use a valid email").optional().or(z.literal(""))
});

export const availabilityFormSchema = z
  .object({
    participantId: z.string().min(1, "Choose a person"),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required")
  })
  .refine((value) => parseTimeToMinutes(value.endTime) > parseTimeToMinutes(value.startTime), {
    path: ["endTime"],
    message: "End time must be after start time"
  });

export type AvailabilityFormInput = z.infer<typeof availabilityFormSchema>;

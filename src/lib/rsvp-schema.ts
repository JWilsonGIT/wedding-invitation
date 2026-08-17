import { z } from "zod";
import { wedding } from "@/config/wedding";

const MAX_GUESTS = wedding.rsvp.maxGuestsPerRsvp;

/**
 * One schema, imported by both the form and the API route.
 *
 * Sharing it is the point: client-side validation is a courtesy that any
 * guest can bypass by editing the page, so the server re-runs exactly the
 * same rules. Two copies would drift.
 */
export const rsvpSchema = z
  .object({
    /* The `error` on the constructor matters as much as the one on .min():
       when a field is missing entirely, zod's type check fails first and
       would otherwise show a guest "Invalid input: expected string,
       received undefined". */
    fullName: z
      .string({ error: "Please tell us your full name." })
      .trim()
      .min(2, "Please tell us your full name.")
      .max(80, "That is longer than we can store — an abbreviation is fine."),

    mobile: z
      .string({ error: "Please leave a number we can reach you on." })
      .trim()
      .min(7, "Please leave a number we can reach you on.")
      .max(24, "That number looks too long.")
      .regex(/^[0-9+()\s-]+$/, "Digits, spaces and + ( ) - only, please."),

    /* Optional, but an empty string must pass — browsers submit "" for
       untouched optional inputs, which a bare email check would reject. */
    email: z
      .union([z.literal(""), z.email("That email address does not look right.")])
      .optional(),

    attending: z.enum(["yes", "no"], {
      error: "Please let us know whether you can make it.",
    }),

    /* Absent or blank means "one" — a guest who declines never sees this
       field, so it must not be able to fail validation for them. */
    guests: z.preprocess(
      (value) => (value === "" || value === undefined || value === null ? 1 : value),
      z.coerce
        .number()
        .int("Whole numbers only.")
        .min(1, "At least one of you, we hope.")
        .max(
          MAX_GUESTS,
          `We can take up to ${MAX_GUESTS} per reply — please call us for a larger group.`,
        ),
    ),

    message: z
      .string()
      .trim()
      .max(600, "Please keep your note under 600 characters.")
      .optional(),

    /* Honeypot. Hidden from guests, irresistible to bots. Validated loosely
       here and judged in the route, so a bot gets a cheerful 200 instead of
       an error that tells it what to fix. */
    website: z.string().max(200).optional(),
  })
  .transform((data) => ({
    ...data,
    /* A decline has no headcount. Normalising here means the sheet can
       never read "not attending — 3 guests". */
    guests: data.attending === "yes" ? data.guests : 0,
  }));

export type RsvpInput = z.input<typeof rsvpSchema>;
export type RsvpRecord = z.output<typeof rsvpSchema>;
export type RsvpFieldErrors = Partial<Record<keyof RsvpInput, string[]>>;

export const MAX_GUESTS_PER_RSVP = MAX_GUESTS;

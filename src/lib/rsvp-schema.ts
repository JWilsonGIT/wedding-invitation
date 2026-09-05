import { z } from "zod";

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

    message: z
      .string()
      .trim()
      .max(600, "Please keep your note under 600 characters.")
      .optional(),

    /* Honeypot. Hidden from guests, irresistible to bots. Validated loosely
       here and judged in the route, so a bot gets a cheerful 200 instead of
       an error that tells it what to fix.

       NOT named "website", and that matters. Chrome's profile autofill and
       most password managers keep a "website"/"url" concept and will fill a
       field called that even through autocomplete="off" — which silently
       discarded a real guest's reply once. This name is in no autofill
       dictionary, while a bot that fills every input it finds still trips it.

       If you rename it, rename it in all three places at once — this key,
       the input in RsvpForm, and the check in the route. z.object strips
       unknown keys, so a half-rename disables spam protection silently. */
    botField: z.string().max(200).optional(),
  })
  .transform((data) => ({
    ...data,
    /* One invitation, one seat — the form never asks for a headcount, so it
       is set here rather than accepted from the request. A hand-rolled POST
       carrying "guests": 5 is stripped by z.object and overwritten by this,
       so the no-plus-one rule holds server-side and not just in the UI.
       A decline has no seat, which keeps the sheet from ever reading
       "not attending — 1 guest". */
    guests: data.attending === "yes" ? 1 : 0,
  }));

export type RsvpInput = z.input<typeof rsvpSchema>;
export type RsvpRecord = z.output<typeof rsvpSchema>;
export type RsvpFieldErrors = Partial<Record<keyof RsvpInput, string[]>>;

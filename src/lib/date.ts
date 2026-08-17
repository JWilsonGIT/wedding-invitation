/**
 * Date formatting for the invitation.
 *
 * Every helper anchors the ISO date to midday UTC before formatting.
 * That single detail avoids the classic off-by-one-day bug: parsing a
 * bare "2026-12-11" gives UTC midnight, which in a negative-offset
 * timezone renders as December 10th. Midday has no such edge.
 */

const MANILA = "Asia/Manila";

function anchor(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

/** "Friday, December 11, 2026" */
export function formatFullDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: MANILA,
  }).format(anchor(isoDate));
}

/** "December 11, 2026" */
export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: MANILA,
  }).format(anchor(isoDate));
}

/** Parts for the stacked hero display: "Friday" / "12" / "11" / "2026" */
export function dateParts(isoDate: string) {
  const d = anchor(isoDate);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-PH", { ...options, timeZone: MANILA }).format(d);

  return {
    weekday: part({ weekday: "long" }),
    month: part({ month: "long" }),
    day: part({ day: "numeric" }),
    year: part({ year: "numeric" }),
  };
}

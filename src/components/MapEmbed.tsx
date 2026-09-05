/**
 * A map plus the two links that actually get guests there.
 *
 * Uses Google's keyless embed endpoint (`output=embed`) rather than the
 * Maps Embed API — no API key, no Google Cloud project, no billing
 * account, no quota to blow through the week of the wedding.
 *
 * Waze is here because in the Philippines it is what most people drive
 * with. Offering only Google Maps quietly costs you guests.
 */

type Props = {
  /** Free-text place search, e.g. "Max's Restaurant Manila East Road, Binangonan". */
  query: string;
  /** Exact Google Maps share link. Far more accurate than a text search. */
  mapsUrl?: string;
  /** "lat,lng" if known — see below for why Waze needs it. */
  coords?: string;
  /** Venue name, used for the iframe's accessible title. */
  venue: string;
  /**
   * Shorter map, for places where the height budget is fixed — the
   * no-scroll detail sheets have no room to give and no scrollbar to
   * borrow, so the map gives up the pixels instead of the address.
   */
  compact?: boolean;
  /**
   * Extra classes for the outer element.
   *
   * This exists so a caller can animate the map WITHOUT wrapping it in a
   * div. That distinction is not cosmetic: on a landscape phone
   * .where-detail becomes a two-column grid and zeroes this element's top
   * margin via `> div:last-child`. A wrapper takes that selector's place,
   * the margin comes back, the card grows, and the panel's heading is
   * pushed off the top of the screen — which is exactly what happened.
   */
  className?: string;
};

export function MapEmbed({ query, mapsUrl, coords, venue, compact = false, className = "" }: Props) {
  const encoded = encodeURIComponent(query);

  /* Google keeps the text query so the pin arrives labelled with the place
     name, its hours and photos — more use to a guest than a bare dot. */
  const embedSrc = `https://www.google.com/maps?q=${encoded}&output=embed`;
  const googleHref = mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  /* Waze gets coordinates whenever we have them. It cannot interpret a Plus
     Code at all and is unreliable with long address strings, so `ll` is the
     difference between a guest navigating and a guest calling you. */
  const wazeHref = coords
    ? `https://waze.com/ul?ll=${coords}&navigate=yes`
    : `https://waze.com/ul?q=${encoded}&navigate=yes`;

  return (
    <div className={`${compact ? "mt-5" : "mt-7"} ${className}`.trim()}>
      <div className="overflow-hidden rounded-lg border border-blush-200 bg-blush-50">
        <iframe
          src={embedSrc}
          title={`Map showing the location of ${venue}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className={`block w-full border-0 ${compact ? "h-36 sm:h-40" : "h-56 sm:h-64"}`}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <MapLink href={googleHref} label="Open in Google Maps">
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.6" />
          </svg>
        </MapLink>

        <MapLink href={wazeHref} label="Open in Waze">
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 11.2 21 4l-7.2 18-2.4-7.4Z" />
          </svg>
        </MapLink>
      </div>
    </div>
  );
}

function MapLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      /* min-h-11 keeps this a comfortable phone tap target (WCAG 2.2) */
      /* Gray: getting there is practical, not celebratory. Keeping these
         off the pink means the RSVP button is the only pink button. */
      className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-500 hover:bg-gray-50"
    >
      {children}
      {label}
    </a>
  );
}

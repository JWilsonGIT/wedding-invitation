/* ═══════════════════════════════════════════════════════════════
   THE ONLY FILE YOU NEED TO EDIT.

   Everything the site displays lives here. Replace every value
   written in [SQUARE BRACKETS] — those are placeholders, and they
   render visibly on the page so an unfinished invitation can never
   be mistaken for a finished one.

   Search this file for "[" to find everything still to do.
   ═══════════════════════════════════════════════════════════════ */

export type WeddingEvent = {
  /** Anchor id and React key. */
  id: string;
  /** Small label above the venue, e.g. "The Ceremony". */
  label: string;
  /** Venue name, e.g. "Santo Niño Parish Church". */
  venue: string;
  /** Displayed as written, e.g. "2:00 PM". */
  time: string;
  /** Full street address, shown under the venue name. */
  address: string;
  /**
   * What Google Maps should search for. Be specific — include the
   * city — or the map may land on the wrong branch.
   */
  mapsQuery: string;
  /**
   * OPTIONAL but recommended: paste the exact Google Maps share
   * link for the place. When set, the "Open in Google Maps" button
   * uses it instead of a text search, which is far more accurate.
   */
  mapsUrl?: string;
  /**
   * Exact coordinates, "lat,lng".
   *
   * Worth filling in: Waze cannot interpret a Plus Code and is unreliable
   * with long address strings, so the Waze link uses these when present and
   * only falls back to a text search without them. Get them by right-clicking
   * the spot in Google Maps — the first item in the menu is the lat,lng.
   */
  coords?: string;
  /** One short line of practical guidance. Optional. */
  note?: string;
};

export const wedding = {
  /* ── The couple ──────────────────────────────────────────── */
  couple: {
    /** Shown first, before the ampersand. */
    partnerOne: "Analiza",
    /** Shown second. */
    partnerTwo: "John Wilson",
    /** Used in the footer, nav and browser tab. Keep it short. */
    shortNames: "Analiza & John Wilson",
  },

  /* ── The date ────────────────────────────────────────────── */
  /** ISO format, YYYY-MM-DD. Everything on the page derives from this. */
  date: "2026-12-11",

  /* ── The day, in order ───────────────────────────────────────
     Two entries: the church, then Max's. The same card component
     renders both, so adding a third event needs no new code. */
  events: [
    {
      id: "ceremony",
      label: "The Ceremony",
      venue: "[CHURCH NAME]",
      time: "[2:00 PM]",
      address: "G4FX+CWC Doña Aurora St, Angono, Rizal",
      /* A Plus Code pins an exact spot rather than guessing at a street,
         so this is more accurate than any text search. Keep the locality
         ("Angono, Rizal") — a short Plus Code needs it to resolve. */
      mapsQuery: "G4FX+CWC Angono, Rizal, Philippines",
      /* Verified: this is where the Plus Code above resolves. */
      coords: "14.5235625,121.1497656",
      note: "Please be seated fifteen minutes before the ceremony begins.",
    },
    {
      id: "gathering",
      label: "The Gathering",
      venue: "Max's Restaurant — Binangonan",
      time: "[Right after the ceremony]",
      address: "Manila East Rd, Brgy. Pag-asa, Binangonan, Rizal",
      mapsQuery: "Max's Restaurant Manila East Road, Pag-asa, Binangonan, Rizal, Philippines",
      /* Verified: this query resolves to the single place "Max's Binangonan",
         about 900m from the church — roughly a five-minute drive. */
      coords: "14.5253098,121.158075",
      note: "A relaxed lunch together — no program, no speeches. Come hungry.",
    },
  ] satisfies WeddingEvent[],

  /* ── Invitation note ─────────────────────────────────────────
     Keep it short. This is the emotional centre of the page. */
  invitation: {
    heading: "Together with our families",
    body: [
      "We are getting married, and we would love for you to be there.",
      "The day is a simple one: a ceremony at the church, then a meal together at Max's. No program, no long afternoon — just the people we love in one room.",
    ],
  },

  /* ── Dress code ──────────────────────────────────────────────
     Swatches render as circles. Keep to 3–5 or the strip gets busy.
     `hex` must be a real colour; `name` is what guests read. */
  dressCode: {
    heading: "What to Wear",
    intro: "Semi-formal, in soft white and pink tones if you can.",
    swatches: [
      { name: "Ivory", hex: "#FBF7F4" },
      { name: "Blush", hex: "#F7DCE5" },
      { name: "Rose", hex: "#E2A0B8" },
      { name: "Dusty Rose", hex: "#A8536F" },
    ],
    notes: [
      { who: "Ladies", what: "Long dress or cocktail dress." },
      { who: "Gentlemen", what: "Barong, or coat and tie." },
    ],
    /** Colours to politely ask guests to avoid. Set to [] to hide. */
    pleaseAvoid: ["Full white", "Bright red"],
  },

  /* ── Gallery ─────────────────────────────────────────────────
     Drop your photos into public/images/gallery/ and point at them.
     Placeholders ship with the project so the layout is visible.
     `alt` matters — screen readers and slow connections both use it. */
  gallery: {
    heading: "Us",
    images: [
      { src: "/images/gallery/placeholder-1.jpg", alt: "[Describe this photo]", width: 1200, height: 1500 },
      { src: "/images/gallery/placeholder-2.jpg", alt: "[Describe this photo]", width: 1400, height: 1050 },
      { src: "/images/gallery/placeholder-3.jpg", alt: "[Describe this photo]", width: 1400, height: 1050 },
      { src: "/images/gallery/placeholder-4.jpg", alt: "[Describe this photo]", width: 1200, height: 1500 },
      { src: "/images/gallery/placeholder-5.jpg", alt: "[Describe this photo]", width: 1400, height: 1050 },
      { src: "/images/gallery/placeholder-6.jpg", alt: "[Describe this photo]", width: 1400, height: 1050 },
    ],
  },

  /** Hero photo. Swap for a real one — this is the first thing guests see. */
  heroImage: {
    src: "/images/hero-placeholder.jpg",
    alt: "[Describe your hero photo]",
  },

  /* ── Gifts ───────────────────────────────────────────────────
     Both QR codes are OPTIONAL. Leave a `qr` as undefined and that
     card simply does not render — no empty box, no broken image. */
  gifts: {
    heading: "Gifts",
    message:
      "Your presence on our wedding day is the greatest gift of all. Should you wish to bless us with something more, a contribution toward our life together would be warmly appreciated.",
    methods: [
      {
        name: "GCash",
        accountName: "[ACCOUNT NAME]",
        accountNumber: "[09XX XXX XXXX]",
        /** e.g. "/images/qr/gcash.png" — save your QR screenshot there. */
        qr: undefined as string | undefined,
      },
      {
        name: "Maya",
        accountName: "[ACCOUNT NAME]",
        accountNumber: "[09XX XXX XXXX]",
        qr: undefined as string | undefined,
      },
    ],
  },

  /* ── RSVP ────────────────────────────────────────────────────── */
  rsvp: {
    heading: "Will you join us?",
    /** ISO date. Shown to guests as a friendly deadline. */
    deadline: "2026-11-11",
    /** Cap on the guest-count dropdown, including the person replying. */
    maxGuestsPerRsvp: 5,
    /** Optional — a number guests can call if the form gives them trouble. */
    contactNumber: "[09XX XXX XXXX]",
  },

  /* ── Site metadata ───────────────────────────────────────────
     Powers link previews in Messenger, Viber and iMessage.

     Leave this blank and it resolves automatically — Vercel supplies
     the deployed domain, and local development falls back to
     localhost. Only set it if you have a custom domain, e.g.
     "https://anaandjohn.com". No square brackets here: this string is
     parsed as a real URL, not displayed on the page. */
  site: {
    url: "",
  },
} as const;

export type Wedding = typeof wedding;

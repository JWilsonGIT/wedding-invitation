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
  /** Venue name, e.g. "Santo Niño Parish Church". Keep it to the name. */
  venue: string;
  /**
   * Optional small line under the venue name — a diocese, a hall name,
   * a floor. Keeps `venue` short enough to sit in the hero line and in
   * the RSVP confirmation without swallowing them.
   */
  venueMeta?: string;
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
    partnerOne: "Ana",
    /** Shown second. */
    partnerTwo: "John",
    /** Used in the footer, nav and browser tab. Keep it short. */
    shortNames: "Ana & John",
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
      venue: "Diocesan Shrine and Parish of Saint Clement",
      venueMeta: "Diocese of Antipolo",
      time: "11:00 AM",
      address: "Doña Aurora St, Poblacion Ibaba, Angono, Rizal",
      /* This is the church's exact name on Google Maps, so it resolves to
         the listing itself — the pin arrives labelled rather than as a bare
         dot. Cross-checked against the Plus Code G4FX+CWC: both land within
         1 metre of each other, so the two confirm one another. */
      mapsQuery:
        "Diocesan Shrine and Parish of Saint Clement - Poblacion Ibaba, Angono, Rizal (Diocese of Antipolo)",
      coords: "14.5235697,121.1497727",
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
     Each party gets its own swatches, so a guest sees the colours that
     apply to them rather than one mixed row they have to interpret.
     Keep to 3–4 swatches each or the strip gets busy. `hex` must be a
     real colour; `name` is what guests read. */
  dressCode: {
    heading: "What to Wear",
    intro: "Semi-formal — the ladies in soft pinks, the gentlemen in khaki.",
    parties: [
      {
        who: "Ladies",
        attire: "Long dress or cocktail dress.",
        /*
          Which colourway this card is tinted with — "rose" or "khaki".

          A NAMED TINT rather than an id or a position, because that is
          what the value actually is. Deriving it from `who` would break
          the day someone writes "The Ladies" or translates the page, and
          deriving it from the array order would move the colours the day
          someone reorders the two.

          The two tints are defined in globals.css. Adding a third means
          adding an `.attire-card-<name>` rule there; anything not defined
          falls back to rose, so a typo renders a finished card rather
          than a broken one.
        */
        tint: "rose",
        swatches: [
          { name: "Blush", hex: "#F7DCE5" },
          { name: "Rose", hex: "#E2A0B8" },
          { name: "Dusty Rose", hex: "#A8536F" },
        ],
      },
      {
        who: "Gentlemen",
        attire: "Barong, or coat and tie.",
        tint: "khaki",
        /*
          KHAKI, AND THE THREE VALUES ARE NOT ARBITRARY. They replace a
          gray ramp, and they keep its luminance span so the row still has
          the same visual weight beside the ladies' pinks — steps of
          2.13:1 and 2.06:1 against the gray ramp's 2.15:1 and 2.06:1.
          Pick new ones by eye and the strip goes flat or top-heavy.

          Hue holds at 42-48 degrees across all three. That is what keeps
          them reading as KHAKI rather than sliding into olive at the dark
          end, which is the usual way a tan ramp goes wrong — and it is
          why the darkest is named "Dark Khaki" and not "Olive". A guest
          shopping from that word must not come back with green.
        */
        swatches: [
          { name: "Light Khaki", hex: "#D2C39F" },
          { name: "Khaki", hex: "#948353" },
          { name: "Dark Khaki", hex: "#5C5330" },
        ],
      },
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
    /**
     * The surface the photographs lie on. Optional — delete this and the
     * panel falls back to the plum gradient it had before, which is not a
     * placeholder but a designed ground.
     *
     * Pick a DARK, mostly-empty image. The prints on this panel are white-
     * bordered and read as objects because they sit on something darker
     * than they are; a pale background makes their edges dissolve and the
     * pile stops looking like a pile.
     */
    background: {
      src: "/images/gallery.png",
      alt: "",
    },
    images: [
      { src: "/images/gallery/placeholder-1.jpg", alt: "[Describe this photo]", width: 1200, height: 1500 },
      { src: "/images/gallery/placeholder-2.jpg", alt: "[Describe this photo]", width: 1400, height: 1050 },
      { src: "/images/gallery/placeholder-3.jpg", alt: "[Describe this photo]", width: 1400, height: 1050 },
      { src: "/images/gallery/placeholder-4.jpg", alt: "[Describe this photo]", width: 1200, height: 1500 },
      { src: "/images/gallery/placeholder-5.jpg", alt: "[Describe this photo]", width: 1400, height: 1050 },
      { src: "/images/gallery/placeholder-6.jpg", alt: "[Describe this photo]", width: 1400, height: 1050 },
      /* Plain tinted stand-ins, so the pile can be seen at full density
         before the real photographs arrive. Swap the src for your own and
         write a real alt — the gallery takes any number from 6 to 18.

         EIGHTEEN IS A HARD CEILING, not a soft one. Every print's
         position, size, angle and stacking order is placed by hand in
         globals.css, and there are eighteen such places. A nineteenth
         photograph has nowhere to stand, so the pile falls back to a plain
         grid rather than breaking the composition — see PanelPhotos. */
      { src: "/images/gallery/placeholder-7.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-8.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-9.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-10.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-11.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-12.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-13.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-14.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-15.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-16.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-17.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
      { src: "/images/gallery/placeholder-18.png", alt: "[Describe this photo]", width: 1200, height: 1200 },
    ],
  },

  /** Hero photo. Swap for a real one — this is the first thing guests see. */
  heroImage: {
    src: "/images/hero.png",
    alt: "Three wedding rings resting on ivory linen, scattered with pink rose petals",
  },

  /*
    The surface Panel III — "The Day" — lays its four doors on. Optional:
    delete this and the panel falls back to the blush gradient it had
    before, which is a designed ground rather than a placeholder.

    Pick a DARK image, for the same reason the gallery does. The four
    doors are opaque near-white cards, and they read as doors because
    they stand on something darker than they are. On a pale photograph
    their edges dissolve and the panel turns into four pale smudges.

    A light picture is not simply a different look here — the date and
    the title sit directly on this image, and the veil that keeps them
    readable would have to be heavy enough to hide most of it. See the
    contrast table in globals.css before swapping this.
  */
  dayImage: {
    src: "/images/day.png",
    alt: "",
  },

  /*
    The texture behind Panel V — the reply. Optional: delete this and the
    panel is the plain deep-rose gradient it was before.

    THIS ONE WANTS A TEXTURE, NOT A SCENE. The panel's copy sits directly
    on it and is veiled to stay readable, so a picture with a subject would
    be a subject you could not quite see. Fabric, light or pattern reads
    through a veil as a surface, which is what the panel needs it to be.

    Brightness barely matters; EVENNESS does. What forces the veil here is
    not that this image is light but that it holds deep shadow and near-
    white highlight within the same few lines of type — see the numbers in
    globals.css. A picture with a narrower range would need less veil and
    would show more of itself.

    Delete this and the panel falls back to the deep-rose gradient it had
    before, which is a designed ground rather than a placeholder.
  */
  rsvpImage: {
    src: "/images/invitation.png",
    alt: "",
  },

  /*
    The surface behind Panel IV — "Where". Optional: delete this and the
    panel falls back to the ground it had before.

    A DARK-ISH IMAGE, for the reason the gallery and Panel III give: the
    place-switcher buttons and the map are opaque light objects, and they
    read as objects because they sit on something darker. It is also the
    only direction that works — all of this panel's own copy inverts to
    white when the image is present.

    EVENNESS MATTERS MORE THAN BRIGHTNESS. garden.png is a four-photo
    collage with torn white edges, so it reaches 0.900 at the top of the
    frame where the title sits; that brightest point, not the average, is
    what sets the veil. A calmer picture would need less of one and would
    show more of itself. See the veil note in globals.css.
  */
  whereImage: {
    src: "/images/garden.png",
    alt: "",
  },

  /* ── Gifts ───────────────────────────────────────────────────
     Both QR codes are OPTIONAL. Leave a `qr` as undefined and that
     card simply does not render — no empty box, no broken image. */
  gifts: {
    heading: "Gifts",
    message:
      "Your presence on our wedding day is the greatest gift of all. Should you wish to bless us with something more, a contribution toward our life together would be warmly appreciated.",
    /*
      Four ways to send something, each with its provider's mark.

      `logo` is OPTIONAL — leave it off and the card simply renders without
      one, so adding a fifth method does not require finding artwork first.
      Drop new marks in public/images/banks/.

      The logos are shown on a white chip rather than directly on the card,
      because these four do not agree with each other: GCash and MariBank
      have transparent backgrounds, while BDO and Maya are JPEGs with white
      baked in. On the blush card the opaque pair would have shown as pale
      rectangles beside two floating marks. A white chip under all four
      makes that difference invisible instead of conspicuous.

      They carry no `alt` text on purpose. The provider's name is set
      directly beneath each mark, so describing the logo would have a
      screen reader announce every method twice.
    */
    methods: [
      {
        name: "GCash",
        accountName: "[ACCOUNT NAME]",
        accountNumber: "[09XX XXX XXXX]",
        logo: "/images/banks/g-cash-logo.png" as string | undefined,
        logoScale: 1,
        /** e.g. "/images/qr/gcash.png" — save your QR screenshot there. */
        qr: undefined as string | undefined,
      },
      {
        name: "Maya",
        accountName: "[ACCOUNT NAME]",
        accountNumber: "[09XX XXX XXXX]",
        logo: "/images/banks/maya-logo.jpg" as string | undefined,
        logoScale: 1,
        qr: undefined as string | undefined,
      },
      {
        name: "BDO",
        accountName: "[ACCOUNT NAME]",
        accountNumber: "[0000 0000 0000]",
        /* A clean 400x400 mark on white. It replaced a screenshot that had
           an editor's transparency checkerboard baked into its pixels and
           had to be repaired by colour; this one needed nothing. */
        logo: "/images/banks/bdo-logo.webp" as string | undefined,
        logoScale: 1,
        qr: undefined as string | undefined,
      },
      {
        name: "MariBank",
        accountName: "[ACCOUNT NAME]",
        accountNumber: "[0000 0000 0000]",
        logo: "/images/banks/maribank-logo.png" as string | undefined,
        /*
          1.35, and the reason is optical rather than a fault in the file.

          All four marks are normalised to the same HEIGHT, which is the
          right way round — matching them on width would make the square
          ones tower over the wordmarks. But equal height is not equal
          presence. At 42px tall these cover:

              MariBank  1.00:1   42 x 42    1,731 sq px
              GCash     1.19:1   50 x 42    2,059
              BDO       2.75:1  114 x 42    4,762
              Maya      3.44:1  143 x 42    5,959

          A square mark gets a third of the area of a wordmark at the same
          height, and reads as small next to it. This is NOT padding in the
          file — measured, MariBank's artwork fills 100% of its 512x512
          canvas, so there is nothing to trim.

          It scales the IMAGE inside a fixed box rather than growing the
          box: the box height sets each card's internal rhythm, so a taller
          one here would push MariBank's name below BDO's in the same grid
          row.
        */
        logoScale: 1.35,
        qr: undefined as string | undefined,
      },
    ],
  },

  /* ── RSVP ────────────────────────────────────────────────────── */
  rsvp: {
    heading: "Will you join us?",
    /** ISO date. Shown to guests as a friendly deadline. */
    deadline: "2026-11-11",
    /** Shown under the reply deadline. Set to "" to hide it. */
    plusOneNote:
      "We have one seat reserved in your name. Kindly note we are not able to welcome plus-ones on the day.",
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

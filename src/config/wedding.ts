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
  /* ── WHAT GUESTS ARE ALLOWED TO SEE YET ──────────────────────
     Three switches, because the details did not become public all at
     once. Everything below is untouched whatever these say — this is
     what is SHOWN, never what exists.

     Today: the church is public, Perlie's Garden is not, and neither
     time is.

     WHAT EACH ONE REACHES, so nothing is missed on the way back:

       ceremonyVenue   Panel I's venue line; the church's sheet on
                       Panel III (name, diocese, address) and that
                       sheet's "Maps and directions" button; the
                       ceremony's map on Panel IV
       gatheringVenue  the same for Perlie's Garden
       times           Panel I's animated hour, both door metas on
                       Panel III, the time inside each sheet, and the
                       second line of each tab on Panel IV

     PANEL IV EXISTS ONLY IF A VENUE DOES. It is maps and addresses and
     nothing else, so with both venues hidden it is dropped from the
     deck entirely and the numerals renumber. It shows only the venues
     that are public, and hides its own switcher when that is just one,
     because a one-tab switcher reads as a broken control.

     THE LINK PREVIEW FOLLOWS THESE TOO. src/app/layout.tsx builds the
     Open Graph description from whichever venues are public, because
     that is the text Messenger and Viber show when the invitation is
     pasted — a venue left in there is hidden from nobody.

     A MAP DISCLOSES THE VENUE TO GOOGLE whether or not the text is on
     screen, which is why the embed is gated on the same flag as the
     words rather than left running.

     NOT THE USUAL PATTERN IN THIS FILE, deliberately. Everything else
     optional here switches on the data being ABSENT — `qr: undefined`,
     `pleaseAvoid: []`, `Set to "" to hide it`. That works by deleting
     the value, and the whole point here is to keep it. Named flags are
     the honest shape for "present, withheld"; please do not tidy them
     into the absence pattern. */
  reveal: {
    /** The church: name, Diocese of Antipolo, address, and its map. */
    ceremonyVenue: true,
    /** Perlie's Garden: name and address. */
    gatheringVenue: false,
    /** Both events' times, together. */
    times: false,
  },
  /** Stands in wherever a withheld detail used to be. */
  detailsPlaceholder: "To be announced",

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
     Two entries: the church, then Perlie's. The same card component
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
      note: "Please try to be seated about fifteen minutes before we start.",
    },
    {
      id: "gathering",
      label: "The Gathering",
      venue: "Perlie's Garden",
      time: "Right after the ceremony",
      address: "Eastridge Ave, Angono, Rizal",
      mapsQuery: "Perlie's Garden Restaurant, Eastridge Ave, Angono, Rizal, Philippines",
      /* About 2.5km from the church — a short drive east, up into
         Eastridge. Single-sourced, unlike the church's coordinates: only
         one listing publishes them, so they are worth a look on Maps
         before this goes out. Waze falls back to `mapsQuery` if removed. */
      coords: "14.5302192,121.1717403",
      note: "Just a relaxed meal together. No speeches, so come hungry.",
    },
  ] satisfies WeddingEvent[],

  /* ── Invitation note ─────────────────────────────────────────
     Keep it short. This is the emotional centre of the page. */
  invitation: {
    heading: "Together with our families",
    body: [
      "We're getting married, and we'd really love for you to be there.",
      "It's a simple day: a ceremony at the church, then a meal together at Perlie's Garden. No long program, just the people we love in one room.",
    ],
  },

  /* ── Dress code ──────────────────────────────────────────────
     Each party gets its own swatches, so a guest sees the colours that
     apply to them rather than one mixed row they have to interpret.
     Keep to 3–4 swatches each or the strip gets busy. `hex` must be a
     real colour; `name` is what guests read. */
  dressCode: {
    heading: "What to Wear",
    intro: "Semi-formal, please. Soft pinks for the ladies, Khaki for the gentlemen.",
    parties: [
      {
        who: "Ladies",
        /* One line under the heading saying what to wear. Set to "" and
           the line disappears, leaving the card as its heading and its
           swatches. Was "Long dress or cocktail dress." */
        attire: "",
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
        /* Set to "" to hide, as above. Was "Barong, or coat and tie." */
        attire: "",
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
    /*
      THE REAL PHOTOGRAPHS, in the order they were taken, so the set reads
      as the day it was: messing about in the park, then the garden, then
      the proposal after dark at the end.

      Every `alt` describes the photograph it sits on. They are what a
      screen reader reads aloud and what shows if an image fails to load,
      so if you reorder or replace a file, move its description with it.

      EIGHTEEN IS A HARD CEILING, not a soft one. Every print's position,
      size and stacking order is placed by hand in globals.css, and there
      are eighteen such places. A nineteenth photograph has nowhere to
      stand, so the pile falls back to a plain grid rather than breaking
      the composition — see PanelPhotos.

      The tiles crop to fill, and the collage mixes square, portrait and
      landscape cells, so a photograph will not always be shown in its own
      shape. Anything with a face near an edge is the one thing to check
      after a reorder.
    */
    images: [
      { src: "/images/invitation/IMG_3900.jpg", alt: "Ana on John's back under a big tree, both of them laughing", width: 1536, height: 2048 },
      { src: "/images/invitation/IMG_3915.jpg", alt: "John handing Ana a bouquet while she sits on a scooter in a veil", width: 1536, height: 2048 },
      { src: "/images/invitation/IMG_3936.jpg", alt: "Ana and John sitting on brick steps, hands held between them", width: 1536, height: 2048 },
      { src: "/images/invitation/IMG_3943.jpg", alt: "Ana and John either side of a stone marker, palms pressed together", width: 2048, height: 1536 },
      { src: "/images/invitation/IMG_3972.jpg", alt: "Ana in a veil holding her bouquet, standing close to John on a garden path", width: 2048, height: 1536 },
      { src: "/images/invitation/IMG_4009.jpg", alt: "Ana and John laughing face to face, the bouquet between them", width: 2048, height: 1536 },
      { src: "/images/invitation/IMG_4048.jpg", alt: "The two of them at an old stone well, water spraying up between them", width: 2048, height: 1536 },
      { src: "/images/invitation/IMG_4063.jpg", alt: "Ana and John posing in front of the giant painted figures in the park", width: 2048, height: 1536 },
      { src: "/images/invitation/IMG_4064.jpg", alt: "Ana and John hugging on the lawn, the giant figures behind them", width: 1536, height: 2048 },
      { src: "/images/invitation/IMG_4068.jpg", alt: "The two of them sitting on a rock under a canopy of branches", width: 1536, height: 2048 },
      { src: "/images/invitation/IMG_4092.jpg", alt: "Ana and John arm in arm in front of a tall rock formation", width: 1536, height: 2048 },
      { src: "/images/invitation/IMG_4101.jpg", alt: "Ana and John crouched together on the grass, smiling at the camera", width: 2048, height: 1536 },
      { src: "/images/invitation/IMG_4109.jpg", alt: "John with his arms around Ana as they sit on the grass", width: 1536, height: 2048 },
      { src: "/images/invitation/IMG_4119.jpg", alt: "Ana and John sitting back to back on the grass", width: 2048, height: 1536 },
      { src: "/images/invitation/IMG_4145.jpg", alt: "The two of them leaning into each other on the grass, laughing", width: 2048, height: 1536 },
      { src: "/images/invitation/IMG_4175.jpg", alt: "Ana and John facing each other at night, his hand at her cheek", width: 1536, height: 2048 },
      { src: "/images/invitation/IMG_4199.jpg", alt: "John on one knee proposing to Ana under a street light at night", width: 1536, height: 2048 },
      { src: "/images/invitation/IMG_4202.jpg", alt: "Ana and John close together at night, her ring hand raised, seen through leaves", width: 1536, height: 2048 },
    ],
  },

  /** Hero photo. Swap for a real one — this is the first thing guests see. */
  heroImage: {
    src: "/images/hero2.png",
    alt: "Two gold and white wedding bands resting together, pink rose petals scattered around them",
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
     Every `qr` is OPTIONAL. Set one to undefined and that card simply
     renders without a code — no empty box, no broken image.

     The four PNGs were cut out of app screenshots by scripts/crop-qr.mjs,
     which finds the code by measuring rather than by a hardcoded box, and
     paints its own white quiet zone. Re-run it if a screenshot is
     replaced. The screenshots themselves stay in this folder as the
     source, and are not referenced by the site: each one carries the
     account holder's real name, which the crop removes. */
  gifts: {
    heading: "Gifts",
    message:
      "Having you there is honestly the best gift we could ask for. If you'd still like to give something, anything you can put toward our life together would mean a lot to us.",
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
        accountNumber: "0995 458 9142",
        logo: "/images/banks/g-cash-logo.png" as string | undefined,
        logoScale: 1,
        qr: "/images/banks/gcash-qr.png" as string | undefined,
      },
      {
        name: "Maya",
        accountNumber: "0995 458 9142",
        logo: "/images/banks/maya-logo.jpg" as string | undefined,
        logoScale: 1,
        qr: "/images/banks/maya-qr.png" as string | undefined,
      },
      {
        name: "BDO",
        accountNumber: "00655 018 192",
        /* A clean 400x400 mark on white. It replaced a screenshot that had
           an editor's transparency checkerboard baked into its pixels and
           had to be repaired by colour; this one needed nothing. */
        logo: "/images/banks/bdo-logo.webp" as string | undefined,
        logoScale: 1,
        qr: "/images/banks/bdo-qr.png" as string | undefined,
      },
      {
        name: "MariBank",
        accountNumber: "1318 838 0487",
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
        qr: "/images/banks/maribank-qr.png" as string | undefined,
      },
    ],
  },

  /* ── RSVP ────────────────────────────────────────────────────── */
  rsvp: {
    heading: "Will you join us?",
    /** ISO date. Shown to guests as a friendly deadline. */
    deadline: "2026-10-10",
    /** Shown under the reply deadline. Set to "" to hide it. */
    plusOneNote:
      "We've saved one seat in your name. We're sorry we can't fit plus-ones this time.",
    /** Optional — a number guests can call if the form gives them trouble. */
    /* Grouped 4-3-4 to match the gift account numbers above; the digits
       are 09274560613. */
    contactNumber: "0927 456 0613",
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

/*
  Which of the two events may show its venue. The id lives on the event
  itself, so a component holding a WeddingEvent can answer the question
  without knowing which flag it maps to.
*/
export function venueIsPublic(eventId: string): boolean {
  return eventId === "ceremony"
    ? wedding.reveal.ceremonyVenue
    : wedding.reveal.gatheringVenue;
}

/** True when at least one venue is public, which is what Panel IV needs. */
export const anyVenuePublic =
  wedding.reveal.ceremonyVenue || wedding.reveal.gatheringVenue;

export type Wedding = typeof wedding;

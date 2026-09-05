# Wedding Invitation

A one-page wedding invitation. Ceremony at the church, then a meal together at
Max's — no program. RSVPs land in a Google Sheet.

White, with soft pink and gray accents. Next.js 16, Tailwind v4, TypeScript.

```bash
npm run dev
```

Then open http://localhost:3000. The RSVP form works immediately — see
[Before you connect Google](#before-you-connect-google).

---

## 1. Fill in your details

Everything guests read lives in one file:

**`src/config/wedding.ts`**

Open it and replace every value in `[SQUARE BRACKETS]`. Search the file for `[`
to find what's left. Placeholders render visibly on the page on purpose, so a
half-finished invitation can never be mistaken for a finished one.

You'll need:

- Both first names, and a short "Ana & John" form for the tab title
- The date, as `YYYY-MM-DD`
- Church: name, time, address
- Max's: branch name, time, address
- GCash / Maya account names and numbers (or delete that section — see below)

### Getting the maps right

Each event has a `mapsQuery` — free text Google searches for. Include the city
or you may land on the wrong Max's branch.

For real accuracy, add `mapsUrl` as well:

1. Find the place on Google Maps
2. Share ▸ Copy link
3. Paste it as `mapsUrl` on that event

The map iframe uses Google's keyless embed, so there's **no API key, no Google
Cloud project and no billing account** to set up. Every guest also gets a Waze
link, which is what most people in the Philippines actually drive with.

### Photos

Drop your own into `public/images/`:

| Replace | With |
|---|---|
| `public/images/hero-placeholder.jpg` | Your hero photo (landscape, ~1800px wide) |
| `public/images/gallery/placeholder-1…6.jpg` | Six gallery photos |

Then update `gallery.images` in the config — including each image's real
`width` and `height`, which stop the page jumping as photos load. Write a real
`alt` for each one; it's what guests on slow connections and screen readers get.

For the gift QR codes, save your screenshots to `public/images/qr/` and set
`gifts.methods[].qr` to e.g. `"/images/qr/gcash.png"`. **A QR left as
`undefined` simply doesn't render** — no empty box.

---

## 2. Connect the Google Sheet

RSVPs are appended to a spreadsheet by a small Apps Script.

Full click-by-click steps are in the comments at the top of
**`scripts/apps-script.gs`**. In short:

1. New sheet at https://sheets.new
2. Extensions ▸ Apps Script, paste in `scripts/apps-script.gs`
3. Replace `CHANGE_ME` with a long random string
4. Deploy ▸ New deployment ▸ **Web app**, Execute as **Me**, access **Anyone**
5. Copy the `/exec` URL

Then create `.env.local` (copy `.env.example`):

```bash
RSVP_WEBHOOK_URL=https://script.google.com/macros/s/AKfy…/exec
RSVP_SHARED_SECRET=the-same-random-string-you-pasted-into-the-script
```

Generate the secret with:

```bash
node -e "console.log(crypto.randomUUID())"
```

> **If you edit the Apps Script later**, you must redeploy for the change to
> take effect: Deploy ▸ Manage deployments ▸ pencil ▸ Version: New version.
> Saving alone leaves the old version live. This catches nearly everyone once.

### Why the form posts to our own server first

Apps Script doesn't return usable CORS headers, so a browser can't POST to it
and read the reply — a guest would never learn whether their RSVP landed. So
the form posts to `/api/rsvp`, which forwards it server-side. Two bonuses: the
Apps Script URL never reaches guests' browsers, and validation can't be skipped
by editing the page.

### Before you connect Google

With `RSVP_WEBHOOK_URL` unset, submissions append to `.data/rsvps.jsonl` so you
can test the whole flow first. That file is gitignored — it holds real names and
phone numbers.

In **production** with the variable unset, the form returns an honest error
instead of pretending to succeed. Vercel's filesystem is read-only, so there's
no quiet local fallback to hide a lost RSVP in.

---

## 3. Deploy

```bash
npx vercel
```

Add both environment variables in the Vercel dashboard (Settings ▸ Environment
Variables), for **Production** and **Preview**. Redeploy after adding them —
env vars are read at build and request time, not injected retroactively.

The site URL for link previews resolves automatically from Vercel's own domain.
Only set `site.url` in the config if you buy a custom domain.

---

## Counting your guests

In the sheet, the **Attending** column reads `Attending` / `Not attending` and
**Guests** holds `1` for an accepted invitation and `0` for a decline, so you
can sum the column safely. Every invitation is for one person — there is no
headcount field to fill in — so that total is also your guest count.

For a running total, open the Apps Script editor, pick `countAttending` from the
function dropdown, press Run, and read the Execution log.

---

## Editing the design

Colours and fonts are defined once, at the top of `src/app/globals.css`.

The palette is white, with **pink and gray** accents. They divide the work:

- **Pink** — celebration, and the one primary action (RSVP)
- **Gray** — everything practical: directions, secondary buttons, logistical
  notes, and the two practical doors on Panel III
- **White** — the ground

Gray used to double as the gentlemen's colour. It no longer does — the
gentlemen wear khaki, and khaki is split across the two files on purpose:

- The **swatch values** are in `wedding.ts`, because what guests are asked to
  wear is content and should be editable without touching the interface.
- Three **chrome tokens** (`khaki-50/200/700`) are in `globals.css`, because
  the card those swatches sit in is interface.

Khaki is scoped to that one card and nothing else, which is why the ramp has
three shades instead of the gray ramp's nine. Reach for a fourth and the
answer is almost certainly that it belongs in a different colour.

Keeping "how to get there" in gray is what leaves pink meaning something. If
every button is pink, none of them is.

**One rule worth keeping.** Pink on white is a contrast trap — the prettiest
pinks are illegible as body text. So each accent has exactly one job:

| Token | Contrast on white | Use for |
|---|---|---|
| `rose-400` | 1.9:1 | Decoration only — rules, icons |
| `rose-500` | 3.4:1 | Large display text only (≥24px) |
| `rose-600` | 5.1:1 | **All** pink body text, links, primary buttons |
| `rose-700` | 6.9:1 | Hover states, error text |
| `gray-400` | 2.6:1 | Decoration only |
| `gray-500` | 3.8:1 | Large text only (≥24px) |
| `gray-600` | 5.7:1 | Gray body text, secondary buttons |
| `gray-700` | 8.0:1 | Emphasis |
| `khaki-700` | 6.5:1 | The gentlemen's card heading — its only use |

Putting small text in `rose-400/500` or `gray-400` is the one change that will
make this page look cheap and read badly. The ink tones are all ≥5:1 too.

Both scales intentionally override Tailwind's built-ins. `gray` is defined
across the full 50–900 ramp so any shade you reach for stays warm; `rose` is
only defined at 400–700, so don't reach for `rose-300` or `rose-800` — those
are Tailwind's cool defaults and won't match.

### Section design

Each section is meant to feel like an arrival rather than the next band down.
Five details do that work, and they are deliberately quiet individually:

| Piece | Where |
|---|---|
| Ghosted Roman numeral behind the heading | `.section-numeral`, via `SectionHeading index={n}` |
| Hairlines flanking the eyebrow label | `SectionHeading` |
| A rule that fades out before the page edges | `.section-rule`, via `Section divider` |
| A lit gradient instead of a flat fill | `.tone-white` / `.tone-blush` |
| A colour hairline across a card's top edge | `.card-accent` |

The **arched photo frame** (`.arch`) is the one strongly bridal shape — a
chapel window, and the crop wedding photographers already shoot for. It is an
ellipse rather than a half-circle so tall portraits stay natural.

To renumber sections, change the `index` prop. To drop a numeral, omit it.

### Hover — 3D tilt

Cards tilt toward the cursor with a highlight that follows (`Tilt`,
`.tilt` / `.tilt-sheen`). Two things worth knowing:

- **The pointer handler never touches React state.** It writes CSS custom
  properties straight onto the node, coalesced to one write per frame with the
  latest position. A mouse move fires 100+ times a second; re-rendering the
  subtree that often for something the compositor can do alone would be waste.
- **Event cards use `.lift`, not `.tilt`** — a straight rise, no rotation.
  They hold a live Google Maps iframe, and rotating an iframe's ancestor makes
  browsers re-rasterise it, so it goes soft. It is also just annoying to have a
  map tip away while you are reading a street name off it.

Gated on `hover: hover` and `pointer: fine`. On a touch screen `:hover` latches
after a tap, which would strand a card mid-tilt.

### Paced scrolling

`ScrollPacer` holds a target position and walks the real scroll toward it at a
fixed **1000 px/second**, so however hard someone spins the wheel the page
advances at a readable rate and the invitation actually gets seen.

**This is scroll-hijacking, and it is worth being clear-eyed about.** Many
people dislike it, and the thing it slows down most is reaching the RSVP form.
Three deliberate limits keep it from becoming a trap:

- **Touch is untouched.** Damping touch means `touch-action: none` and
  hand-rolled momentum: it breaks pull-to-refresh, fights the platform's
  physics, and feels broken on a phone in a way tuning does not fix. Flicks on
  mobile stay native.
- **Keyboard, scrollbar dragging, find-in-page and nav links are untouched.**
  Those are deliberate acts by someone who knows where they want to be —
  clicking "RSVP" still goes straight there. The pacer resyncs whenever the page
  moves by other means, so nothing snaps back.
- **`prefers-reduced-motion` disables it.** The smoothing *is* the motion here.

Also skipped: `ctrl`/`cmd`+wheel (that is pinch-zoom), and any wheel over an
element that scrolls on its own.

**The watchdog.** The wheel handler calls `preventDefault()` and hands all
scrolling to an animation loop, so if that loop ever stalls the page would be
permanently unscrollable by wheel with no way for a guest to recover. If a frame
has not run in 250ms the pacer surrenders **permanently** and lets the browser
scroll natively. Surrendering for just one event would mean every other wheel
tick gets swallowed, and a page that scrolls at half rate feels more broken than
one that simply scrolls.

To change the pace, edit `MAX_SPEED` in `src/components/ScrollPacer.tsx`. To
remove it entirely, delete `<ScrollPacer />` from `src/app/page.tsx` — nothing
else depends on it.

### The groom walks to the bride

The groom stands at the bottom-left, the bride at the bottom-right, and his
position is bound to scroll progress. He arrives, his stride settles, and they
join hands as the page runs out (`CoupleWalk`, `.couple-scene`).

| Scroll | What happens |
|---|---|
| 0 → 86% | he walks, gait bound to scroll |
| 86 → 93% | his stride settles into a stand |
| 86 → 99% | both reach out; their hands meet |
| 88 → 96% | small hearts start rising around them |

- **His stride is on the scroll timeline too**, at 11 strides across the page.
  With a scroll timeline, iterations divide the scroll *range* rather than
  elapsed time, so he steps only while you scroll and stands still when you
  stop. A time-based loop would have him marching on the spot while you read.
- **Both figures are in profile**, facing each other. A front-facing figure
  translating sideways cannot read as walking — there is no forward direction
  to attach the motion to, so it reads as moon-walking.
- **Each leg is a thigh with a shin nested inside it**, pivoting at the knee.
  The trailing leg folds as it lifts and straightens to land. A single rigid
  segment swinging from the hip is a pendulum, not a stride.
- The gait is written as a **full asymmetric cycle**, not a two-frame
  `alternate` swing. During stance the thigh rotates from forward to backward
  — the foot stays planted while the body passes over it. That one detail is
  the difference between walking and sliding.
- Knees only ever fold backward (`shin >= 0`). Letting that go negative is
  what makes cheap walk cycles look broken-legged.
- **Each joint is double-wrapped.** Two animations cannot share one `rotate`,
  and the later one would simply cancel the walk. So an outer group adds a
  second rotation on top of the gait's held pose: the leg settles are the exact
  complements of the held stride (`-20°` held, `+20°` settled → upright), and
  the arm groups add the reach. **If you change the gait keyframes, the settle
  values must change with them.**
- **The rising hearts answer to two clocks.** Their container's opacity is
  scroll-driven, so nothing shows until the couple are together; each heart
  then rises on a time-based loop, so they keep going once you have reached the
  bottom instead of freezing when you stop scrolling. Edit the `SPARKS` array
  in `CoupleWalk.tsx` — one entry per heart.
- **`.cw-celebrate` extends leftward only.** Centring it on the couple pushed
  its right edge past the viewport on mobile — they stand at the edge, so there
  is no room that side, and hearts there were clipped away. The box hugs the
  right edge instead.
- **`--meet-gap` is a fraction of figure height, not a fixed pixel value.**
  Their element boxes touching still leaves a gap between the drawn figures,
  because each SVG carries internal padding — and that gap scales with the
  figures, which shrink on mobile. Measured: hand centres end 3.3px apart at
  375px and 4.8px at 1280px, inside the hand radius at both, so they read as
  clasped rather than merely near.
- **Distance uses `cqw`, not `vw`.** `100vw` includes the scrollbar, so on a
  desktop with a classic scrollbar he would overshoot by ~15px and walk into
  the bride. The scene is a size container, so `100cqw` is the real usable
  width. Measured landing gap: 0px at both 1280px and 375px.
- Figures are silhouettes — elegant at 100px tall, and no need to guess at
  features. Groom in gray, bride in ivory with a rose outline, because white
  on white would disappear. The gray here is for contrast against her ivory,
  not a match to the dress code — the gentlemen wear khaki.
- A heart blooms between them over the last 10% of the page.

Sizes are tokens on `.couple-scene` (`--groom-w`, `--bride-w`, `--figure-h`)
and shrink on mobile, where the pair occupies about 22% of the screen width.
The scene is `pointer-events: none` and aria-hidden — verified that no
interactive control is blocked by it.

### Petals on the wind

A fixed layer of 34 drifting blossom petals (`Petals`, `.petal-field`). No
JavaScript — it is a server component emitting CSS custom properties, and the
animation runs on the compositor.

- **Three depths.** Far petals are small, slow and faint; near ones are large,
  fast and blurred. The blur is depth of field — it is what stops the field
  reading as one flat sheet of confetti.
- **Two nested elements per petal.** One element has one `transform`, so the
  wind path and the tumble cannot share it. The outer carries the drift, the
  inner spins on an unrelated clock — which is why no two petals ever visibly
  repeat in step.
- **The values are hand-picked, not random.** `Math.random()` would generate
  different numbers on the server and the client and trip a hydration
  mismatch.
- **z-40**: above the page so petals pass in front of the photographs, below
  the nav (z-50) and the lightbox (z-60).
- Mobile shows the first 16, which are ordered to span all three depths;
  `prefers-reduced-motion` hides them entirely.

Two things to preserve if you edit this:

1. **Tone matters more than count.** The first version used near-white petals,
   which are close to invisible on a white page — no amount of extra petals
   fixes that. The current tones lead with rose-400/500 and separate from the
   background at about 2.9:1.
2. **Blur belongs on a modifier class**, not `filter: blur(var(--x, 0px))` on
   every petal. An unset variable resolves to `blur(0px)`, which is not the
   same as no filter — it still forces a filter pass and a stacking context on
   every element.

To change the density, edit the `PETALS` array in `src/components/Petals.tsx` —
each entry is one petal, and deleting lines is the whole edit. To confine them
to the hero instead of the whole page, move `<Petals />` inside `Hero` and
change `.petal-field` from `fixed` to `absolute`.

### Motion — 3D scroll and parallax

All of it is **native CSS scroll-driven animation** (`animation-timeline`), not
a scroll listener. There is no JavaScript involved: the animations run on the
compositor, so they cannot jank, and progress is tied to scroll *position*, so
they track a finger on a phone and reverse when you scroll back up.

| Class | Effect | Timeline |
|---|---|---|
| `.parallax-hero` | Hero photo drifts slower than the page | page scroll |
| `.hero-depth` | Hero words recede into depth and fade | page scroll |
| `.reveal-3d` | Sections rise out of depth, tilting flat | element in view |
| `.tilt-3d` | Gallery photos tilt up out of the page | element in view |
| `.drift` | Blurred colour layers drift at two speeds | element in view |

Three rules that keep this working — each one cost a bug to learn:

1. **Perspective is baked into the `transform`**, never set as a `perspective`
   property on an ancestor. An element with `perspective` becomes the
   containing block for `position: fixed` descendants, which tears the fixed
   nav off the top of the page.
2. **Sections use `overflow-x: clip`, not `overflow-hidden`.** `hidden` creates
   a scroll container, and `animation-timeline: view()` resolves against the
   nearest scrollport — so an `overflow-hidden` section silently freezes every
   scroll animation inside it.
3. **Translucent drifting layers eat contrast.** The rose layer at 30% alpha
   dragged an 11px heading to 4.0:1. Alphas are capped low and the small
   letterspaced eyebrows use `rose-700`. If you raise a `Drift` alpha, re-check
   contrast.

To tune the depth, edit the keyframes in `globals.css`. The geometry is
deliberately shallow — about 7° of rotation and 110px of depth. It should read
as air and light, not as a carousel.

Guests who have asked their system for reduced motion, and browsers without
scroll-driven animation support, get the finished page with no motion at all —
the whole block is gated behind `prefers-reduced-motion: no-preference` and
`@supports`.

### Structure

| File | What it does |
|---|---|
| `src/config/wedding.ts` | All content |
| `src/app/page.tsx` | Section order |
| `src/components/EventCard.tsx` | One card, renders every event |
| `src/components/MapEmbed.tsx` | Map iframe + Maps/Waze links |
| `src/lib/rsvp-schema.ts` | Validation, shared by form and server |
| `src/app/api/rsvp/route.ts` | Receives and forwards RSVPs |

Adding a third stop to the day needs no new code — just another entry in
`wedding.events`.

---

## Deliberately left out

Countdown timer, meal preference, song request, seating charts, QR entry passes
and an admin panel. Plus-ones are refused by design: each invitation seats the
one person named on it, the form cannot reply for anybody else, and the schema
enforces that server-side — so please don't "restore" a guest-count field. Max's serves a set menu, so meal choice is yours rather than
your guests'; and with no program there's nothing for a song request to feed
into. All of it is easy to add later — the config-driven structure leaves room.

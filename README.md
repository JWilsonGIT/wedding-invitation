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
**Guests** holds the headcount for that reply (a decline always stores `0`, so
you can sum the column safely).

For a running total, open the Apps Script editor, pick `countAttending` from the
function dropdown, press Run, and read the Execution log.

---

## Editing the design

Colours and fonts are defined once, at the top of `src/app/globals.css`.

The palette is white, with **pink and gray** accents. They divide the work:

- **Pink** — celebration, and the one primary action (RSVP)
- **Gray** — the gentlemen's colour, and everything practical: directions,
  secondary buttons, logistical notes
- **White** — the ground

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

Putting small text in `rose-400/500` or `gray-400` is the one change that will
make this page look cheap and read badly. The ink tones are all ≥5:1 too.

Both scales intentionally override Tailwind's built-ins. `gray` is defined
across the full 50–900 ramp so any shade you reach for stays warm; `rose` is
only defined at 400–700, so don't reach for `rose-300` or `rose-800` — those
are Tailwind's cool defaults and won't match.

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
and an admin panel. Max's serves a set menu, so meal choice is yours rather than
your guests'; and with no program there's nothing for a song request to feed
into. All of it is easy to add later — the config-driven structure leaves room.

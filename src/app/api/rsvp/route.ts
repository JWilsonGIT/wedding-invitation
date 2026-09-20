import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { rsvpSchema, type RsvpRecord } from "@/lib/rsvp-schema";
import { wedding } from "@/config/wedding";

/*
  Why this route exists at all:

  Google Apps Script web apps do not return usable CORS headers, so the
  browser cannot POST to one and read the reply — a guest would never learn
  whether their RSVP landed. Forwarding server-side sidesteps CORS entirely
  and buys two more things: the Apps Script URL never reaches the browser,
  and validation cannot be skipped by editing client code.
*/

export const runtime = "nodejs";

/*
  HOW LONG GOOGLE IS ALLOWED TO TAKE.

  Apps Script is slow and wildly inconsistent. Round-trips measured from
  one machine on one afternoon: 11.0s, 11.4s, 14.0s, and one that still had
  not answered after 60s. The row itself is written almost
  immediately; what varies is how long Google takes to hand the reply back,
  including a 302 through script.googleusercontent.com.

  This used to wait ten seconds, which sits right in the middle of that
  range. So roughly every other reply was abandoned mid-flight while the
  row was already in the sheet: the guest saw an error, pressed send again,
  and wrote a duplicate. It looked like a phone-only bug because the first
  person to hit it was on a phone. It is not — the webhook call happens
  here, on the server, and knows nothing about the device. It is a coin
  toss on every submission.

  30 seconds covers everything but the pathological tail. maxDuration must
  be comfortably larger, or the platform kills the function first and the
  guest gets a gateway error page instead of anything written below.
*/
export const maxDuration = 60;
const WEBHOOK_TIMEOUT_MS = 30_000;

const LOCAL_STORE = path.join(process.cwd(), ".data", "rsvps.jsonl");

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "We couldn't read that." },
      { status: 400 },
    );
  }

  const parsed = rsvpSchema.safeParse(payload);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return NextResponse.json({ ok: false, fieldErrors }, { status: 422 });
  }

  const data = parsed.data;

  /* Honeypot tripped. Answer as though all is well — a bot that gets a
     clear error just learns which field to leave alone next time.

     But LOG it. A guest whose reply is dropped here sees the thank-you
     screen and has no idea, so a false positive is invisible from both
     ends; this line is the only way to tell one from real spam. If a real
     name appears below, the honeypot is catching guests, not bots. */
  if (data.botField && data.botField.trim() !== "") {
    console.warn(
      "RSVP discarded as spam — honeypot filled:",
      JSON.stringify({ fullName: data.fullName, mobile: data.mobile, botField: data.botField }),
    );
    return NextResponse.json({ ok: true });
  }

  const record = {
    submittedAt: new Date().toISOString(),
    fullName: data.fullName,
    mobile: data.mobile,
    email: data.email ?? "",
    attending: data.attending,
    guests: data.guests,
    message: data.message ?? "",
  };

  const webhook = process.env.RSVP_WEBHOOK_URL;

  if (!webhook) {
    /* Vercel's filesystem is read-only, so there is no quiet local fallback
       in production. Fail loudly rather than swallow a real RSVP. */
    if (process.env.NODE_ENV === "production") {
      console.error("RSVP_WEBHOOK_URL is not set. RSVP was NOT stored:", record);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Our form isn't connected yet. Please message us directly so we don't lose your reply.",
        },
        { status: 503 },
      );
    }

    await appendLocally(record);
    return NextResponse.json({ ok: true, storedLocally: true });
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.RSVP_SHARED_SECRET ?? "",
        ...record,
      }),
      /* Apps Script answers with a 302 to script.googleusercontent.com;
         fetch follows it by default, but be explicit about the intent. */
      redirect: "follow",
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    const body = await response.text();

    if (!response.ok || !body.includes('"ok":true')) {
      console.error("Apps Script rejected the RSVP:", response.status, body.slice(0, 500));
      return NextResponse.json(
        {
          ok: false,
          error: "We couldn't save your reply just now. Please try again in a moment.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    /* A timeout is not the same failure as a refused connection, and the
       guest must not be told the same thing about both.

       Timed out: the POST left here, so Apps Script has almost certainly
       written the row and merely failed to say so in time. Inviting a
       retry would duplicate a reply that is already in the sheet.

       Could not connect: nothing was sent, nothing was written, and trying
       again is exactly the right advice. */
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    if (timedOut) {
      console.error(
        `RSVP webhook did not answer within ${WEBHOOK_TIMEOUT_MS}ms. The row may still have been written — check the sheet before assuming this reply was lost:`,
        JSON.stringify({ fullName: record.fullName, mobile: record.mobile }),
      );
      return NextResponse.json(
        {
          ok: false,
          error: `Your reply may have gone through — our list is just slow to answer. Please don't send it twice; call us on ${wedding.rsvp.contactNumber} if you'd like to be sure.`,
        },
        { status: 504 },
      );
    }

    console.error("Failed to reach the RSVP webhook:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "We couldn't reach our guest list. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}

/**
 * Dev-only store, so the whole form is testable before the Google Sheet
 * exists. JSONL because appending a line cannot corrupt earlier entries
 * the way rewriting a JSON array can.
 */
async function appendLocally(record: Omit<RsvpRecord, "botField"> & { submittedAt: string }) {
  await fs.mkdir(path.dirname(LOCAL_STORE), { recursive: true });
  await fs.appendFile(LOCAL_STORE, `${JSON.stringify(record)}\n`, "utf8");
  console.info(`RSVP stored locally in .data/rsvps.jsonl — ${record.fullName}`);
}

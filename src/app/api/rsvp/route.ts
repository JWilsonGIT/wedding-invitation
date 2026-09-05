import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { rsvpSchema, type RsvpRecord } from "@/lib/rsvp-schema";

/*
  Why this route exists at all:

  Google Apps Script web apps do not return usable CORS headers, so the
  browser cannot POST to one and read the reply — a guest would never learn
  whether their RSVP landed. Forwarding server-side sidesteps CORS entirely
  and buys two more things: the Apps Script URL never reaches the browser,
  and validation cannot be skipped by editing client code.
*/

export const runtime = "nodejs";

const LOCAL_STORE = path.join(process.cwd(), ".data", "rsvps.jsonl");

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "We could not read that submission." },
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
            "Our form is not connected yet. Please message us directly — we do not want to lose your reply.",
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
      signal: AbortSignal.timeout(10_000),
    });

    const body = await response.text();

    if (!response.ok || !body.includes('"ok":true')) {
      console.error("Apps Script rejected the RSVP:", response.status, body.slice(0, 500));
      return NextResponse.json(
        {
          ok: false,
          error: "We could not save your reply just now. Please try again in a moment.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to reach the RSVP webhook:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "We could not reach our guest list. Please try again in a moment.",
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

"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RsvpFieldErrors } from "@/lib/rsvp-schema";
import { wedding } from "@/config/wedding";
import { formatLongDate } from "@/lib/date";
import { Ornament } from "../Ornament";

/*
  Panel IV — the reply, asked one question at a time.

  A no-scroll panel cannot hold a five-field form on a phone with the
  keyboard open, so the form stops being a form and becomes a
  conversation: four questions, each filling the screen, each advanced by
  a single tap. The constraint improved it — one question at a time is a
  better way to ask a guest anything.

  WHY THE FIELDS ARE CONTROLLED HERE. The old single-page form read its
  values straight out of the DOM with `new FormData`, which is the nicer
  pattern when every input is mounted at once. In a wizard the inputs
  unmount as a guest moves on, so their values have to live in state or
  they would be thrown away between steps.

  WHAT IS DELIBERATELY DUPLICATED. Each step gates on the value it just
  asked for, which is a second copy of a rule the zod schema already
  owns. That is on purpose: without it a guest could reach step four,
  submit, and be thrown back to step one — a far worse outcome than a
  friendly nudge at the moment they typed. The server is still the only
  authority; these checks just stop a guest wasting their time.
*/

type Values = {
  attending: "yes" | "no" | "";
  fullName: string;
  mobile: string;
  email: string;
  message: string;
  botField: string;
};

type Status = "idle" | "submitting" | "success" | "error";

const EMPTY: Values = {
  attending: "",
  fullName: "",
  mobile: "",
  email: "",
  message: "",
  botField: "",
};

/* Which step owns which field, so a server error can send a guest back to
   the exact question that needs fixing rather than to the start. */
const STEP_OF: Record<string, number> = {
  attending: 0,
  fullName: 1,
  mobile: 2,
  email: 2,
  message: 3,
};

const TOTAL = 4;

/*
  The texture under the rose. Declared once and used by BOTH states of
  this panel — the form and the finished screen — because they are two
  returns from one component and a layer added to only one of them is
  exactly the kind of thing that goes unnoticed until someone replies.

  EAGER, NOT `priority`, the same reasoning as Panels II and III: this
  must not compete with the hero, but it also cannot be lazy, because
  every panel in the deck shares one set of coordinates and a lazy image
  would only start loading once a guest had already arrived here.
*/
function RsvpTexture() {
  if (!wedding.rsvpImage) return null;
  return (
    <div className="panel-rsvp-photo" aria-hidden="true">
      <Image
        src={wedding.rsvpImage.src}
        alt=""
        fill
        loading="eager"
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}

export function PanelRsvp({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<RsvpFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [replied, setReplied] = useState<"yes" | "no">("yes");
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  /* The keyboard should land in the field a guest was just asked about,
     but only once they are actually looking at this panel — focusing an
     input three panels away would drag the viewport sideways. */
  useEffect(() => {
    if (!active || status === "success") return;
    if (step === 0) return;
    const id = window.setTimeout(() => firstInputRef.current?.focus({ preventScroll: true }), 260);
    return () => window.clearTimeout(id);
  }, [step, active, status]);

  const goStep = useCallback((next: number) => {
    setLocalError(null);
    setStep(Math.max(0, Math.min(TOTAL - 1, next)));
  }, []);

  const submit = useCallback(
    async (payload: Values) => {
      setStatus("submitting");
      setFieldErrors({});
      setFormError(null);

      try {
        const response = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        /* Read the body as text and parse it ourselves. Anything that fails
           before the route runs — a gateway timeout, a platform error —
           answers with an HTML page, and response.json() throws on it. That
           threw us into the catch below, which blamed the guest list: the
           one explanation that is certainly wrong when the request never
           reached the guest list at all. */
        const raw = await response.text();
        let result: { ok?: boolean; error?: string; fieldErrors?: RsvpFieldErrors } = {};
        try {
          if (raw) result = JSON.parse(raw);
        } catch {
          /* Not JSON. Leave result empty and fall into the generic message
             below, which is honest about not knowing what happened. */
        }

        if (!response.ok || !result.ok) {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
            const firstField = Object.keys(result.fieldErrors)[0];
            if (firstField && STEP_OF[firstField] !== undefined) goStep(STEP_OF[firstField]);
          }
          setFormError(
            result.error ??
              (result.fieldErrors
                ? "Please check the details above and try once more."
                : `Something went wrong at our end, and we can't tell whether your reply was saved. Please call us on ${wedding.rsvp.contactNumber} rather than sending it twice.`),
          );
          setStatus("error");
          return;
        }

        setReplied(payload.attending === "no" ? "no" : "yes");
        setStatus("success");
      } catch {
        /* The request never left this device — dropped connection, a
           network switched mid-send. Nothing was saved, so trying again is
           safe, and saying so is better than naming a guest list this
           never reached. */
        setFormError(
          "We couldn't send that — check your connection and try once more.",
        );
        setStatus("error");
      }
    },
    [goStep],
  );

  /* ── the finished state ─────────────────────────────────────── */
  if (status === "success") {
    return (
      <div className={`panel panel-rsvp is-done ${active ? "is-active" : ""}`}>
        <RsvpTexture />
        <div className="panel-inner panel-rsvp-done">
          <Ornament />
          <h2 className="stagger-2 panel-title is-onDark mt-7">
            {replied === "yes" ? "Thank you, we can't wait!" : "Thank you for letting us know"}
          </h2>
          <p className="stagger-3 panel-rsvp-done-body">
            {replied === "yes"
              ? wedding.reveal.ceremonyVenue && wedding.reveal.gatheringVenue
                ? `Your reply is in. We'll see you at ${wedding.events[0].venue}, then at ${wedding.events[1].venue} straight after.`
                : wedding.reveal.ceremonyVenue
                  ? `Your reply is in. We'll see you at ${wedding.events[0].venue}, and we'll send the rest of the details soon.`
                  : "Your reply is in. We'll send you the where and when as soon as it is settled."
              : "We'll miss you, but thank you for letting us know. You'll be in our thoughts."}
          </p>
          <p className="stagger-4 panel-rsvp-done-note">
            Need to change your reply? Call us on {wedding.rsvp.contactNumber}.
          </p>
        </div>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <div className={`panel panel-rsvp ${active ? "is-active" : ""}`}>
      <RsvpTexture />
      <div className="panel-inner">
        <header className="panel-head">
          <p className="stagger-1 panel-eyebrow is-onDark">RSVP</p>
          <h2 className="stagger-2 panel-title is-onDark">{wedding.rsvp.heading}</h2>
          <p className="stagger-3 panel-rsvp-deadline">
            Please reply by{" "}
            <strong>{formatLongDate(wedding.rsvp.deadline)}</strong> so we can set the table.
          </p>
        </header>

        {/* This had no entrance of its own: the largest, whitest thing on
            the panel simply existed as soon as the panel faded up, while
            the three lines above it morphed in. It arrives last now, which
            is also the right reading order. */}
        <div className="stagger-4 rsvp-card">
          {/* Honeypot. Mounted on every step so a bot always finds it, and
              named nothing an autofill dictionary recognises — a field
              called "website" once ate a real guest's reply. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="rsvp-botField">Leave this field empty</label>
            <input
              id="rsvp-botField"
              name="botField"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.botField}
              onChange={(event) => set("botField", event.target.value)}
            />
          </div>

          <div className="rsvp-progress" aria-hidden="true">
            <span className="rsvp-progress-bar" style={{ ["--p" as string]: (step + 1) / TOTAL }} />
          </div>
          <p className="rsvp-step-count">
            Question {step + 1} of {TOTAL}
          </p>

          {formError ? (
            <p role="alert" className="rsvp-alert">
              {formError}
            </p>
          ) : null}

          {step === 0 ? (
            <Step question="Will you be joining us?">
              <div className="rsvp-choices">
                <ChoiceCard
                  title="Yes, count me in"
                  subtitle="I'll be there"
                  selected={values.attending === "yes"}
                  onSelect={() => {
                    set("attending", "yes");
                    goStep(1);
                  }}
                />
                <ChoiceCard
                  title="Sorry, I can't make it"
                  subtitle="I'll be there in spirit"
                  selected={values.attending === "no"}
                  onSelect={() => {
                    set("attending", "no");
                    goStep(1);
                  }}
                />
              </div>
              {wedding.rsvp.plusOneNote ? (
                <p className="rsvp-aside">{wedding.rsvp.plusOneNote}</p>
              ) : null}
              <FieldError messages={fieldErrors.attending} />
            </Step>
          ) : null}

          {step === 1 ? (
            <Step question="And your name?" hint="One name per invitation.">
              <input
                ref={firstInputRef as React.Ref<HTMLInputElement>}
                type="text"
                autoComplete="name"
                placeholder="Juan dela Cruz"
                value={values.fullName}
                onChange={(event) => set("fullName", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    next();
                  }
                }}
                aria-label="Full name"
                aria-invalid={fieldErrors.fullName || localError ? true : undefined}
                className="rsvp-input"
              />
              <FieldError messages={fieldErrors.fullName} local={localError} />
              <Controls onBack={() => goStep(0)} onNext={next} />
            </Step>
          ) : null}

          {step === 2 ? (
            <Step question="A number we can reach you on?" hint="So we can reach you about the day.">
              <input
                ref={firstInputRef as React.Ref<HTMLInputElement>}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0917 123 4567"
                value={values.mobile}
                onChange={(event) => set("mobile", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    next();
                  }
                }}
                aria-label="Mobile number"
                aria-invalid={fieldErrors.mobile || localError ? true : undefined}
                className="rsvp-input"
              />
              <FieldError messages={fieldErrors.mobile} local={localError} />

              <input
                type="email"
                autoComplete="email"
                placeholder="juan@email.com (optional)"
                value={values.email}
                onChange={(event) => set("email", event.target.value)}
                aria-label="Email address, optional"
                aria-invalid={fieldErrors.email ? true : undefined}
                className="rsvp-input mt-3"
              />
              <FieldError messages={fieldErrors.email} />
              <Controls onBack={() => goStep(1)} onNext={next} />
            </Step>
          ) : null}

          {step === 3 ? (
            <Step question="Anything you'd like us to know?" hint="Optional. A note, a song, or just a hello.">
              <textarea
                ref={firstInputRef as React.Ref<HTMLTextAreaElement>}
                rows={3}
                placeholder="We're so happy for you both!"
                value={values.message}
                onChange={(event) => set("message", event.target.value)}
                aria-label="A note for us, optional"
                aria-invalid={fieldErrors.message ? true : undefined}
                className="rsvp-input rsvp-textarea"
              />
              <FieldError messages={fieldErrors.message} />
              <Controls
                onBack={() => goStep(2)}
                onNext={() => submit(values)}
                nextLabel={busy ? "Sending…" : "Send my reply"}
                busy={busy}
                primary
              />
            </Step>
          ) : null}
        </div>
      </div>
    </div>
  );

  function next() {
    if (step === 1) {
      if (values.fullName.trim().length < 2) {
        setLocalError("Please tell us your full name.");
        return;
      }
    }
    if (step === 2) {
      const mobile = values.mobile.trim();
      if (mobile.length < 7) {
        setLocalError("Please leave a number we can reach you on.");
        return;
      }
      if (!/^[0-9+()\s-]+$/.test(mobile)) {
        setLocalError("Digits, spaces and + ( ) - only, please.");
        return;
      }
    }
    goStep(step + 1);
  }
}

/* ── small pieces ─────────────────────────────────────────────────── */

function Step({
  question,
  hint,
  children,
}: {
  question: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rsvp-step">
      <h3 className="rsvp-question">{question}</h3>
      {hint ? <p className="rsvp-hint">{hint}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Controls({
  onBack,
  onNext,
  nextLabel = "Continue",
  busy = false,
  primary = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  busy?: boolean;
  primary?: boolean;
}) {
  return (
    <div className="rsvp-controls">
      <button type="button" onClick={onBack} className="rsvp-back" disabled={busy}>
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={busy}
        className={`rsvp-next ${primary ? "is-primary" : ""}`}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function ChoiceCard({
  title,
  subtitle,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rsvp-choice ${selected ? "is-selected" : ""}`}
    >
      <span className="rsvp-choice-title">{title}</span>
      <span className="rsvp-choice-sub">{subtitle}</span>
    </button>
  );
}

function FieldError({ messages, local }: { messages?: string[]; local?: string | null }) {
  const text = local ?? messages?.[0];
  if (!text) return null;
  /* role=alert so a guest using a screen reader hears the problem at the
     moment it appears, rather than discovering it by tabbing back. */
  return (
    <p role="alert" className="rsvp-error">
      {text}
    </p>
  );
}

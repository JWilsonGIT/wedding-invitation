"use client";

import { useId, useRef, useState } from "react";
import { wedding } from "@/config/wedding";
/* Type-only import — erased at compile time, so zod stays on the server
   instead of riding along in the client bundle. */
import type { RsvpFieldErrors } from "@/lib/rsvp-schema";
import { formatLongDate } from "@/lib/date";
import { Section } from "./Section";
import { SectionHeading } from "./SectionHeading";
import { Ornament } from "./Ornament";

type Status = "idle" | "submitting" | "success" | "error";

export function RsvpForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<RsvpFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [replied, setReplied] = useState<"yes" | "no">("yes");

  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const errorId = (name: string) => `${uid}-${name}-error`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setFieldErrors({});
    setFormError(null);

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        fieldErrors?: RsvpFieldErrors;
      };

      if (!response.ok || !result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          /* Send focus to the first thing that needs fixing, so a guest on a
             phone is not left scrolling to find the red text. */
          const firstField = Object.keys(result.fieldErrors)[0];
          const node = formRef.current?.querySelector<HTMLElement>(
            `[name="${firstField}"]`,
          );
          node?.focus();
        }
        setFormError(
          result.error ??
            (result.fieldErrors
              ? "Please check the highlighted fields."
              : "Something went wrong. Please try again."),
        );
        setStatus("error");
        return;
      }

      setReplied(attending === "no" ? "no" : "yes");
      setStatus("success");
    } catch {
      setFormError(
        "We could not reach the internet just then. Please check your connection and try again.",
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Section id="rsvp" tone="blush">
        <div className="mx-auto max-w-xl rounded-xl border border-blush-200 bg-white px-6 py-14 text-center sm:px-10">
          <Ornament />
          <h2 className="mt-8 font-display text-3xl font-light text-ink-900">
            {replied === "yes" ? "Thank you, we can't wait!" : "Thank you for letting us know"}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink-600">
            {replied === "yes"
              ? `Your reply is in. We will see you at ${wedding.events[0].venue}, and then at ${wedding.events[1].venue} straight after.`
              : "We will miss you on the day, but we are grateful you took the time to tell us. You will be in our thoughts."}
          </p>
          <p className="mt-6 text-sm text-ink-400">
            Need to change your reply? Call us on {wedding.rsvp.contactNumber}.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section id="rsvp" tone="blush">
      <SectionHeading eyebrow="RSVP" index={5}>
        {wedding.rsvp.heading}
      </SectionHeading>

      <p className="mx-auto mt-6 max-w-xl text-center text-base text-ink-600">
        Kindly reply by{" "}
        <strong className="font-medium text-ink-900">
          {formatLongDate(wedding.rsvp.deadline)}
        </strong>{" "}
        so we can set the table.
      </p>

      {/* The one place the invitation says no to a guest. Kept in the config
          beside the deadline it sits under, so it can be reworded — or
          emptied to hide it — without opening a component. */}
      {wedding.rsvp.plusOneNote ? (
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-ink-400">
          {wedding.rsvp.plusOneNote}
        </p>
      ) : null}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        /* noValidate on purpose: the server schema is the single source of
           truth, so guests read our wording rather than the browser's. */
        noValidate
        className="card-accent relative mx-auto mt-12 max-w-xl overflow-hidden rounded-xl border border-blush-200 bg-white p-6 shadow-[0_1px_3px_rgba(47,38,41,0.05)] sm:p-9"
      >
        {formError ? (
          <p
            role="alert"
            className="mb-7 rounded-md border border-rose-400 bg-blush-100 px-4 py-3 text-sm text-rose-700"
          >
            {formError}
          </p>
        ) : null}

        {/* Honeypot: off-screen, unlabelled, skipped by keyboard and
            ignored by autofill. Bots fill it; guests never see it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor={fieldId("botField")}>Leave this field empty</label>
          <input
            id={fieldId("botField")}
            type="text"
            name="botField"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <div className="space-y-6">
          <Field
            label="Full name"
            name="fullName"
            id={fieldId("fullName")}
            errorId={errorId("fullName")}
            errors={fieldErrors.fullName}
            /* States the rule as a plain fact. The full, polite version is
               the aside above the form — saying "no plus-ones" twice on one
               screen reads as scolding. */
            hint="One name per invitation."
          >
            <input
              id={fieldId("fullName")}
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Juan dela Cruz"
              aria-invalid={fieldErrors.fullName ? true : undefined}
              aria-describedby={fieldErrors.fullName ? errorId("fullName") : undefined}
              className={inputClass(!!fieldErrors.fullName)}
            />
          </Field>

          <Field
            label="Mobile number"
            name="mobile"
            id={fieldId("mobile")}
            errorId={errorId("mobile")}
            errors={fieldErrors.mobile}
            hint="So we can reach you about the day."
          >
            <input
              id={fieldId("mobile")}
              name="mobile"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0917 123 4567"
              aria-invalid={fieldErrors.mobile ? true : undefined}
              aria-describedby={fieldErrors.mobile ? errorId("mobile") : undefined}
              className={inputClass(!!fieldErrors.mobile)}
            />
          </Field>

          <Field
            label="Email"
            name="email"
            id={fieldId("email")}
            errorId={errorId("email")}
            errors={fieldErrors.email}
            optional
          >
            <input
              id={fieldId("email")}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="juan@email.com"
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? errorId("email") : undefined}
              className={inputClass(!!fieldErrors.email)}
            />
          </Field>

          {/* Attendance — a fieldset so screen readers announce the question
              along with each option, not two orphaned radios. */}
          <fieldset>
            <legend className="text-sm font-medium text-ink-900">
              Will you be joining us?
            </legend>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChoiceCard
                name="attending"
                value="yes"
                id={fieldId("attending-yes")}
                checked={attending === "yes"}
                onChange={() => setAttending("yes")}
                title="Joyfully accepts"
                subtitle="I will be there"
              />
              <ChoiceCard
                name="attending"
                value="no"
                id={fieldId("attending-no")}
                checked={attending === "no"}
                onChange={() => setAttending("no")}
                title="Regretfully declines"
                subtitle="I cannot make it"
              />
            </div>

            {fieldErrors.attending ? (
              <FieldError id={errorId("attending")} messages={fieldErrors.attending} />
            ) : null}
          </fieldset>

          <Field
            label="A note for us"
            name="message"
            id={fieldId("message")}
            errorId={errorId("message")}
            errors={fieldErrors.message}
            optional
          >
            <textarea
              id={fieldId("message")}
              name="message"
              rows={4}
              placeholder="Anything you would like us to know"
              aria-invalid={fieldErrors.message ? true : undefined}
              aria-describedby={fieldErrors.message ? errorId("message") : undefined}
              className={`${inputClass(!!fieldErrors.message)} resize-y`}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-9 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-md bg-rose-600 px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? (
            <>
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              Sending your reply
            </>
          ) : (
            "Send my reply"
          )}
        </button>

        <p aria-live="polite" className="sr-only">
          {status === "submitting" ? "Sending your reply" : ""}
        </p>
      </form>
    </Section>
  );
}

/* ── small building blocks ─────────────────────────────────────────── */

function inputClass(hasError: boolean) {
  return [
    "block w-full min-h-11 rounded-md border bg-white px-3.5 py-2.5",
    "text-base text-ink-900 placeholder:text-ink-400",
    hasError ? "border-rose-600" : "border-blush-200",
  ].join(" ");
}

function Field({
  label,
  id,
  errorId,
  errors,
  hint,
  optional,
  children,
}: {
  label: string;
  name: string;
  id: string;
  errorId: string;
  errors?: string[];
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-900">
        {label}
        {optional ? (
          <span className="ml-2 text-xs font-normal text-ink-400">optional</span>
        ) : null}
      </label>
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {errors ? <FieldError id={errorId} messages={errors} /> : null}
    </div>
  );
}

function FieldError({ id, messages }: { id: string; messages: string[] }) {
  return (
    // rose-700 for small text — rose-400/500 would fail contrast here
    <p id={id} className="mt-2 text-sm text-rose-700">
      {messages[0]}
    </p>
  );
}

function ChoiceCard({
  name,
  value,
  id,
  checked,
  onChange,
  title,
  subtitle,
}: {
  name: string;
  value: string;
  id: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer flex-col rounded-md border px-4 py-3.5 transition-colors ${
        checked
          ? "border-rose-600 bg-blush-100"
          : "border-blush-200 bg-white hover:border-rose-400"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="size-4 accent-rose-600"
        />
        <span className="font-display text-lg text-ink-900">{title}</span>
      </span>
      <span className="mt-1 pl-[1.625rem] text-xs text-ink-400">{subtitle}</span>
    </label>
  );
}

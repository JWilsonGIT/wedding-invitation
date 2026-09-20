import Image from "next/image";
import { wedding } from "@/config/wedding";
import { Section } from "./Section";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { Drift } from "./Drift";
import { Tilt } from "./Tilt";

export function Gifts() {
  const { heading, message, methods } = wedding.gifts;

  return (
    <Section
      id="gifts"
      tone="blush"
      decoration={
        <>
          <Drift className="top-8 -right-[10%] size-72" speed={48} tone="rose" />
          <Drift className="-bottom-16 -left-[12%] size-80" speed={18} tone="gray" />
        </>
      }
    >
      <SectionHeading eyebrow="With Thanks" index={4}>
        {heading}
      </SectionHeading>

      <Reveal className="mx-auto mt-8 max-w-2xl">
        <p className="text-center text-base leading-relaxed text-ink-600">
          {message}
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {methods.map((method) => (
            <Tilt key={method.name} className="rounded-xl" max={5} lift={5}>
              <div className="card-accent relative flex h-full flex-col items-center overflow-hidden rounded-xl border border-blush-200 bg-white px-6 py-7 text-center">
                <p className="font-display text-xl text-ink-900">{method.name}</p>

              {/* A missing QR renders nothing at all — no empty frame,
                  no broken image icon. */}
                {method.qr ? (
                  <Image
                    src={method.qr}
                    alt={`${method.name} QR code`}
                    width={180}
                    height={180}
                    className="mt-5 rounded-md border border-blush-200"
                  />
                ) : null}

                <p className="mt-1 text-sm tracking-wide text-ink-400">
                  {method.accountNumber}
                </p>
              </div>
            </Tilt>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

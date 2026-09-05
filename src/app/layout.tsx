import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Story_Script, Tangerine } from "next/font/google";
import "./globals.css";
import { wedding } from "@/config/wedding";
import { formatLongDate } from "@/lib/date";
import { siteUrl } from "@/lib/site-url";

/*
  Cormorant Garamond for names and headings — a delicate serif that
  carries the occasion at light weights with wide tracking.
  Inter for everything a guest actually has to read.

  Tangerine for the couple's names on Panel I, and for nothing else.
  That restriction is the whole point: it never touches a heading a guest
  has to READ, so the cost of a cursive is paid once, on two words, where
  it is decoration rather than information.

  It is a far more decorative face than the Cormorant around it — very
  high stroke contrast, long swashes, a tiny x-height — which is why it
  needs its own size and leading in globals.css rather than inheriting the
  display scale. Do not press it into service for a heading; at anything
  below the size Panel I sets it, the thin strokes disappear.
*/
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* 700, not 400 — and this is a legibility decision, not a stylistic one.
   Tangerine is an exceptionally fine-stroked calligraphic face, and the
   names sit directly on the hero photograph with nothing washed over it.
   At 400 the hairlines break up against the picture; 700 keeps the same
   letterforms with a stroke that survives the background. */
const tangerine = Tangerine({
  variable: "--font-tangerine",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

/*
  Story Script, for the ceremony hour on Panel I and for nothing else.

  ONE WEIGHT IS ALL IT HAS — Google publishes it at 400 only, so there is
  no bolder cut to reach for if it ever reads too light. That is the thing
  to know before using it anywhere the background is busier than the
  frosted pill it sits on here.

  Like Tangerine, it needs its own size rather than inheriting a scale: a
  casual script runs small for its point size, so the hour is set larger
  than the sans it replaced and still occupies about the same space. See
  `.panel-welcome-venue-time` in globals.css.
*/
const storyScript = Story_Script({
  variable: "--font-story-script",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const title = `${wedding.couple.shortNames} — ${formatLongDate(wedding.date)}`;
const description = `Please join us for our wedding ceremony at ${wedding.events[0].venue}, followed by a meal together at ${wedding.events[1].venue}. Kindly RSVP.`;

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title,
  description,
  /* Link previews in Messenger, Viber and iMessage — where these
     invitations actually get shared. */
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_PH",
    siteName: title,
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${tangerine.variable} ${storyScript.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">{children}</body>
    </html>
  );
}

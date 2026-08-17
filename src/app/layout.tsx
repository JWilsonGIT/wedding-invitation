import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { wedding } from "@/config/wedding";
import { formatLongDate } from "@/lib/date";
import { siteUrl } from "@/lib/site-url";

/*
  Cormorant Garamond for names and headings — a delicate serif that
  carries the occasion at light weights with wide tracking.
  Inter for everything a guest actually has to read.

  Deliberately no script/cursive face. Great Vibes and its cousins
  are the single clearest tell of a templated wedding site.
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
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">{children}</body>
    </html>
  );
}

import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { InvitationNote } from "@/components/InvitationNote";
import { TheDay } from "@/components/TheDay";
import { DressCode } from "@/components/DressCode";
import { Gallery } from "@/components/Gallery";
import { Gifts } from "@/components/Gifts";
import { RsvpForm } from "@/components/RsvpForm";
import { Footer } from "@/components/Footer";

/*
  Order matters: tell them who and when, then where, then what to wear,
  then ask. The RSVP sits last because by then a guest has every answer
  they need to say yes.
*/
export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <InvitationNote />
        <TheDay />
        <DressCode />
        <Gallery />
        <Gifts />
        <RsvpForm />
      </main>
      <Footer />
    </>
  );
}

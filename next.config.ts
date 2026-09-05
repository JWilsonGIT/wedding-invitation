import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
      Next 16 REQUIRES every quality you use to be listed here — the
      default allowlist is [75] and nothing else, and a request for an
      unlisted quality is rejected outright rather than clamped. That is
      why `quality={90}` on the hero returned a 44-byte error instead of
      an image until this line existed.

      90 is here for the hero photograph alone. It is the one image shown
      at full-bleed, so webp artefacts in a large flat area of near-white
      are visible in a way they never are on a gallery thumbnail; 75 stays
      the default for everything else and is still the value every other
      <Image> on the site uses.
    */
    qualities: [75, 90],
  },
};

export default nextConfig;

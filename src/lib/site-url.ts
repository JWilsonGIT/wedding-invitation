import { wedding } from "@/config/wedding";

/**
 * Resolves the canonical site URL for link previews and Open Graph tags.
 *
 * Deliberately forgiving: `new URL()` throws on anything malformed, and a
 * half-filled config value must never be able to break the build. Order of
 * preference — explicit env var, then Vercel's own domain, then the config
 * file, then localhost.
 *
 * The localhost fallback reads PORT rather than assuming 3000, because the
 * dev server does not always get 3000 — `.claude/launch.json` sets
 * `autoPort`, so a second server already holding it means this one is
 * assigned another. Hardcoding 3000 would put the wrong origin in
 * `metadataBase`, and the only symptom is link previews quietly pointing at
 * a port nothing is serving.
 */
function parse(value: string | undefined): URL | null {
  if (!value || value.trim() === "") return null;

  const trimmed = value.trim();
  const candidate = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

export function siteUrl(): URL {
  return (
    parse(process.env.NEXT_PUBLIC_SITE_URL) ??
    parse(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    parse(wedding.site.url) ??
    new URL(`http://localhost:${process.env.PORT ?? 3000}`)
  );
}

import type { SVGProps } from "react";

/**
 * Ordo mark — a single geometric ring, drawn as a monoline "O".
 * Inherits `currentColor`, so it reads correctly on any surface and in dark mode.
 */
export function OrdoMark({
  title = "Ordo",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label={title} fill="none" {...props}>
      <circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="3.25" />
    </svg>
  );
}

import type { ImgHTMLAttributes, JSX } from "react";

/** Compact mark — cobalt tile favicon. */
export const HUMANER_ICON_PATH = "/favicon.svg";
/** Light surfaces that need ink, not cobalt. */
export const HUMANER_ICON_BLACK_PATH = "/brandmark-dark.svg";
/** Cobalt figure on transparent — light chrome and inline marks. */
export const HUMANER_BRANDMARK_PATH = "/brandmark_blue.svg";
/** Square cobalt logo for search, OG, and apple icons. */
export const HUMANER_LOGO_PATH = "/LOGO.png";
/** Raster / search tile (same art as the favicon). */
export const HUMANER_BLUE_ICON_PATH = "/blue_icon.svg";

export const HUMANER_INK = "#0A0D0D";
export const HUMANER_ACCENT = "#e0e1df";

export type BrandMarkTone = "theme" | "light" | "dark" | "nav";

export type BrandMarkProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  /** Kept for call-site compatibility — does not recolor the file. */
  tone?: BrandMarkTone;
  /** Light surfaces: `brandmark_blue.svg`. */
  invert?: boolean;
};

function joinClassNames(
  ...classes: Array<string | undefined | false>
): string | undefined {
  const value = classes.filter(Boolean).join(" ");
  return value || undefined;
}

/** `/favicon.svg` on dark, `/brandmark_blue.svg` on light. */
export function BrandMark({
  src,
  tone: _tone,
  invert = false,
  className,
  alt = "",
  ...props
}: BrandMarkProps): JSX.Element {
  const resolvedSrc =
    src ?? (invert ? HUMANER_BRANDMARK_PATH : HUMANER_ICON_PATH);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={joinClassNames(
        "inline-block shrink-0 object-contain",
        className,
      )}
      {...props}
    />
  );
}

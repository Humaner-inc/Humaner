import type { ImgHTMLAttributes, JSX } from "react";

/** Tab / app icon — cobalt rounded tile. */
export const HUMANER_ICON_PATH = "/favicon.svg";
/** Ink mark for light surfaces and mail. */
export const HUMANER_ICON_BLACK_PATH = "/brandmark-dark.svg";
/** Main brand logo — cobalt figure on transparent. */
export const HUMANER_BRANDMARK_PATH = "/brandmark_blue.svg";

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

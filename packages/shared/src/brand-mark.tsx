import type { ImgHTMLAttributes, JSX } from "react";

/** Compact Humaner mark — footer, collapsed sidebar, dark chrome. */
export const HUMANER_ICON_PATH = "/icon.svg";
/** Cream / light surfaces — same invert as the hero mockup. */
export const HUMANER_ICON_BLACK_PATH = "/icon_black.svg";
/** Full brandmark on dark chrome — emails, widget watermark. */
export const HUMANER_BRANDMARK_PATH = "/brandmark-dark.svg";

export const HUMANER_INK = "#0A0D0D";
export const HUMANER_ACCENT = "#e0e1df";

export type BrandMarkTone = "theme" | "light" | "dark" | "nav";

export type BrandMarkProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  /** Kept for call-site compatibility — does not recolor the file. */
  tone?: BrandMarkTone;
  /** Cream / white surfaces: hero-mockup invert via `icon_black.svg`. */
  invert?: boolean;
};

function joinClassNames(
  ...classes: Array<string | undefined | false>
): string | undefined {
  const value = classes.filter(Boolean).join(" ");
  return value || undefined;
}

/** `/icon.svg` on dark, `/icon_black.svg` on cream (hero invert). */
export function BrandMark({
  src,
  tone: _tone,
  invert = false,
  className,
  alt = "",
  ...props
}: BrandMarkProps): JSX.Element {
  const resolvedSrc =
    src ?? (invert ? HUMANER_ICON_BLACK_PATH : HUMANER_ICON_PATH);

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

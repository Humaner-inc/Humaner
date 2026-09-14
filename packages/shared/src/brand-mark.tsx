import type { ImgHTMLAttributes, JSX } from "react";

/** Compact mark — favicon, dark theme, and icons. */
export const HUMANER_ICON_PATH = "/favicon.svg";
/** Light surfaces and mail — dark ink brandmark. */
export const HUMANER_ICON_BLACK_PATH = "/brandmark-dark.svg";
/** Brandmark on light chrome — light theme. */
export const HUMANER_BRANDMARK_PATH = "/brandmark-dark.svg";
/** Full brand logo. */
export const HUMANER_LOGO_PATH = "/logo-black.png";

export const HUMANER_INK = "#0A0D0D";
export const HUMANER_ACCENT = "#e0e1df";

export type BrandMarkTone = "theme" | "light" | "dark" | "nav";

export type BrandMarkProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  /** Kept for call-site compatibility — does not recolor the file. */
  tone?: BrandMarkTone;
  /** Light / cream surfaces: `brandmark-dark.svg`. */
  invert?: boolean;
};

function joinClassNames(
  ...classes: Array<string | undefined | false>
): string | undefined {
  const value = classes.filter(Boolean).join(" ");
  return value || undefined;
}

/** `/favicon.svg` on dark, `/brandmark-dark.svg` on light. */
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

import type { HTMLAttributes, ReactNode } from "react";

export type BrandSwapProps = HTMLAttributes<HTMLSpanElement> & {
  /** When true, shows the `next` face (mark). When false, shows `rest`. */
  active: boolean;
  rest: ReactNode;
  next: ReactNode;
};

function joinClassNames(
  ...classes: Array<string | undefined | false>
): string | undefined {
  const value = classes.filter(Boolean).join(" ");
  return value || undefined;
}

/**
 * Two-layer brand swap — same blur/scale as the landing navbar wordmark.
 * Toggle `active`; CSS in each app’s globals (`.brand-swap`) runs the motion.
 */
export function BrandSwap({
  active,
  rest,
  next,
  className,
  ...props
}: BrandSwapProps): React.JSX.Element {
  return (
    <span
      className={joinClassNames("brand-swap", className)}
      data-state={active ? "b" : "a"}
      {...props}
    >
      <span className="brand-swap-layer" data-layer="a">
        {rest}
      </span>
      <span className="brand-swap-layer" data-layer="b">
        {next}
      </span>
    </span>
  );
}

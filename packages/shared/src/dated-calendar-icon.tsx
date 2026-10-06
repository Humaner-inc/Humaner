"use client";

import { useEffect, useId, useState } from "react";

type DatedCalendarIconProps = {
  size?: number;
  weight?: "regular" | "fill";
  className?: string;
  "aria-hidden"?: boolean;
};

/** Calendar mark whose face is today's date. Fill knocks the number out of the shape. */
export function DatedCalendarIcon({
  size = 24,
  weight = "regular",
  className,
  "aria-hidden": ariaHidden = true,
}: DatedCalendarIconProps): React.JSX.Element {
  const rawId = useId();
  const maskId = `dated-cal-${rawId.replace(/:/g, "")}`;
  const [day, setDay] = useState<number | null>(null);

  useEffect(() => {
    setDay(new Date().getDate());
  }, []);

  const label = day == null ? "" : String(day);
  const filled = weight === "fill";

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden={ariaHidden}
      fill="none"
    >
      <path
        d="M8 3.15v2.3M16 3.15v2.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {filled ? (
        <>
          <mask id={maskId}>
            <rect width="24" height="24" fill="white" />
            <rect x="3.4" y="8.7" width="17.2" height="1.35" fill="black" />
            {label ? (
              <text
                x="12"
                y="15.35"
                textAnchor="middle"
                dominantBaseline="central"
                fill="black"
                fontSize={label.length > 1 ? "7.4" : "8.6"}
                fontWeight="700"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {label}
              </text>
            ) : null}
          </mask>
          <rect
            x="3.4"
            y="4.9"
            width="17.2"
            height="15.7"
            rx="2.7"
            fill="currentColor"
            mask={`url(#${maskId})`}
          />
        </>
      ) : (
        <>
          <rect
            x="3.4"
            y="4.9"
            width="17.2"
            height="15.7"
            rx="2.7"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M3.4 9.35h17.2" stroke="currentColor" strokeWidth="1.6" />
          {label ? (
            <text
              x="12"
              y="15.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="currentColor"
              fontSize={label.length > 1 ? "7.2" : "8.2"}
              fontWeight="700"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {label}
            </text>
          ) : null}
        </>
      )}
    </svg>
  );
}

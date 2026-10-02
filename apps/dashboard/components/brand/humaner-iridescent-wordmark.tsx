'use client';

import * as React from 'react';

import { HUMANER_NAV_COLORS } from '@/lib/humaner-nav-colors';
import { cn } from '@/lib/utils';

/**
 * Comfortaa Bold “Humaner” outline (font-size 96), generated from
 * `apps/dashboard/public/Comfortaa-Bold.ttf` — same face as the brand
 * wordmark / Humaner.svg lockup.
 */
const HUMANER_PATH =
  'M28 97.98V32.99Q28 30.78 29.44 29.39Q30.88 28 32.99 28Q35.2 28 36.59 29.39Q37.98 30.78 37.98 32.99V60.54H82.53V32.99Q82.53 30.78 83.97 29.39Q85.41 28 87.52 28Q89.63 28 91.02 29.39Q92.42 30.78 92.42 32.99V97.98Q92.42 100.19 91.02 101.58Q89.63 102.98 87.52 102.98Q85.41 102.98 83.97 101.54Q82.53 100.1 82.53 97.98V69.38H37.98V97.98Q37.98 100.1 36.59 101.54Q35.2 102.98 32.99 102.98Q30.88 102.98 29.44 101.54Q28 100.1 28 97.98ZM158.85 55.26V98.08Q158.85 100.19 157.5 101.58Q156.16 102.98 153.95 102.98Q151.84 102.98 150.45 101.58Q149.06 100.19 149.06 98.08V97.02Q145.98 100.1 141.76 101.78Q137.54 103.46 132.74 103.46Q126.11 103.46 120.83 100.58Q115.55 97.7 112.58 92.18Q109.6 86.66 109.6 78.88V55.26Q109.6 53.15 110.99 51.76Q112.38 50.37 114.5 50.37Q116.61 50.37 118 51.76Q119.39 53.15 119.39 55.26V78.88Q119.39 86.66 123.57 90.64Q127.74 94.62 134.66 94.62Q138.69 94.62 142 92.99Q145.31 91.36 147.18 88.58Q149.06 85.79 149.06 82.34V55.26Q149.06 53.06 150.45 51.71Q151.84 50.37 153.95 50.37Q156.16 50.37 157.5 51.71Q158.85 53.06 158.85 55.26ZM249.95 70.72V98.18Q249.95 100.29 248.61 101.68Q247.26 103.07 245.06 103.07Q242.94 103.07 241.55 101.68Q240.16 100.29 240.16 98.18V70.72Q240.16 64.86 237.23 61.84Q234.3 58.82 229.41 58.82Q224.42 58.82 221.2 62.27Q217.98 65.73 217.98 71.1V98.18Q217.98 100.29 216.64 101.68Q215.3 103.07 213.09 103.07Q210.98 103.07 209.58 101.68Q208.19 100.29 208.19 98.18V70.72Q208.19 64.86 205.26 61.84Q202.34 58.82 197.44 58.82Q192.35 58.82 189.14 62.27Q185.92 65.73 185.92 71.1V98.18Q185.92 100.29 184.58 101.68Q183.23 103.07 181.02 103.07Q178.91 103.07 177.52 101.68Q176.13 100.29 176.13 98.18V55.46Q176.13 53.25 177.52 51.9Q178.91 50.56 181.02 50.56Q183.14 50.56 184.48 51.86Q185.82 53.15 185.92 55.26Q188.42 52.77 191.87 51.38Q195.33 49.98 199.36 49.98Q204.26 49.98 208.14 51.95Q212.03 53.92 214.53 57.57Q217.41 54.02 221.73 52Q226.05 49.98 231.33 49.98Q239.68 49.98 244.82 55.46Q249.95 60.93 249.95 70.72ZM316.38 76.77V98.18Q316.38 100.29 314.99 101.68Q313.6 103.07 311.49 103.07Q309.38 103.07 307.98 101.68Q306.59 100.29 306.59 98.18V94.62Q303.23 98.75 298.43 101.06Q293.63 103.36 288.06 103.36Q281.15 103.36 275.54 99.9Q269.92 96.45 266.7 90.35Q263.49 84.26 263.49 76.77Q263.49 69.28 266.94 63.18Q270.4 57.09 276.5 53.58Q282.59 50.08 289.98 50.08Q297.38 50.08 303.38 53.58Q309.38 57.09 312.88 63.18Q316.38 69.28 316.38 76.77ZM306.98 76.77Q306.98 71.68 304.77 67.55Q302.56 63.42 298.67 61.07Q294.78 58.72 289.98 58.72Q285.18 58.72 281.3 61.07Q277.41 63.42 275.15 67.55Q272.9 71.68 272.9 76.77Q272.9 81.86 275.15 85.94Q277.41 90.02 281.3 92.37Q285.18 94.72 289.98 94.72Q294.78 94.72 298.67 92.37Q302.56 90.02 304.77 85.94Q306.98 81.86 306.98 76.77ZM380.22 74.56V98.18Q380.22 100.29 378.83 101.68Q377.44 103.07 375.33 103.07Q373.22 103.07 371.82 101.68Q370.43 100.29 370.43 98.18V74.56Q370.43 66.78 366.26 62.8Q362.08 58.82 355.17 58.82Q351.14 58.82 347.82 60.45Q344.51 62.08 342.64 64.86Q340.77 67.65 340.77 71.1V98.18Q340.77 100.29 339.42 101.68Q338.08 103.07 335.87 103.07Q333.76 103.07 332.37 101.68Q330.98 100.29 330.98 98.18V55.36Q330.98 53.15 332.37 51.81Q333.76 50.46 335.87 50.46Q338.08 50.46 339.42 51.81Q340.77 53.15 340.77 55.36V56.42Q343.84 53.34 348.06 51.66Q352.29 49.98 357.09 49.98Q363.71 49.98 368.99 52.86Q374.27 55.74 377.25 61.26Q380.22 66.78 380.22 74.56ZM439.17 80.13H402.69Q403.74 86.85 408.78 90.98Q413.82 95.1 421.12 95.1Q424 95.1 427.12 94.05Q430.24 92.99 432.26 91.46Q433.6 90.4 435.42 90.4Q437.25 90.4 438.3 91.36Q440.03 92.8 440.03 94.62Q440.03 96.35 438.5 97.5Q435.23 100.1 430.38 101.73Q425.54 103.36 421.12 103.36Q413.25 103.36 407.01 99.95Q400.77 96.54 397.26 90.5Q393.76 84.45 393.76 76.77Q393.76 69.09 397.07 62.99Q400.38 56.9 406.29 53.49Q412.19 50.08 419.68 50.08Q427.07 50.08 432.45 53.34Q437.82 56.61 440.7 62.46Q443.58 68.32 443.58 75.9Q443.58 77.73 442.34 78.93Q441.09 80.13 439.17 80.13ZM402.78 72.45H434.75Q433.89 66.02 429.95 62.18Q426.02 58.34 419.68 58.34Q412.67 58.34 408.3 62.18Q403.94 66.02 402.78 72.45ZM492.64 55.26Q492.64 55.94 492.54 56.22Q491.68 59.3 488.7 59.3Q488.22 59.3 487.26 59.1Q483.42 58.43 481.02 58.43Q474.11 58.43 469.89 61.6Q465.66 64.77 465.66 70.14V98.18Q465.66 100.48 464.46 101.73Q463.26 102.98 460.86 102.98Q458.56 102.98 457.31 101.78Q456.06 100.58 456.06 98.18V55.26Q456.06 52.96 457.31 51.71Q458.56 50.46 460.86 50.46Q465.66 50.46 465.66 55.26V57.09Q468.54 53.73 472.77 51.81Q476.99 49.89 481.79 49.89Q486.88 49.89 489.76 51.42Q492.64 52.96 492.64 55.26Z';

const VIEW_W = 520.64;
const VIEW_H = 131.46;

/** Cream surface — pairs with HUMANER_NAV_COLORS neutrals. */
const HUMANER_CREAM = '#fcf4ec';

/**
 * feComponentTransfer tables (input 0 = black → 1 = white).
 * Remap uses Humaner brand stops only:
 * black → ink → green → blue → yellow → orange → cream → white
 */
function hexChannelTables(hexes: readonly string[]): {
  r: string;
  g: string;
  b: string;
} {
  const channels = hexes.map((hex) => {
    const h = hex.replace('#', '');
    return [
      Number.parseInt(h.slice(0, 2), 16) / 255,
      Number.parseInt(h.slice(2, 4), 16) / 255,
      Number.parseInt(h.slice(4, 6), 16) / 255
    ] as const;
  });
  const fmt = (n: number): string => n.toFixed(4).replace(/\.?0+$/, '');
  return {
    r: channels.map((c) => fmt(c[0])).join(' '),
    g: channels.map((c) => fmt(c[1])).join(' '),
    b: channels.map((c) => fmt(c[2])).join(' ')
  };
}

const BRAND_SPECTRUM = hexChannelTables([
  '#000000',
  HUMANER_NAV_COLORS.foreground,
  HUMANER_NAV_COLORS.success,
  HUMANER_NAV_COLORS.info,
  HUMANER_NAV_COLORS.yellow,
  HUMANER_NAV_COLORS.warning,
  HUMANER_CREAM,
  '#FFFFFF'
] as const);

const TABLE_R = BRAND_SPECTRUM.r;
const TABLE_G = BRAND_SPECTRUM.g;
const TABLE_B = BRAND_SPECTRUM.b;

export type HumanerIridescentWordmarkProps = {
  className?: string;
  /** Accessible name — defaults to “Humaner”. */
  title?: string;
};

/**
 * Pure SVG (no JS animation): recessed grey Comfortaa paths, sliding
 * white–black overlay gradient, then a grain + brand-color remap filter.
 */
export function HumanerIridescentWordmark({
  className,
  title = 'Humaner'
}: HumanerIridescentWordmarkProps): React.JSX.Element {
  const reactId = React.useId().replace(/:/g, '');
  const innerId = `hiw-inner-${reactId}`;
  const shineId = `hiw-shine-${reactId}`;
  const colorId = `hiw-color-${reactId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={title}
      className={cn('h-auto w-full overflow-visible', className)}
    >
      <title>{title}</title>
      <defs>
        {/* 3-layer inner shadow (recessed letterforms) */}
        <filter
          id={innerId}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feOffset
            dx="0"
            dy="1.5"
            in="SourceAlpha"
            result="off1"
          />
          <feGaussianBlur
            stdDeviation="1.2"
            in="off1"
            result="blur1"
          />
          <feComposite
            in="blur1"
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="cut1"
          />
          <feFlood
            floodColor="#000000"
            floodOpacity="0.55"
            result="flood1"
          />
          <feComposite
            in="flood1"
            in2="cut1"
            operator="in"
            result="shadow1"
          />

          <feOffset
            dx="0"
            dy="3.5"
            in="SourceAlpha"
            result="off2"
          />
          <feGaussianBlur
            stdDeviation="2.8"
            in="off2"
            result="blur2"
          />
          <feComposite
            in="blur2"
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="cut2"
          />
          <feFlood
            floodColor="#000000"
            floodOpacity="0.35"
            result="flood2"
          />
          <feComposite
            in="flood2"
            in2="cut2"
            operator="in"
            result="shadow2"
          />

          <feOffset
            dx="0"
            dy="-2"
            in="SourceAlpha"
            result="off3"
          />
          <feGaussianBlur
            stdDeviation="2"
            in="off3"
            result="blur3"
          />
          <feComposite
            in="blur3"
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="cut3"
          />
          <feFlood
            floodColor="#ffffff"
            floodOpacity="0.5"
            result="flood3"
          />
          <feComposite
            in="flood3"
            in2="cut3"
            operator="in"
            result="highlight"
          />

          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shadow1" />
            <feMergeNode in="shadow2" />
            <feMergeNode in="highlight" />
          </feMerge>
        </filter>

        {/* Repeating white–black–white (×2 = 486), −35°, slides 0→486 / 4.4s */}
        <linearGradient
          id={shineId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="486"
          y2="0"
          gradientTransform="rotate(-35)"
        >
          <stop
            offset="0"
            stopColor="#ffffff"
          />
          <stop
            offset="0.25"
            stopColor="#000000"
          />
          <stop
            offset="0.5"
            stopColor="#ffffff"
          />
          <stop
            offset="0.75"
            stopColor="#000000"
          />
          <stop
            offset="1"
            stopColor="#ffffff"
          />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="0 0"
            to="486 0"
            dur="4.4s"
            repeatCount="indefinite"
            additive="sum"
          />
        </linearGradient>

        {/* White backdrop → blur 7.3 → grain (~12%) → brand color remap */}
        <filter
          id={colorId}
          x="-35%"
          y="-55%"
          width="170%"
          height="210%"
          colorInterpolationFilters="sRGB"
        >
          <feFlood
            floodColor="#ffffff"
            result="white"
          />
          <feComposite
            in="SourceGraphic"
            in2="white"
            operator="over"
            result="backed"
          />
          <feGaussianBlur
            in="backed"
            stdDeviation="7.3"
            result="blur"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="4"
            numOctaves="1"
            seed="7"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.12 0"
            result="grain"
          />
          <feBlend
            in="blur"
            in2="grain"
            mode="overlay"
            result="grainy"
          />
          <feComponentTransfer
            in="grainy"
            result="colored"
          >
            <feFuncR
              type="table"
              tableValues={TABLE_R}
            />
            <feFuncG
              type="table"
              tableValues={TABLE_G}
            />
            <feFuncB
              type="table"
              tableValues={TABLE_B}
            />
          </feComponentTransfer>
        </filter>
      </defs>

      <g filter={`url(#${colorId})`}>
        <path
          d={HUMANER_PATH}
          fill="#9D9D9D"
          filter={`url(#${innerId})`}
        />
        <path
          d={HUMANER_PATH}
          fill={`url(#${shineId})`}
          style={{ mixBlendMode: 'overlay' }}
        />
      </g>
    </svg>
  );
}

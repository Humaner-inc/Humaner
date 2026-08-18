/** Screen bounds on `computer_frame.png` (1536×589). */
export const HERO_COMPUTER_FRAME = {
  width: 1536,
  height: 589
} as const;

/** Visible computer bounds inside the frame asset (crops empty canvas padding). */
export const HERO_COMPUTER_CROP = {
  left: 636,
  top: 74,
  width: 501,
  height: 462
} as const;

/** Crop viewport aspect ratio (width / height). */
export const HERO_COMPUTER_VIEWPORT_ASPECT =
  HERO_COMPUTER_CROP.width / HERO_COMPUTER_CROP.height;

/** Full frame positioned inside the crop viewport (percent of viewport). */
export const HERO_COMPUTER_FRAME_LAYOUT = {
  width: `${(HERO_COMPUTER_FRAME.width / HERO_COMPUTER_CROP.width) * 100}%`,
  height: `${(HERO_COMPUTER_FRAME.height / HERO_COMPUTER_CROP.height) * 100}%`,
  left: `${(-HERO_COMPUTER_CROP.left / HERO_COMPUTER_CROP.width) * 100}%`,
  top: `${(-HERO_COMPUTER_CROP.top / HERO_COMPUTER_CROP.height) * 100}%`
} as const;

function pct(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

/**
 * Measured lit-glass AABB (px on the full frame), inset inside the bezel
 * so the brandmark stays on the CRT.
 */
const HERO_COMPUTER_SCREEN_PX = {
  left: 734,
  top: 162,
  width: 232,
  height: 170
} as const;

export const HERO_COMPUTER_SCREEN = {
  top: pct(HERO_COMPUTER_SCREEN_PX.top, HERO_COMPUTER_FRAME.height),
  left: pct(HERO_COMPUTER_SCREEN_PX.left, HERO_COMPUTER_FRAME.width),
  width: pct(HERO_COMPUTER_SCREEN_PX.width, HERO_COMPUTER_FRAME.width),
  height: pct(HERO_COMPUTER_SCREEN_PX.height, HERO_COMPUTER_FRAME.height),
  borderRadius: '9%',
  rotateY: '-7deg',
  rotateX: '0.75deg',
  screenOffsetX: '0%',
  screenOffsetY: '0%'
} as const;

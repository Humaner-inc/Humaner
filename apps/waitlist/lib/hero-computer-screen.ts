/** Screen bounds on `computer_frame.png` (1536×589). */
export const HERO_COMPUTER_FRAME = {
  width: 1536,
  height: 589,
} as const;

/** Visible computer bounds inside the frame asset (crops empty canvas padding). */
export const HERO_COMPUTER_CROP = {
  left: 636,
  top: 74,
  width: 501,
  height: 462,
} as const;

export const HERO_COMPUTER_VIEWPORT_ASPECT =
  HERO_COMPUTER_CROP.width / HERO_COMPUTER_CROP.height;

export const HERO_COMPUTER_FRAME_LAYOUT = {
  width: `${(HERO_COMPUTER_FRAME.width / HERO_COMPUTER_CROP.width) * 100}%`,
  height: `${(HERO_COMPUTER_FRAME.height / HERO_COMPUTER_CROP.height) * 100}%`,
  left: `${(-HERO_COMPUTER_CROP.left / HERO_COMPUTER_CROP.width) * 100}%`,
  top: `${(-HERO_COMPUTER_CROP.top / HERO_COMPUTER_CROP.height) * 100}%`,
} as const;

export const HERO_COMPUTER_SCREEN = {
  top: "26%",
  left: "45.4%",
  width: "20%",
  height: "28.7%",
  borderRadius: "2.4%",
  rotateY: "-7deg",
  rotateX: "0.75deg",
  screenOffsetX: "0%",
  screenOffsetY: "0%",
  logoOffsetX: "0%",
  logoOffsetY: "0%",
} as const;

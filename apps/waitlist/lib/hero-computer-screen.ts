/** Screen bounds on `computer_frame.png` (1536×1024), derived from the lit screen region. */
export const HERO_COMPUTER_FRAME = {
  width: 1536,
  height: 1024,
} as const;

/** Visible computer bounds inside the frame asset (crops empty canvas padding). */
export const HERO_COMPUTER_CROP = {
  left: 637,
  top: 0,
  width: 498,
  height: 712,
} as const;

export const HERO_COMPUTER_CROP_ASPECT =
  HERO_COMPUTER_CROP.width / HERO_COMPUTER_FRAME.height;

export const HERO_COMPUTER_SCREEN = {
  top: "27.55%",
  left: "42.14%",
  width: "25.91%",
  height: "27.25%",
  borderRadius: "2.4%",
  rotateY: "-7deg",
  rotateX: "0.75deg",
  screenOffsetX: "0%",
  screenOffsetY: "0%",
  logoOffsetX: "0%",
  logoOffsetY: "0%",
} as const;

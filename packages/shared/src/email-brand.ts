/** Full-bleed white transactional mail — mark + name, left type, reply footer. */

import { RADIUS_CHIP_PX } from "./radius";

/** Neutrals aligned with dashboard palette (widget surfaces stay separate). */
export const EMAIL_COLORS = {
  foreground: "#0A0D0D",
  background: "#ffffff",
  canvas: "#ffffff",
  border: "#eaeaea",
  muted: "#71717a",
  body: "#3f3f46",
  link: "#001afc",
  button: "#001afc",
} as const;

export const EMAIL_BUTTON_RADIUS_PX = RADIUS_CHIP_PX;

export const EMAIL_BODY_CLASS =
  "m-auto bg-[#ffffff] px-2 font-sans text-[#0A0D0D]";

export const EMAIL_CONTAINER_CLASS =
  "mx-auto my-[40px] max-w-[520px] bg-[#ffffff] px-[40px] py-[48px]";

export const EMAIL_LOGO_SIZE = 20;

export const EMAIL_WORDMARK_CLASS =
  "m-0 p-0 text-[15px] font-medium leading-[20px] text-[#0A0D0D]";

export const EMAIL_BRAND_SECTION_CLASS = "mb-[40px]";

export const EMAIL_TITLE_CLASS =
  "mx-0 mb-[16px] mt-0 p-0 text-left text-[24px] font-semibold leading-[32px] text-[#0A0D0D]";

export const EMAIL_TEXT_CLASS =
  "mx-0 my-[16px] text-left text-[15px] leading-[24px] text-[#3f3f46]";

export const EMAIL_MUTED_CLASS =
  "mx-0 my-[16px] text-left text-[14px] leading-[22px] text-[#71717a]";

export const EMAIL_MUTED_CENTER_CLASS = EMAIL_MUTED_CLASS;

export const EMAIL_LINK_CLASS = "text-[#001afc] no-underline";

export const EMAIL_HR_CLASS =
  "mx-0 my-[32px] w-full border border-solid border-[#eaeaea]";

export const EMAIL_BUTTON_PRIMARY_CLASS =
  "rounded-full bg-[#001afc] px-4 py-2.5 text-center text-[14px] font-medium text-white no-underline";

export const EMAIL_BUTTON_SECTION_CLASS = "my-[28px] text-left";

export const EMAIL_OTP_CLASS =
  "m-0 text-left text-[32px] font-semibold tracking-[8px] text-[#0A0D0D]";

export const EMAIL_OTP_SECTION_CLASS = "my-[24px] text-left";

/** Sign-off above the footer rule — smaller and greyer than the mail body. */
export const EMAIL_SIGNOFF_TEXT_CLASS =
  "m-0 text-left text-[13px] leading-[20px] text-[#a1a1aa]";

export const EMAIL_SIGNOFF_LINK_CLASS = "text-[#a1a1aa] underline";

/** Social line between the two footer rules — same size as the mail body. */
export const EMAIL_SOCIAL_TEXT_CLASS =
  "m-0 text-left text-[15px] leading-[24px] text-[#3f3f46]";

export const EMAIL_SOCIAL_LINK_CLASS = "text-[#001afc] underline";

/** Quiet meta block under the last rule. */
export const EMAIL_META_TEXT_CLASS =
  "m-0 text-left text-[13px] leading-[20px] text-[#a1a1aa]";

export const EMAIL_META_LINK_CLASS = "text-[#a1a1aa] no-underline";

export const EMAIL_FOOTER_TEXT_CLASS = EMAIL_SIGNOFF_TEXT_CLASS;

export const EMAIL_FOOTER_LINK_CLASS = EMAIL_SIGNOFF_LINK_CLASS;

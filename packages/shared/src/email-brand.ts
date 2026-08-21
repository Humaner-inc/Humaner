/** Humaner raw email template — original waitlist / transactional design. */

/** Neutrals aligned with dashboard palette (widget surfaces stay separate). */
export const EMAIL_COLORS = {
  foreground: "#e0e1df",
  background: "#0A0D0D",
  border: "#1c1c1e",
  muted: "#eaeaea",
  canvas: "#0A0D0D",
  link: "#e0e1df",
} as const;

export const EMAIL_BODY_CLASS = "m-auto bg-[#0A0D0D] px-2 font-sans";

export const EMAIL_CONTAINER_CLASS =
  "mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#1c1c1e] bg-[#0A0D0D] p-[20px]";

export const EMAIL_LOGO_SECTION_CLASS = "my-[24px] text-center";

export const EMAIL_TITLE_CLASS =
  "mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-[#e0e1df]";

export const EMAIL_TEXT_CLASS = "text-[14px] leading-[24px] text-[#e0e1df]";

export const EMAIL_MUTED_CLASS = "text-[12px] leading-[24px] text-[#eaeaea]";

export const EMAIL_MUTED_CENTER_CLASS =
  "text-center text-[14px] leading-[24px] text-[#eaeaea]";

export const EMAIL_LINK_CLASS = "text-[#e0e1df] underline";

export const EMAIL_HR_CLASS =
  "mx-0 my-[26px] w-full border border-solid border-[#1c1c1e]";

export const EMAIL_BUTTON_PRIMARY_CLASS =
  "rounded-none bg-[#e0e1df] px-5 py-3 text-center text-[12px] font-semibold text-[#0A0D0D] no-underline";

export const EMAIL_BUTTON_SECTION_CLASS = "my-[32px] text-center";

export const EMAIL_OTP_CLASS =
  "m-0 text-[36px] font-bold tracking-[10px] text-[#e0e1df]";

export const EMAIL_OTP_SECTION_CLASS = "my-[32px] text-center";

export const EMAIL_FOOTER_CONTAINER_CLASS =
  "mx-auto mb-[40px] max-w-[465px] px-[20px]";

export const EMAIL_FOOTER_TEXT_CLASS =
  "m-0 text-[12px] leading-[20px] text-[#eaeaea]";

export const EMAIL_FOOTER_LINK_CLASS = "text-[#eaeaea] underline";

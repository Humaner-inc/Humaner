/** Humaner raw email template — original waitlist / transactional design. */

/** Neutrals aligned with dashboard palette (widget surfaces stay separate). */
export const EMAIL_COLORS = {
  foreground: "#0A0D0D",
  background: "#ffffff",
  border: "#eaeaea",
  muted: "#18181b",
  canvas: "#F2F2F2",
  link: "#2252bc",
} as const;

export const EMAIL_BODY_CLASS =
  "m-auto bg-[#ffffff] px-2 font-sans text-[#0A0D0D]";

export const EMAIL_CONTAINER_CLASS =
  "mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] bg-[#ffffff] p-[20px]";

/** Between the original 110px mark and the 48px cloud pass. */
export const EMAIL_LOGO_SIZE = 80;

export const EMAIL_LOGO_SECTION_CLASS = "my-[24px] text-center";

export const EMAIL_LOGO_CLASS = "mx-auto block";

export const EMAIL_TITLE_CLASS =
  "mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-[#0A0D0D]";

export const EMAIL_TEXT_CLASS = "text-[14px] leading-[24px] text-[#0A0D0D]";

export const EMAIL_MUTED_CLASS = "text-[12px] leading-[24px] text-[#18181b]";

export const EMAIL_MUTED_CENTER_CLASS =
  "text-center text-[14px] leading-[24px] text-[#18181b]";

export const EMAIL_LINK_CLASS = "text-[#2252bc] no-underline";

export const EMAIL_HR_CLASS =
  "mx-0 my-[26px] w-full border border-solid border-[#eaeaea]";

export const EMAIL_BUTTON_PRIMARY_CLASS =
  "rounded-none bg-[#0A0D0D] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline";

export const EMAIL_BUTTON_SECTION_CLASS = "my-[32px] text-center";

export const EMAIL_OTP_CLASS =
  "m-0 text-[36px] font-bold tracking-[10px] text-[#0A0D0D]";

export const EMAIL_OTP_SECTION_CLASS = "my-[32px] text-center";

export const EMAIL_FOOTER_CONTAINER_CLASS =
  "mx-auto mb-[40px] max-w-[465px] px-[20px]";

export const EMAIL_FOOTER_TEXT_CLASS =
  "m-0 text-[12px] leading-[20px] text-[#18181b]";

export const EMAIL_FOOTER_LINK_CLASS = "text-[#18181b] underline";

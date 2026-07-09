/** Humaner raw email template — original waitlist / transactional design. */

export const EMAIL_COLORS = {
  foreground: '#000000',
  background: '#ffffff',
  border: '#eaeaea',
  muted: '#666666',
  link: '#2563eb'
} as const;

export const EMAIL_BODY_CLASS = 'm-auto bg-white px-2 font-sans';

export const EMAIL_CONTAINER_CLASS =
  'mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]';

export const EMAIL_LOGO_SECTION_CLASS = 'my-[24px] text-center';

export const EMAIL_TITLE_CLASS =
  'mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black';

export const EMAIL_TEXT_CLASS = 'text-[14px] leading-[24px] text-black';

export const EMAIL_MUTED_CLASS = 'text-[12px] leading-[24px] text-[#666666]';

export const EMAIL_MUTED_CENTER_CLASS =
  'text-center text-[14px] leading-[24px] text-[#666666]';

export const EMAIL_LINK_CLASS = 'text-blue-600 no-underline';

export const EMAIL_HR_CLASS =
  'mx-0 my-[26px] w-full border border-solid border-[#eaeaea]';

export const EMAIL_BUTTON_PRIMARY_CLASS =
  'rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline';

export const EMAIL_BUTTON_SECTION_CLASS = 'my-[32px] text-center';

export const EMAIL_OTP_CLASS =
  'm-0 text-[36px] font-bold tracking-[10px] text-black';

export const EMAIL_OTP_SECTION_CLASS = 'my-[32px] text-center';

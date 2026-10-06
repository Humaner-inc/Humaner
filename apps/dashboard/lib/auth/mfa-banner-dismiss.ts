// hides the recommendation for 30 days
export const MFA_BANNER_COOKIE = 'humaner.mfa-banner-dismissed';
export const MFA_BANNER_DISMISS_SECONDS = 60 * 60 * 24 * 30;

export function writeMfaBannerDismissCookie(): void {
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${MFA_BANNER_COOKIE}=1; Path=/; Max-Age=${MFA_BANNER_DISMISS_SECONDS}; SameSite=Lax${secure}`;
  } catch {
    // storage disabled
  }
}

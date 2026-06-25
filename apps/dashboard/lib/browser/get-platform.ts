import 'client-only';

export function getPlatform(): string {
  if (typeof window === 'undefined') {
    return 'unknown'; // Handle server-side rendering
  }

  const nav = navigator as Navigator & {
    userAgentData?: {
      platform: string;
    };
  };

  // Check for userAgentData (modern browsers)
  if (nav.userAgentData?.platform) {
    return nav.userAgentData.platform;
  }

  // Fallback to navigator.platform (older browsers)
  if (navigator.platform) {
    // Check for Android specifically
    if (navigator.userAgent && /android/i.test(navigator.userAgent)) {
      return 'android';
    }
    return navigator.platform;
  }

  return 'unknown';
}

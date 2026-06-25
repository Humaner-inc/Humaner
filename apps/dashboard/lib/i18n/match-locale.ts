import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/i18n/locale';

export function matchLocale(locale?: string | null): string {
  if (!locale) {
    return DEFAULT_LOCALE;
  }

  if (SUPPORTED_LOCALES.includes(locale)) {
    return locale;
  }

  for (const supportedLocale of SUPPORTED_LOCALES) {
    const alpha2Code = supportedLocale.substring(0, 2);
    if (locale.toLocaleLowerCase().startsWith(alpha2Code.toLocaleLowerCase())) {
      return supportedLocale;
    }
  }

  console.warn(`Requested unsupported locale "${locale}"`);

  return DEFAULT_LOCALE;
}

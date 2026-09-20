import { resolveIanaTimeZone } from '@/lib/calendar/parse-calendar-when';

export const COMPANION_TIME_ZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland'
] as const;

export type TimeZoneLocation = {
  timeZone: string;
  lat: number;
  lng: number;
  countryIso: string;
  city: string;
};

/** Polar angle (radians from +Y) for a geodetic latitude. */
export function globePolarAngle(lat: number): number {
  return ((90 - lat) * Math.PI) / 180;
}

/** Loose enough for London (51.5°N) and Auckland (36.9°S). */
export const GLOBE_MIN_POLAR_ANGLE = 0.35;
export const GLOBE_MAX_POLAR_ANGLE = Math.PI - 0.35;

const TIME_ZONE_LOCATIONS: Record<
  string,
  Omit<TimeZoneLocation, 'timeZone'>
> = {
  UTC: { lat: 51.48, lng: 0, countryIso: 'GBR', city: 'UTC' },
  'Europe/London': {
    lat: 51.51,
    lng: -0.13,
    countryIso: 'GBR',
    city: 'London'
  },
  'Europe/Paris': { lat: 48.86, lng: 2.35, countryIso: 'FRA', city: 'Paris' },
  'Europe/Berlin': {
    lat: 52.52,
    lng: 13.4,
    countryIso: 'DEU',
    city: 'Berlin'
  },
  'Europe/Madrid': { lat: 40.42, lng: -3.7, countryIso: 'ESP', city: 'Madrid' },
  'America/New_York': {
    lat: 40.71,
    lng: -74.01,
    countryIso: 'USA',
    city: 'New York'
  },
  'America/Chicago': {
    lat: 41.88,
    lng: -87.63,
    countryIso: 'USA',
    city: 'Chicago'
  },
  'America/Denver': {
    lat: 39.74,
    lng: -104.99,
    countryIso: 'USA',
    city: 'Denver'
  },
  'America/Los_Angeles': {
    lat: 34.05,
    lng: -118.24,
    countryIso: 'USA',
    city: 'Los Angeles'
  },
  'America/Sao_Paulo': {
    lat: -23.55,
    lng: -46.63,
    countryIso: 'BRA',
    city: 'São Paulo'
  },
  'Africa/Lagos': { lat: 6.45, lng: 3.4, countryIso: 'NGA', city: 'Lagos' },
  'Asia/Dubai': { lat: 25.2, lng: 55.27, countryIso: 'ARE', city: 'Dubai' },
  'Asia/Kolkata': {
    lat: 22.57,
    lng: 88.36,
    countryIso: 'IND',
    city: 'Kolkata'
  },
  'Asia/Singapore': {
    lat: 1.35,
    lng: 103.82,
    countryIso: 'SGP',
    city: 'Singapore'
  },
  'Asia/Tokyo': { lat: 35.68, lng: 139.69, countryIso: 'JPN', city: 'Tokyo' },
  'Australia/Sydney': {
    lat: -33.87,
    lng: 151.21,
    countryIso: 'AUS',
    city: 'Sydney'
  },
  'Pacific/Auckland': {
    lat: -36.85,
    lng: 174.76,
    countryIso: 'NZL',
    city: 'Auckland'
  },
  'Europe/Amsterdam': {
    lat: 52.37,
    lng: 4.9,
    countryIso: 'NLD',
    city: 'Amsterdam'
  },
  'Europe/Rome': { lat: 41.9, lng: 12.5, countryIso: 'ITA', city: 'Rome' },
  'Europe/Zurich': { lat: 47.38, lng: 8.54, countryIso: 'CHE', city: 'Zurich' },
  'Europe/Dublin': {
    lat: 53.35,
    lng: -6.26,
    countryIso: 'IRL',
    city: 'Dublin'
  },
  'America/Toronto': {
    lat: 43.65,
    lng: -79.38,
    countryIso: 'CAN',
    city: 'Toronto'
  },
  'America/Vancouver': {
    lat: 49.28,
    lng: -123.12,
    countryIso: 'CAN',
    city: 'Vancouver'
  },
  'America/Phoenix': {
    lat: 33.45,
    lng: -112.07,
    countryIso: 'USA',
    city: 'Phoenix'
  },
  'America/Mexico_City': {
    lat: 19.43,
    lng: -99.13,
    countryIso: 'MEX',
    city: 'Mexico City'
  },
  'Asia/Shanghai': {
    lat: 31.23,
    lng: 121.47,
    countryIso: 'CHN',
    city: 'Shanghai'
  },
  'Asia/Hong_Kong': {
    lat: 22.32,
    lng: 114.17,
    countryIso: 'HKG',
    city: 'Hong Kong'
  },
  'Asia/Seoul': { lat: 37.57, lng: 126.98, countryIso: 'KOR', city: 'Seoul' },
  'Australia/Melbourne': {
    lat: -37.81,
    lng: 144.96,
    countryIso: 'AUS',
    city: 'Melbourne'
  }
};

function fallbackLocation(
  timeZone: string
): Omit<TimeZoneLocation, 'timeZone'> {
  const city = timeZone.split('/').pop()?.replaceAll('_', ' ') ?? timeZone;
  if (timeZone.startsWith('America/')) {
    return { lat: 39, lng: -98, countryIso: 'USA', city };
  }
  if (timeZone.startsWith('Europe/')) {
    return { lat: 50, lng: 10, countryIso: '', city };
  }
  if (timeZone.startsWith('Asia/')) {
    return { lat: 30, lng: 100, countryIso: '', city };
  }
  if (timeZone.startsWith('Africa/')) {
    return { lat: 5, lng: 20, countryIso: '', city };
  }
  if (timeZone.startsWith('Australia/')) {
    return { lat: -25, lng: 134, countryIso: 'AUS', city };
  }
  if (timeZone.startsWith('Pacific/')) {
    return { lat: -20, lng: 170, countryIso: '', city };
  }
  return { lat: 20, lng: 0, countryIso: '', city };
}

export function timeZoneLocation(
  timeZone?: string | null
): TimeZoneLocation | null {
  const resolved = resolveIanaTimeZone(timeZone);
  if (!resolved) {
    return null;
  }
  const known = TIME_ZONE_LOCATIONS[resolved];
  return {
    timeZone: resolved,
    ...(known ?? fallbackLocation(resolved))
  };
}

const COMMON_TIME_ZONES = new Set<string>(COMPANION_TIME_ZONES);

export function timeZoneSelectOptions(current?: string | null): string[] {
  const resolved = resolveIanaTimeZone(current);
  if (resolved && !COMMON_TIME_ZONES.has(resolved)) {
    return [resolved, ...COMPANION_TIME_ZONES];
  }
  return [...COMPANION_TIME_ZONES];
}

export function formatTimeZoneLabel(
  timeZone: string,
  now = new Date()
): string {
  const city = timeZone.split('/').pop()?.replaceAll('_', ' ') ?? timeZone;
  try {
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset'
    })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value;
    return offset ? `${city} (${offset})` : city;
  } catch {
    return city;
  }
}

export function resolveCompanionTimeZone(
  stored?: string | null,
  browser?: string | null
): string | undefined {
  return (
    resolveIanaTimeZone(stored) ?? resolveIanaTimeZone(browser) ?? undefined
  );
}

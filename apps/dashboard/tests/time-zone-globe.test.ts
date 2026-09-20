import { describe, expect, it } from 'vitest';

import {
  COMPANION_TIME_ZONES,
  GLOBE_MAX_POLAR_ANGLE,
  GLOBE_MIN_POLAR_ANGLE,
  globePolarAngle,
  timeZoneLocation
} from '@/lib/calendar/time-zones';

describe('timezone globe locations', () => {
  it('maps each companion zone to the city it names', () => {
    expect(timeZoneLocation('Europe/London')).toMatchObject({
      city: 'London',
      lat: 51.51,
      lng: -0.13,
      countryIso: 'GBR'
    });
    expect(timeZoneLocation('America/New_York')).toMatchObject({
      city: 'New York',
      lat: 40.71,
      lng: -74.01
    });
    expect(timeZoneLocation('Pacific/Auckland')).toMatchObject({
      city: 'Auckland',
      lat: -36.85,
      lng: 174.76
    });
  });

  it('keeps every mapped city inside the globe camera tilt range', () => {
    const zones = [
      ...COMPANION_TIME_ZONES,
      'Europe/Amsterdam',
      'Europe/Rome',
      'America/Toronto',
      'Asia/Shanghai',
      'Australia/Melbourne'
    ];
    for (const zone of zones) {
      const location = timeZoneLocation(zone);
      expect(location, zone).not.toBeNull();
      const polar = globePolarAngle(location!.lat);
      expect(polar).toBeGreaterThanOrEqual(GLOBE_MIN_POLAR_ANGLE);
      expect(polar).toBeLessThanOrEqual(GLOBE_MAX_POLAR_ANGLE);
    }
  });
});

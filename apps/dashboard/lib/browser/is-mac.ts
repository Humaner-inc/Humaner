import 'client-only';

import { getPlatform } from '@/lib/browser/get-platform';

export function isMac(): boolean {
  return /mac/.test(getPlatform());
}

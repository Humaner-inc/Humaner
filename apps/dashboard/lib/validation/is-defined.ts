import type { Maybe } from '@/types/maybe';

export type IsDefinedGuard<T> = Exclude<T, undefined | null>;

export function isDefined<T>(val: Maybe<T>): val is IsDefinedGuard<T> {
  return (
    typeof val !== 'undefined' &&
    val !== undefined &&
    val !== null &&
    val !== Infinity
  );
}

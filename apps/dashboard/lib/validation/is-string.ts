export function isString<T>(obj: T): boolean {
  return (
    obj !== null &&
    typeof obj !== 'undefined' &&
    Object.prototype.toString.call(obj) === '[object String]'
  );
}

import 'server-only';

import { compare, hash } from 'bcryptjs';

export function hashPassword(password: string): Promise<string> {
  return hash(password, 13);
}

export function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

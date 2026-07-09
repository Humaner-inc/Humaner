import type { HandoffRoutedTo } from '@prisma/client';

import type { DeskRoutedTo } from '@/lib/desk/types';

export function toDeskRoutedTo(
  value: HandoffRoutedTo | null | undefined
): DeskRoutedTo | null {
  if (value === 'AI') return 'ai';
  if (value === 'HUMAN') return 'human';
  return null;
}

export function toPrismaRoutedTo(value: DeskRoutedTo): HandoffRoutedTo {
  return value === 'ai' ? 'AI' : 'HUMAN';
}

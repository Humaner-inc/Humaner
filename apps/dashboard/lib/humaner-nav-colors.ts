export const HUMANER_NAV_COLORS = {
  info: '#0b00d1',
  warning: '#f85919',
  success: '#226342',
  destructive: '#aa1f18',
  yellow: '#e6b325',
  foreground: '#0A0D0D',
  brand: '#e0e1df'
} as const;

export type HumanerNavColor =
  (typeof HUMANER_NAV_COLORS)[keyof typeof HUMANER_NAV_COLORS];

import 'client-only';

export function isDialogOpen(): boolean {
  return !!document.querySelector('[role="dialog"]');
}

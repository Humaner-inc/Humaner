export function mailThreadStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case 'OPEN':
      return 'Open';
    case 'PENDING':
      return 'In progress';
    case 'RESOLVED':
      return 'Done';
    case 'SNOOZED':
      return 'Snoozed';
    default:
      return status;
  }
}

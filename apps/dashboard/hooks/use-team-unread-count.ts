import * as React from 'react';

import {
  countUnreadTeamActivity,
  readTeamLastSeenAt,
  writeTeamLastSeenAt,
  type TeamUnreadItem,
  type TeamUnreadNote
} from '@/lib/team/team-unread';

export function useTeamUnreadCount(input: {
  userId: string;
  userName: string;
  messages: TeamUnreadItem[];
  notes: TeamUnreadNote[];
  teamDockOpen: boolean;
}): number {
  const [lastSeenAt, setLastSeenAt] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setLastSeenAt(readTeamLastSeenAt(input.userId));
    setReady(true);
  }, [input.userId]);

  React.useEffect(() => {
    if (!ready || !input.teamDockOpen) return;
    const seenAt = new Date().toISOString();
    writeTeamLastSeenAt(input.userId, seenAt);
    setLastSeenAt(seenAt);
  }, [input.teamDockOpen, input.userId, ready, input.messages, input.notes]);

  if (!ready) return 0;

  return countUnreadTeamActivity({
    userId: input.userId,
    userName: input.userName,
    lastSeenAt,
    messages: input.messages,
    notes: input.notes
  });
}

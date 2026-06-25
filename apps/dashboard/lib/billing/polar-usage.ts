import 'server-only';

import { polarServer } from '@/lib/billing/polar-server';

export type MessageUsage = {
  consumed: number;
  credited: number;
  balance: number;
};

export async function getMessageUsage(
  polarCustomerId: string
): Promise<MessageUsage | null> {
  try {
    const state = await polarServer.customers.getState({ id: polarCustomerId });
    const messageMeter = state.activeMeters.find((meter) =>
      meter.meterId.toLowerCase().includes('message')
    );

    if (!messageMeter) {
      return null;
    }

    return {
      consumed: messageMeter.consumedUnits,
      credited: messageMeter.creditedUnits,
      balance: messageMeter.balance
    };
  } catch (error) {
    console.error('Failed to load Polar customer state', error);
    return null;
  }
}

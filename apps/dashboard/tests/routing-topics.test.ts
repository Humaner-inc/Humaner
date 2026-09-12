import { describe, expect, it } from 'vitest';

import {
  expandRoutingTopics,
  inferRoutingTopics
} from '@/lib/team/routing-topics';

describe('expandRoutingTopics', () => {
  it('maps Stripe, GitHub, and Linear onto profile skills', () => {
    expect(expandRoutingTopics(['Stripe', 'github'])).toEqual(
      expect.arrayContaining(['stripe', 'billing', 'github', 'devops'])
    );
    expect(expandRoutingTopics(['linear'])).toEqual(
      expect.arrayContaining(['linear', 'product'])
    );
  });

  it('ignores blank tokens', () => {
    expect(expandRoutingTopics(['', ' inbox '])).toEqual(
      expect.arrayContaining(['inbox', 'mail', 'support'])
    );
  });
});

describe('inferRoutingTopics', () => {
  it('maps Stripe, GitHub, and Linear senders onto profile skills', () => {
    expect(
      inferRoutingTopics({ fromAddress: 'receipts@invoice.stripe.com' })
    ).toEqual(expect.arrayContaining(['stripe', 'billing']));
    expect(
      inferRoutingTopics({ fromAddress: 'notifications@github.com' })
    ).toEqual(expect.arrayContaining(['github', 'devops']));
    expect(inferRoutingTopics({ fromAddress: 'noreply@linear.app' })).toEqual(
      expect.arrayContaining(['linear'])
    );
  });

  it('maps subject keywords when the sender is generic', () => {
    expect(
      inferRoutingTopics({
        subject: 'Payment failed on subscription',
        fromAddress: 'ada@example.com'
      })
    ).toEqual(expect.arrayContaining(['stripe', 'billing']));
  });

  it('stays empty for ordinary inbox mail so callers can default to inbox', () => {
    expect(
      inferRoutingTopics({
        subject: 'Can we meet Thursday?',
        fromAddress: 'ada@example.com'
      })
    ).toEqual([]);
  });
});

import {
  CLASSIC_FRONTIER_BETA_CAPABILITIES,
  formatOveragePerMessage,
  formatPlanAgents,
  formatPlanIncludedMessages,
  FRONTIER_PLAN_COMING_SOON,
  getEffectivePlan,
  getHumanerPricingCardFeatures,
  getPlanCapabilities,
  getPlanForTier,
  isClassicFrontierBetaActive,
  isFrontierPlanPurchasable,
  isOperatorOwnedQuotaPlan,
  PAID_CLOUD_TRIAL_DAYS,
  PLAN_CAPABILITIES,
  PRICING_PLANS
} from '@humaner/shared/plans';
import { PRICING_FEATURE_CATEGORIES } from '@humaner/shared/pricing-feature-categories';
import { CLASSIC_VOLUME_STEPS } from '@humaner/shared/pricing-volume';
import { describe, expect, it } from 'vitest';

describe('Public catalog — Self-Host, Custom, Humaner', () => {
  it('keeps Frontier off the public ladder while Humaner is the hosted plan', () => {
    expect(isFrontierPlanPurchasable()).toBe(!FRONTIER_PLAN_COMING_SOON);
    expect(getPlanForTier('byo').name).toBe('Custom');
    expect(getPlanForTier('byo').priceMonthly).toBe(30);
    expect(getPlanForTier('byo').members).toBe(2);
    expect(getPlanForTier('byo').mailboxAliases).toBe(1);
    expect(getPlanForTier('classic').name).toBe('Humaner');
    expect(getPlanForTier('classic').priceMonthly).toBe(70);
    expect(getPlanForTier('classic').members).toBe(3);
    expect(getPlanForTier('classic').mailboxAliases).toBe(3);
    expect(getPlanForTier('classic').includedMessages).toBe(1_000);
    expect(CLASSIC_VOLUME_STEPS).toEqual([1_000, 3_000, 10_000]);
    expect(getPlanForTier('classic').overagePerMessage).toBe(0.03);
    expect(PAID_CLOUD_TRIAL_DAYS).toBe(3);
    expect(PRICING_PLANS.map((plan) => plan.name)).toEqual([
      'Self-Host',
      'Humaner',
      'Custom'
    ]);
    expect(getEffectivePlan('classic', 10_000).members).toBe(5);
    expect(getEffectivePlan('classic', 10_000).mailboxAliases).toBe(5);
    expect(getEffectivePlan('classic', 10_000).priceMonthly).toBe(400);
  });

  it('gives Humaner the hosted matrix and Custom API access', () => {
    expect(PLAN_CAPABILITIES.classic.agentDesk).toBe(true);
    expect(PLAN_CAPABILITIES.classic.liveChat).toBe(true);
    expect(PLAN_CAPABILITIES.classic.apiAccess).toBe(true);
    expect(PLAN_CAPABILITIES.classic.copilot).toBe(true);
    expect(PLAN_CAPABILITIES.classic.autoTraining).toBe(true);
    expect(PLAN_CAPABILITIES.classic.hostedAgent).toBe(true);
    expect(PLAN_CAPABILITIES.classic.memory).toBe('cross-session');
    expect(PLAN_CAPABILITIES.byo.apiAccess).toBe(true);
    expect(PLAN_CAPABILITIES.byo.agentDesk).toBe(true);
    expect(PLAN_CAPABILITIES.byo.hostedAgent).toBe(false);
    expect(PLAN_CAPABILITIES.byo.liveChat).toBe(false);
    expect(PLAN_CAPABILITIES.byo.copilot).toBe(false);
    expect(formatOveragePerMessage(0.03)).toBe('$0.03');
  });

  it('lists full Humaner pricing card features without a delta header pattern', () => {
    const labels = getHumanerPricingCardFeatures().map(
      (feature) => feature.label
    );
    expect(labels).toContain('Hybrid RAG');
    expect(labels).toContain('Humaner Agents');
    expect(labels).toContain('Live chat');
    expect(labels).not.toContain('Everything in Custom');
  });

  it('hides Custom agents and usage like Self-Host and names Helpdesk', () => {
    const byo = getPlanForTier('byo');
    const selfHost = PRICING_PLANS[0]!;
    expect(formatPlanAgents(selfHost)).toBe('-');
    expect(formatPlanAgents(byo)).toBe('-');
    expect(formatPlanIncludedMessages(selfHost)).toBe('-');
    expect(formatPlanIncludedMessages(byo)).toBe('-');
    expect(isOperatorOwnedQuotaPlan(byo)).toBe(true);
    expect(byo.features.some((feature) => feature.label === 'Helpdesk')).toBe(
      true
    );
    expect(
      PRICING_FEATURE_CATEGORIES.some((category) =>
        category.rows.some(
          (row) => row.label === 'Desks' && row.values.byo === 'Helpdesk'
        )
      )
    ).toBe(true);
    expect(
      PRICING_FEATURE_CATEGORIES.some((category) =>
        category.rows.some(
          (row) => row.label === 'Async solving' && row.values.byo === 'API'
        )
      )
    ).toBe(true);
    expect(
      PRICING_FEATURE_CATEGORIES.some((category) =>
        category.rows.some(
          (row) => row.label === 'Widget embed' && row.values.byo === false
        )
      )
    ).toBe(true);
  });

  it('does not overlay Classic with beta features unless Coming Soon is on', () => {
    const optedIn = getPlanCapabilities('classic', {
      frontierBetaEnabled: true
    });
    const optedOut = getPlanCapabilities('classic', {
      frontierBetaEnabled: false
    });

    if (FRONTIER_PLAN_COMING_SOON) {
      expect(isClassicFrontierBetaActive(true)).toBe(true);
      expect(isClassicFrontierBetaActive(false)).toBe(false);
      expect(optedIn).toEqual(CLASSIC_FRONTIER_BETA_CAPABILITIES);
      expect(optedOut).toEqual(PLAN_CAPABILITIES.classic);
    } else {
      expect(isClassicFrontierBetaActive(true)).toBe(false);
      expect(optedIn).toEqual(PLAN_CAPABILITIES.classic);
      expect(optedOut).toEqual(PLAN_CAPABILITIES.classic);
    }

    expect(getPlanCapabilities('frontier').agentDesk).toBe(true);
    expect(getPlanCapabilities('frontier').memory).toBe('cross-session');
  });
});

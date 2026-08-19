import {
  CLASSIC_FRONTIER_BETA_CAPABILITIES,
  FRONTIER_PLAN_COMING_SOON,
  getPlanCapabilities,
  getPlanForTier,
  isClassicFrontierBetaActive,
  isFrontierPlanPurchasable,
  PLAN_CAPABILITIES
} from '@humaner/shared/plans';
import { describe, expect, it } from 'vitest';

describe('Frontier Coming Soon switch', () => {
  it('matches isFrontierPlanPurchasable to the compile-time flag', () => {
    expect(isFrontierPlanPurchasable()).toBe(!FRONTIER_PLAN_COMING_SOON);
  });

  it('keeps the paid Classic matrix (no watermark, no Agent Desk)', () => {
    expect(PLAN_CAPABILITIES.classic.agentDesk).toBe(false);
    expect(PLAN_CAPABILITIES.classic.liveChat).toBe(false);
    expect(PLAN_CAPABILITIES.classic.autoTraining).toBe(false);
    expect(PLAN_CAPABILITIES.classic.memory).toBe('session');
    expect(PLAN_CAPABILITIES.classic.removeWatermark).toBe(false);
    expect(PLAN_CAPABILITIES.classic.apiAccess).toBe(false);
    expect(getPlanForTier('classic').agents).toBe(3);
    expect(getPlanForTier('classic').members).toBe(2);
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
      expect(optedIn.removeWatermark).toBe(false);
      expect(optedIn.apiAccess).toBe(false);
    } else {
      expect(isClassicFrontierBetaActive(true)).toBe(false);
      expect(optedIn).toEqual(PLAN_CAPABILITIES.classic);
      expect(optedOut).toEqual(PLAN_CAPABILITIES.classic);
    }

    expect(getPlanCapabilities('frontier').agentDesk).toBe(true);
    expect(getPlanCapabilities('frontier').memory).toBe('cross-session');
  });

  it('does not treat Frontier Beta as the Frontier plan', () => {
    expect(CLASSIC_FRONTIER_BETA_CAPABILITIES).not.toEqual(
      PLAN_CAPABILITIES.frontier
    );
    expect(CLASSIC_FRONTIER_BETA_CAPABILITIES.removeWatermark).toBe(false);
    expect(CLASSIC_FRONTIER_BETA_CAPABILITIES.apiAccess).toBe(false);
    expect(CLASSIC_FRONTIER_BETA_CAPABILITIES.contentGaps).toBe(false);
    expect(CLASSIC_FRONTIER_BETA_CAPABILITIES.liveData).toBe(false);
    expect(PLAN_CAPABILITIES.frontier.removeWatermark).toBe(true);
    expect(PLAN_CAPABILITIES.frontier.apiAccess).toBe(true);
    expect(PLAN_CAPABILITIES.frontier.contentGaps).toBe(true);
  });
});

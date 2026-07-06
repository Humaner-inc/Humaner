'use client';

import { useEffect, useRef, useState } from 'react';

import { BrandStoriesSection } from '@/components/brand-stories-section';
import { WaitlistHeroSection } from '@/components/hero/waitlist-hero-section';
import { WaitlistHeader } from '@/components/waitlist-header';
import {
  BranchTrunk,
  TRUNK_START_Y,
  useBranchScrollTimeline
} from '@/components/ui/branch-timeline';

type FormState = 'idle' | 'loading' | 'success' | 'error';

const NODE_COUNT = 5;
const STEP_COUNT = 4;
const TRUNK_GAP_BELOW_DESCRIPTION = 12;

export function WaitlistPage(): React.JSX.Element {
  const timelineRef = useRef<HTMLDivElement>(null);
  const trunkAnchorRef = useRef<HTMLParagraphElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const [trunkOriginY, setTrunkOriginY] = useState(0);
  const [lightTrackPx, setLightTrackPx] = useState(0);

  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const timeline = useBranchScrollTimeline({
    nodeCount: NODE_COUNT,
    stepCount: STEP_COUNT,
    stepRefs,
    timelineRef,
    ctaRef,
    trunkOriginY,
    scrollDrivenFill: true
  });

  useEffect(() => {
    const updateTrunkLayout = (): void => {
      const container = timelineRef.current;
      const anchor = trunkAnchorRef.current;
      const hero = document.getElementById('hero');
      if (!container || !anchor) return;

      const containerTop = container.getBoundingClientRect().top;
      const anchorBottom = anchor.getBoundingClientRect().bottom;
      const originY = Math.max(
        0,
        anchorBottom - containerTop + TRUNK_GAP_BELOW_DESCRIPTION
      );
      setTrunkOriginY(originY);

      if (hero) {
        const heroBottom = hero.getBoundingClientRect().bottom;
        setLightTrackPx(
          Math.max(0, heroBottom - containerTop - originY - TRUNK_START_Y)
        );
      }
    };

    updateTrunkLayout();
    window.addEventListener('scroll', updateTrunkLayout, { passive: true });
    window.addEventListener('resize', updateTrunkLayout);

    return () => {
      window.removeEventListener('scroll', updateTrunkLayout);
      window.removeEventListener('resize', updateTrunkLayout);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormState('error');
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setFormState('success');
    } catch {
      setFormState('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  const trunkFillPx = timeline.trunkFillPx;
  const trunkTrackPx = timeline.trunkTrackPx;
  const trunkExtentPx = timeline.trunkExtentPx;
  const activeIndex = timeline.activeIndex;
  const branchProgressValues =
    timeline.branchProgress ?? Array.from({ length: NODE_COUNT }, () => 0);
  const nodeFillValues =
    timeline.nodeFillProgress ?? Array.from({ length: NODE_COUNT }, () => 0);
  const rootNodeFill =
    trunkFillPx > 0 && trunkExtentPx > 0 ? Math.min(1, trunkFillPx / 16) : 0;

  return (
    <div className="relative">
      <WaitlistHeader />

      <div ref={timelineRef} className="relative">
        <BranchTrunk
          trunkTrackPx={trunkTrackPx}
          trunkFillPx={trunkFillPx}
          trunkExtentPx={trunkExtentPx}
          rootNodeFill={rootNodeFill}
          rootActive={activeIndex === 0}
          tone="light"
          lightTrackPx={lightTrackPx}
          trunkOriginY={trunkOriginY}
        />

        <WaitlistHeroSection trunkAnchorRef={trunkAnchorRef} />

        <BrandStoriesSection
          email={email}
          formState={formState}
          errorMessage={errorMessage}
          onEmailChange={setEmail}
          onSubmit={handleSubmit}
          stepRefs={stepRefs}
          ctaRef={ctaRef}
          activeIndex={activeIndex}
          branchProgressValues={branchProgressValues}
          nodeFillValues={nodeFillValues}
        />
      </div>
    </div>
  );
}

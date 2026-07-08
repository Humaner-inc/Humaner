'use client';

import { forwardRef, type ReactNode, type RefObject } from 'react';

import { BranchConnector } from '@/components/ui/branch-timeline';
import { WaitlistEmailForm, type FormState } from '@/components/waitlist-email-form';
import { WaitlistCtaReveal } from '@/components/waitlist-cta-reveal';
import { WaitlistFeaturePillars } from '@/components/waitlist-support-pillars';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

const STAGES = ['past', 'present', 'frontier', 'future', 'access'] as const;

type BrandStoriesSectionProps = {
  email: string;
  formState: FormState;
  errorMessage: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  stepRefs: RefObject<(HTMLElement | null)[]>;
  ctaRef: RefObject<HTMLDivElement | null>;
  activeIndex: number;
  branchProgressValues: number[];
  nodeFillValues: number[];
};

export function BrandStoriesSection({
  email,
  formState,
  errorMessage,
  onEmailChange,
  onSubmit,
  stepRefs,
  ctaRef,
  activeIndex,
  branchProgressValues,
  nodeFillValues
}: BrandStoriesSectionProps): React.JSX.Element {
  const ctaInView = useInView(ctaRef, { threshold: 0.25 });

  const ctaIndex = STAGES.length - 1;
  const ctaActive = activeIndex === ctaIndex;
  const ctaPassed = activeIndex >= ctaIndex;

  const beat = (index: number) => ({
    active: activeIndex === index,
    visible: activeIndex >= index,
    branchProgress: branchProgressValues[index] ?? 0,
    nodeFillProgress: nodeFillValues[index] ?? 0
  });

  const setStepRef = (index: number) => (element: HTMLElement | null) => {
    const steps = stepRefs.current;
    if (!steps) return;
    steps[index] = element;
  };

  return (
    <section id="story" className="relative bg-foreground pt-24 sm:pt-32">
      <div className="relative mx-auto max-w-6xl px-6 pb-24 sm:pb-32">
        <StoryBeat
          ref={setStepRef(0)}
          stage={STAGES[0]}
          {...beat(0)}
          headline="There was a time when asking support to a company meant something."
          subline="Now every company puts AI in front and threat support as a cost center."
        />

        <StoryBeat
          ref={setStepRef(1)}
          stage={STAGES[1]}
          {...beat(1)}
          headline="Scaling indifference instead of care, facing churn instead of growth."
        />

        <StoryBeat
          ref={setStepRef(2)}
          stage={STAGES[2]}
          {...beat(2)}
          headline="Humaner is the frontier between automation and human care."
        />

        <StoryBeat
          ref={setStepRef(3)}
          stage={STAGES[3]}
          {...beat(3)}
          headline="Redefining customer support."
        >
          <div className="mx-auto mt-12 w-full max-w-5xl sm:mt-14">
            <WaitlistFeaturePillars active={beat(3).active} />
          </div>
        </StoryBeat>

        <StoryCtaEnd
          ctaRef={ctaRef}
          active={ctaActive}
          passed={ctaPassed}
          branchProgress={branchProgressValues[ctaIndex] ?? 0}
          nodeFillProgress={nodeFillValues[ctaIndex] ?? 0}
          ctaInView={ctaInView}
          email={email}
          formState={formState}
          errorMessage={errorMessage}
          onEmailChange={onEmailChange}
          onSubmit={onSubmit}
        />
      </div>
    </section>
  );
}

type StoryBeatProps = {
  stage: string;
  active: boolean;
  visible: boolean;
  branchProgress: number;
  nodeFillProgress: number;
  headline: string;
  subline?: string;
  children?: ReactNode;
};

const StoryBeat = forwardRef<HTMLElement, StoryBeatProps>(function StoryBeat(
  {
    stage,
    active,
    visible,
    branchProgress,
    nodeFillProgress,
    headline,
    subline,
    children
  },
  ref
) {
  return (
    <article
      ref={ref}
      className="relative flex min-h-[70vh] scroll-mt-28 items-center justify-center py-16 sm:min-h-[80vh] sm:py-20 lg:pl-20"
    >
      <BranchConnector
        active={active}
        passed={!active && visible}
        branchProgress={branchProgress}
        nodeFillProgress={visible && !active ? 1 : nodeFillProgress}
        label={stage}
        tone="dark"
      />

      <div
        className={cn(
          'mx-auto w-full max-w-4xl px-2 text-center transition-all duration-700 ease-out sm:px-4',
          visible
            ? 'translate-y-0 opacity-100 blur-0'
            : 'translate-y-8 opacity-0 blur-[6px]'
        )}
      >
        <p
          className={cn(
            'font-display text-[1.75rem] font-semibold leading-[1.25] tracking-tight sm:text-4xl sm:leading-[1.22] lg:text-[2.65rem] lg:leading-[1.2]',
            active ? 'story-sentence' : 'story-sentence--muted'
          )}
        >
          {headline}
        </p>

        {subline ? (
          <p className="mx-auto mt-6 max-w-4xl text-sm leading-relaxed text-white/55 sm:mt-8 sm:text-base sm:leading-relaxed sm:whitespace-nowrap">
            {subline}
          </p>
        ) : null}

        {children}
      </div>
    </article>
  );
});

const StoryCtaEnd = function StoryCtaEnd({
  ctaRef,
  active,
  passed,
  branchProgress,
  nodeFillProgress,
  email,
  formState,
  errorMessage,
  onEmailChange,
  onSubmit,
  ctaInView
}: {
  ctaRef: RefObject<HTMLDivElement | null>;
  active: boolean;
  passed: boolean;
  branchProgress: number;
  nodeFillProgress: number;
  email: string;
  formState: FormState;
  errorMessage: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  ctaInView: boolean;
}): React.JSX.Element {
  const joinOpen = active || passed || ctaInView;

  return (
    <article className="relative scroll-mt-28 pb-16 sm:pb-20">
      <div ref={ctaRef} className="relative px-2 sm:px-4 lg:pl-20">
        <BranchConnector
          active={active || ctaInView}
          passed={passed}
          branchProgress={branchProgress}
          nodeFillProgress={passed ? 1 : nodeFillProgress}
          label={STAGES[4]}
          tone="dark"
        />

        <WaitlistCtaReveal open={joinOpen} formState={formState} className="pt-7 sm:pt-8">
          <WaitlistEmailForm
            email={email}
            formState={formState}
            errorMessage={errorMessage}
            onEmailChange={onEmailChange}
            onSubmit={onSubmit}
          />
        </WaitlistCtaReveal>
      </div>
    </article>
  );
};

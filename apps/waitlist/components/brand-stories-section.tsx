'use client';

import { forwardRef, type RefObject } from 'react';

import { BranchConnector } from '@/components/ui/branch-timeline';
import { WaitlistEmailForm, type FormState } from '@/components/waitlist-email-form';
import { WaitlistCtaReveal } from '@/components/waitlist-cta-reveal';
import { useInView } from '@/hooks/use-in-view';
import { waitlistCardFadeMaskStyle, WAITLIST_CARD_RADIUS } from '@/lib/waitlist-card-fade';
import { cn } from '@/lib/utils';

const PROBLEM_STAGE = 'Define';
const VALUES_STAGE = 'Believe';
const CTA_STAGE = 'Join';

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

  const problemActive = activeIndex === 0;
  const problemPassed = activeIndex > 0;
  const problemVisible = problemActive || problemPassed;

  const valuesIndex = 1;
  const valuesActive = activeIndex === valuesIndex;
  const valuesPassed = activeIndex > valuesIndex;
  const valuesVisible = valuesActive || valuesPassed;

  const ctaIndex = 2;
  const ctaBranchProgress = branchProgressValues[ctaIndex] ?? 0;
  const ctaNodeFill = nodeFillValues[ctaIndex] ?? 0;
  const ctaActive = activeIndex === ctaIndex;
  const ctaPassed = activeIndex >= ctaIndex;

  return (
    <section id="story" className="relative bg-foreground pt-24 sm:pt-32">
      <div className="relative mx-auto max-w-6xl px-6 pb-24 sm:pb-32">
        <ProblemBlock
          ref={(element) => {
            const steps = stepRefs.current;
            if (!steps) return;
            steps[0] = element;
          }}
          active={problemActive}
          visible={problemVisible}
          branchProgress={branchProgressValues[0] ?? 0}
          nodeFillProgress={nodeFillValues[0] ?? 0}
        />

        <ValuesCoreBlock
          ref={(element) => {
            const steps = stepRefs.current;
            if (!steps) return;
            steps[1] = element;
          }}
          active={valuesActive}
          visible={valuesVisible}
          branchProgress={branchProgressValues[valuesIndex] ?? 0}
          nodeFillProgress={nodeFillValues[valuesIndex] ?? 0}
        />

        <StoryCtaEnd
          ctaRef={ctaRef}
          active={ctaActive}
          passed={ctaPassed}
          branchProgress={ctaBranchProgress}
          nodeFillProgress={ctaNodeFill}
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
  active: boolean;
  visible: boolean;
  branchProgress: number;
  nodeFillProgress: number;
};

const ProblemBlock = forwardRef<HTMLElement, StoryBeatProps>(
  function ProblemBlock({ active, visible, branchProgress, nodeFillProgress }, ref) {
    return (
      <article
        ref={ref}
        className="relative flex min-h-[70vh] scroll-mt-28 items-center justify-center py-12 sm:min-h-[80vh] sm:py-16 lg:pl-20"
      >
        <BranchConnector
          active={active}
          passed={!active && visible}
          branchProgress={branchProgress}
          nodeFillProgress={visible && !active ? 1 : nodeFillProgress}
          label={PROBLEM_STAGE}
          tone="dark"
        />

        <div
          className={cn(
            'mx-auto w-full max-w-3xl px-2 text-center transition-all duration-700 ease-out sm:px-4',
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
            There was a time when asking support to a company meant something.
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:mt-8 sm:text-lg sm:leading-relaxed">
            Now every companies put AI in front and threat support as a cost center while keeping customers issues unsolved.
            <br /> Scaling indifference instead of care, facing churn instead of growth.
          </p>
        </div>
      </article>
    );
  }
);

/**
 * One bottom-faded card — same width and typographic hierarchy as the
 * problem beat above: story-sentence title at the top, subline below.
 */
const ValuesCoreBlock = forwardRef<HTMLElement, StoryBeatProps>(
  function ValuesCoreBlock({ active, visible, branchProgress, nodeFillProgress }, ref) {
    return (
      <article
        ref={ref}
        className="relative flex min-h-[70vh] scroll-mt-28 items-center justify-center py-12 sm:min-h-[80vh] sm:py-16 lg:pl-20"
      >
        <BranchConnector
          active={active}
          passed={!active && visible}
          branchProgress={branchProgress}
          nodeFillProgress={visible && !active ? 1 : nodeFillProgress}
          label={VALUES_STAGE}
          tone="dark"
        />

        <div
          className={cn(
            'mx-auto w-full max-w-3xl px-2 text-center transition-all duration-700 ease-out sm:px-4',
            visible
              ? 'translate-y-0 opacity-100 blur-0'
              : 'translate-y-8 opacity-0 blur-[6px]'
          )}
        >
          <div
            className={cn(
              'relative transition-opacity duration-500',
              !active && visible && 'opacity-55'
            )}
          >
            <div className="relative" style={waitlistCardFadeMaskStyle}>
              <div
                className="overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#141414] via-[#101010] to-[#070607] shadow-[0_24px_60px_-32px_rgb(0_0_0_/_0.5)]"
                style={{ borderRadius: WAITLIST_CARD_RADIUS }}
              >
                <div className="flex min-h-[19rem] flex-col sm:min-h-[21rem]">
                  <div className="px-6 py-10 sm:px-10 sm:py-12">
                    <p
                      className={cn(
                        'font-display text-[1.75rem] font-semibold leading-[1.25] tracking-tight sm:text-4xl sm:leading-[1.22] lg:text-[2.65rem] lg:leading-[1.2]',
                        active ? 'story-sentence' : 'story-sentence--muted'
                      )}
                    >
                      Humaner is the frontier between automation and human care.
                    </p>

                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:mt-8 sm:text-lg sm:leading-relaxed">
                      Redefining how customer support should work in the age of AI.
                      <br />
                      Something that gets remembered.
                    </p>
                  </div>

                  {/* Empty runway — the mask fade dissolves here, not through the copy */}
                  <div aria-hidden className="min-h-[6rem] flex-1 sm:min-h-[7rem]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }
);

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
          label={CTA_STAGE}
          tone="dark"
        />

        <WaitlistCtaReveal open={joinOpen} className="pt-7 sm:pt-8">
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

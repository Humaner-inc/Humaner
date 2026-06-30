'use client';

import { forwardRef, useRef } from 'react';

import {
  BranchConnector,
  BranchTrunk,
  MobileBranchProgress,
  useBranchScrollTimeline
} from '@/components/ui/branch-timeline';
import { WaitlistEmailForm, type FormState } from '@/components/waitlist-email-form';
import { WaitlistCtaReveal } from '@/components/waitlist-cta-reveal';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

type BrandStory = {
  id: string;
  stage: string;
  sentence: string;
};

const CTA_STAGE = 'Join';
const NODE_COUNT = 6;
const STEP_COUNT = 5;

const stories: BrandStory[] = [
  {
    id: 'think',
    stage: 'Think',
    sentence: 'Nobody likes talking to a bot.'
  },
  {
    id: 'init',
    stage: 'Init',
    sentence: 'Your brand has a voice. Your support should too.'
  },
  {
    id: 'embed',
    stage: 'Embed',
    sentence: 'Built for developers. Designed for customers.'
  },
  {
    id: 'connect',
    stage: 'Connect',
    sentence: 'Real conversations — not scripted replies.'
  },
  {
    id: 'learn',
    stage: 'Learn',
    sentence: 'Support that feels human, and leaves customers remembered.'
  }
];

type BrandStoriesSectionProps = {
  email: string;
  formState: FormState;
  errorMessage: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function BrandStoriesSection({
  email,
  formState,
  errorMessage,
  onEmailChange,
  onSubmit
}: BrandStoriesSectionProps): React.JSX.Element {
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const timeline = useBranchScrollTimeline({
    nodeCount: NODE_COUNT,
    stepCount: STEP_COUNT,
    stepRefs,
    timelineRef,
    ctaRef
  });

  const ctaInView = useInView(ctaRef, { threshold: 0.25 });

  const trunkFillPx = timeline.trunkFillPx;
  const trunkTrackPx = timeline.trunkTrackPx;
  const trunkExtentPx = timeline.trunkExtentPx;
  const activeIndex = timeline.activeIndex;
  const branchProgressValues =
    timeline.branchProgress ?? Array.from({ length: NODE_COUNT }, () => 0);
  const nodeFillValues =
    timeline.nodeFillProgress ?? Array.from({ length: NODE_COUNT }, () => 0);
  const ctaIndex = stories.length;
  const ctaBranchProgress = branchProgressValues[ctaIndex] ?? 0;
  const ctaNodeFill = nodeFillValues[ctaIndex] ?? 0;
  const ctaActive = activeIndex === ctaIndex;
  const ctaPassed = activeIndex >= ctaIndex;
  const rootNodeFill =
    trunkExtentPx > 0 ? Math.min(1, trunkFillPx / 16) : 0;

  return (
    <section id="story" className="relative bg-foreground pt-24 sm:pt-32">
      <div ref={timelineRef} className="relative">
        <BranchTrunk
          trunkTrackPx={trunkTrackPx}
          trunkFillPx={trunkFillPx}
          trunkExtentPx={trunkExtentPx}
          rootNodeFill={rootNodeFill}
          rootActive={activeIndex === 0}
        />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 sm:pb-32">
          <MobileBranchProgress
            labels={[...stories.map((s) => s.stage), CTA_STAGE]}
            activeIndex={activeIndex}
            nodeFillValues={nodeFillValues}
            className="lg:hidden"
          />

          <div className="relative flex min-h-[50vh] items-center justify-center lg:pl-20">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="section-headline story-sentence">
                Nobody likes talking to agents.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/55">
                Except when they feel human.
              </p>
            </div>
          </div>

          <div className="relative mt-8 lg:mt-12">
            {stories.map((story, index) => (
              <StoryBlock
                key={story.id}
                ref={(element) => {
                  stepRefs.current[index] = element;
                }}
                story={story}
                active={activeIndex === index}
                passed={index < activeIndex}
                branchProgress={branchProgressValues[index] ?? 0}
                nodeFillProgress={nodeFillValues[index] ?? 0}
                isLast={index === stories.length - 1}
              />
            ))}
          </div>

          <StoryCtaEnd
            ref={ctaRef}
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
      </div>
    </section>
  );
}

type StoryBlockProps = {
  story: BrandStory;
  active: boolean;
  passed: boolean;
  branchProgress: number;
  nodeFillProgress: number;
  isLast: boolean;
};

const StoryBlock = forwardRef<HTMLElement, StoryBlockProps>(function StoryBlock(
  { story, active, passed, branchProgress, nodeFillProgress, isLast },
  ref
) {
  const visible = active || passed;

  return (
    <article
      ref={ref}
      className={cn(
        'relative flex min-h-[65vh] scroll-mt-28 items-center justify-center sm:min-h-[72vh] lg:pl-20',
        !isLast && 'pb-8 sm:pb-12',
        isLast && 'pb-4 sm:pb-6'
      )}
    >
      <BranchConnector
        active={active}
        passed={passed}
        branchProgress={branchProgress}
        nodeFillProgress={passed ? 1 : nodeFillProgress}
        label={story.stage}
        tone="dark"
      />

      <p className="absolute left-6 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 lg:hidden">
        {story.stage}
      </p>

      <div
        className={cn(
          'mx-auto w-full max-w-4xl px-2 text-center transition-all duration-700 ease-out sm:px-4',
          visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-6 opacity-0'
        )}
      >
        <p
          className={cn(
            'font-display text-[1.75rem] font-semibold leading-[1.25] tracking-tight sm:text-4xl sm:leading-[1.22] lg:text-5xl lg:leading-[1.2]',
            active ? 'story-sentence' : 'story-sentence--muted'
          )}
        >
          {story.sentence}
        </p>
      </div>
    </article>
  );
});

const StoryCtaEnd = forwardRef<
  HTMLDivElement,
  {
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
  }
>(function StoryCtaEnd(
  {
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
  },
  ref
) {
  const joinOpen = active || passed || ctaInView;

  return (
    <article className="relative scroll-mt-28 pb-16 sm:pb-20">
      <div ref={ref} className="relative px-2 sm:px-4 lg:pl-20">
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

          <p className="mt-5 text-center text-sm leading-relaxed text-white/40">
            Redefining how customer support should work in the AI era.
          </p>
        </WaitlistCtaReveal>
      </div>
    </article>
  );
});

'use client';

import { forwardRef, type RefObject } from 'react';

import {
  BranchConnector
} from '@/components/ui/branch-timeline';
import { WaitlistEmailForm, type FormState } from '@/components/waitlist-email-form';
import { WaitlistCtaReveal } from '@/components/waitlist-cta-reveal';
import { WaitlistSupportPillars } from '@/components/waitlist-support-pillars';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

type BrandStory = {
  id: string;
  stage: string;
  sentence: string;
  tagline: string;
};

const CTA_STAGE = 'Join';

const stories: BrandStory[] = [
  {
    id: 'think',
    stage: 'Think',
    sentence: 'Your brand has a voice,',
    tagline: ' But your support doesn\'t.'
  },
  {
    id: 'init',
    stage: 'Init',
    sentence: 'Customer support is misunderstood.',
    tagline: 'It\'s one of the strongest growth engines a business can invest in.'
  },
  {
    id: 'embed',
    stage: 'Commit',
    sentence: 'AI shouldn\'t replace human support.',
    tagline: 'It should strengthen it.'
  },
  {
    id: 'learn',
    stage: 'Push',
    sentence: '',
    tagline: ''
  }
];

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

  const ctaIndex = stories.length;
  const ctaBranchProgress = branchProgressValues[ctaIndex] ?? 0;
  const ctaNodeFill = nodeFillValues[ctaIndex] ?? 0;
  const ctaActive = activeIndex === ctaIndex;
  const ctaPassed = activeIndex >= ctaIndex;

  return (
    <section id="story" className="relative bg-foreground pt-24 sm:pt-32">
      <div className="relative mx-auto max-w-6xl px-6 pb-24 sm:pb-32">
        <div className="relative flex min-h-[50vh] items-center justify-center lg:pl-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="section-headline story-sentence">
              Nobody likes talking to agents.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/55">
              Except if they feel human.
            </p>
          </div>
        </div>

        <div className="relative mt-8 lg:mt-12">
          {stories.map((story, index) => (
            <StoryBlock
              key={story.id}
              ref={(element) => {
                const steps = stepRefs.current;
                if (!steps) return;
                steps[index] = element;
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
        'relative flex scroll-mt-28 items-center justify-center lg:pl-20',
        isLast
          ? 'min-h-[80vh] py-8 sm:min-h-[85vh] sm:py-10'
          : 'min-h-[65vh] sm:min-h-[72vh]',
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

      {isLast ? (
        <WaitlistSupportPillars active={active} visible={visible} />
      ) : (
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
              'font-display text-[1.75rem] font-semibold leading-[1.25] tracking-tight sm:text-4xl sm:leading-[1.22] lg:text-5xl lg:leading-[1.2]',
              active ? 'story-sentence' : 'story-sentence--muted'
            )}
          >
            {story.sentence}
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/55">
            {story.tagline}
          </p>
        </div>
      )}
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

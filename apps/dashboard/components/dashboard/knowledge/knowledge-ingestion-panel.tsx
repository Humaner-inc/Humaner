'use client';

import * as React from 'react';
import { CheckIcon, FileTextIcon } from '@humaner/shared/icons';
import { AnimatePresence, motion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { SkillzCubeLoader } from '@/components/ui/skillz-cube-loader';

export type KnowledgeIngestionPhase = 'loading' | 'success';

export const MIN_INGESTION_LOADING_MS = 3000;
export const MAX_INGESTION_LOADING_MS = 10000;
export const INGESTION_SUCCESS_HOLD_MS = 4000;

export function randomIngestionLoadingDelayMs(): number {
  return (
    MIN_INGESTION_LOADING_MS +
    Math.floor(
      Math.random() * (MAX_INGESTION_LOADING_MS - MIN_INGESTION_LOADING_MS + 1)
    )
  );
}

type KnowledgeIngestionPanelProps = {
  phase: KnowledgeIngestionPhase;
  agentName?: string;
  onDone?: () => void;
};

export function KnowledgeIngestionPanel({
  phase,
  agentName,
  onDone
}: KnowledgeIngestionPanelProps): React.JSX.Element {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center overflow-hidden py-4"
      role="status"
      aria-live="polite"
      aria-label={
        phase === 'success' ? 'Resources available' : 'Loading resources'
      }
    >
      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {phase === 'loading' ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex w-full flex-col items-center gap-4 px-2"
          >
            <SkillzCubeLoader size={48} />
            <div className="text-center">
              <p className="font-display text-2xl font-medium text-foreground">
                Loading resources
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                We&apos;re indexing your knowledge. That won&apos;t take long.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex w-full flex-col items-center gap-4 px-2"
          >
            <div className="relative flex size-14 items-center justify-center">
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="absolute inset-0 rounded-full bg-emerald-500/10"
              />
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 22,
                  delay: 0.05
                }}
                className="relative flex items-center justify-center"
              >
                <FileTextIcon
                  className="size-7 text-foreground/80"
                  aria-hidden
                />
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 20,
                    delay: 0.12
                  }}
                  className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                >
                  <CheckIcon
                    className="size-3"
                    aria-hidden
                  />
                </motion.span>
              </motion.span>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-medium text-foreground">
                Resources available
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Your knowledge is ready to be used
                {agentName ? (
                  <>
                    {' '}
                    by{' '}
                    <span className="font-medium text-foreground">
                      {agentName}
                    </span>
                  </>
                ) : null}
                .
              </p>
              {onDone ? (
                <Button
                  type="button"
                  className="mt-4"
                  onClick={onDone}
                >
                  Done
                </Button>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

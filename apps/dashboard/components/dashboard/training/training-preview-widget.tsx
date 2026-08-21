'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';

type TrainingMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'typing' | 'complete' | 'evaluating';
  score?: {
    accuracy: number;
    persona: number;
    helpfulness: number;
    hallucination: number;
    passed: boolean;
    escalated?: boolean;
    notes?: string;
  };
};

type TrainingPreviewWidgetProps = {
  agentName: string;
  accentColor: string;
  messages: TrainingMessage[];
  currentQuestion: number;
  totalQuestions: number;
  isTraining: boolean;
};

function TypingIndicator({ color }: { color: string }): React.JSX.Element {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="size-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
}

function ScoreBadge({
  score,
  passed
}: {
  score: TrainingMessage['score'];
  passed: boolean;
}): React.JSX.Element | null {
  if (!score) return null;

  const label = score.escalated
    ? passed
      ? '↗ Escalated · Right call'
      : '↗ Escalated · Should have answered'
    : passed
      ? '✓ Passed'
      : '✗ Failed';

  // Surface whichever dimension actually decided the verdict — accuracy and
  // helpfulness alone can look "fine" while persona or hallucination is what
  // tipped it, which otherwise reads as an arbitrary call.
  const hasHallucination = score.hallucination > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mt-2 flex flex-col gap-1 rounded-lg px-2 py-1 text-[10px] ${
        passed
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          Acc: {score.accuracy}% | Persona: {score.persona}% | Help:{' '}
          {score.helpfulness}%
          {hasHallucination && ` | Hallucination: ${score.hallucination}%`}
        </span>
      </div>
      {score.notes && (
        <span className="italic text-muted-foreground/80">
          &ldquo;{score.notes}&rdquo;
        </span>
      )}
    </motion.div>
  );
}

export function TrainingPreviewWidget({
  agentName,
  accentColor,
  messages,
  currentQuestion,
  totalQuestions,
  isTraining
}: TrainingPreviewWidgetProps): React.JSX.Element {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className="flex h-[500px] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
      <header
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: accentColor }}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {agentName}
          </p>
          <p className="truncate text-xs text-white/80">Training Mode</p>
        </div>
        {isTraining && (
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-2 py-1">
            <motion.div
              className="size-2 rounded-full bg-white"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-medium">
              {currentQuestion}/{totalQuestions}
            </span>
          </div>
        )}
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={
                message.role === 'user'
                  ? 'flex justify-end'
                  : 'flex justify-start'
              }
            >
              <div className="max-w-[85%]">
                <div
                  className={
                    message.role === 'user'
                      ? 'rounded-2xl rounded-br-sm px-3.5 py-2 text-sm text-[#0A0D0D] dark:text-[#f2f2f2]'
                      : 'rounded-2xl rounded-bl-sm bg-background px-3.5 py-2 text-sm shadow-sm ring-1 ring-border'
                  }
                  style={
                    message.role === 'user'
                      ? { backgroundColor: accentColor }
                      : undefined
                  }
                >
                  {message.status === 'typing' ? (
                    <TypingIndicator
                      color={message.role === 'user' ? '#0A0D0D' : accentColor}
                    />
                  ) : message.status === 'evaluating' ? (
                    <div className="space-y-2">
                      {message.content ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : null}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear'
                          }}
                          className="size-3 rounded-full border-2 border-current border-t-transparent"
                        />
                        <span className="text-xs">Evaluating…</span>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === 'assistant' &&
                  message.status === 'complete' &&
                  message.score && (
                    <ScoreBadge
                      score={message.score}
                      passed={message.score.passed}
                    />
                  )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t bg-background p-3">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {isTraining ? (
            <span>Simulating customer questions...</span>
          ) : (
            <span>Ready to train</span>
          )}
        </div>
      </div>
    </div>
  );
}

export type { TrainingMessage };

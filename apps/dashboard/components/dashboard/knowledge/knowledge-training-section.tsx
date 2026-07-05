'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  AgentAccuracyCard,
  TrainAgentPanel,
  TrainingInsightsPanel,
  type TrainingModelInfo,
  type TrainingQuotaInfo
} from '@/components/dashboard/training/training-workspace';
import {
  TrainingPreviewWidget,
  type TrainingMessage
} from '@/components/dashboard/training/training-preview-widget';
import { runTrainingStream } from '@/lib/training/run-training-stream';

import type { IndustryType } from '@prisma/client';
import type { TrainingProgressEvent } from '@/lib/training/training-progress';

type KnowledgeGapItem = {
  id: string;
  question: string;
};

type TrainingRunItem = {
  id: string;
  accuracyAvg: number;
  passed: number;
  totalQuestions: number;
  createdAt: string;
};

type QuestionCount = 5 | 10 | 25 | 50;

export type KnowledgeTrainingSectionProps = {
  agent: {
    id: string;
    name: string;
    accentColor: string;
    industry: IndustryType;
    role: string;
  };
  industryLabel: string;
  industryDescription: string;
  trainingTopics: string[];
  suggestedTopics: string[];
  healthScore: number | null;
  lastTrainedAt: string | null;
  latestRun: {
    accuracyAvg: number;
    personaAvg: number;
    helpfulnessAvg: number;
    hallucinationCount: number;
    passed: number;
    totalQuestions: number;
  } | null;
  trainingHistory: TrainingRunItem[];
  gaps: KnowledgeGapItem[];
  organizationName: string;
  modelInfo: TrainingModelInfo;
  quota: TrainingQuotaInfo;
};

function applyTrainingEvent(
  event: TrainingProgressEvent,
  setPreviewMessages: React.Dispatch<React.SetStateAction<TrainingMessage[]>>,
  setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>,
  setTotalQuestions: React.Dispatch<React.SetStateAction<number>>
): void {
  switch (event.type) {
    case 'started':
      setCurrentQuestion(0);
      setTotalQuestions(event.totalQuestions);
      setPreviewMessages([
        {
          id: 'starting',
          role: 'assistant',
          content: 'Generating customer questions for your focus topics…',
          status: 'complete'
        }
      ]);
      break;

    case 'question':
      setCurrentQuestion(event.index);
      setTotalQuestions(event.total);
      setPreviewMessages((prev) => {
        const withoutStarting = prev.filter((message) => message.id !== 'starting');
        return [
          ...withoutStarting,
          {
            id: `q-${event.index}`,
            role: 'user',
            content: event.question,
            status: 'complete'
          },
          {
            id: `a-${event.index}`,
            role: 'assistant',
            content: '',
            status: 'typing'
          }
        ];
      });
      break;

    case 'answer':
      setPreviewMessages((prev) =>
        prev.map((message) =>
          message.id === `a-${event.index}`
            ? { ...message, content: event.response, status: 'evaluating' }
            : message
        )
      );
      break;

    case 'evaluated':
      setPreviewMessages((prev) =>
        prev.map((message) =>
          message.id === `a-${event.index}`
            ? {
                ...message,
                content: event.response,
                status: 'complete',
                score: {
                  accuracy: event.score.accuracy,
                  persona: event.score.persona,
                  helpfulness: event.score.helpfulness,
                  hallucination: event.score.hallucination,
                  passed: event.score.passed,
                  escalated: event.score.escalated,
                  notes: event.score.notes
                }
              }
            : message
        )
      );
      break;

    case 'complete':
    case 'error':
    case 'typing':
    case 'evaluating':
      break;
  }
}

export function KnowledgeTrainingSection({
  agent,
  industryLabel,
  industryDescription,
  trainingTopics,
  suggestedTopics,
  healthScore,
  lastTrainedAt,
  latestRun,
  trainingHistory,
  gaps,
  organizationName,
  modelInfo,
  quota
}: KnowledgeTrainingSectionProps): React.JSX.Element {
  const router = useRouter();
  const [isTraining, setIsTraining] = React.useState(false);
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [totalQuestions, setTotalQuestions] = React.useState(0);
  const [previewMessages, setPreviewMessages] = React.useState<TrainingMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm ${agent.name}. Run a simulation to watch me answer customer questions.`,
      status: 'complete'
    }
  ]);

  const handleRunTraining = React.useCallback(
    async (questionCount: QuestionCount): Promise<void> => {
      setIsTraining(true);

      try {
        let completed: Extract<TrainingProgressEvent, { type: 'complete' }> | null =
          null;

        await runTrainingStream({
          agentId: agent.id,
          questionCount,
          onEvent: (event) => {
            if (event.type === 'complete') {
              completed = event;
              return;
            }

            if (event.type === 'error') {
              throw new Error(event.message);
            }

            applyTrainingEvent(
              event,
              setPreviewMessages,
              setCurrentQuestion,
              setTotalQuestions
            );
          }
        });

        if (!completed) {
          throw new Error('Training ended before completion');
        }

        const { result } = completed as Extract<
          TrainingProgressEvent,
          { type: 'complete' }
        >;
        toast.success(
          `${agent.name}: ${result.healthScore}/100 (${result.passed}/${result.totalQuestions} passed)`
        );
        setPreviewMessages((prev) => [
          ...prev,
          {
            id: 'complete',
            role: 'assistant',
            content: `Simulation complete — ${result.healthScore}/100 accuracy (${result.passed}/${result.totalQuestions} passed). Review gaps in the accuracy panel.`,
            status: 'complete'
          }
        ]);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Training failed unexpectedly'
        );
        setPreviewMessages([
          {
            id: 'error',
            role: 'assistant',
            content:
              error instanceof Error
                ? error.message
                : 'Training failed unexpectedly',
            status: 'complete'
          }
        ]);
      } finally {
        setIsTraining(false);
        setCurrentQuestion(0);
        setTotalQuestions(0);
      }
    },
    [agent.id, agent.name, router]
  );

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1 space-y-4">
        <AgentAccuracyCard
          score={healthScore}
          lastTrainedAt={lastTrainedAt}
          latestRun={latestRun}
          gaps={gaps}
        />

        <TrainAgentPanel
          isTraining={isTraining}
          onRunTraining={handleRunTraining}
          modelInfo={modelInfo}
          quota={quota}
        />

        <TrainingInsightsPanel
          agentId={agent.id}
          organizationName={organizationName}
          industryLabel={industryLabel}
          industryDescription={industryDescription}
          initialTopics={trainingTopics}
          suggestedTopics={suggestedTopics}
          trainingHistory={trainingHistory}
        />
      </div>

      <div className="w-full shrink-0 xl:sticky xl:top-6 xl:w-[360px]">
        <TrainingPreviewWidget
          agentName={agent.name}
          accentColor={agent.accentColor}
          messages={previewMessages}
          currentQuestion={currentQuestion}
          totalQuestions={totalQuestions}
          isTraining={isTraining}
        />
      </div>
    </div>
  );
}

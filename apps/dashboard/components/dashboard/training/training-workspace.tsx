'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { CircleAlert, Plus, X } from '@humaner/shared/icons';
import { toast } from 'sonner';

import { updateTrainingTopics } from '@/actions/training/update-training-topics';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const QUESTION_COUNT_OPTIONS = [5, 25, 50, 100] as const;
type QuestionCount = (typeof QUESTION_COUNT_OPTIONS)[number];

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

type AgentAccuracyCardProps = {
  score: number | null;
  lastTrainedAt: string | null;
  latestRun: {
    accuracyAvg: number;
    personaAvg: number;
    helpfulnessAvg: number;
    hallucinationCount: number;
    passed: number;
    totalQuestions: number;
  } | null;
  gaps: KnowledgeGapItem[];
};

export function AgentAccuracyCard({
  score,
  lastTrainedAt,
  latestRun,
  gaps
}: AgentAccuracyCardProps): React.JSX.Element {
  const displayScore = score ?? latestRun?.accuracyAvg ?? 0;

  const scoreTone =
    displayScore >= 90
      ? 'text-emerald-600'
      : displayScore >= 70
        ? 'text-amber-600'
        : 'text-red-600';

  const barTone =
    displayScore >= 90
      ? 'bg-emerald-500'
      : displayScore >= 70
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Agent accuracy</CardTitle>
        <CardDescription>
          {lastTrainedAt
            ? `Last run ${formatDistanceToNow(new Date(lastTrainedAt), { addSuffix: true })}`
            : 'Run a simulation to measure how well your agent answers niche questions.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={`font-display text-5xl leading-none ${scoreTone}`}>
              {Math.round(displayScore)}
              <span className="ml-1 text-lg text-muted-foreground">/ 100</span>
            </p>
            {latestRun && (
              <p className="mt-2 text-sm text-muted-foreground">
                {latestRun.passed}/{latestRun.totalQuestions} questions passed
              </p>
            )}
          </div>
          {latestRun && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-xs text-muted-foreground">
              <span>Persona {Math.round(latestRun.personaAvg)}%</span>
              <span>Helpful {Math.round(latestRun.helpfulnessAvg)}%</span>
              <span>
                Hallucinations{' '}
                {latestRun.hallucinationCount === 0
                  ? 'none'
                  : latestRun.hallucinationCount}
              </span>
            </div>
          )}
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all ${barTone}`}
            style={{ width: `${Math.min(100, Math.max(0, displayScore))}%` }}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Knowledge gaps</p>
            <span className="text-xs text-muted-foreground">{gaps.length} open</span>
          </div>
          {gaps.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
              No gaps yet. Failed answers from training will appear here.
            </p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {gaps.map((gap) => (
                <li
                  key={gap.id}
                  className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                >
                  {gap.question}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type TrainAgentPanelProps = {
  isTraining: boolean;
  onRunTraining: (questionCount: QuestionCount) => Promise<void>;
};

export function TrainAgentPanel({
  isTraining,
  onRunTraining
}: TrainAgentPanelProps): React.JSX.Element {
  const [isPending, startTransition] = React.useTransition();
  const [questionCount, setQuestionCount] = React.useState<QuestionCount>(25);

  const handleTrain = (): void => {
    startTransition(async () => {
      await onRunTraining(questionCount);
    });
  };

  const busy = isPending || isTraining;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Run simulation</CardTitle>
        <CardDescription>
          Test your agent against customer questions from your focus areas and knowledge base.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <Button
              key={count}
              type="button"
              size="sm"
              variant={questionCount === count ? 'default' : 'outline'}
              disabled={busy}
              onClick={() => setQuestionCount(count)}
            >
              {count}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={busy}
          loading={busy}
          onClick={handleTrain}
        >
          {busy ? 'Running simulation…' : `Train with ${questionCount} questions`}
        </Button>
      </CardContent>
    </Card>
  );
}

type TrainingInsightsPanelProps = {
  agentId: string;
  organizationName: string;
  industryLabel: string;
  industryDescription: string;
  initialTopics: string[];
  suggestedTopics: string[];
  trainingHistory: TrainingRunItem[];
};

export function TrainingInsightsPanel({
  agentId,
  organizationName,
  industryLabel,
  industryDescription,
  initialTopics,
  suggestedTopics,
  trainingHistory
}: TrainingInsightsPanelProps): React.JSX.Element {
  const router = useRouter();
  const [topics, setTopics] = React.useState(
    initialTopics.length > 0 ? initialTopics : suggestedTopics
  );
  const [draft, setDraft] = React.useState('');
  const [isSaving, startSave] = React.useTransition();

  React.useEffect(() => {
    setTopics(initialTopics.length > 0 ? initialTopics : suggestedTopics);
  }, [initialTopics, suggestedTopics]);

  const persistTopics = (nextTopics: string[]): void => {
    setTopics(nextTopics);
    startSave(async () => {
      const result = await updateTrainingTopics({
        agentId,
        topics: nextTopics
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  const addTopic = (): void => {
    const value = draft.trim();
    if (!value) return;
    if (topics.some((topic) => topic.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    persistTopics([...topics, value]);
    setDraft('');
  };

  const removeTopic = (topic: string): void => {
    persistTopics(topics.filter((item) => item !== topic));
  };

  const hasSuggestedTopics = suggestedTopics.length > 0;

  return (
    <Card className="relative overflow-hidden">
      {hasSuggestedTopics && (
        <div className="absolute right-0 top-0 z-10 flex max-w-[min(100%,16rem)] items-start gap-1.5 rounded-bl-lg border-b border-l bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <span className="leading-snug">Suggested from your knowledge base</span>
        </div>
      )}
      <CardHeader className={hasSuggestedTopics ? 'pr-44 pb-3' : 'pb-3'}>
        <CardTitle className="text-base">{organizationName} context</CardTitle>
        <CardDescription>
          {industryLabel} · {industryDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm font-medium">What to test</p>
          <div className="flex flex-wrap gap-2">
            {topics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add topics your customers ask about — e.g. shipping, refunds, class bookings.
              </p>
            ) : (
              topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-3 py-1 text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    aria-label={`Remove ${topic}`}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    disabled={isSaving}
                    onClick={() => removeTopic(topic)}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={draft}
              placeholder="Add a topic…"
              disabled={isSaving || topics.length >= 20}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTopic();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isSaving || !draft.trim() || topics.length >= 20}
              onClick={addTopic}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">Past runs</p>
          {trainingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No training runs yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {trainingHistory.map((run) => (
                <li
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(run.createdAt), {
                      addSuffix: true
                    })}
                  </span>
                  <span className="font-medium">
                    {Math.round(run.accuracyAvg)}% · {run.passed}/{run.totalQuestions}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

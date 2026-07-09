import type { RunbookStep } from '@/lib/desk/types';

export type AIDeskTrainingContext = {
  runbookTitle: string | null;
  runbookSteps: RunbookStep[];
  clusterPattern: string | null;
  clusterIssueType: string | null;
  clusterSolution: string | null;
  whySummary: string | null;
  howSummary: string | null;
};

type RunbookRef = {
  title: string;
  steps: unknown;
  description: string | null;
};

type ClusterRef = {
  pattern: string;
  issueType: string;
  templateResponse: string;
};

/**
 * Builds the training context AI Desk uses from matched runbooks and clusters.
 */
export function buildAIDeskTrainingContext(input: {
  whySummary?: string | null;
  howSummary?: string | null;
  runbook?: RunbookRef | null;
  cluster?: ClusterRef | null;
}): AIDeskTrainingContext {
  const steps = Array.isArray(input.runbook?.steps)
    ? (input.runbook.steps as RunbookStep[])
    : [];

  return {
    runbookTitle: input.runbook?.title ?? null,
    runbookSteps: steps,
    clusterPattern: input.cluster?.pattern ?? null,
    clusterIssueType: input.cluster?.issueType ?? null,
    clusterSolution: input.cluster?.templateResponse ?? null,
    whySummary: input.whySummary ?? null,
    howSummary: input.howSummary ?? null
  };
}

export function hasAIDeskTrainingPath(ctx: AIDeskTrainingContext): boolean {
  return (
    ctx.runbookSteps.length > 0 ||
    ctx.clusterSolution !== null ||
    (ctx.whySummary !== null && ctx.howSummary !== null)
  );
}

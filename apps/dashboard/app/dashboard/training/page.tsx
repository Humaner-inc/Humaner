import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { TrainingPageClient } from './training-page-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { getAgents } from '@/data/agents/get-agents';
import { dedupedAuth } from '@/lib/auth';
import { getIndustry } from '@/lib/industries';
import { prisma } from '@/lib/db/prisma';
import { createTitle } from '@/lib/utils';
import { suggestTrainingTopics } from '@/services/training/training-topics';

export const metadata: Metadata = {
  title: createTitle('Training')
};

export const maxDuration = 300;

export default async function TrainingPage({
  searchParams
}: {
  searchParams: Promise<{ agent?: string }>;
}): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!session?.user?.id) {
    redirect(Routes.Login);
  }

  const agents = await getAgents();
  const { agent: agentParam } = await searchParams;
  const selectedAgent =
    agents.find((agent) => agent.id === agentParam) ?? agents[0] ?? null;

  const organization = session.user.organizationId
    ? await prisma.organization.findFirst({
        where: { id: session.user.organizationId },
        select: { name: true }
      })
    : null;

  const [gaps, latestRun, trainingHistory, agentDetails, suggestedTopics] =
    await Promise.all([
      selectedAgent
        ? prisma.knowledgeGap.findMany({
            where: { agentId: selectedAgent.id, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: { id: true, question: true }
          })
        : Promise.resolve([]),
      selectedAgent
        ? prisma.agentEvalRun.findFirst({
            where: { agentId: selectedAgent.id },
            orderBy: { createdAt: 'desc' },
            select: {
              accuracyAvg: true,
              personaAvg: true,
              helpfulnessAvg: true,
              hallucinationCount: true,
              passed: true,
              totalQuestions: true,
              createdAt: true
            }
          })
        : Promise.resolve(null),
      selectedAgent
        ? prisma.agentEvalRun.findMany({
            where: { agentId: selectedAgent.id },
            orderBy: { createdAt: 'desc' },
            take: 6,
            select: {
              id: true,
              accuracyAvg: true,
              passed: true,
              totalQuestions: true,
              createdAt: true
            }
          })
        : Promise.resolve([]),
      selectedAgent
        ? prisma.agent.findFirst({
            where: { id: selectedAgent.id },
            select: {
              healthScore: true,
              lastTrainedAt: true,
              widgetColor: true,
              industry: true,
              role: true,
              trainingTopics: true
            }
          })
        : Promise.resolve(null),
      selectedAgent
        ? suggestTrainingTopics(selectedAgent.id)
        : Promise.resolve([])
    ]);

  const industry = agentDetails
    ? getIndustry(agentDetails.industry)
    : null;

  return (
    <SectionPage width="xl">
      <div className="space-y-5">
          {agents.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => (
                <Button
                  key={agent.id}
                  asChild
                  variant={selectedAgent?.id === agent.id ? 'default' : 'outline'}
                  size="sm"
                >
                  <Link href={`${Routes.Training}?agent=${agent.id}`}>
                    {agent.name}
                  </Link>
                </Button>
              ))}
            </div>
          )}

          {agents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Create an agent first, then return here to run training.
                <div className="mt-4">
                  <Button asChild>
                    <Link href={Routes.Agents}>Go to Agents</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedAgent && agentDetails && industry ? (
            <TrainingPageClient
              agent={{
                id: selectedAgent.id,
                name: selectedAgent.name,
                accentColor: agentDetails.widgetColor,
                industry: agentDetails.industry,
                role: agentDetails.role
              }}
              industryLabel={industry.label}
              industryDescription={industry.description}
              trainingTopics={agentDetails.trainingTopics}
              suggestedTopics={suggestedTopics}
              healthScore={agentDetails.healthScore}
              lastTrainedAt={agentDetails.lastTrainedAt?.toISOString() ?? null}
              latestRun={latestRun}
              trainingHistory={trainingHistory.map((run) => ({
                ...run,
                createdAt: run.createdAt.toISOString()
              }))}
              gaps={gaps}
              organizationName={organization?.name ?? 'Your business'}
            />
          ) : null}
      </div>
    </SectionPage>
  );
}

import * as React from 'react';
import { after, connection } from 'next/server';
import { processPendingKnowledgeSources } from '@/services/knowledge/process-knowledge-source';
import { BookOpenIcon } from '@humaner/shared/icons';

import { AddSourceDialogTrigger } from '@/components/dashboard/knowledge/add-source-dialog';
import { KnowledgeRescanSchedule } from '@/components/dashboard/knowledge/knowledge-rescan-schedule';
import {
  KnowledgeResourcesList,
  KnowledgeResourcesShell
} from '@/components/dashboard/knowledge/knowledge-resources-shell';
import {
  ResourcesWorkspaceChrome,
  type ResourcesWorkspaceTab
} from '@/components/dashboard/resources/resources-workspace-chrome';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionPage } from '@/components/ui/section-shell';
import { getWorkspaceKnowledgeData } from '@/data/knowledge/get-workspace-knowledge';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { dashboardSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';

export async function ResourcesPageBody({
  tab = 'sources'
}: {
  tab?: ResourcesWorkspaceTab;
}): Promise<React.JSX.Element> {
  await connection();
  await requireDashboardPageOrRedirect('inbox');

  return (
    <SectionPage width="xl">
      <ResourcesWorkspaceChrome tab={tab}>
        <ResourcesSourcesPanel />
      </ResourcesWorkspaceChrome>
    </SectionPage>
  );
}

async function ResourcesSourcesPanel(): Promise<React.JSX.Element> {
  const data = await getWorkspaceKnowledgeData();
  const oss = isOssDeployment();

  if (!data.agent) {
    return (
      <>
        <h1 className="sr-only">Resources</h1>
        <EmptyState
          icon={<BookOpenIcon strokeWidth={1.25} />}
          title="Finish onboarding"
          description="Resources attach to the workspace agent created during onboarding."
        />
      </>
    );
  }

  const hasActiveProcessing = data.sources.some((source) =>
    ['PENDING', 'QUEUED', 'EXTRACTING', 'PROCESSING', 'INDEXING'].includes(
      source.status
    )
  );
  if (hasActiveProcessing) {
    after(async () => {
      await processPendingKnowledgeSources(data.agent!.id);
    });
  }

  return (
    <KnowledgeResourcesShell
      agentId={data.agent.id}
      agentName={data.agent.name}
      initialSources={data.sources}
    >
      <div className="space-y-8">
        <h1 className="sr-only">Resources</h1>

        <section className={cn(dashboardSurfaceClassName, 'overflow-hidden')}>
          <div className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-foreground">Sources</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                URLs, PDFs, and text Companion can train on.
              </p>
            </div>
            <AddSourceDialogTrigger className="shrink-0" />
          </div>
          <div className="space-y-6 p-5 sm:p-6">
            <KnowledgeResourcesList
              emptyState={
                <EmptyState
                  icon={<BookOpenIcon strokeWidth={1.25} />}
                  title="No resources yet"
                  description="Add URLs, PDFs, or text Companion can train on for this workspace."
                />
              }
            />
            {oss || !data.knowledgeSettings ? null : (
              <KnowledgeRescanSchedule
                agentId={data.agent.id}
                interval={data.knowledgeSettings.knowledgeRescanInterval}
              />
            )}
          </div>
        </section>
      </div>
    </KnowledgeResourcesShell>
  );
}

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
import { EmptyState } from '@/components/ui/empty-state';
import { SectionPage } from '@/components/ui/section-shell';
import { getWorkspaceKnowledgeData } from '@/data/knowledge/get-workspace-knowledge';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { isOssDeployment } from '@/lib/deployment-mode';

function ResourcesFallback(): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 px-6 py-5">
      <div className="h-8 w-48 animate-pulse bg-muted/40" />
      <div className="h-24 animate-pulse bg-muted/40" />
    </div>
  );
}

async function ResourcesPageContent(): Promise<React.JSX.Element> {
  await connection();
  await requireDashboardPageOrRedirect('inbox');
  const data = await getWorkspaceKnowledgeData();
  const oss = isOssDeployment();

  if (!data.agent) {
    return (
      <SectionPage width="xl">
        <h1 className="page-title">Resources</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Companion learns from this workspace&apos;s knowledge. Finish
          onboarding so a workspace agent exists to attach sources to.
        </p>
      </SectionPage>
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
    <SectionPage width="xl">
      <KnowledgeResourcesShell
        agentId={data.agent.id}
        agentName={data.agent.name}
        initialSources={data.sources}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-title">Resources</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Business knowledge for this workspace. Companion retrieves from
              these sources when it drafts or answers.
            </p>
          </div>
          <AddSourceDialogTrigger />
        </div>

        <div className="mt-8">
          <KnowledgeResourcesList
            emptyState={
              <EmptyState
                icon={<BookOpenIcon strokeWidth={1.25} />}
                title="No resources yet"
                description="Add URLs, PDFs, or text Companion can train on for this workspace."
              >
                <AddSourceDialogTrigger />
              </EmptyState>
            }
          />
          {oss || !data.knowledgeSettings ? null : (
            <KnowledgeRescanSchedule
              agentId={data.agent.id}
              interval={data.knowledgeSettings.knowledgeRescanInterval}
            />
          )}
        </div>
      </KnowledgeResourcesShell>
    </SectionPage>
  );
}

export default function ResourcesPage(): React.JSX.Element {
  return (
    <React.Suspense fallback={<ResourcesFallback />}>
      <ResourcesPageContent />
    </React.Suspense>
  );
}

import * as React from 'react';
import { after, connection } from 'next/server';
import { processPendingKnowledgeSources } from '@/services/knowledge/process-knowledge-source';
import { BookOpenIcon } from '@humaner/shared/icons';
import { Books } from '@phosphor-icons/react/dist/ssr/Books';

import { AddSourceDialogTrigger } from '@/components/dashboard/knowledge/add-source-dialog';
import { KnowledgeRescanSchedule } from '@/components/dashboard/knowledge/knowledge-rescan-schedule';
import {
  KnowledgeResourcesList,
  KnowledgeResourcesShell
} from '@/components/dashboard/knowledge/knowledge-resources-shell';
import { PresentationPageMark } from '@/components/dashboard/workspace-page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionPage } from '@/components/ui/section-shell';
import { getWorkspaceKnowledgeData } from '@/data/knowledge/get-workspace-knowledge';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { dashboardSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';

function ResourcesHeader({
  action
}: {
  action?: React.ReactNode;
}): React.JSX.Element {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3.5">
        <PresentationPageMark className="bg-[#2252bc] text-[#fcf4ec]">
          <Books
            className="size-6"
            weight="duotone"
          />
        </PresentationPageMark>
        <div className="min-w-0">
          <h1 className="page-title">Resources</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Business knowledge for this workspace. Companion retrieves from
            these sources when it drafts or answers.
          </p>
        </div>
      </div>
      {action}
    </header>
  );
}

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
        <div className="space-y-8">
          <header className="flex items-start gap-3.5">
            <PresentationPageMark className="bg-[#2252bc] text-[#fcf4ec]">
              <Books
                className="size-6"
                weight="duotone"
              />
            </PresentationPageMark>
            <div className="min-w-0">
              <h1 className="page-title">Resources</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Companion learns from this workspace&apos;s knowledge. Finish
                onboarding so a workspace agent exists to attach sources to.
              </p>
            </div>
          </header>
        </div>
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
        <div className="space-y-8">
          <ResourcesHeader action={<AddSourceDialogTrigger />} />

          <section className={cn(dashboardSurfaceClassName, 'overflow-hidden')}>
            <div className="border-b border-border/60 px-5 py-4 sm:px-6">
              <h2 className="text-sm font-medium text-foreground">Sources</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                URLs, PDFs, and text Companion can train on.
              </p>
            </div>
            <div className="space-y-6 p-5 sm:p-6">
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
          </section>
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

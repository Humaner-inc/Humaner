'use client';

import * as React from 'react';
import type { SyncStatus } from '@prisma/client';

import { AddSourceDialog } from '@/components/dashboard/knowledge/add-source-dialog';
import { SourceList } from '@/components/dashboard/knowledge/source-list';
import type { KnowledgeSourceItem } from '@/data/knowledge/get-knowledge-sources';

const ACTIVE_STATUSES: SyncStatus[] = [
  'PENDING',
  'QUEUED',
  'EXTRACTING',
  'PROCESSING',
  'INDEXING'
];

const POLL_INTERVAL_MS = 2000;

export type AddSourceDialogOptions = {
  textPrefill?: { title: string; content?: string };
};

type KnowledgeResourcesContextValue = {
  addSources: (sources: KnowledgeSourceItem[]) => void;
  removeSource: (id: string) => void;
  markSourcePending: (id: string) => void;
  reconcileSources: (
    optimisticIds: string[],
    sources: KnowledgeSourceItem[]
  ) => void;
  openAddSourceDialog: (options?: AddSourceDialogOptions) => void;
};

const KnowledgeResourcesContext =
  React.createContext<KnowledgeResourcesContextValue | null>(null);

const KnowledgeResourcesSourcesContext = React.createContext<
  KnowledgeSourceItem[] | null
>(null);

export function useKnowledgeResources(): KnowledgeResourcesContextValue {
  const value = React.useContext(KnowledgeResourcesContext);
  if (!value) {
    throw new Error(
      'useKnowledgeResources must be used within KnowledgeResourcesShell'
    );
  }
  return value;
}

export function useOptionalKnowledgeResources(): KnowledgeResourcesContextValue | null {
  return React.useContext(KnowledgeResourcesContext);
}

const EMPTY_KNOWLEDGE_SOURCES: KnowledgeSourceItem[] = [];

export function useOptionalKnowledgeResourcesSources(): KnowledgeSourceItem[] {
  return (
    React.useContext(KnowledgeResourcesSourcesContext) ??
    EMPTY_KNOWLEDGE_SOURCES
  );
}

function parseKnowledgeSourceItem(
  source: KnowledgeSourceItem & {
    createdAt: string | Date;
    lastSyncedAt?: string | Date | null;
  }
): KnowledgeSourceItem {
  return {
    ...source,
    createdAt:
      source.createdAt instanceof Date
        ? source.createdAt
        : new Date(source.createdAt),
    lastSyncedAt: source.lastSyncedAt
      ? source.lastSyncedAt instanceof Date
        ? source.lastSyncedAt
        : new Date(source.lastSyncedAt)
      : null
  };
}

function sortSources(sources: KnowledgeSourceItem[]): KnowledgeSourceItem[] {
  return [...sources].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

function mergeSources(
  current: KnowledgeSourceItem[],
  incoming: KnowledgeSourceItem[]
): KnowledgeSourceItem[] {
  const byId = new Map(current.map((source) => [source.id, source]));

  for (const source of incoming) {
    byId.set(source.id, source);
  }

  return sortSources([...byId.values()]);
}

export type KnowledgeResourcesShellProps = {
  agentId: string;
  agentName: string;
  initialSources: KnowledgeSourceItem[];
  children: React.ReactNode;
};

export function KnowledgeResourcesShell({
  agentId,
  agentName,
  initialSources,
  children
}: KnowledgeResourcesShellProps): React.JSX.Element {
  const [sources, setSources] = React.useState(initialSources);
  const [addSourceOpen, setAddSourceOpen] = React.useState(false);
  const [addSourcePrefill, setAddSourcePrefill] =
    React.useState<AddSourceDialogOptions['textPrefill']>(undefined);

  const openAddSourceDialog = React.useCallback(
    (options?: AddSourceDialogOptions): void => {
      setAddSourcePrefill(options?.textPrefill);
      setAddSourceOpen(true);
    },
    []
  );

  const handleAddSourceOpenChange = React.useCallback((open: boolean): void => {
    setAddSourceOpen(open);
    if (!open) {
      setAddSourcePrefill(undefined);
    }
  }, []);

  React.useEffect(() => {
    setSources((current) => mergeSources(current, initialSources));
  }, [initialSources]);

  const addSources = React.useCallback((next: KnowledgeSourceItem[]) => {
    setSources((current) => mergeSources(next, current));
  }, []);

  const removeSource = React.useCallback((id: string) => {
    setSources((current) => current.filter((source) => source.id !== id));
  }, []);

  const markSourcePending = React.useCallback((id: string) => {
    setSources((current) =>
      current.map((source) =>
        source.id === id
          ? { ...source, status: 'PENDING', errorMessage: null }
          : source
      )
    );
  }, []);

  const reconcileSources = React.useCallback(
    (optimisticIds: string[], next: KnowledgeSourceItem[]) => {
      setSources((current) => {
        const withoutOptimistic = current.filter(
          (source) => !optimisticIds.includes(source.id)
        );
        return mergeSources(withoutOptimistic, next);
      });
    },
    []
  );

  const hasActiveProcessing = sources.some((source) =>
    ACTIVE_STATUSES.includes(source.status)
  );

  React.useEffect(() => {
    if (!hasActiveProcessing) {
      return;
    }

    let cancelled = false;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(
          `/api/agents/${agentId}/knowledge-sources`,
          { cache: 'no-store' }
        );
        if (!response.ok || cancelled) {
          return;
        }

        const payload = (await response.json()) as {
          sources: Array<
            KnowledgeSourceItem & {
              createdAt: string;
              lastSyncedAt: string | null;
            }
          >;
        };

        setSources((current) =>
          mergeSources(
            current,
            payload.sources.map((source) => parseKnowledgeSourceItem(source))
          )
        );
      } catch {
        // Ignore transient polling errors.
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [agentId, hasActiveProcessing]);

  const contextValue = React.useMemo(
    () => ({
      addSources,
      removeSource,
      markSourcePending,
      reconcileSources,
      openAddSourceDialog
    }),
    [
      addSources,
      removeSource,
      markSourcePending,
      reconcileSources,
      openAddSourceDialog
    ]
  );

  return (
    <KnowledgeResourcesContext.Provider value={contextValue}>
      <KnowledgeResourcesSourcesContext.Provider value={sources}>
        {children}
        <AddSourceDialog
          agentId={agentId}
          agentName={agentName}
          open={addSourceOpen}
          onOpenChange={handleAddSourceOpenChange}
          hideTrigger
          textPrefill={addSourcePrefill}
        />
      </KnowledgeResourcesSourcesContext.Provider>
    </KnowledgeResourcesContext.Provider>
  );
}

export type KnowledgeResourcesListProps = {
  emptyState: React.ReactNode;
};

export function KnowledgeResourcesList({
  emptyState
}: KnowledgeResourcesListProps): React.JSX.Element {
  const sources = React.useContext(KnowledgeResourcesSourcesContext);
  const { removeSource } = useKnowledgeResources();

  if (!sources) {
    throw new Error(
      'KnowledgeResourcesList must be used within KnowledgeResourcesShell'
    );
  }

  if (sources.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <SourceList
      sources={sources}
      onSourceRemoved={removeSource}
    />
  );
}

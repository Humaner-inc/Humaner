import type { SourceType, SyncStatus } from '@prisma/client';

import type { KnowledgeSourceItem } from '@/data/knowledge/get-knowledge-sources';

export function createOptimisticKnowledgeSource(input: {
  type: SourceType;
  title: string;
  url?: string | null;
}): KnowledgeSourceItem {
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    type: input.type,
    title: input.title,
    url: input.url ?? null,
    status: 'PENDING' as SyncStatus,
    pageCount: null,
    lastSyncedAt: null,
    errorMessage: null,
    createdAt: new Date()
  };
}

function deriveTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segment = parsed.pathname.split('/').filter(Boolean).pop();
    const label = segment ? segment.replace(/[-_]+/g, ' ') : parsed.hostname;
    return label.slice(0, 255);
  } catch {
    return url.slice(0, 255);
  }
}

export function buildOptimisticKnowledgeSources(input: {
  type: 'URL' | 'SITEMAP' | 'TEXT';
  urls?: string[];
  url?: string;
  title?: string;
  files?: { name: string }[];
}): KnowledgeSourceItem[] {
  if (input.type === 'URL') {
    return (input.urls ?? []).map((url) =>
      createOptimisticKnowledgeSource({
        type: 'URL',
        title: deriveTitleFromUrl(url),
        url
      })
    );
  }

  if (input.type === 'SITEMAP') {
    const url = input.url?.trim() ?? '';
    return [
      createOptimisticKnowledgeSource({
        type: 'SITEMAP',
        title: input.title?.trim() || deriveTitleFromUrl(url),
        url
      })
    ];
  }

  if (input.files) {
    return input.files.map((file) =>
      createOptimisticKnowledgeSource({
        type: 'TEXT',
        title: file.name
      })
    );
  }

  return [
    createOptimisticKnowledgeSource({
      type: 'TEXT',
      title: input.title?.trim() ?? 'Untitled'
    })
  ];
}

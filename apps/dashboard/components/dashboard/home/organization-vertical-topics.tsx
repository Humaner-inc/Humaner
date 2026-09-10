'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@humaner/shared/icons';
import type { IndustryType } from '@prisma/client';
import { toast } from 'sonner';

import { updateOrganizationVerticalTopics } from '@/actions/organization/update-organization-vertical-topics';
import { getIndustry } from '@/lib/industries';
import { getIndustryIcon } from '@/lib/industry-icons';
import { resolveSelectedVerticalTopics } from '@/lib/organization/vertical-topics';
import { cn } from '@/lib/utils';

export type OrganizationVerticalTopicsProps = {
  industry: IndustryType;
  commonTopics: string[];
  selectedTopics: string[];
  readOnly?: boolean;
  forCompanion?: boolean;
};

export function OrganizationVerticalTopics({
  industry,
  commonTopics,
  selectedTopics: initialSelected,
  readOnly = false,
  forCompanion = false
}: OrganizationVerticalTopicsProps): React.JSX.Element {
  const router = useRouter();
  const industryDef = getIndustry(industry);
  const Icon = getIndustryIcon(industryDef.iconKey);
  const [selected, setSelected] = React.useState(() =>
    resolveSelectedVerticalTopics(initialSelected, commonTopics)
  );
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setSelected(resolveSelectedVerticalTopics(initialSelected, commonTopics));
  }, [initialSelected, commonTopics]);

  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  const persist = (next: string[]): void => {
    if (readOnly) {
      return;
    }
    setSelected(next);
    startTransition(async () => {
      const result = await updateOrganizationVerticalTopics({ topics: next });
      if (result?.serverError || result?.validationErrors) {
        toast.error("Couldn't update topics");
        setSelected(
          resolveSelectedVerticalTopics(initialSelected, commonTopics)
        );
        return;
      }
      router.refresh();
    });
  };

  const toggle = (topic: string): void => {
    const next = selectedSet.has(topic)
      ? selected.filter((item) => item !== topic)
      : [...selected, topic];
    persist(next);
  };

  return (
    <section className="space-y-4 border border-border/60 bg-muted/20 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Icon className="size-4 shrink-0 text-foreground" />
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {industryDef.label}
        </h2>
        <p className="text-sm text-muted-foreground">
          {industryDef.description}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        {forCompanion
          ? "These shape Companion's persona."
          : "These sync to every agent's persona."}
      </p>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {commonTopics.map((topic) => {
          const isSelected = selectedSet.has(topic);
          return (
            <li key={topic}>
              <button
                type="button"
                disabled={readOnly || isPending}
                onClick={() => toggle(topic)}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-none px-1 py-1.5 text-left transition-colors',
                  'hover:bg-muted/40 disabled:opacity-60',
                  isSelected ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center border',
                    isSelected
                      ? 'border-success/50 bg-success/15 text-success'
                      : 'border-border/70 bg-transparent text-transparent'
                  )}
                >
                  <CheckIcon
                    className="size-3"
                    strokeWidth={2.5}
                  />
                </span>
                <span className="text-sm">{topic}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

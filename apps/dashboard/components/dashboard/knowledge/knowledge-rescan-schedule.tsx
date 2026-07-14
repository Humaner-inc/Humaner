'use client';

import * as React from 'react';
import type { KnowledgeRescanInterval } from '@prisma/client';
import { toast } from 'sonner';

import { updateKnowledgeRescanSchedule } from '@/actions/knowledge/update-knowledge-rescan-schedule';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const INTERVAL_OPTIONS: {
  value: KnowledgeRescanInterval;
  label: string;
  description: string;
}[] = [
  {
    value: 'NEVER',
    label: 'Manual only',
    description: 'Rescan sources yourself when content changes.'
  },
  {
    value: 'WEEKLY',
    label: 'Every 7 days',
    description: 'Automatically rescan all URL and sitemap sources weekly.'
  },
  {
    value: 'MONTHLY',
    label: 'Every month',
    description: 'Automatically rescan all URL and sitemap sources monthly.'
  }
];

export type KnowledgeRescanScheduleProps = {
  agentId: string;
  interval: KnowledgeRescanInterval;
};

export function KnowledgeRescanSchedule({
  agentId,
  interval
}: KnowledgeRescanScheduleProps): React.JSX.Element {
  const [pending, setPending] = React.useState(false);
  const selected = INTERVAL_OPTIONS.find((option) => option.value === interval);

  const handleChange = async (
    value: KnowledgeRescanInterval
  ): Promise<void> => {
    if (pending || value === interval) {
      return;
    }

    setPending(true);
    try {
      const result = await updateKnowledgeRescanSchedule({
        agentId,
        interval: value
      });

      if (!result?.serverError && !result?.validationErrors) {
        toast.success('Rescan schedule updated');
      } else {
        toast.error("Couldn't update rescan schedule");
      }
    } catch {
      toast.error("Couldn't update rescan schedule");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Label
            htmlFor="knowledge-rescan-schedule"
            className="subsection-title"
          >
            Automatic rescan
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {selected?.description}
          </p>
        </div>
        <Select
          value={interval}
          onValueChange={(value) =>
            handleChange(value as KnowledgeRescanInterval)
          }
          disabled={pending}
        >
          <SelectTrigger
            id="knowledge-rescan-schedule"
            className="w-full sm:w-[180px]"
          >
            <SelectValue placeholder="Select schedule" />
          </SelectTrigger>
          <SelectContent>
            {INTERVAL_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

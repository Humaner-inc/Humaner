'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { IndustryType } from '@prisma/client';
import { AlertTriangleIcon, PencilIcon } from 'lucide-react';
import { toast } from 'sonner';

import { updateOrganizationIndustry } from '@/actions/organization/update-organization-industry';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { RadioCardItem, RadioCards } from '@/components/ui/radio-card';
import { getIndustry, INDUSTRY_LIST } from '@/lib/industries';

export type IndustryTagProps = {
  industry: IndustryType | null;
};

export function IndustryTag({ industry }: IndustryTagProps): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<IndustryType | undefined>(
    industry ?? undefined
  );
  const [isPending, startTransition] = React.useTransition();

  const current = industry ? getIndustry(industry) : null;
  const CurrentIcon = current?.icon;

  const handleSave = (): void => {
    if (!selected) {
      return;
    }
    startTransition(async () => {
      const result = await updateOrganizationIndustry({ industry: selected });
      if (result?.serverError || result?.validationErrors) {
        toast.error("Couldn't update industry");
        return;
      }
      toast.success('Industry updated — agents re-anchored to the new vertical');
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className="gap-1.5 px-2.5 py-1"
      >
        {CurrentIcon ? <CurrentIcon className="size-3.5" /> : null}
        {current ? current.label : 'No industry set'}
      </Badge>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) {
            setSelected(industry ?? undefined);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <PencilIcon className="size-3.5" />
            Change
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Change industry</DialogTitle>
            <DialogDescription>
              Industry shapes your agents&apos; defaults and presets.
            </DialogDescription>
          </DialogHeader>
          <RadioCards
            value={selected}
            onValueChange={(value) => setSelected(value as IndustryType)}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            disabled={isPending}
          >
            {INDUSTRY_LIST.map((item) => {
              const Icon = item.icon;
              return (
                <RadioCardItem
                  key={item.id}
                  value={item.id}
                  className="flex flex-col items-start gap-1 pr-9 text-left"
                >
                  <Icon className="mb-1 size-5 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </RadioCardItem>
              );
            })}
          </RadioCards>
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span>
              Switching industry overwrites every agent&apos;s character, tone,
              and forbidden topics with the new vertical&apos;s defaults. Prior
              tuning will be lost.
            </span>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              loading={isPending}
              disabled={!selected || selected === industry || isPending}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

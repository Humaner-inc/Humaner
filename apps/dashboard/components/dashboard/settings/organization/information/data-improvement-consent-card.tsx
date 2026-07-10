'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { updateDataImprovementConsent } from '@/actions/organization/update-data-improvement-consent';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export type DataImprovementConsentCardProps = CardProps & {
  consent: boolean | null;
  consentedAt: string | null;
  isOwner: boolean;
};

export function DataImprovementConsentCard({
  consent,
  consentedAt,
  isOwner,
  ...props
}: DataImprovementConsentCardProps): React.JSX.Element {
  const [enabled, setEnabled] = React.useState(consent === true);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setEnabled(consent === true);
  }, [consent]);

  const onToggle = (next: boolean): void => {
    setEnabled(next);
    startTransition(async () => {
      const result = await updateDataImprovementConsent({ consent: next });
      if (result?.serverError || result?.validationErrors) {
        setEnabled(!next);
        toast.error(result?.serverError ?? 'Could not update preference.');
        return;
      }
      toast.success(
        next
          ? 'Data improvement consent enabled.'
          : 'Data improvement consent disabled.'
      );
    });
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Data &amp; privacy</CardTitle>
        <CardDescription>
          Control whether Humaner may use your workspace data for optional
          product improvements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="space-y-1">
            <Label
              htmlFor="data-improvement-consent"
              className="text-base"
            >
              Allow data use for improvements
            </Label>
            <p className="text-sm text-muted-foreground">
              When enabled, we may use anonymized knowledge gaps, approved Human
              Desk resolutions, and aggregated patterns to improve Humaner
              agents. We never use your data to train third-party foundation
              models.
            </p>
            {consentedAt ? (
              <p className="text-xs text-muted-foreground">
                Last updated {format(new Date(consentedAt), 'PPp')}
              </p>
            ) : null}
          </div>
          <Switch
            id="data-improvement-consent"
            checked={enabled}
            disabled={!isOwner || isPending || consent === null}
            onCheckedChange={onToggle}
          />
        </div>
        {!isOwner ? (
          <p className="text-sm text-muted-foreground">
            Only the workspace owner can change this setting.
          </p>
        ) : null}
        {consent === null && isOwner ? (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            You have not answered the data improvement prompt yet. It will
            appear on your next dashboard visit, or choose below.
          </p>
        ) : null}
      </CardContent>
      {isOwner && consent === null ? (
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isPending}
            onClick={() => onToggle(true)}
          >
            Allow
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onToggle(false)}
          >
            Don&apos;t allow
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

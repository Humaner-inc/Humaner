'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { updateDataImprovementConsent } from '@/actions/organization/update-data-improvement-consent';
import { updateModelTrainingConsent } from '@/actions/organization/update-model-training-consent';
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
  modelTrainingConsent: boolean;
  modelTrainingConsentedAt: string | null;
  isOwner: boolean;
};

export function DataImprovementConsentCard({
  consent,
  consentedAt,
  modelTrainingConsent,
  modelTrainingConsentedAt,
  isOwner,
  ...props
}: DataImprovementConsentCardProps): React.JSX.Element {
  const [enabled, setEnabled] = React.useState(consent === true);
  const [modelEnabled, setModelEnabled] = React.useState(modelTrainingConsent);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setEnabled(consent === true);
  }, [consent]);

  React.useEffect(() => {
    setModelEnabled(modelTrainingConsent);
  }, [modelTrainingConsent]);

  const onToggleImprovement = (next: boolean): void => {
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

  const onToggleModelTraining = (next: boolean): void => {
    setModelEnabled(next);
    startTransition(async () => {
      const result = await updateModelTrainingConsent({ consent: next });
      if (result?.serverError || result?.validationErrors) {
        setModelEnabled(!next);
        toast.error(result?.serverError ?? 'Could not update preference.');
        return;
      }
      toast.success(
        next
          ? 'Model training contribution enabled.'
          : 'Model training contribution disabled.'
      );
    });
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Data &amp; privacy</CardTitle>
        <CardDescription>
          Two separate opt-ins. Product improvements use anonymised patterns
          only. Model fine-tuning is a different purpose and stays off unless
          you enable it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="space-y-1">
            <Label
              htmlFor="data-improvement-consent"
              className="text-base"
            >
              Allow anonymised pattern contributions
            </Label>
            <p className="text-sm text-muted-foreground">
              When enabled (Frontier+), we may extract anonymised knowledge-gap
              patterns, Human Desk resolution motions, and aggregate failure
              statistics to improve Skills and Runbooks. Patterns are promoted
              only after they appear across multiple workspaces (k-anonymity).
              Source transcripts still delete on schedule. We never store org
              IDs or conversation content with promoted patterns.
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
            onCheckedChange={onToggleImprovement}
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="space-y-1">
            <Label
              htmlFor="model-training-consent"
              className="text-base"
            >
              Allow contribution to Humaner model fine-tuning
            </Label>
            <p className="text-sm text-muted-foreground">
              Separate from product improvements. Opt in only if you want your
              workspace&apos;s anonymised patterns to help fine-tune Humaner
              models. Default is off. Raw transcripts are never used for
              training.
            </p>
            {modelTrainingConsentedAt ? (
              <p className="text-xs text-muted-foreground">
                Last updated {format(new Date(modelTrainingConsentedAt), 'PPp')}
              </p>
            ) : null}
          </div>
          <Switch
            id="model-training-consent"
            checked={modelEnabled}
            disabled={!isOwner || isPending}
            onCheckedChange={onToggleModelTraining}
          />
        </div>

        {!isOwner ? (
          <p className="text-sm text-muted-foreground">
            Only the workspace owner can change these settings.
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
            onClick={() => onToggleImprovement(true)}
          >
            Allow patterns
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onToggleImprovement(false)}
          >
            Don&apos;t allow
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

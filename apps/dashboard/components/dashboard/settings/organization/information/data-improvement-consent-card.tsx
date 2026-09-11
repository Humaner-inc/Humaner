'use client';

import * as React from 'react';
import {
  ArrowDownIcon,
  BotIcon,
  Brain,
  Layers,
  LockIcon,
  ShieldCheck
} from '@humaner/shared/icons';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { updateDataImprovementConsent } from '@/actions/organization/update-data-improvement-consent';
import { updateModelTrainingConsent } from '@/actions/organization/update-model-training-consent';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AppInfo } from '@/constants/app-info';

export type DataImprovementConsentCardProps = CardProps & {
  consent: boolean | null;
  consentedAt: string | null;
  modelTrainingConsent: boolean;
  modelTrainingConsentedAt: string | null;
  isOwner: boolean;
};

function PipelineStep({
  icon: Icon,
  title,
  description
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

const downArrow = (
  <div className="flex justify-center py-0.5">
    <ArrowDownIcon className="size-3 text-muted-foreground/50" />
  </div>
);

const switchClassName =
  'data-[state=checked]:bg-foreground data-[state=unchecked]:bg-input';

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
  const [tourOpen, setTourOpen] = React.useState(false);

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
          ? 'Pattern contributions enabled.'
          : 'Pattern contributions disabled.'
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
        next ? 'Model fine-tuning enabled.' : 'Model fine-tuning disabled.'
      );
    });
  };

  return (
    <Card {...props}>
      <CardHeader className="pb-2">
        <CardTitle>Data agreement</CardTitle>
        <p className="text-sm text-muted-foreground">
          Following DPA and GDPR regulations.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Collapsible
          open={tourOpen}
          onOpenChange={setTourOpen}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/40"
            >
              <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">How {AppInfo.APP_NAME} uses data</span>
              <ArrowDownIcon
                className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${tourOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1 border border-t-0 border-border/60 bg-muted/10 px-4 pb-5 pt-4">
              <PipelineStep
                icon={Layers}
                title="Anonymised patterns"
                description={`${AppInfo.APP_NAME} can use industry patterns to improve the platform — never to train third-party models.`}
              />
              {downArrow}
              <PipelineStep
                icon={LockIcon}
                title="Encrypted in transit and at rest"
                description="Patterns are encrypted at rest before any processing."
              />
              {downArrow}
              <p className="py-1 text-center text-xs font-medium text-muted-foreground">
                Then used for either
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                  <PipelineStep
                    icon={Brain}
                    title="Model fine-tuning"
                    description={`Optional. Improving the ${AppInfo.APP_NAME} model as a whole.`}
                  />
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                  <PipelineStep
                    icon={BotIcon}
                    title="Companion in your workspace"
                    description="Resources you add train Companion for this workspace under the DPA. That is not this opt-in."
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
          <div className="space-y-1">
            <Label
              htmlFor="data-improvement-consent"
              className="text-base"
            >
              Anonymised pattern contributions
            </Label>
            <p className="text-sm text-muted-foreground">
              Share anonymised patterns to improve Skills and recursive learning
              on the {AppInfo.APP_NAME} platform. Workspace Resources still
              train Companion without this.
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
            className={switchClassName}
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
          <div className="space-y-1">
            <Label
              htmlFor="model-training-consent"
              className="text-base"
            >
              Improve {AppInfo.APP_NAME} Model
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow anonymised patterns to help fine-tune {AppInfo.APP_NAME}
              &apos;s model. Optional and separate from Companion training on
              your Resources.
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
            className={switchClassName}
          />
        </div>

        {!isOwner ? (
          <p className="text-sm text-muted-foreground">
            Only the workspace owner can change these settings.
          </p>
        ) : null}
        {consent === null && isOwner ? (
          <p className="text-sm text-warning dark:text-warning">
            You haven&apos;t responded to the data improvement prompt yet.
            Choose below or it will appear on your next visit.
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

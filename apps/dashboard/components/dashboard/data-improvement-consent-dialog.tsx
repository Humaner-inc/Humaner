'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { updateDataImprovementConsent } from '@/actions/organization/update-data-improvement-consent';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export type DataImprovementConsentDialogProps = {
  privacyPolicyUrl: string;
  /** When true, the owner must choose before using the dashboard. */
  open: boolean;
  onResolved: () => void;
};

export function DataImprovementConsentDialog({
  privacyPolicyUrl,
  open,
  onResolved
}: DataImprovementConsentDialogProps): React.JSX.Element {
  const [isPending, startTransition] = React.useTransition();

  const submit = (consent: boolean): void => {
    startTransition(async () => {
      const result = await updateDataImprovementConsent({ consent });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error('Could not save your choice. Please try again.');
        return;
      }

      onResolved();
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg" preventDismiss>
        <DialogHeader>
          <DialogTitle>Help us improve Humaner</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1 text-sm text-muted-foreground">
              <p>
                With your permission, Humaner may use your workspace data to
                improve agent quality — for example anonymized knowledge gaps,
                resolved Human Desk tickets you approve for the knowledge base,
                and aggregated usage patterns.
              </p>
              <p>
                This is optional. Humaner works fully whether you allow this or
                not. We do not sell your data, and we do not use your content to
                train third-party foundation models (such as Anthropic&apos;s).
              </p>
              <p>
                You remain responsible for informing your end-customers in your
                own privacy notice. You can change this choice anytime under{' '}
                <span className="font-medium text-foreground">
                  Settings → Organization → Organization information
                </span>
                .
              </p>
              <p>
                <Link
                  href={privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Read our Privacy Policy
                </Link>
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            className="w-full"
            disabled={isPending}
            onClick={() => submit(true)}
          >
            {isPending ? 'Saving…' : 'Allow data use for improvements'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isPending}
            onClick={() => submit(false)}
          >
            Don&apos;t allow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

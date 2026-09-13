'use client';

import * as React from 'react';
import { AlertCircleIcon } from '@humaner/shared/icons';

import { CompanionKeyMark } from '@/components/brand/companion-key-mark';
import { MaskedApiKeyField } from '@/components/dashboard/settings/organization/developers/masked-api-key-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export function CreatedApiKeyContent({
  apiKey,
  heading,
  footer
}: {
  apiKey: string;
  heading: React.ReactNode;
  footer: React.ReactNode;
}): React.JSX.Element {
  return (
    <>
      <div className="border-b border-border/60 px-6 pb-6 pt-7">
        <div className="flex flex-col items-center text-center">
          <CompanionKeyMark
            className="mb-4"
            size="lg"
          />
          {heading}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5">
        <Alert variant="warning">
          <div className="flex flex-row items-start gap-2">
            <AlertCircleIcon className="mt-0.5 size-[18px] shrink-0" />
            <AlertDescription>
              Store this key somewhere safe. For security reasons we cannot show
              it again.
            </AlertDescription>
          </div>
        </Alert>
        <div className="flex w-full flex-col space-y-2">
          <Label>API key</Label>
          <MaskedApiKeyField apiKey={apiKey} />
        </div>
      </div>
      {footer}
    </>
  );
}

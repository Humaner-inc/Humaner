'use client';

import * as React from 'react';
import type { CharacterType } from '@prisma/client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';
import { DEFAULT_AGENT_ROLE } from '@/lib/agent-defaults';
import { CHARACTER_META } from '@/lib/character-presets';
import { cn } from '@/lib/utils';

export type AgentCreatedPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  role: string;
  character: CharacterType;
  image?: string | null;
  onContinue: () => void;
};

export function AgentCreatedPreviewDialog({
  open,
  onOpenChange,
  name,
  role,
  character,
  image,
  onContinue
}: AgentCreatedPreviewDialogProps): React.JSX.Element {
  const meta = CHARACTER_META[character];
  const previewImage = image ?? (character === 'CUSTOM' ? null : meta.image);
  const displayRole = role.trim() || DEFAULT_AGENT_ROLE;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="max-w-sm gap-0 overflow-hidden p-0"
        preventDismiss
      >
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <DialogTitle className="sr-only">{name} created</DialogTitle>
          <DialogDescription className="sr-only">
            Preview your new agent before editing persona settings.
          </DialogDescription>

          <div
            className={cn(
              'relative size-24 shrink-0 overflow-hidden rounded-full ring-2 ring-foreground/10 ring-offset-2 ring-offset-background'
            )}
          >
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImage}
                alt={name}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full bg-white" />
            )}
          </div>

          <p className="mt-4 font-display text-2xl font-semibold tracking-tight">
            {name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {displayRole} · {meta.label}
          </p>

          <p className="mt-5 text-sm text-muted-foreground">
            Add your brand picture?
          </p>

          <Button
            type="button"
            className="mt-6 w-full"
            onClick={onContinue}
          >
            Continue to persona
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

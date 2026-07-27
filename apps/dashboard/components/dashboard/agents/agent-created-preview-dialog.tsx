'use client';

import * as React from 'react';
import { AlertCircleIcon } from '@humaner/shared/icons';
import type { CharacterType } from '@prisma/client';

import { AgentAvatarUpload } from '@/components/dashboard/agents/agent-avatar-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';
import { DEFAULT_AGENT_ROLE } from '@/lib/agent-defaults';
import {
  CHARACTER_META,
  formatPersonaToneCaption
} from '@/lib/character-presets';

export type AgentCreatedPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  name: string;
  role: string;
  character: CharacterType;
  image?: string | null;
  onContinue: () => void;
};

export function AgentCreatedPreviewDialog({
  open,
  onOpenChange,
  agentId,
  name,
  role,
  character,
  image,
  onContinue
}: AgentCreatedPreviewDialogProps): React.JSX.Element {
  const meta = CHARACTER_META[character];
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

          <Alert
            variant="info"
            className="mb-5 w-full text-left"
          >
            <div className="flex flex-row items-start gap-2">
              <AlertCircleIcon className="mt-0.5 size-[18px] shrink-0 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-foreground/80">
                Customize your agent picture
              </AlertDescription>
            </div>
          </Alert>

          <AgentAvatarUpload
            agentId={agentId}
            character={character}
            image={image}
            size="dialog"
          />

          <p className="mt-4 font-display text-2xl font-semibold tracking-tight">
            {name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {displayRole} ·{' '}
            {meta.personaName
              ? `${meta.personaName} · ${formatPersonaToneCaption(meta)}`
              : formatPersonaToneCaption(meta)}
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

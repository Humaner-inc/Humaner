'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type {
  CharacterType,
  EmojiMode,
  Formality,
  OpenerStyle,
  Verbosity
} from '@prisma/client';
import type { PersonalityAccess } from '@humaner/shared/plans';
import { toast } from 'sonner';

import { updateAgent } from '@/actions/agents/update-agent';
import { AgentAvatarUpload } from '@/components/dashboard/agents/agent-avatar-upload';
import { AgentPersonalityTuning } from '@/components/dashboard/agents/agent-personality-tuning';
import { RoleFieldLabel } from '@/components/dashboard/agents/role-field-label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AgentListItem } from '@/data/agents/get-agents';
import {
  CHARACTER_META,
  getSelectableCharacters
} from '@/lib/character-presets';
import {
  DEFAULT_AGENT_ROLE,
  DEFAULT_FALLBACK_MESSAGE,
  getGreetingPlaceholder,
  isPersonalityDefaultGreeting
} from '@/lib/agent-defaults';
import { cn } from '@/lib/utils';

export type EditAgentDialogProps = {
  agent: AgentListItem;
  personalityAccess?: PersonalityAccess;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditAgentDialog({
  agent,
  personalityAccess = 'all',
  open,
  onOpenChange
}: EditAgentDialogProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [character, setCharacter] = React.useState(agent.character);
  const [name, setName] = React.useState(agent.name);
  const [role, setRole] = React.useState(agent.role);
  const [verbosity, setVerbosity] = React.useState(agent.verbosity);
  const [formality, setFormality] = React.useState(agent.formality);
  const [emojiMode, setEmojiMode] = React.useState(agent.emojiMode);
  const [openerStyle, setOpenerStyle] = React.useState(agent.openerStyle);
  const [allowTypos, setAllowTypos] = React.useState(agent.allowTypos);
  const [fallbackMessage, setFallbackMessage] = React.useState(
    agent.fallbackMessage === DEFAULT_FALLBACK_MESSAGE ? '' : agent.fallbackMessage
  );
  const [greetingMessage, setGreetingMessage] = React.useState(
    isPersonalityDefaultGreeting(
      agent.greetingMessage,
      agent.character,
      agent.name
    )
      ? ''
      : (agent.greetingMessage ?? '')
  );
  const [showRole, setShowRole] = React.useState(agent.showRole);
  const [customCharacterPrompt, setCustomCharacterPrompt] = React.useState(
    agent.customCharacterPrompt ?? ''
  );
  const [avatarImage, setAvatarImage] = React.useState(agent.image);

  const greetingPlaceholder = React.useMemo(
    () => getGreetingPlaceholder(character, name),
    [character, name]
  );
  const selectableCharacters = React.useMemo(
    () => getSelectableCharacters(personalityAccess),
    [personalityAccess]
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }
    setCharacter(agent.character);
    setName(agent.name);
    setRole(agent.role);
    setVerbosity(agent.verbosity);
    setFormality(agent.formality);
    setEmojiMode(agent.emojiMode);
    setOpenerStyle(agent.openerStyle);
    setAllowTypos(agent.allowTypos);
    setFallbackMessage(
      agent.fallbackMessage === DEFAULT_FALLBACK_MESSAGE ? '' : agent.fallbackMessage
    );
    setGreetingMessage(
      isPersonalityDefaultGreeting(
        agent.greetingMessage,
        agent.character,
        agent.name
      )
        ? ''
        : (agent.greetingMessage ?? '')
    );
    setShowRole(agent.showRole);
    setCustomCharacterPrompt(agent.customCharacterPrompt ?? '');
    setAvatarImage(agent.image);
  }, [agent, open]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    if (!selectableCharacters.some((item) => item.id === character)) {
      setCharacter(selectableCharacters[0]?.id ?? 'CORPORATE');
    }
  }, [character, open, selectableCharacters]);

  const canSubmit =
    name.trim().length > 0 &&
    (character !== 'CUSTOM' || customCharacterPrompt.trim().length > 0);

  const handleSave = (): void => {
    if (!canSubmit) {
      return;
    }
    startTransition(async () => {
      const result = await updateAgent({
        id: agent.id,
        name,
        role: role.trim() || undefined,
        character,
        customCharacterPrompt:
          character === 'CUSTOM' ? customCharacterPrompt : undefined,
        verbosity,
        formality,
        emojiMode,
        openerStyle,
        allowTypos,
        fallbackMessage: fallbackMessage.trim() || undefined,
        greetingMessage: greetingMessage.trim() || undefined,
        showRole
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error('Please check the agent details');
        return;
      }
      toast.success('Agent updated');
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Edit personality
          </DialogTitle>
          <DialogDescription>
            Update this agent&apos;s personality and voice settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-3 border-b border-border/50 pb-6">
            <AgentAvatarUpload
              agentId={agent.id}
              character={character}
              image={avatarImage}
              disabled={isPending}
              onImageChange={setAvatarImage}
            />
            <p className="max-w-sm text-center text-xs text-muted-foreground">
              Upload a profile picture to personnalize your chat.
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Personality</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {selectableCharacters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => setCharacter(item.id)}
                  className={cn(
                    'group relative h-32 overflow-hidden rounded-xl border text-left transition-all disabled:opacity-50',
                    character === item.id
                      ? 'border-foreground/30 ring-2 ring-foreground/15'
                      : 'border-border hover:border-foreground/15'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.label}
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="font-display text-lg leading-none text-white">
                      {item.label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-white/80">
                      {item.tagline}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {character === 'CUSTOM' ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor={`edit-agent-custom-prompt-${agent.id}`}>
                  Character prompt
                </Label>
                <Textarea
                  id={`edit-agent-custom-prompt-${agent.id}`}
                  rows={6}
                  placeholder="Describe how your agent should speak — tone, style, boundaries, and any rules you want it to follow."
                  value={customCharacterPrompt}
                  maxLength={8000}
                  disabled={isPending}
                  onChange={(e) => setCustomCharacterPrompt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                This replaces the personality presets. Your agent still
                uses Humaner intelligence.
                </p>
              </div>
            ) : (
              <p className="mt-2 rounded-md bg-secondary/50 p-2.5 text-xs italic text-muted-foreground">
                &ldquo;{CHARACTER_META[character].example}&rdquo;
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 sm:items-center">
            <Label htmlFor={`edit-agent-name-${agent.id}`}>Name</Label>
            <RoleFieldLabel
              htmlFor={`edit-agent-role-${agent.id}`}
              showRoleId={`edit-show-role-${agent.id}`}
              showRole={showRole}
              disabled={isPending}
              onShowRoleChange={setShowRole}
            />
            <Input
              id={`edit-agent-name-${agent.id}`}
              value={name}
              maxLength={255}
              disabled={isPending}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              id={`edit-agent-role-${agent.id}`}
              placeholder={DEFAULT_AGENT_ROLE}
              value={role}
              maxLength={255}
              disabled={isPending}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          {character !== 'CUSTOM' ? (
            <AgentPersonalityTuning
              character={character}
              verbosity={verbosity}
              formality={formality}
              emojiMode={emojiMode}
              openerStyle={openerStyle}
              allowTypos={allowTypos}
              disabled={isPending}
              onVerbosityChange={setVerbosity}
              onFormalityChange={setFormality}
              onEmojiModeChange={setEmojiMode}
              onOpenerStyleChange={setOpenerStyle}
              onAllowTyposChange={setAllowTypos}
            />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`edit-agent-greeting-${agent.id}`}>
              Greeting message
            </Label>
            <Textarea
              id={`edit-agent-greeting-${agent.id}`}
              rows={2}
              placeholder={greetingPlaceholder}
              value={greetingMessage}
              maxLength={500}
              disabled={isPending}
              onChange={(e) => setGreetingMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shown when the widget, hosted link, or React component opens.
              Leave blank to use the default for this personality.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-agent-fallback-${agent.id}`}>
              Fallback message
            </Label>
            <Textarea
              id={`edit-agent-fallback-${agent.id}`}
              rows={2}
              placeholder={DEFAULT_FALLBACK_MESSAGE}
              value={fallbackMessage}
              maxLength={2000}
              disabled={isPending}
              onChange={(e) => setFallbackMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            loading={isPending}
            disabled={!canSubmit || isPending}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

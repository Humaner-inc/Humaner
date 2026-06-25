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
import { toast } from 'sonner';

import { updateAgent } from '@/actions/agents/update-agent';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AgentListItem } from '@/data/agents/get-agents';
import {
  CHARACTER_LIST,
  CHARACTER_META,
  EMOJI_OPTIONS,
  FORMALITY_OPTIONS,
  OPENER_OPTIONS,
  VERBOSITY_OPTIONS
} from '@/lib/character-presets';
import { cn } from '@/lib/utils';

const DEFAULT_FALLBACK =
  "I don't have that information yet. A team member will follow up shortly.";

export type EditAgentDialogProps = {
  agent: AgentListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditAgentDialog({
  agent,
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
    agent.fallbackMessage === DEFAULT_FALLBACK ? '' : agent.fallbackMessage
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
      agent.fallbackMessage === DEFAULT_FALLBACK ? '' : agent.fallbackMessage
    );
  }, [agent, open]);

  const canSubmit = name.trim().length > 0 && role.trim().length > 0;

  const handleSave = (): void => {
    if (!canSubmit) {
      return;
    }
    startTransition(async () => {
      const result = await updateAgent({
        id: agent.id,
        name,
        role,
        character,
        verbosity,
        formality,
        emojiMode,
        openerStyle,
        allowTypos,
        fallbackMessage: fallbackMessage.trim() || undefined
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
            Edit character
          </DialogTitle>
          <DialogDescription>
            Update this agent&apos;s personality and voice settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="mb-2 block">Character</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CHARACTER_LIST.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => setCharacter(item.id)}
                  className={cn(
                    'group relative h-32 overflow-hidden rounded-xl border text-left transition-all disabled:opacity-50',
                    character === item.id
                      ? 'border-primary ring-2 ring-primary'
                      : 'border-border hover:border-primary/50'
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
            <p className="mt-2 rounded-md bg-secondary/50 p-2.5 text-xs italic text-muted-foreground">
              &ldquo;{CHARACTER_META[character].example}&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-agent-name-${agent.id}`}>Name</Label>
              <Input
                id={`edit-agent-name-${agent.id}`}
                value={name}
                maxLength={255}
                disabled={isPending}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-agent-role-${agent.id}`}>Role</Label>
              <Input
                id={`edit-agent-role-${agent.id}`}
                value={role}
                maxLength={255}
                disabled={isPending}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <SegmentedControl
              label="Verbosity"
              options={VERBOSITY_OPTIONS}
              value={verbosity}
              onChange={setVerbosity}
              disabled={isPending}
            />
            <SegmentedControl
              label="Formality"
              options={FORMALITY_OPTIONS}
              value={formality}
              onChange={setFormality}
              disabled={isPending}
            />
            <SegmentedControl
              label="Emoji"
              options={EMOJI_OPTIONS}
              value={emojiMode}
              onChange={setEmojiMode}
              disabled={isPending}
            />
            <SegmentedControl
              label="Opener"
              options={OPENER_OPTIONS}
              value={openerStyle}
              onChange={setOpenerStyle}
              disabled={isPending}
            />
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Realistic typos</p>
                <p className="text-xs text-muted-foreground">
                  Occasional human typos for max authenticity.
                </p>
              </div>
              <Switch
                checked={allowTypos}
                onCheckedChange={setAllowTypos}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-agent-fallback-${agent.id}`}>
              Fallback message
            </Label>
            <Textarea
              id={`edit-agent-fallback-${agent.id}`}
              rows={2}
              placeholder="Leave blank to use the default fallback."
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

type SegmentedControlProps<T extends string> = {
  label: string;
  options: { value: T; label: string; hint: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg border px-2 py-2 text-center transition-colors disabled:opacity-50',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <span className="block text-xs font-medium">{option.label}</span>
            <span className="block text-[10px] text-muted-foreground">
              {option.hint}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

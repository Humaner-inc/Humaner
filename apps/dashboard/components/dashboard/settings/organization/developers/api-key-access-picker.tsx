'use client';

import * as React from 'react';
import {
  KeyRoundIcon,
  LockKeyholeIcon,
  type AnimatedIconHandle
} from '@humaner/shared/icons';
import { AnimatePresence, motion } from 'motion/react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioCardItem, RadioCards } from '@/components/ui/radio-card';
import {
  API_KEY_SCOPE_OPTIONS,
  type ApiKeyAccessMode,
  type ApiKeyScope
} from '@/lib/auth/api-key-scopes';
import { cn } from '@/lib/utils';

const FADE = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

const ACCESS_CARD_SURFACE = 'rounded-xl';

const SCOPE_CARD_SURFACE = 'rounded-xl';

const ACCESS_OPTIONS = [
  {
    id: 'full' as const,
    label: 'Full access',
    description: 'Mailbox, calendar, and Intelligence.',
    Icon: KeyRoundIcon
  },
  {
    id: 'scoped' as const,
    label: 'Scoped',
    description: 'Limit this key to the permissions you pick, nothing else.',
    Icon: LockKeyholeIcon
  }
] as const;

type AccessSurface = 'light' | 'dark' | 'adaptive';

const SELECTED_CARD: Record<AccessSurface, string> = {
  light:
    '!overflow-visible !border-[#0A0D0D] !bg-[#0A0D0D] !text-[#fcf4ec] data-[state=checked]:!border-[#0A0D0D] data-[state=checked]:!bg-[#0A0D0D]',
  dark: '!overflow-visible !border-[#fcf4ec] !bg-[#fcf4ec] !text-[#0A0D0D] data-[state=checked]:!border-[#fcf4ec] data-[state=checked]:!bg-[#fcf4ec]',
  adaptive:
    '!overflow-visible !border-[#0A0D0D] !bg-[#0A0D0D] !text-[#fcf4ec] data-[state=checked]:!border-[#0A0D0D] data-[state=checked]:!bg-[#0A0D0D] dark:!border-[#fcf4ec] dark:!bg-[#fcf4ec] dark:!text-[#0A0D0D] dark:data-[state=checked]:!border-[#fcf4ec] dark:data-[state=checked]:!bg-[#fcf4ec]'
};

const IDLE_CARD: Record<AccessSurface, string> = {
  light:
    '!overflow-visible !border-[#0A0D0D]/30 !bg-transparent hover:!border-[#0A0D0D]/55',
  dark: '!overflow-visible !border-white/25 !bg-transparent hover:!border-white/45',
  adaptive:
    '!overflow-visible !border-[#0A0D0D]/30 !bg-transparent hover:!border-[#0A0D0D]/55 dark:!border-white/25 dark:hover:!border-white/45'
};

const SELECTED_FG: Record<AccessSurface, string> = {
  light: '!text-[#fcf4ec]',
  dark: '!text-[#0A0D0D]',
  adaptive: '!text-[#fcf4ec] dark:!text-[#0A0D0D]'
};

const SELECTED_MUTED: Record<AccessSurface, string> = {
  light: '!text-[#fcf4ec]/65',
  dark: '!text-[#0A0D0D]/60',
  adaptive: '!text-[#fcf4ec]/65 dark:!text-[#0A0D0D]/60'
};

const SELECTED_SCOPE =
  'border-[#226342] bg-[color-mix(in_srgb,#226342_16%,transparent)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06)] ring-1 ring-[#226342]/30';

const IDLE_SCOPE: Record<AccessSurface, string> = {
  light:
    'border-[#0A0D0D]/20 bg-transparent hover:border-[#0A0D0D]/35 hover:bg-[#0A0D0D]/[0.03]',
  dark: 'border-white/20 bg-transparent hover:border-white/35 hover:bg-white/[0.04]',
  adaptive:
    'border-[#0A0D0D]/20 bg-transparent hover:border-[#0A0D0D]/35 hover:bg-[#0A0D0D]/[0.03] dark:border-white/20 dark:hover:border-white/35 dark:hover:bg-white/[0.04]'
};

export function ApiKeyAccessPicker({
  access,
  scopes,
  onAccessChange,
  onScopesChange,
  disabled = false,
  surface = 'adaptive',
  labelClassName,
  mutedClassName,
  radioClassName,
  iconClassName,
  titleClassName
}: {
  access: ApiKeyAccessMode;
  scopes: ApiKeyScope[];
  onAccessChange: (access: ApiKeyAccessMode) => void;
  onScopesChange: (scopes: ApiKeyScope[]) => void;
  disabled?: boolean;
  surface?: AccessSurface;
  labelClassName?: string;
  mutedClassName?: string;
  radioClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
}): React.JSX.Element {
  const toggleScope = React.useCallback(
    (scope: ApiKeyScope, checked: boolean) => {
      if (checked) {
        onScopesChange(
          API_KEY_SCOPE_OPTIONS.map((option) => option.id).filter(
            (id) => id === scope || scopes.includes(id)
          )
        );
        return;
      }
      onScopesChange(scopes.filter((current) => current !== scope));
    },
    [onScopesChange, scopes]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className={labelClassName}>Access</Label>
        <RadioCards
          value={access}
          onValueChange={(value) => {
            const next = value as ApiKeyAccessMode;
            onAccessChange(next);
            if (next === 'full') {
              onScopesChange([]);
            }
          }}
          className="grid grid-cols-2 gap-2"
          disabled={disabled}
          aria-label="API key access"
        >
          {ACCESS_OPTIONS.map((option) => (
            <AccessOptionCard
              key={option.id}
              option={option}
              selected={access === option.id}
              surface={surface}
              mutedClassName={mutedClassName}
              radioClassName={radioClassName}
              iconClassName={iconClassName}
              titleClassName={titleClassName}
            />
          ))}
        </RadioCards>
      </div>
      <AnimatePresence initial={false}>
        {access === 'scoped' ? (
          <motion.div
            key="scopes"
            initial={{ opacity: 0, filter: 'blur(2px)', height: 0 }}
            animate={{ opacity: 1, filter: 'blur(0px)', height: 'auto' }}
            exit={{ opacity: 0, filter: 'blur(2px)', height: 0 }}
            transition={FADE}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 pt-0.5">
              <Label className={cn('pb-0.5', labelClassName)}>
                Permissions
              </Label>
              {API_KEY_SCOPE_OPTIONS.map((option) => {
                const checked = scopes.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={cn(
                      SCOPE_CARD_SURFACE,
                      'group flex cursor-pointer items-start gap-3 border px-3.5 py-3 transition-all duration-200',
                      'focus-within:ring-2 focus-within:ring-[#226342]/25 focus-within:ring-offset-2 focus-within:ring-offset-background',
                      checked ? SELECTED_SCOPE : IDLE_SCOPE[surface],
                      disabled && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      className={cn(
                        'mt-0.5',
                        checked &&
                          'border-[#226342] data-[state=checked]:border-[#226342] data-[state=checked]:bg-[#226342] data-[state=checked]:text-[#fcf4ec]'
                      )}
                      onCheckedChange={(value) => {
                        toggleScope(option.id, value === true);
                      }}
                    />
                    <span className="min-w-0">
                      <span className="text-sm font-semibold leading-none">
                        {option.label}
                      </span>
                      <span
                        className={cn(
                          'mt-1 block text-xs leading-relaxed',
                          mutedClassName
                        )}
                      >
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AccessOptionCard({
  option,
  selected,
  surface,
  mutedClassName,
  radioClassName,
  iconClassName,
  titleClassName
}: {
  option: (typeof ACCESS_OPTIONS)[number];
  selected: boolean;
  surface: AccessSurface;
  mutedClassName?: string;
  radioClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
}): React.JSX.Element {
  const iconRef = React.useRef<AnimatedIconHandle>(null);
  const { Icon, label, description } = option;

  return (
    <RadioCardItem
      value={option.id}
      checkClassName="hidden"
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      className={cn(
        ACCESS_CARD_SURFACE,
        'flex min-h-[8.75rem] flex-col items-start justify-between gap-3 px-4 py-4 text-left shadow-none transition-all duration-200',
        radioClassName,
        selected ? SELECTED_CARD[surface] : IDLE_CARD[surface]
      )}
    >
      <Icon
        ref={iconRef}
        animateOnHover={false}
        className={cn(
          'size-6 shrink-0 transition-colors',
          selected
            ? SELECTED_FG[surface]
            : (iconClassName ?? 'text-muted-foreground')
        )}
      />
      <div className="space-y-1.5">
        <p
          className={cn(
            'text-sm font-semibold leading-none tracking-tight',
            selected ? SELECTED_FG[surface] : titleClassName
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'text-xs leading-relaxed',
            selected ? SELECTED_MUTED[surface] : mutedClassName
          )}
        >
          {description}
        </p>
      </div>
    </RadioCardItem>
  );
}

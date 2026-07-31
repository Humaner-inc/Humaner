'use client';

import { useEffectEvent } from 'react';
import * as React from 'react';

import { MINIMUM_PASSWORD_LENGTH } from '@/constants/limits';
import { passwordValidator } from '@/lib/auth/password';
import { cn } from '@/lib/utils';
import type { Maybe } from '@/types/maybe';

export type PasswordRequirementListProps = {
  password: Maybe<string>;
};

type RequirementId = 'case' | 'length' | 'number';

type Requirement = {
  id: RequirementId;
  met: boolean;
  label: string;
};

type DismissPhase = 'green' | 'fading' | 'gone';

/** Time to show green before opacity starts falling. */
const GREEN_HOLD_MS = 420;
/** Fade duration after the green hold. */
const FADE_OUT_MS = 480;

function getRequirements(password: Maybe<string>): Requirement[] {
  return [
    {
      id: 'case',
      met: passwordValidator.containsLowerAndUpperCase(password),
      label: 'Mix of uppercase & lowercase letters'
    },
    {
      id: 'length',
      met: passwordValidator.hasMinimumLength(password),
      label: `Minimum ${MINIMUM_PASSWORD_LENGTH} characters long`
    },
    {
      id: 'number',
      met: passwordValidator.containsNumber(password),
      label: 'Contain at least 1 number'
    }
  ];
}

export function PasswordRequirementList({
  password
}: PasswordRequirementListProps): React.JSX.Element | null {
  const requirements = getRequirements(password);
  const [phases, setPhases] = React.useState<
    Partial<Record<RequirementId, DismissPhase>>
  >({});
  const timersRef = React.useRef<
    Partial<Record<RequirementId, ReturnType<typeof setTimeout>[]>>
  >({});
  const startedRef = React.useRef<Partial<Record<RequirementId, boolean>>>({});

  const clearTimers = useEffectEvent((id: RequirementId): void => {
    const timers = timersRef.current[id];
    if (timers) {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      delete timersRef.current[id];
    }
    delete startedRef.current[id];
  });

  const startDismiss = useEffectEvent((id: RequirementId): void => {
    if (startedRef.current[id]) return;
    startedRef.current[id] = true;

    setPhases((prev) => ({ ...prev, [id]: 'green' }));

    const fadeTimer = setTimeout(() => {
      setPhases((prev) => ({ ...prev, [id]: 'fading' }));
    }, GREEN_HOLD_MS);

    const goneTimer = setTimeout(() => {
      setPhases((prev) => ({ ...prev, [id]: 'gone' }));
      delete timersRef.current[id];
    }, GREEN_HOLD_MS + FADE_OUT_MS);

    timersRef.current[id] = [fadeTimer, goneTimer];
  });

  React.useEffect(() => {
    for (const requirement of getRequirements(password)) {
      if (!requirement.met) {
        clearTimers(requirement.id);
        setPhases((prev) => {
          if (!prev[requirement.id]) return prev;
          const next = { ...prev };
          delete next[requirement.id];
          return next;
        });
        continue;
      }

      startDismiss(requirement.id);
    }
  }, [password, clearTimers, startDismiss]);

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of Object.keys(timers) as RequirementId[]) {
        clearTimers(id);
      }
    };
  }, [clearTimers]);

  const visible = requirements.filter(
    (requirement) => phases[requirement.id] !== 'gone'
  );

  if (visible.length === 0) {
    return null;
  }

  return (
    <ul className="list-none space-y-1 pb-2">
      {visible.map((requirement) => {
        const phase = phases[requirement.id];
        const isMet = requirement.met || Boolean(phase);
        const isFading = phase === 'fading';

        return (
          <li
            key={requirement.id}
            className={cn(
              'flex flex-row items-center px-4 transition-[opacity,color,transform] ease-out',
              isMet
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground',
              isFading && 'translate-y-0.5 opacity-0'
            )}
            style={{
              transitionDuration: isFading ? `${FADE_OUT_MS}ms` : '300ms'
            }}
          >
            <BulletPointIcon met={isMet} />
            <p className="text-sm">{requirement.label}</p>
          </li>
        );
      })}
    </ul>
  );
}

function BulletPointIcon({ met }: { met: boolean }): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="5"
      height="5"
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      className={cn(
        'mr-2 inline-block transition-colors duration-300',
        met ? 'text-emerald-600 dark:text-emerald-400' : undefined
      )}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
      />
    </svg>
  );
}

'use client';

import * as React from 'react';
import { CheckIcon } from '@humaner/shared/icons';
import { AnimatePresence, motion } from 'motion/react';

import { MINIMUM_PASSWORD_LENGTH } from '@/constants/limits';
import { passwordValidator } from '@/lib/auth/password-validator';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';
import type { Maybe } from '@/types/maybe';

export type PasswordRequirementListProps = {
  password: Maybe<string>;
};

type Requirement = {
  met: boolean;
  missingLabel: string;
};

function getRequirements(password: Maybe<string>): Requirement[] {
  return [
    {
      met: passwordValidator.containsLowerAndUpperCase(password),
      missingLabel: 'uppercase & lowercase'
    },
    {
      met: passwordValidator.hasMinimumLength(password),
      missingLabel: `${MINIMUM_PASSWORD_LENGTH} characters`
    },
    {
      met: passwordValidator.containsNumber(password),
      missingLabel: 'a number'
    }
  ];
}

function formatMissingLabel(missing: string[]): string {
  if (missing.length === 1) {
    return `Missing ${missing[0]}`;
  }
  if (missing.length === 2) {
    return `Missing ${missing[0]} or ${missing[1]}`;
  }
  return `Missing ${missing.slice(0, -1).join(', ')}, or ${missing[missing.length - 1]}`;
}

/**
 * Compact password hints (Cloud + Self-Host):
 * - Empty → nothing
 * - Incomplete → "Missing x" / "Missing x or y"
 * - Complete → check + "All requirements met"
 * Text shifts left → right when the hint changes.
 */
export function PasswordRequirementList({
  password
}: PasswordRequirementListProps): React.JSX.Element {
  const oss = isOssDeployment();
  const requirements = getRequirements(password);
  const missing = requirements
    .filter((requirement) => !requirement.met)
    .map((requirement) => requirement.missingLabel);

  const complete = Boolean(password) && missing.length === 0;
  const label = !password
    ? null
    : complete
      ? 'All requirements met'
      : formatMissingLabel(missing);

  return (
    <div
      className={cn(
        'relative overflow-hidden px-0.5 transition-[height] duration-200',
        label ? 'h-5' : 'h-0'
      )}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {label ? (
          <motion.p
            key={label}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 14 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute inset-x-0 top-0 flex items-center gap-1.5 text-sm',
              complete
                ? oss
                  ? 'text-emerald-600'
                  : 'text-emerald-400'
                : oss
                  ? 'text-zinc-500'
                  : 'text-white/40'
            )}
          >
            {complete ? (
              <CheckIcon
                className="size-3.5 shrink-0"
                strokeWidth={2.5}
              />
            ) : null}
            <span className="truncate">{label}</span>
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

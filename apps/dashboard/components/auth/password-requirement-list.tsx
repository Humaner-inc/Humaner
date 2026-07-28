import * as React from 'react';

import { MINIMUM_PASSWORD_LENGTH } from '@/constants/limits';
import { passwordValidator } from '@/lib/auth/password';
import type { Maybe } from '@/types/maybe';

export type PasswordRequirementListProps = {
  password: Maybe<string>;
};

type Requirement = {
  id: string;
  met: boolean;
  label: string;
};

export function PasswordRequirementList({
  password
}: PasswordRequirementListProps): React.JSX.Element | null {
  const requirements: Requirement[] = [
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

  const unmet = requirements.filter((requirement) => !requirement.met);
  if (unmet.length === 0) {
    return null;
  }

  return (
    <ul className="list-none space-y-1 pb-2">
      {unmet.map((requirement) => (
        <li
          key={requirement.id}
          className="flex flex-row items-center px-4 text-muted-foreground"
        >
          <BulletPointIcon />
          <p className="text-sm">{requirement.label}</p>
        </li>
      ))}
    </ul>
  );
}

function BulletPointIcon(): React.JSX.Element {
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
      className="mr-2 inline-block"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
      />
    </svg>
  );
}

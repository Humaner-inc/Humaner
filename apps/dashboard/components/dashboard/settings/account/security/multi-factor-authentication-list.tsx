'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { toast } from 'sonner';

import { generateTotpSetupData } from '@/actions/account/generate-totp-setup-data';
import { DisableAuthenticatorAppModal } from '@/components/dashboard/settings/account/security/disable-authenticator-app-modal';
import { EnableAuthenticatorAppModal } from '@/components/dashboard/settings/account/security/enable-authenticator-app-modal';
import { RecoveryCodesModal } from '@/components/dashboard/settings/account/security/recovery-codes-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  AuthenticatorAppDto,
  MultiFactorAuthenticationDto
} from '@/types/dtos/multi-factor-authentication-dto';

export type MultiFactorAuthenticationListProps =
  React.HtmlHTMLAttributes<HTMLUListElement> & MultiFactorAuthenticationDto;

export function MultiFactorAuthenticationList({
  authenticatorApp,
  className,
  ...other
}: MultiFactorAuthenticationListProps): React.JSX.Element {
  return (
    <ul
      role="list"
      className={cn('m-0 list-none divide-y p-0', className)}
      {...other}
    >
      <AuthenticatorAppListItem authenticatorApp={authenticatorApp} />
    </ul>
  );
}

type MultiFactorAuthenticationListItemProps =
  React.HtmlHTMLAttributes<HTMLLIElement> & {
    authenticatorApp?: AuthenticatorAppDto;
  };

function AuthenticatorAppListItem({
  authenticatorApp,
  className,
  ...other
}: MultiFactorAuthenticationListItemProps): React.JSX.Element {
  const isEnabled = !!authenticatorApp;
  const handleShowEnableAuthenticatorAppModal = async (): Promise<void> => {
    const result = await generateTotpSetupData();
    if (result?.data) {
      const recoveryCodes: string[] = await NiceModal.show(
        EnableAuthenticatorAppModal,
        {
          accountName: result.data.accountName,
          issuer: result.data.issuer,
          secret: result.data.secret,
          keyUri: result.data.keyUri,
          dataUri: result.data.dataUri
        }
      );
      if (recoveryCodes) {
        NiceModal.show(RecoveryCodesModal, { recoveryCodes });
      }
    } else {
      toast.error("Couldn't generate TOTP setup data");
    }
  };
  const handleShowDisableAuthenticatorAppModal = (): void => {
    NiceModal.show(DisableAuthenticatorAppModal);
  };
  return (
    <li
      role="listitem"
      className={cn('flex w-full flex-row justify-between p-6', className)}
      {...other}
    >
      <div className="flex min-w-0 flex-row items-center gap-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19.4182 21.5453L19.5047 1.71902C19.5047 0.77099 18.6857 0 17.6780 0H6.71821C5.71049 0 4.89157 0.77099 4.89157 1.71902V21.7442C6.91486 23.2188 9.44835 24 12.1981 24C14.9480 24 17.3952 23.0218 19.4182 21.5453Z"
            fill="currentColor"
            className="text-black dark:text-neutral-300"
          />
          <path
            d="M5.49157 1.44376H18.6916V16.1729H5.49157V1.44376Z"
            fill="currentColor"
            className="text-neutral-400 dark:text-neutral-950"
          />
          <path
            d="M18.6916 22.0312V16.1729H5.49157V22.1536C7.36638 23.4046 9.65863 24 12.1099 24C14.7742 24 16.8170 23.2847 18.6916 22.0312Z"
            fill="currentColor"
            className="text-neutral-100 dark:text-neutral-900"
          />
          <path
            d="M14.7660 18.7587H9.90357C9.45714 18.7587 9.09157 19.1108 9.09157 19.5458C9.09157 19.9808 9.45714 20.3329 9.90357 20.3329H14.7660C15.2125 20.3329 15.5780 19.9808 15.5780 19.5458C15.5780 19.1091 15.2125 18.7587 14.7660 18.7587Z"
            fill="currentColor"
            className="text-black dark:text-neutral-700"
          />
        </svg>
        <div className="flex min-w-0 flex-1 flex-col">
          <h5 className="overflow-hidden truncate text-sm font-medium">
            Authenticator app
          </h5>
          <div className="overflow-hidden truncate text-sm text-muted-foreground">
            {isEnabled ? 'Enabled' : 'Not enabled'}
          </div>
        </div>
      </div>
      {isEnabled ? (
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={handleShowDisableAuthenticatorAppModal}
        >
          Disable
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={handleShowEnableAuthenticatorAppModal}
        >
          Enable
        </Button>
      )}
    </li>
  );
}

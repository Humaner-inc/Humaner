'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { toast } from 'sonner';

import { generateTotpSetupData } from '@/actions/account/generate-totp-setup-data';
import { DisableAuthenticatorAppModal } from '@/components/dashboard/settings/account/security/disable-authenticator-app-modal';
import { EnableAuthenticatorAppModal } from '@/components/dashboard/settings/account/security/enable-authenticator-app-modal';
import { RecoveryCodesModal } from '@/components/dashboard/settings/account/security/recovery-codes-modal';
import { Button } from '@/components/ui/button';
import {
  FingerprintIcon,
  type FingerprintIconHandle
} from '@/components/ui/fingerprint-icon';
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
  const iconRef = React.useRef<FingerprintIconHandle>(null);
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
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      {...other}
    >
      <div className="flex min-w-0 flex-row items-center gap-4">
        <FingerprintIcon
          ref={iconRef}
          size={24}
          className="shrink-0 text-foreground"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <h5 className="overflow-hidden truncate text-sm font-medium">
            Authenticator app
          </h5>
          <div className="overflow-hidden truncate text-sm text-muted-foreground">
            {isEnabled
              ? 'Enabled — required at sign-in'
              : 'Not enabled — highly recommended for owners'}
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

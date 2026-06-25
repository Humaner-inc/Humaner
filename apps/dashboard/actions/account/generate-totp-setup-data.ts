'use server';

import { authenticator } from 'otplib';
import qrcode from 'qrcode';

import { authActionClient } from '@/actions/safe-action';
import { AppInfo } from '@/constants/app-info';

export const generateTotpSetupData = authActionClient
  .metadata({ actionName: 'generateTotpSetupData' })
  .action(async ({ ctx: { session } }) => {
    const secret = authenticator.generateSecret(20);
    const accountName = session.user.email;
    const issuer = AppInfo.APP_NAME;
    const keyUri = authenticator.keyuri(accountName, issuer, secret);
    const dataUri = await qrcode.toDataURL(keyUri, {
      errorCorrectionLevel: 'low'
    });

    return { accountName, issuer, secret, keyUri, dataUri };
  });

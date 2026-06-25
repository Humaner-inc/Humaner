'use client';

import Link from 'next/link';
import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { CopyIcon, InfoIcon } from 'lucide-react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { enableAuthenticatorApp } from '@/actions/account/enable-authenticator-app';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp';
import { MediaQueries } from '@/constants/media-queries';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  enableAuthenticatorAppSchema,
  type EnableAuthenticatorAppSchema
} from '@/schemas/account/enable-authenticator-app-schema';

export type EnableAuthenticatorAppModalProps = NiceModalHocProps & {
  accountName: string;
  issuer: string;
  secret: string;
  dataUri: string;
};

export const EnableAuthenticatorAppModal =
  NiceModal.create<EnableAuthenticatorAppModalProps>(
    ({ accountName, issuer, secret, dataUri }) => {
      const modal = useEnhancedModal();
      const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
      const methods = useZodForm({
        schema: enableAuthenticatorAppSchema,
        mode: 'onSubmit',
        defaultValues: {
          accountName,
          issuer,
          secret,
          totpCode: ''
        }
      });
      const copyToClipboard = useCopyToClipboard();
      const title = 'Authenticator app';
      const description =
        'Add an authenticator app by filling out the form below.';
      const canSubmit =
        !methods.formState.isSubmitting && methods.formState.isValid;
      const handleCopySecret = async (): Promise<void> => {
        await copyToClipboard(secret);
        toast.success('Copied!');
      };
      const onSubmit: SubmitHandler<EnableAuthenticatorAppSchema> = async (
        values
      ) => {
        if (!canSubmit) {
          return;
        }

        const result = await enableAuthenticatorApp(values);
        if (!result?.serverError && !result?.validationErrors && result?.data) {
          toast.success('Authenticator app enabled');
          modal.resolve(result.data.recoveryCodes);
          modal.handleClose();
        } else {
          if (result?.validationErrors?.totpCode?._errors?.[0]) {
            methods.setError('totpCode', {
              message: result.validationErrors.totpCode._errors[0]
            });
          } else {
            toast.error("Couldn't enable authenticator app");
          }
        }
      };
      const renderForm = (
        <form
          className={cn('space-y-4', !mdUp && 'p-4')}
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <p className="text-sm text-muted-foreground">
            Using an authenticator app like{' '}
            <Link
              href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              Google Authenticator
            </Link>
            ,{' '}
            <Link
              href="https://www.microsoft.com/en-us/security/mobile-authenticator-app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              Microsoft Authenticator
            </Link>
            ,{' '}
            <Link
              href="https://authy.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              Authy
            </Link>{' '}
            or{' '}
            <Link
              href="https://1password.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              1Password
            </Link>{' '}
            scan this QR code. It will generate a 6 digit code for you to enter
            below.
          </p>
          <div>
            <div className="mx-auto size-48">
              <img
                src={dataUri}
                alt="QR code"
              />
            </div>
            <div className="mx-auto flex flex-row items-center justify-center gap-2 text-xs font-semibold">
              {secret}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleCopySecret}
              >
                <CopyIcon className="size-4 shrink-0" />
              </Button>
            </div>
          </div>
          <FormField
            control={methods.control}
            name="totpCode"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col items-center">
                <FormLabel>Enter 6-digit code from the app</FormLabel>
                <FormControl>
                  <InputOTP
                    {...field}
                    inputMode="numeric"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    disabled={methods.formState.isSubmitting}
                    onComplete={methods.handleSubmit(onSubmit)}
                  >
                    <InputOTPGroup>
                      {[...Array(6)].map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="size-12"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Alert variant="info">
            <div className="flex flex-row items-start gap-2">
              <InfoIcon className="mt-0.5 size-[18px] shrink-0" />
              <AlertDescription>
                If your app asks for an issuer use "
                <strong className="text-foreground">{issuer}</strong>" and for
                an account name use "
                <strong className="text-foreground">{accountName}</strong>".
              </AlertDescription>
            </div>
          </Alert>
        </form>
      );
      const renderButtons = (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={modal.handleClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={!canSubmit}
            loading={methods.formState.isSubmitting}
            onClick={methods.handleSubmit(onSubmit)}
          >
            Turn on
          </Button>
        </>
      );
      return (
        <FormProvider {...methods}>
          {mdUp ? (
            <Dialog open={modal.visible}>
              <DialogContent
                className="max-w-lg"
                onClose={modal.handleClose}
                onAnimationEndCapture={modal.handleAnimationEndCapture}
              >
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  <DialogDescription className="sr-only">
                    {description}
                  </DialogDescription>
                </DialogHeader>
                {renderForm}
                <DialogFooter>{renderButtons}</DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Drawer
              open={modal.visible}
              onOpenChange={modal.handleOpenChange}
            >
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle>{title}</DrawerTitle>
                  <DrawerDescription className="sr-only">
                    {description}
                  </DrawerDescription>
                </DrawerHeader>
                {renderForm}
                <DrawerFooter className="flex-col-reverse pt-4">
                  {renderButtons}
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
        </FormProvider>
      );
    }
  );

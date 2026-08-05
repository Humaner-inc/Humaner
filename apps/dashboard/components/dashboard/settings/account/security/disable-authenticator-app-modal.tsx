'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { disableAuthenticatorApp } from '@/actions/account/disable-authenticator-app';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import {
  disableAuthenticatorAppSchema,
  type DisableAuthenticatorAppSchema
} from '@/schemas/account/disable-authenticator-app-schema';

export type DisableAuthenticatorAppModalProps = NiceModalHocProps;

export const DisableAuthenticatorAppModal =
  NiceModal.create<DisableAuthenticatorAppModalProps>(() => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: disableAuthenticatorAppSchema,
      mode: 'onSubmit',
      defaultValues: {
        totpCode: ''
      }
    });
    const title = 'Disable authenticator app?';
    const description =
      'Enter the 6-digit code from your authenticator app to confirm.';
    const canSubmit =
      !methods.formState.isSubmitting &&
      methods.watch('totpCode').trim().length === 6;

    const onSubmit: SubmitHandler<DisableAuthenticatorAppSchema> = async (
      values
    ) => {
      if (!canSubmit) {
        return;
      }

      const result = await disableAuthenticatorApp(values);
      if (!result?.serverError && !result?.validationErrors) {
        toast.success('Authenticator app disabled');
        modal.handleClose();
        return;
      }

      if (result?.validationErrors?.totpCode?._errors?.[0]) {
        methods.setError('totpCode', {
          message: result.validationErrors.totpCode._errors[0]
        });
        methods.setValue('totpCode', '');
        return;
      }

      toast.error("Couldn't disable authenticator app");
    };

    const form = (
      <FormProvider {...methods}>
        <form
          className="flex flex-col items-center gap-3"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormField
            control={methods.control}
            name="totpCode"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col items-center">
                <FormLabel>Authenticator code</FormLabel>
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
        </form>
      </FormProvider>
    );

    const renderButtons = (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={modal.handleClose}
          disabled={methods.formState.isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!canSubmit}
          loading={methods.formState.isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
          Disable
        </Button>
      </>
    );

    return (
      <>
        {mdUp ? (
          <AlertDialog open={modal.visible}>
            <AlertDialogContent
              className="max-w-sm"
              onClose={modal.handleClose}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
              </AlertDialogHeader>
              {form}
              <AlertDialogFooter>{renderButtons}</AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Drawer
            open={modal.visible}
            onOpenChange={modal.handleOpenChange}
          >
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>{title}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
              </DrawerHeader>
              <div className="px-4">{form}</div>
              <DrawerFooter className="flex-col-reverse pt-4">
                {renderButtons}
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </>
    );
  });

'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { checkIfEmailIsAvailable } from '@/actions/account/check-if-email-is-available';
import { requestEmailChange } from '@/actions/account/request-email-change';
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
import { Input } from '@/components/ui/input';
import { MediaQueries } from '@/constants/media-queries';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  requestEmailChangeSchema,
  type RequestEmailChangeSchema
} from '@/schemas/account/request-email-change-schema';

export type ChangeEmailModalProps = NiceModalHocProps & {
  currentEmail: string;
};

export const ChangeEmailModal = NiceModal.create<ChangeEmailModalProps>(
  ({ currentEmail }) => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: requestEmailChangeSchema,
      mode: 'onSubmit',
      defaultValues: {
        email: ''
      }
    });
    const title = 'Change email address';
    const description = 'Enter your new email address and verify it';
    const canSubmit =
      !methods.formState.isSubmitting &&
      (!methods.formState.isSubmitted || methods.formState.isDirty);
    const onSubmit: SubmitHandler<RequestEmailChangeSchema> = async (
      values
    ) => {
      if (!canSubmit) {
        return;
      }
      const checkResult = await checkIfEmailIsAvailable({
        email: values.email
      });
      if (
        checkResult &&
        !checkResult.serverError &&
        !checkResult.validationErrors &&
        checkResult.data
      ) {
        if (checkResult.data.isAvailable) {
          const result = await requestEmailChange(values);
          if (!result?.serverError && !result?.validationErrors) {
            toast.success('Change request sent');
            modal.hide();
          } else {
            toast.error("Couldn't send request");
          }
        } else {
          methods.setError('email', {
            message: 'Email address is already taken.'
          });
        }
      } else {
        toast.error("Couldn't check availability");
      }
    };
    const renderForm = (
      <form
        className={cn('space-y-4', !mdUp && 'p-4')}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2 pt-2">
          <FormLabel required>Current email address</FormLabel>
          <Input
            type="email"
            required
            disabled
            value={currentEmail}
          />
        </div>
        <FormField
          control={methods.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <FormLabel required>New email address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  maxLength={255}
                  required
                  disabled={methods.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-sm text-muted-foreground">
          We will send a change request to your new email address. After
          clicking on the link in the email, you will be automatically logged
          out and and will need to login in again with your new email address.
        </p>
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
          Request change
        </Button>
      </>
    );
    return (
      <FormProvider {...methods}>
        {mdUp ? (
          <Dialog open={modal.visible}>
            <DialogContent
              className="max-w-sm"
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

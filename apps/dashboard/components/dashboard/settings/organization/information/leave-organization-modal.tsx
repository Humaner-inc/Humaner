'use client';

import * as React from 'react';
import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { assignTrustedNavigation } from '@humaner/shared/urls';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { leaveOrganization } from '@/actions/organization/leave-organization';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
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
  FormLabel
} from '@/components/ui/form';
import { MediaQueries } from '@/constants/media-queries';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  leaveOrganizationSchema,
  type LeaveOrganizationSchema
} from '@/schemas/organization/leave-organization-schema';

export type LeaveOrganizationModalProps = NiceModalHocProps & {
  workspaceName: string;
};

export const LeaveOrganizationModal =
  NiceModal.create<LeaveOrganizationModalProps>(({ workspaceName }) => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: leaveOrganizationSchema,
      mode: 'all',
      defaultValues: {
        statement: false
      }
    });
    const title = 'Leave workspace?';
    const description = `You will lose access to ${workspaceName}. Your account remains; you can join again if invited.`;
    const canSubmit =
      !methods.formState.isSubmitting &&
      methods.formState.isValid &&
      !!methods.watch('statement');

    const onSubmit: SubmitHandler<LeaveOrganizationSchema> = async (values) => {
      if (!canSubmit) {
        return;
      }
      const result = await leaveOrganization(values);
      if (!result) {
        return;
      }
      if (result.serverError || result.validationErrors) {
        toast.error(result.serverError ?? "Couldn't leave workspace");
        return;
      }
      toast.success('Left workspace');
      modal.handleClose();
      assignTrustedNavigation(result.data?.redirectTo ?? '/workspace');
    };

    const renderForm = (
      <form
        className={cn('space-y-4 text-sm leading-relaxed', !mdUp && 'px-4')}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <FormField
          control={methods.control}
          name="statement"
          render={({ field }) => (
            <FormItem className="mx-1 flex flex-row items-center gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(!!value)}
                  disabled={methods.formState.isSubmitting}
                />
              </FormControl>
              <FormLabel className="cursor-pointer leading-snug">
                I understand I will lose access to this workspace.
              </FormLabel>
            </FormItem>
          )}
        />
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
          variant="destructive"
          disabled={!canSubmit}
          loading={methods.formState.isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
          Leave workspace
        </Button>
      </>
    );

    return (
      <FormProvider {...methods}>
        {mdUp ? (
          <AlertDialog open={modal.visible}>
            <AlertDialogContent
              className="max-w-md"
              onClose={modal.handleClose}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
              </AlertDialogHeader>
              {renderForm}
              <DialogFooter>{renderButtons}</DialogFooter>
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
              {renderForm}
              <DrawerFooter className="flex-col-reverse pt-4">
                {renderButtons}
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </FormProvider>
    );
  });

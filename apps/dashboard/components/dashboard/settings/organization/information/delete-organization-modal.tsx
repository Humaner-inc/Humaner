'use client';

import * as React from 'react';
import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { deleteOrganization } from '@/actions/organization/delete-organization';
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
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MediaQueries } from '@/constants/media-queries';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  deleteOrganizationSchema,
  type DeleteOrganizationSchema
} from '@/schemas/organization/delete-organization-schema';

export type DeleteOrganizationModalProps = NiceModalHocProps & {
  workspaceName: string;
};

export const DeleteOrganizationModal =
  NiceModal.create<DeleteOrganizationModalProps>(({ workspaceName }) => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: deleteOrganizationSchema,
      mode: 'all',
      defaultValues: {
        statement: false,
        name: ''
      }
    });
    const title = 'Delete workspace?';
    const description =
      'This permanently deletes the workspace, agents, knowledge, inbox data, and memberships. Your account stays; you can create or join another workspace later.';
    const canSubmit =
      !methods.formState.isSubmitting &&
      methods.formState.isValid &&
      !!methods.watch('statement') &&
      methods.watch('name').trim().length > 0;

    const onSubmit: SubmitHandler<DeleteOrganizationSchema> = async (
      values
    ) => {
      if (!canSubmit) {
        return;
      }
      const result = await deleteOrganization(values);
      if (!result) {
        return;
      }
      if (result.serverError || result.validationErrors) {
        toast.error(result.serverError ?? "Couldn't delete workspace");
        return;
      }
      toast.success('Workspace deleted');
      modal.handleClose();
      window.location.href = result.data?.redirectTo ?? '/workspace';
    };

    const renderForm = (
      <form
        className={cn('space-y-4 text-sm leading-relaxed', !mdUp && 'px-4')}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            Workspace name
          </p>
          <p className="mt-1 truncate font-mono text-sm">{workspaceName}</p>
        </div>

        <FormField
          control={methods.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Type the workspace name to confirm</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="off"
                  placeholder={workspaceName}
                  disabled={methods.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                I understand this workspace and its data will be permanently
                deleted.
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
          Delete workspace
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

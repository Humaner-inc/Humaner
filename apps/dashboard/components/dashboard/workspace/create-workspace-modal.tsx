'use client';

import * as React from 'react';
import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { createWorkspace } from '@/actions/workspaces/create-workspace';
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
  createWorkspaceSchema,
  type CreateWorkspaceSchema
} from '@/schemas/workspaces/workspace-schemas';

export type CreateWorkspaceModalProps = NiceModalHocProps;

export const CreateWorkspaceModal = NiceModal.create<CreateWorkspaceModalProps>(
  () => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const methods = useZodForm({
      schema: createWorkspaceSchema,
      mode: 'onSubmit',
      defaultValues: { website: '' }
    });

    const onSubmit: SubmitHandler<CreateWorkspaceSchema> = async (values) => {
      setIsSubmitting(true);
      const result = await createWorkspace(values);
      setIsSubmitting(false);

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error("Couldn't create workspace");
        return;
      }

      toast.success('Workspace created');
      modal.handleClose();
      if (result?.data?.redirectTo) {
        window.location.href = result.data.redirectTo;
      }
    };

    const renderForm = (
      <form
        className={cn('space-y-4', !mdUp && 'px-4')}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <FormField
          control={methods.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Business website</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="url"
                  placeholder="https://yourcompany.com"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
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
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isSubmitting}
          loading={isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
          Create workspace
        </Button>
      </>
    );

    return (
      <FormProvider {...methods}>
        {mdUp ? (
          <Dialog open={modal.visible}>
            <DialogContent
              className="max-w-md"
              onClose={modal.handleClose}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              <DialogHeader>
                <DialogTitle>Create workspace</DialogTitle>
                <DialogDescription>
                  Add another business. We&apos;ll use the website to name and
                  brand the workspace, then walk you through setup.
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
                <DrawerTitle>Create workspace</DrawerTitle>
                <DrawerDescription>
                  Add another business. We&apos;ll use the website to name and
                  brand the workspace, then walk you through setup.
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

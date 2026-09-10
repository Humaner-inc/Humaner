'use client';

import * as React from 'react';
import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { InfoIcon } from '@humaner/shared/icons';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { createWorkspace } from '@/actions/workspaces/create-workspace';
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

        <Alert variant="info">
          <div className="flex flex-row items-start gap-2">
            <InfoIcon className="mt-0.5 size-[18px] shrink-0" />
            <AlertDescription>
              Creating a new workspace will share your account&apos;s plan and
              credits. If you need a separate billing for this business create a
              new account.
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
          size="sm"
          className="h-8 rounded-none px-3 font-mono text-xs font-medium normal-case tracking-normal"
          onClick={modal.handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-none px-3 font-mono text-xs font-medium normal-case tracking-normal"
          disabled={isSubmitting}
          loading={isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
          Create
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
                  Add another business organization below.
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

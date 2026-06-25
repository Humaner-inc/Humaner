'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { WebhookTrigger } from '@prisma/client';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { createWebhook } from '@/actions/webhooks/create-webhook';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { webhookTriggerLabels } from '@/constants/labels';
import { MediaQueries } from '@/constants/media-queries';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  createWebhookSchema,
  type CreateWebhookSchema
} from '@/schemas/webhooks/create-webhook-schema';

function dec2hex(dec: number): string {
  return dec.toString(16).padStart(2, '0');
}

function generateId(len: number): string {
  const arr = new Uint8Array((len || 40) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join('');
}

export type CreateWebhookModalProps = NiceModalHocProps;

export const CreateWebhookModal = NiceModal.create<CreateWebhookModalProps>(
  () => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: createWebhookSchema,
      mode: 'onSubmit',
      defaultValues: {
        url: '',
        triggers: [
          WebhookTrigger.CONTACT_CREATED,
          WebhookTrigger.CONTACT_UPDATED,
          WebhookTrigger.CONTACT_DELETED
        ],
        secret: generateId(32)
      }
    });
    const title = 'Create webhook';
    const description = 'Create a new webhook by filling out the form below.';
    const canSubmit =
      !methods.formState.isSubmitting &&
      (!methods.formState.isSubmitted || methods.formState.isDirty);
    const onSubmit: SubmitHandler<CreateWebhookSchema> = async (values) => {
      if (!canSubmit) {
        return;
      }
      const result = await createWebhook(values);
      if (!result?.serverError && !result?.validationErrors) {
        toast.success('Webhook created');
        modal.handleClose();
      } else {
        toast.error("Couldn't create webhook");
      }
    };
    const renderForm = (
      <form
        className={cn('space-y-4', !mdUp && 'p-4')}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <FormField
          control={methods.control}
          name="url"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel required>POST URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  required
                  maxLength={2000}
                  disabled={methods.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={methods.control}
          name="triggers"
          render={({ field }) => (
            <div className="space-y-1.5">
              <FormLabel>Triggers</FormLabel>
              {Object.values(WebhookTrigger).map((value) => (
                <FormItem
                  key={value}
                  className="flex flex-row items-center gap-3 space-y-0"
                >
                  <FormControl>
                    <Checkbox
                      checked={field.value.includes(value)}
                      onCheckedChange={(e) =>
                        field.onChange(
                          e
                            ? [...field.value, value]
                            : field.value.filter((v) => v !== value)
                        )
                      }
                      disabled={methods.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">
                    {webhookTriggerLabels[value]}
                  </FormLabel>
                </FormItem>
              ))}
            </div>
          )}
        />
        <FormField
          control={methods.control}
          name="secret"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Secret</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  maxLength={1024}
                  disabled={methods.formState.isSubmitting}
                  {...field}
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
          Create
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

'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { addYears, format, isBefore, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { createApiKey } from '@/actions/api-keys/create-api-key';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { MediaQueries } from '@/constants/media-queries';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  createApiKeySchema,
  type CreateApiKeySchema
} from '@/schemas/api-keys/create-api-key-schema';

export type CreateApiKeyModalProps = NiceModalHocProps;

export const CreateApiKeyModal = NiceModal.create<CreateApiKeyModalProps>(
  () => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: createApiKeySchema,
      mode: 'onSubmit',
      defaultValues: {
        description: '',
        neverExpires: true,
        expiresAt: addYears(startOfDay(new Date()), 1)
      }
    });
    const title = 'Create API key';
    const description = 'Create a new API key by filling out the form below.';
    const neverExpires = methods.watch('neverExpires');
    const canSubmit =
      !methods.formState.isSubmitting &&
      (!methods.formState.isSubmitted || methods.formState.isDirty);
    const onSubmit: SubmitHandler<CreateApiKeySchema> = async (values) => {
      if (!canSubmit) {
        return;
      }
      const result = await createApiKey(values);
      if (
        result &&
        !result.serverError &&
        !result.validationErrors &&
        result.data
      ) {
        toast.success('API key added');
        modal.resolve(result.data.apiKey);
        modal.handleClose();
      } else {
        toast.error("Couldn't add API key");
      }
    };
    const renderForm = (
      <form
        className={cn('space-y-4', !mdUp && 'p-4')}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <FormField
          control={methods.control}
          name="description"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <FormLabel required>Description</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  required
                  disabled={methods.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-row items-center justify-between">
            <FormLabel required>Expires on</FormLabel>
            <FormField
              control={methods.control}
              name="neverExpires"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-row items-center gap-1">
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        disabled={methods.formState.isSubmitting}
                        style={{ transform: 'scale(0.8)' }}
                      />
                    </FormControl>
                    <FormLabel className="leading-2 cursor-pointer">
                      Never expires
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={methods.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        disabled={
                          methods.formState.isSubmitting ||
                          Boolean(neverExpires)
                        }
                      >
                        {field.value ? (
                          format(field.value, 'd MMM yyyy')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto size-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        isBefore(startOfDay(date), new Date())
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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

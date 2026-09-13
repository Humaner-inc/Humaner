'use client';

import * as React from 'react';
import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { CalendarIcon } from '@humaner/shared/icons';
import { SquircleLoader } from '@humaner/shared/squircle-loader';
import { addYears, format, isBefore, startOfDay } from 'date-fns';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { createApiKey } from '@/actions/api-keys/create-api-key';
import { ApiKeyAccessPicker } from '@/components/dashboard/settings/organization/developers/api-key-access-picker';
import { CreatedApiKeyContent } from '@/components/dashboard/settings/organization/developers/created-api-key-content';
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
  FormDescription,
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

const MIN_CREATING_MS = 500;

type CreateApiKeyView = 'form' | 'creating' | 'created';

async function waitAtLeast(startedAt: number, minMs: number): Promise<void> {
  const remaining = minMs - (Date.now() - startedAt);
  if (remaining <= 0) {
    return;
  }
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}

export const CreateApiKeyModal = NiceModal.create<CreateApiKeyModalProps>(
  () => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const [view, setView] = React.useState<CreateApiKeyView>('form');
    const [createdApiKey, setCreatedApiKey] = React.useState('');
    const methods = useZodForm({
      schema: createApiKeySchema,
      mode: 'onSubmit',
      defaultValues: {
        description: '',
        neverExpires: true,
        expiresAt: addYears(startOfDay(new Date()), 1),
        access: 'full',
        scopes: []
      }
    });
    const title = 'Create API key';
    const description = 'Create a new API key by filling out the form below.';
    const neverExpires = methods.watch('neverExpires');
    const access = methods.watch('access');
    const scopes = methods.watch('scopes');
    const canSubmit =
      view === 'form' &&
      !methods.formState.isSubmitting &&
      (!methods.formState.isSubmitted || methods.formState.isDirty);
    const finishWithKey = React.useCallback(
      (apiKey: string) => {
        modal.resolve(apiKey);
        modal.handleClose();
      },
      [modal]
    );
    const handleDismiss = (): void => {
      if (view === 'creating') {
        return;
      }
      if (createdApiKey) {
        finishWithKey(createdApiKey);
        return;
      }
      modal.handleClose();
    };
    const onSubmit: SubmitHandler<CreateApiKeySchema> = async (values) => {
      if (!canSubmit) {
        return;
      }
      const startedAt = Date.now();
      setView('creating');
      try {
        const result = await createApiKey({
          description: values.description,
          neverExpires: values.neverExpires,
          expiresAt: values.expiresAt,
          access: values.access ?? 'full',
          scopes: values.scopes ?? []
        });
        await waitAtLeast(startedAt, MIN_CREATING_MS);
        if (
          result &&
          !result.serverError &&
          !result.validationErrors &&
          result.data
        ) {
          toast.success('API key added');
          setCreatedApiKey(result.data.apiKey);
          window.setTimeout(() => {
            setView('created');
          }, 40);
          return;
        }
        toast.error("Couldn't add API key");
        setView('form');
      } catch {
        toast.error("Couldn't add API key");
        setView('form');
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
        <FormField
          control={methods.control}
          name="scopes"
          render={() => (
            <FormItem className="flex w-full flex-col">
              <ApiKeyAccessPicker
                access={access ?? 'full'}
                scopes={scopes ?? []}
                disabled={methods.formState.isSubmitting}
                mutedClassName="text-muted-foreground"
                onAccessChange={(next) => {
                  methods.setValue('access', next, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
                onScopesChange={(next) => {
                  methods.setValue('scopes', next, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
              />
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
                {!neverExpires ? (
                  <FormDescription>
                    <i>A reminder is sent 72 hours before expiration.</i>
                  </FormDescription>
                ) : null}
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
          onClick={handleDismiss}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={!canSubmit}
          loading={methods.formState.isSubmitting || view === 'creating'}
          onClick={methods.handleSubmit(onSubmit)}
        >
          Create
        </Button>
      </>
    );
    const createdHeading = mdUp ? (
      <DialogHeader className="space-y-2 text-center">
        <DialogTitle className="font-display text-xl">API Key ✓</DialogTitle>
        <DialogDescription className="sr-only">
          Copy your API key now. It will not be shown again.
        </DialogDescription>
      </DialogHeader>
    ) : (
      <DrawerHeader className="space-y-2 text-center">
        <DrawerTitle className="font-display text-xl">API Key ✓</DrawerTitle>
        <DrawerDescription className="sr-only">
          Copy your API key now. It will not be shown again.
        </DrawerDescription>
      </DrawerHeader>
    );
    const createdFooter = mdUp ? (
      <DialogFooter className="border-t border-border/60 px-6 py-4">
        <Button
          type="button"
          variant="default"
          className="w-full sm:w-auto"
          onClick={handleDismiss}
        >
          Got it
        </Button>
      </DialogFooter>
    ) : (
      <DrawerFooter className="border-t border-border/60 px-6 py-4">
        <Button
          type="button"
          variant="default"
          className="w-full"
          onClick={handleDismiss}
        >
          Got it
        </Button>
      </DrawerFooter>
    );
    const renderBody =
      view === 'created' && createdApiKey ? (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
          <CreatedApiKeyContent
            apiKey={createdApiKey}
            heading={createdHeading}
            footer={createdFooter}
          />
        </div>
      ) : (
        <div className="relative">
          <div
            className={cn(
              'grid gap-4 transition-opacity duration-200 ease-out motion-reduce:transition-none',
              view === 'creating'
                ? 'pointer-events-none opacity-0'
                : 'opacity-100'
            )}
            aria-hidden={view === 'creating'}
          >
            {mdUp ? (
              <>
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  <DialogDescription className="sr-only">
                    {description}
                  </DialogDescription>
                </DialogHeader>
                {renderForm}
                <DialogFooter>{renderButtons}</DialogFooter>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          {view === 'creating' ? (
            <div
              className="absolute inset-0 flex items-center justify-center bg-background motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
              role="status"
              aria-live="polite"
            >
              {mdUp ? (
                <DialogTitle className="sr-only">Creating API key</DialogTitle>
              ) : (
                <DrawerTitle className="sr-only">Creating API key</DrawerTitle>
              )}
              <SquircleLoader size={36} />
            </div>
          ) : null}
        </div>
      );
    return (
      <FormProvider {...methods}>
        {mdUp ? (
          <Dialog open={modal.visible}>
            <DialogContent
              className={cn(
                'max-w-md overflow-hidden',
                view === 'created' && 'gap-0 p-0'
              )}
              onClose={handleDismiss}
              preventDismiss={view === 'creating'}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              {renderBody}
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer
            open={modal.visible}
            onOpenChange={(open) => {
              if (!open && view === 'creating') {
                return;
              }
              if (!open && createdApiKey) {
                finishWithKey(createdApiKey);
                return;
              }
              modal.handleOpenChange(open);
            }}
          >
            <DrawerContent>{renderBody}</DrawerContent>
          </Drawer>
        )}
      </FormProvider>
    );
  }
);

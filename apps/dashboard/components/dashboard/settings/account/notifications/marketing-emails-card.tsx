'use client';

import * as React from 'react';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updateMarketingEmails } from '@/actions/account/update-marketing-emails';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useZodForm } from '@/hooks/use-zod-form';
import {
  updateMarketingEmailsSchema,
  type UpdateMarketingEmailsSchema
} from '@/schemas/account/update-marketing-email-settings';
import type { MarketingEmailsDto } from '@/types/dtos/marketing-emails-dto';

export type MarketingEmailsCardProps = CardProps & {
  settings: MarketingEmailsDto;
};

export function MarketingEmailsCard({
  settings,
  ...other
}: MarketingEmailsCardProps): React.JSX.Element {
  const methods = useZodForm({
    schema: updateMarketingEmailsSchema,
    mode: 'onSubmit',
    defaultValues: settings
  });
  const canSubmit = !methods.formState.isSubmitting;
  const onSubmit: SubmitHandler<UpdateMarketingEmailsSchema> = async (
    values
  ) => {
    if (!canSubmit) {
      return;
    }
    const result = await updateMarketingEmails(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Marketing emails updated');
    } else {
      toast.error("Couldn't update marketing emails");
    }
  };
  return (
    <FormProvider {...methods}>
      <Card {...other}>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormField
              control={methods.control}
              name="enabledNewsletter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Newsletter</FormLabel>
                    <FormDescription>
                      Receive emails filled with industry expertise.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={methods.formState.isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="enabledProductUpdates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Product updates</FormLabel>
                    <FormDescription>
                      Receive emails with all new features and updates.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={methods.formState.isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </CardContent>
        <Separator />
        <CardFooter className="flex w-full justify-end pt-6">
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={!canSubmit}
            loading={methods.formState.isSubmitting}
            onClick={methods.handleSubmit(onSubmit)}
          >
            Save
          </Button>
        </CardFooter>
      </Card>
    </FormProvider>
  );
}

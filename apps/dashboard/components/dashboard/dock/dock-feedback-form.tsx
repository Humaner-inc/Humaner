'use client';

import * as React from 'react';
import { FeedbackCategory } from '@prisma/client';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { sendFeedback } from '@/actions/feedback/send-feedback';
import { useDashboardDock } from '@/components/dashboard/dock/dashboard-dock-context';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { feedbackCategoryLabels } from '@/constants/labels';
import { useZodForm } from '@/hooks/use-zod-form';
import {
  sendFeedbackSchema,
  type SendFeedbackSchema
} from '@/schemas/feedback/send-feedback-schema';

export function DockFeedbackForm(): React.JSX.Element {
  const { openDock } = useDashboardDock();
  const methods = useZodForm({
    schema: sendFeedbackSchema,
    mode: 'onSubmit',
    defaultValues: {
      category: FeedbackCategory.SUGGESTION,
      message: ''
    }
  });

  const canSubmit =
    !methods.formState.isSubmitting &&
    (!methods.formState.isSubmitted || methods.formState.isDirty);

  const onSubmit: SubmitHandler<SendFeedbackSchema> = async (values) => {
    if (!canSubmit) return;
    const result = await sendFeedback(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Feedback sent');
      openDock('help');
    } else {
      toast.error("Couldn't send feedback");
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="flex h-full flex-col"
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <FormField
            control={methods.control}
            name="category"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col">
                <FormLabel required>Topic</FormLabel>
                <FormControl>
                  <Select
                    required
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={methods.formState.isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(FeedbackCategory).map((key) => (
                        <SelectItem
                          key={key}
                          value={key}
                        >
                          {feedbackCategoryLabels[key as FeedbackCategory]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel required>Message</FormLabel>
                <FormControl>
                  <Textarea
                    required
                    rows={4}
                    autoFocus
                    disabled={methods.formState.isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border/50 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openDock('help')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!canSubmit}
            loading={methods.formState.isSubmitting}
          >
            Send
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { FeedbackCategory } from '@prisma/client';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { sendFeedback } from '@/actions/feedback/send-feedback';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { feedbackCategoryLabels } from '@/constants/labels';
import { MediaQueries } from '@/constants/media-queries';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  sendFeedbackSchema,
  type SendFeedbackSchema
} from '@/schemas/feedback/send-feedback-schema';

export type FeedbackModalProps = NiceModalHocProps;

export const FeedbackModal = NiceModal.create<FeedbackModalProps>(() => {
  const modal = useEnhancedModal();
  const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
  const methods = useZodForm({
    schema: sendFeedbackSchema,
    mode: 'onSubmit',
    defaultValues: {
      category: FeedbackCategory.SUGGESTION,
      message: ''
    }
  });
  const title = 'Feedback';
  const description = 'Send your feedback by filling out the form below.';
  const canSubmit =
    !methods.formState.isSubmitting &&
    (!methods.formState.isSubmitted || methods.formState.isDirty);
  const onSubmit: SubmitHandler<SendFeedbackSchema> = async (values) => {
    if (!canSubmit) {
      return;
    }
    const result = await sendFeedback(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Feedback sent');
      modal.handleClose();
    } else {
      toast.error("Couldn't send feedback");
    }
  };
  const renderForm = (
    <form
      className={cn('space-y-4', !mdUp && 'p-4')}
      onSubmit={methods.handleSubmit(onSubmit)}
    >
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
        Send
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
});

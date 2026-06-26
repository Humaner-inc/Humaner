'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import {
  TriangleAlertIcon,
  UploadIcon,
  XIcon
} from '@humaner/shared/icons';
import * as React from 'react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { createSupportTicket } from '@/actions/support-tickets/create-support-ticket';
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useZodForm } from '@/hooks/use-zod-form';
import { TICKET_SCREENSHOT_MAX_FILE_BYTES } from '@/lib/media/ticket-screenshot-limits';
import { REPORT_BUG_CONTEXT_TABS } from '@/lib/report-bug-context-options';
import { uploadTicketScreenshot } from '@/lib/storage/upload-ticket-screenshot';
import {
  reportBugSchema,
  type ReportBugSchema
} from '@/schemas/support/support-ticket-schemas';

export type ReportBugModalProps = NiceModalHocProps;

export const ReportBugModal = NiceModal.create<ReportBugModalProps>(() => {
  const modal = useEnhancedModal();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [screenshotFile, setScreenshotFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [screenshotError, setScreenshotError] = React.useState<string | null>(
    null
  );
  const [isUploadingShot, setIsUploadingShot] = React.useState(false);

  const methods = useZodForm({
    schema: reportBugSchema,
    mode: 'onSubmit',
    defaultValues: {
      title: '',
      body: '',
      contextTab: REPORT_BUG_CONTEXT_TABS[0].value,
      contextFeature: ''
    }
  });

  const clearScreenshot = React.useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setScreenshotFile(null);
    setScreenshotError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetForm = React.useCallback(() => {
    methods.reset();
    clearScreenshot();
  }, [clearScreenshot, methods]);

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setScreenshotFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScreenshotError(null);
  };

  const canSubmit =
    !methods.formState.isSubmitting &&
    !isUploadingShot &&
    (!methods.formState.isSubmitted || methods.formState.isDirty);

  const submitting = methods.formState.isSubmitting || isUploadingShot;

  const onSubmit: SubmitHandler<ReportBugSchema> = async (values) => {
    if (!canSubmit) return;

    if (!screenshotFile) {
      setScreenshotError('A screenshot is required');
      return;
    }

    setIsUploadingShot(true);
    let screenshotPath: string;
    try {
      screenshotPath = await uploadTicketScreenshot(screenshotFile);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setIsUploadingShot(false);
      return;
    }
    setIsUploadingShot(false);

    const result = await createSupportTicket({
      ...values,
      screenshotPath
    });

    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Thanks — we received your report.');
      resetForm();
      modal.handleClose();
    } else {
      toast.error("Couldn't send report");
    }
  };

  return (
    <FormProvider {...methods}>
      <Dialog open={modal.visible}>
        <DialogContent
          className="max-w-lg"
          onClose={() => {
            resetForm();
            modal.handleClose();
          }}
          onAnimationEndCapture={modal.handleAnimationEndCapture}
        >
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 ring-1 ring-destructive/20">
                <TriangleAlertIcon className="size-5 text-destructive" />
              </span>
              <div className="space-y-1">
                <DialogTitle>Report a bug</DialogTitle>
                <DialogDescription>
                  Include a screenshot and steps to reproduce. The team reads
                  every ticket.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormField
              control={methods.control}
              name="contextTab"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App section</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Where did this happen?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REPORT_BUG_CONTEXT_TABS.map((tab) => (
                        <SelectItem
                          key={tab.value}
                          value={tab.value}
                        >
                          {tab.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="contextFeature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature or screen (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Widget embed, training run"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Short title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="One line summary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>What happened?</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Steps to reproduce, expected vs actual behavior…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel required>Screenshot</FormLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                id="ticket-screenshot-input"
                onChange={onPickFile}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  <UploadIcon className="mr-2 size-4" />
                  {screenshotFile ? 'Replace screenshot' : 'Add screenshot'}
                </Button>
                {screenshotFile ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearScreenshot}
                    disabled={submitting}
                  >
                    <XIcon className="mr-1 size-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, GIF, or WebP — max{' '}
                {TICKET_SCREENSHOT_MAX_FILE_BYTES / (1024 * 1024)}MB.
              </p>
              {screenshotError ? (
                <p className="text-xs text-destructive">{screenshotError}</p>
              ) : null}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Screenshot preview"
                  className="max-h-44 max-w-full rounded-md border border-border/50 object-contain"
                />
              ) : null}
            </div>
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                modal.handleClose();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSubmit}
              loading={submitting}
              onClick={methods.handleSubmit(onSubmit)}
            >
              {isUploadingShot ? 'Uploading…' : 'Submit report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
});

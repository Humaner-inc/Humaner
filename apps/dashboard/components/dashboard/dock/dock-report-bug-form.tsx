'use client';

import * as React from 'react';
import { UploadIcon, XIcon } from '@humaner/shared/icons';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { createSupportTicket } from '@/actions/support-tickets/create-support-ticket';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useZodForm } from '@/hooks/use-zod-form';
import { TICKET_SCREENSHOT_MAX_FILE_BYTES } from '@/lib/media/ticket-screenshot-limits';
import { REPORT_BUG_CONTEXT_TABS } from '@/lib/report-bug-context-options';
import { uploadTicketScreenshot } from '@/lib/storage/upload-ticket-screenshot';
import {
  reportBugSchema,
  type ReportBugSchema
} from '@/schemas/support/support-ticket-schemas';

export function DockReportBugForm(): React.JSX.Element {
  const { openDock } = useDashboardDock();
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScreenshotFile(null);
    setScreenshotError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
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

    const result = await createSupportTicket({ ...values, screenshotPath });
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Thanks — we received your report.');
      openDock('help');
    } else {
      toast.error("Couldn't send report");
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
                    rows={4}
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
              id="dock-ticket-screenshot-input"
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
                className="max-h-32 max-w-full rounded-md border border-border/50 object-contain"
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/50 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openDock('help')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!canSubmit}
            loading={submitting}
          >
            {isUploadingShot ? 'Uploading…' : 'Submit report'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

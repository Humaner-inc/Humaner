'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { updateMailboxSignature } from '@/actions/inbox/update-mailbox-signature';
import {
  QuickCreateDialogContent,
  QuickCreateFooter
} from '@/components/dashboard/quick-create-dialog';
import { Button } from '@/components/ui/button';
import { DeleteOverlayButton } from '@/components/ui/delete-action-button';
import { Dialog } from '@/components/ui/dialog';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MAX_IMAGE_SIZE } from '@/constants/limits';
import type { ConnectedMailboxItem } from '@/data/inbox/get-mail-threads';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';
import { FileUploadAction } from '@/types/file-upload-action';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Could not read file'));
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export function MailboxSignatureDialog({
  connection,
  open,
  onOpenChange
}: {
  connection: ConnectedMailboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element {
  const [text, setText] = React.useState('');
  const [iconPreview, setIconPreview] = React.useState<string | null>(null);
  const [iconDataUrl, setIconDataUrl] = React.useState<string | null>(null);
  const [iconAction, setIconAction] = React.useState(FileUploadAction.None);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !connection) return;
    setText(connection.signatureText ?? '');
    setIconPreview(connection.signatureIconUrl);
    setIconDataUrl(null);
    setIconAction(FileUploadAction.None);
  }, [open, connection]);

  const handleDrop = async (files: File[]): Promise<void> => {
    const file = files[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Uploaded image shouldn't exceed 5mb size limit");
      return;
    }

    const isSvg =
      file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    const isPng =
      file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

    if (!isSvg && !isPng) {
      toast.error('Signature icon must be PNG or SVG');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setIconPreview(dataUrl);
      setIconDataUrl(dataUrl);
      setIconAction(FileUploadAction.Update);
    } catch {
      toast.error("Couldn't read image");
    }
  };

  const handleRemoveIcon = (): void => {
    setIconPreview(null);
    setIconDataUrl(null);
    setIconAction(
      connection?.signatureIconUrl
        ? FileUploadAction.Delete
        : FileUploadAction.None
    );
  };

  const handleSave = async (): Promise<void> => {
    if (!connection || saving) return;
    setSaving(true);

    const result = await updateMailboxSignature({
      connectionId: connection.id,
      signatureText: text,
      iconAction,
      icon: iconDataUrl ?? undefined
    });

    setSaving(false);

    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't save signature");
      return;
    }

    toast.success('Signature saved');
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <QuickCreateDialogContent
        title="Email signature"
        description={`Signature for ${connection?.email ?? 'mailbox'}`}
        hideCardClose
        preventDismiss={saving}
      >
        <div className="space-y-4 p-5">
          <p className="font-mono text-xs text-muted-foreground">
            {connection?.email}
          </p>

          <div className="space-y-2">
            <Label htmlFor="mailbox-signature-text">Text</Label>
            <Textarea
              id="mailbox-signature-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={'Best,\nAlex'}
              rows={4}
              disabled={saving}
              className="resize-none font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="relative">
              <ImageDropzone
                accept={{
                  'image/png': ['.png'],
                  'image/svg+xml': ['.svg']
                }}
                onDrop={(files) => {
                  void handleDrop(files);
                }}
                disabled={saving}
                src={iconPreview ?? undefined}
                title={iconPreview ? 'Replace icon' : 'Upload PNG or SVG'}
                subtitle=""
                borderRadius="lg"
                className={cn(
                  'min-h-[5.5rem] w-full overflow-hidden border border-border/50 bg-muted/15',
                  dashboardRadiusClassName,
                  iconPreview && '[&_img]:object-contain [&_img]:p-3'
                )}
              />
              {iconPreview ? (
                <div className="absolute right-2 top-2">
                  <DeleteOverlayButton
                    srLabel="Remove signature icon"
                    onClick={handleRemoveIcon}
                    disabled={saving}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <QuickCreateFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !connection}
            onClick={() => {
              void handleSave();
            }}
          >
            {saving ? 'Saving…' : 'Save signature'}
          </Button>
        </QuickCreateFooter>
      </QuickCreateDialogContent>
    </Dialog>
  );
}

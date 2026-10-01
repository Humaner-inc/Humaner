'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { UploadIcon } from '@humaner/shared/icons';
import { toast } from 'sonner';

import { updateMailboxSignature } from '@/actions/inbox/update-mailbox-signature';
import { MailboxSignatureIconImg } from '@/components/dashboard/inbox/mail-signature-preview';
import {
  QuickCreateDialogContent,
  QuickCreateFooter
} from '@/components/dashboard/quick-create-dialog';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { MAX_IMAGE_SIZE } from '@/constants/limits';
import {
  SIGNATURE_ICON_HEIGHT_DEFAULT,
  SIGNATURE_ICON_HEIGHT_MAX,
  SIGNATURE_ICON_HEIGHT_MIN
} from '@/schemas/inbox/update-mailbox-signature-schema';
import { FileUploadAction } from '@/types/file-upload-action';

export type MailboxSignatureTarget = {
  id: string;
  email: string;
  signatureText: string | null;
  signatureIconUrl: string | null;
  signatureIconHeight: number;
};

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

function SignatureMailPreview({
  text,
  iconUrl,
  iconHeight,
  from
}: {
  text: string;
  iconUrl: string | null;
  iconHeight: number;
  from: string;
}): React.JSX.Element {
  const lines = text.trim() ? text.replace(/\r\n/g, '\n').split('\n') : [];

  return (
    <div className="rounded-xl border border-border/60 bg-background">
      <div className="border-b border-border/50 px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Preview in mail
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          From {from}
        </p>
      </div>
      <div className="space-y-3 px-3 py-3 text-sm leading-relaxed text-foreground">
        <p className="text-muted-foreground">Hi there,</p>
        <p className="text-muted-foreground">
          Thanks for your note — following up below.
        </p>
        <div className="border-t border-border/40 pt-3">
          <p className="mb-2 text-muted-foreground">--</p>
          {iconUrl ? (
            <MailboxSignatureIconImg
              src={iconUrl}
              height={iconHeight}
              className="mb-2"
            />
          ) : null}
          {lines.length > 0 ? (
            <div className="whitespace-pre-wrap font-mono text-sm">
              {lines.join('\n')}
            </div>
          ) : !iconUrl ? (
            <p className="text-xs text-muted-foreground">
              Add text or an icon to build your signature.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MailboxSignatureDialog({
  connection,
  open,
  onOpenChange
}: {
  connection: MailboxSignatureTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState('');
  const [iconPreview, setIconPreview] = React.useState<string | null>(null);
  const [iconDataUrl, setIconDataUrl] = React.useState<string | null>(null);
  const [iconAction, setIconAction] = React.useState(FileUploadAction.None);
  const [iconHeight, setIconHeight] = React.useState(
    SIGNATURE_ICON_HEIGHT_DEFAULT
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !connection) return;
    setText(connection.signatureText ?? '');
    setIconPreview(connection.signatureIconUrl);
    setIconDataUrl(null);
    setIconAction(FileUploadAction.None);
    setIconHeight(
      connection.signatureIconHeight || SIGNATURE_ICON_HEIGHT_DEFAULT
    );
  }, [open, connection]);

  const handleFile = async (file: File | undefined): Promise<void> => {
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
      signatureIconHeight: iconHeight,
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
    router.refresh();
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
        <div className="max-h-[min(28rem,55vh)] space-y-4 overflow-y-auto p-5">
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
              rows={3}
              disabled={saving}
              className="resize-none font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Icon</Label>
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,.png,.svg"
                  className="sr-only"
                  disabled={saving}
                  onChange={(event) => {
                    void handleFile(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 font-mono text-[10px]"
                  disabled={saving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="size-3.5" />
                  {iconPreview ? 'Replace' : 'Upload PNG / SVG'}
                </Button>
                {iconPreview ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 font-mono text-[10px] text-destructive hover:text-destructive"
                    disabled={saving}
                    onClick={handleRemoveIcon}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>

            {iconPreview ? (
              <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="mailbox-signature-icon-size"
                    className="text-xs text-muted-foreground"
                  >
                    Icon size in mail
                  </Label>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {iconHeight}px
                  </span>
                </div>
                <Slider
                  id="mailbox-signature-icon-size"
                  min={SIGNATURE_ICON_HEIGHT_MIN}
                  max={SIGNATURE_ICON_HEIGHT_MAX}
                  step={4}
                  value={[iconHeight]}
                  disabled={saving}
                  onValueChange={(value) => {
                    const next = value[0];
                    if (typeof next === 'number') {
                      setIconHeight(next);
                    }
                  }}
                />
              </div>
            ) : null}
          </div>

          <SignatureMailPreview
            text={text}
            iconUrl={iconPreview}
            iconHeight={iconHeight}
            from={connection?.email ?? ''}
          />
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

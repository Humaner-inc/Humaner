'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { CheckIcon, CopyIcon } from '@humaner/shared/icons';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { deleteAccount } from '@/actions/account/delete-account';
import { logOut } from '@/actions/auth/log-out';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
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
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MediaQueries } from '@/constants/media-queries';
import { Routes } from '@/constants/routes';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  deleteAccountSchema,
  type DeleteAccountSchema
} from '@/schemas/account/delete-account-schema';

export type DeleteAccountModalProps = NiceModalHocProps & {
  email: string;
};

export const DeleteAccountModal = NiceModal.create<DeleteAccountModalProps>(
  ({ email }) => {
    const modal = useEnhancedModal();
    const router = useRouter();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const copyToClipboard = useCopyToClipboard();
    const [copiedEmail, setCopiedEmail] = React.useState(false);
    const methods = useZodForm({
      schema: deleteAccountSchema,
      mode: 'all',
      defaultValues: {
        statement: false,
        email: ''
      }
    });
    const title = 'Delete account?';
    const description =
      'Type your account email below to confirm. This permanently removes your access and cannot be undone.';
    const canSubmit =
      !methods.formState.isSubmitting &&
      methods.formState.isValid &&
      !!methods.watch('statement') &&
      methods.watch('email').trim().length > 0;

    const handleCopyEmail = async (): Promise<void> => {
      await copyToClipboard(email);
      setCopiedEmail(true);
      toast.success('Email copied');
      window.setTimeout(() => setCopiedEmail(false), 1500);
    };

    const onSubmit: SubmitHandler<DeleteAccountSchema> = async (values) => {
      if (!canSubmit) {
        return;
      }
      const result = await deleteAccount(values);
      if (result) {
        if (!result.serverError && !result.validationErrors) {
          toast.error('Account deleted');
          modal.handleClose();
          const logoutResult = await logOut({ redirect: false });
          if (!logoutResult?.serverError && !logoutResult?.validationErrors) {
            router.push(Routes.Login);
          } else {
            toast.error("Couldn't log out");
          }
        } else {
          toast.error(result.serverError ?? "Couldn't delete account");
        }
      }
    };

    const renderForm = (
      <form
        className={cn('space-y-4 text-sm leading-relaxed', !mdUp && 'px-4')}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            Account email
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate font-mono text-sm">{email}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => void handleCopyEmail()}
              aria-label="Copy email"
            >
              {copiedEmail ? (
                <CheckIcon className="size-4 text-emerald-500" />
              ) : (
                <CopyIcon className="size-4" />
              )}
            </Button>
          </div>
        </div>

        <FormField
          control={methods.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Type your email to confirm</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="off"
                  placeholder={email}
                  disabled={methods.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={methods.control}
          name="statement"
          render={({ field }) => (
            <FormItem className="mx-1 flex flex-row items-center gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(!!value)}
                  disabled={methods.formState.isSubmitting}
                />
              </FormControl>
              <FormLabel className="cursor-pointer leading-snug">
                I understand I will lose access to this workspace and its data.
              </FormLabel>
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
          variant="destructive"
          disabled={!canSubmit}
          loading={methods.formState.isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
          Delete
        </Button>
      </>
    );

    return (
      <FormProvider {...methods}>
        {mdUp ? (
          <AlertDialog open={modal.visible}>
            <AlertDialogContent
              className="max-w-md"
              onClose={modal.handleClose}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
              </AlertDialogHeader>
              {renderForm}
              <DialogFooter>{renderButtons}</DialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Drawer
            open={modal.visible}
            onOpenChange={modal.handleOpenChange}
          >
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>{title}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
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

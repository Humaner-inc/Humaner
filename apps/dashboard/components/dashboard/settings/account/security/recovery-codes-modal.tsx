'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import saveAs from 'file-saver';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { AppInfo } from '@/constants/app-info';
import { MediaQueries } from '@/constants/media-queries';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { splitIntoChunks } from '@/lib/utils';

export type RecoveryCodesModalProps = NiceModalHocProps & {
  recoveryCodes: string[];
};

export const RecoveryCodesModal = NiceModal.create<RecoveryCodesModalProps>(
  ({ recoveryCodes }) => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const copyToClipboard = useCopyToClipboard();
    const title = 'Recovery codes';
    const description =
      'Each recovery code can be used exactly once to grant access without your authenticator.';
    const handleCopyRecoveryCodes = async (): Promise<void> => {
      await copyToClipboard(
        recoveryCodes
          .map((recoveryCode) => splitIntoChunks(recoveryCode, '-', 5))
          .join('\n')
      );
      toast.success('Copied!');
    };
    const handleDownloadRecoveryCodes = () => {
      const filename = `${AppInfo.APP_NAME}-recovery-codes.txt`;
      const content = recoveryCodes
        .map((recoveryCode) => splitIntoChunks(recoveryCode, '-', 5))
        .join('\n');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, filename);
    };
    const renderContent = (
      <div className="mb-4 grid grid-cols-2 gap-1 text-center font-mono font-medium">
        {recoveryCodes.map((recoveryCode) => (
          <div key={recoveryCode}>{splitIntoChunks(recoveryCode, '-', 5)}</div>
        ))}
      </div>
    );
    const renderButtons = (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={modal.handleClose}
        >
          Close
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCopyRecoveryCodes}
        >
          Copy
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={handleDownloadRecoveryCodes}
        >
          Download
        </Button>
      </>
    );
    return (
      <>
        {mdUp ? (
          <AlertDialog open={modal.visible}>
            <AlertDialogContent
              className="max-w-lg"
              onClose={modal.handleClose}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
              </AlertDialogHeader>
              {renderContent}
              <AlertDialogFooter>{renderButtons}</AlertDialogFooter>
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
              {renderContent}
              <DrawerFooter className="flex-col-reverse pt-4">
                {renderButtons}
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </>
    );
  }
);

'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';

import { UserSupportTicketsPanel } from '@/components/support/user-support-tickets-panel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';

export type UserTicketsSheetProps = NiceModalHocProps;

export const UserTicketsSheet = NiceModal.create<UserTicketsSheetProps>(() => {
  const modal = useEnhancedModal();

  return (
    <Dialog open={modal.visible}>
      <DialogContent
        className="max-h-[92vh] max-w-4xl overflow-hidden p-0"
        onClose={modal.handleClose}
        onAnimationEndCapture={modal.handleAnimationEndCapture}
      >
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle>Account issues</DialogTitle>
          <DialogDescription>
            Follow the status of bugs and feedback you&apos;ve submitted.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 sm:p-6">
          <UserSupportTicketsPanel className="h-[min(640px,calc(92vh-8rem))]" />
        </div>
      </DialogContent>
    </Dialog>
  );
});

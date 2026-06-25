import NiceModal, { type NiceModalHandler } from '@ebay/nice-modal-react';

export type EnhancedNiceModalHandler = NiceModalHandler & {
  handleAnimationEndCapture: () => void;
  handleClose: () => void;
  handleOpenChange: (value: boolean) => void;
};

export function useEnhancedModal(): EnhancedNiceModalHandler {
  const modal = NiceModal.useModal() as NiceModalHandler;
  return {
    ...modal,
    handleAnimationEndCapture: () => {
      modal.resolveHide();
      if (!modal.visible && !modal.keepMounted) {
        modal.remove();
      }
    },
    handleClose: () => {
      modal.hide();
    },
    handleOpenChange: (value) => {
      if (!value) {
        modal.hide();
        modal.resolveHide();
        if (!modal.visible && !modal.keepMounted) {
          modal.remove();
        }
      }
    }
  } as EnhancedNiceModalHandler;
}

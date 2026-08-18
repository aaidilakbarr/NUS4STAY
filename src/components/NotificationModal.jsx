import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

export default function NotificationModal({
  open,
  type = 'success',
  title = '',
  message = '',
  buttonLabel,
  icon,
  onClose,
}) {
  const isSuccess = type === 'success';
  const isDanger = type === 'error' || type === 'danger';
  const isWarning = type === 'warning';

  const defaultIcon = isSuccess
    ? 'check_circle'
    : isDanger
      ? 'error'
      : isWarning
        ? 'warning'
        : 'info';

  const activeIcon = icon || defaultIcon;

  const getIconContainerStyle = () => {
    if (isSuccess) {
      return 'bg-primary-fixed/55 text-primary border border-primary/20';
    }
    if (isDanger) {
      return 'bg-error-container/80 text-on-error-container border border-error/20';
    }
    if (isWarning) {
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    }
    return 'bg-surface-container-high text-primary border border-outline-variant/30';
  };

  const getButtonLabel = () => {
    if (buttonLabel) return buttonLabel;
    if (isSuccess) return 'Selesai';
    return 'Tutup';
  };

  return (
    <Dialog open={Boolean(open)} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="max-w-sm rounded-[2rem] p-6 text-center shadow-2xl backdrop-blur-2xl flex flex-col items-center justify-center">
        <DialogHeader className="flex flex-col items-center justify-center text-center w-full">
          {activeIcon && (
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-2 ${getIconContainerStyle()}`}
            >
              <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                {activeIcon}
              </span>
            </div>
          )}
          <DialogTitle className="text-center font-headline-md text-lg font-bold text-on-surface">
            {title}
          </DialogTitle>
          {message && (
            <DialogDescription className="text-center text-xs leading-relaxed text-on-surface-variant/90 max-w-xs mx-auto mt-1">
              {message}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="w-full flex flex-col items-center justify-center gap-2 mt-5 sm:flex-col sm:justify-center">
          <Button
            variant={isDanger ? 'destructive' : 'default'}
            onClick={onClose}
            className="w-full h-11 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            {getButtonLabel()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


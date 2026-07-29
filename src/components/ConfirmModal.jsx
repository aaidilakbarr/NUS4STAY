import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

export default function ConfirmModal({
  open,
  title = 'Konfirmasi',
  message = '',
  confirmLabel = 'Ya, hapus',
  cancelLabel = 'Batal',
  confirmVariant = 'danger',
  icon = 'delete',
  onConfirm,
  onCancel,
  processing = false,
  showCancelButton = true,
}) {
  const isDanger = confirmVariant === 'danger';
  const shouldShowCancel = showCancelButton && Boolean(cancelLabel);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !processing && !isOpen && onCancel?.()}>
      <DialogContent className="max-w-sm rounded-[2rem] p-6 text-center shadow-2xl backdrop-blur-2xl flex flex-col items-center justify-center">
        <DialogHeader className="flex flex-col items-center justify-center text-center w-full">
          {icon && (
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-2 ${
              isDanger ? 'bg-error-container/80 text-on-error-container border border-error/20' : 'bg-primary-fixed/55 text-primary border border-primary/20'
            }`}>
              <span className="material-symbols-outlined text-[28px]" aria-hidden="true">{icon}</span>
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

        <DialogFooter className="w-full flex flex-col items-center justify-center gap-2 mt-5 sm:flex-col sm:justify-center">
          <Button
            variant={isDanger ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={processing}
            className="w-full h-11 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            {processing ? 'Memproses...' : confirmLabel}
          </Button>

          {shouldShowCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={processing}
              className="w-full h-10 text-xs font-semibold rounded-xl border-outline-variant/60"
            >
              {cancelLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

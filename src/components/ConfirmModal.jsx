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
}) {
  const isDanger = confirmVariant === 'danger';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !processing && !isOpen && onCancel?.()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
            isDanger ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed/55 text-primary'
          }`}>
            <span className="material-symbols-outlined text-[26px]" aria-hidden="true">{icon}</span>
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          {message && <DialogDescription className="text-center">{message}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={processing} autoFocus>
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={processing}
          >
            {processing ? 'Memproses...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

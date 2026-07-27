import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

export default function NotificationModal({
  open,
  type = 'success',
  title = '',
  message = '',
  onClose,
}) {
  const isSuccess = type === 'success';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess ? 'bg-primary-fixed/20 text-primary' : 'bg-error-container/60 text-error'
          }`}>
            <span className="material-symbols-outlined text-[36px]">
              {isSuccess ? 'check_circle' : 'error'}
            </span>
          </div>
          <DialogTitle className={isSuccess ? 'text-primary' : 'text-error'}>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <Button
          variant={isSuccess ? 'default' : 'destructive'}
          className="w-full"
          onClick={onClose}
        >
          Kembali
        </Button>
      </DialogContent>
    </Dialog>
  );
}

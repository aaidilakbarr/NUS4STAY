import React, { useEffect } from 'react';

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
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !processing) onCancel?.();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, processing, onCancel]);

  if (!open) return null;

  const isDanger = confirmVariant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/55 p-5 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget && !processing) onCancel?.(); }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-md animate-in zoom-in-95 rounded-3xl border border-white/30 bg-surface p-6 shadow-[0_28px_80px_rgba(23,28,21,0.28)] md:p-7"
      >
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
          isDanger
            ? 'bg-error-container text-on-error-container'
            : 'bg-primary-fixed/55 text-primary'
        }`}>
          <span className="material-symbols-outlined text-[26px]" aria-hidden="true">{icon}</span>
        </div>

        <h2 id="confirm-modal-title" className="mt-5 font-headline-md text-2xl font-bold text-on-surface">
          {title}
        </h2>

        {message ? (
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{message}</p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            autoFocus
            className="min-h-11 rounded-xl border border-outline-variant px-4 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={processing}
            className={`min-h-11 rounded-xl px-5 text-sm font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
              isDanger
                ? 'bg-error text-on-error hover:opacity-90'
                : 'bg-primary text-on-primary hover:bg-primary-container'
            }`}
          >
            {processing ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

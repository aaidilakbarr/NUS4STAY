import React, { useEffect } from 'react';

export default function NotificationModal({
  open,
  type = 'success',
  title = '',
  message = '',
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = type === 'success';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#101F0D]/60 px-4 py-8 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-md animate-in zoom-in-95 rounded-3xl border border-white/30 bg-surface p-8 text-center shadow-[0_28px_90px_rgba(23,28,21,0.35)]">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          isSuccess ? 'bg-primary-fixed/20 text-primary' : 'bg-error-container/60 text-error'
        }`}>
          <span className="material-symbols-outlined text-[36px]">
            {isSuccess ? 'check_circle' : 'error'}
          </span>
        </div>
        <h3 className={`mt-4 text-xl font-bold ${isSuccess ? 'text-primary' : 'text-error'}`}>
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-on-primary shadow-[0_8px_24px_rgba(52,78,43,0.22)] transition hover:-translate-y-0.5 ${
            isSuccess ? 'bg-primary hover:bg-primary-container' : 'bg-error hover:bg-error/80'
          }`}
        >
          Kembali
        </button>
      </div>
    </div>
  );
}

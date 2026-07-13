import React from 'react';

const ADMIN_ITEMS = [
  {
    key: 'properties',
    href: '#/admin/properties',
    label: 'Properties',
    icon: 'apartment',
  },
  {
    key: 'payments',
    href: '#/admin/payments',
    label: 'Verifikasi',
    icon: 'fact_check',
  },
];

export default function AdminNavigation({ current, pendingCount = 0 }) {
  return (
    <nav
      aria-label="Menu admin"
      className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-outline-variant/40 bg-surface-container-low p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:w-fit"
    >
      {ADMIN_ITEMS.map((item) => {
        const isActive = current === item.key;
        const showCount = item.key === 'payments' && pendingCount > 0;

        return (
          <a
            key={item.key}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-surface text-primary shadow-sm ring-1 ring-outline-variant/45'
                : 'text-on-surface-variant hover:bg-surface/70 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined icon-pro text-[19px]" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
            {showCount ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-tertiary px-1.5 py-0.5 text-[10px] font-bold leading-none text-on-tertiary">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            ) : null}
          </a>
        );
      })}
    </nav>
  );
}

import React from 'react';

const MANAGER_ITEMS = [
  {
    key: 'dashboard',
    href: '#/manager/dashboard',
    label: 'Dashboard',
    icon: 'monitoring',
  },
  {
    key: 'reports',
    href: '#/manager/reports',
    label: 'Laporan',
    icon: 'description',
  },
  {
    key: 'analytics',
    href: '#/manager/analytics',
    label: 'Analitik',
    icon: 'analytics',
  },
];

export default function ManagerNavigation({ current }) {
  return (
    <nav
      aria-label="Menu manager"
      className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-outline-variant/40 bg-surface-container-low p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:w-fit"
    >
      {MANAGER_ITEMS.map((item) => {
        const isActive = current === item.key;

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
          </a>
        );
      })}
    </nav>
  );
}

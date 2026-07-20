import React from 'react';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-outline">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={item.label}>
            {index > 0 ? (
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
            ) : null}
            {isLast ? (
              <span className="font-semibold text-on-surface-variant" aria-current="page">
                {item.label}
              </span>
            ) : (
              <a href={item.href} className="transition hover:text-primary">{item.label}</a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

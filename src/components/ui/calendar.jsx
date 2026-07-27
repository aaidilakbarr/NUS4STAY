import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { cn } from '../../lib/utils';

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center gap-1 h-9',
        month_caption: 'flex justify-center pt-1 relative items-center gap-1 h-9',
        caption_label: 'text-sm font-semibold text-on-surface',
        nav: 'flex items-center justify-between w-full absolute top-1 left-0 right-0 px-1 pointer-events-none z-10',
        nav_button:
          'pointer-events-auto inline-flex h-8 w-8 p-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        button_previous:
          'pointer-events-auto inline-flex h-8 w-8 p-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        button_next:
          'pointer-events-auto inline-flex h-8 w-8 p-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        table: 'w-full border-collapse space-y-1',
        month_grid: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        weekdays: 'flex',
        head_cell: 'text-xs font-semibold text-on-surface-variant w-9 h-9 inline-flex items-center justify-center',
        weekday: 'text-xs font-semibold text-on-surface-variant w-9 h-9 inline-flex items-center justify-center',
        row: 'flex w-full mt-2',
        week: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative rounded-lg',
        day: 'h-9 w-9 text-center text-sm p-0 relative rounded-lg',
        day_button:
          'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-on-surface transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer',
        selected: '!bg-primary !text-on-primary hover:!bg-primary/90 focus:!bg-primary',
        day_selected: '!bg-primary !text-on-primary hover:!bg-primary/90 focus:!bg-primary',
        today: 'bg-surface-container-high text-on-surface font-semibold',
        day_today: 'bg-surface-container-high text-on-surface font-semibold',
        outside: 'text-on-surface-variant/50 opacity-50',
        day_outside: 'text-on-surface-variant/50 opacity-50',
        disabled: 'text-on-surface-variant/30 opacity-30 cursor-not-allowed pointer-events-none',
        day_disabled: 'text-on-surface-variant/30 opacity-30 cursor-not-allowed pointer-events-none',
        range_middle: 'bg-primary-fixed/40 text-on-surface',
        day_range_middle: 'bg-primary-fixed/40 text-on-surface',
        range_start: 'rounded-r-none',
        day_range_start: 'rounded-r-none',
        range_end: 'rounded-l-none',
        day_range_end: 'rounded-l-none',
        hidden: 'invisible',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (
          <span className="material-symbols-outlined text-[18px]">
            {orientation === 'left' ? 'chevron_left' : 'chevron_right'}
          </span>
        ),
        IconLeft: () => <span className="material-symbols-outlined text-[18px]">chevron_left</span>,
        IconRight: () => <span className="material-symbols-outlined text-[18px]">chevron_right</span>,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
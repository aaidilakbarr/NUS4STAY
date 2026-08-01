import * as React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { cn } from '../../lib/utils';

const DatePicker = React.forwardRef(({ className, selected, onSelect, placeholder = 'Pilih tanggal', disabled, allowPastDates = false, disabledDates, ..._props }, _ref) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date) => {
    onSelect?.(date);
    setOpen(false);
  };

  const isDateDisabled = (date) => {
    if (allowPastDates) return false;
    if (typeof disabledDates === 'function') return disabledDates(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn('w-full justify-start text-left h-12 px-3 text-xs font-normal', !selected && 'text-muted-foreground', className)}
          disabled={disabled}
        >
          <span className="material-symbols-outlined text-[16px] mr-2 text-on-surface-variant">calendar_month</span>
          {selected ? format(selected, 'd MMMM yyyy', { locale: id }) : <span className="text-xs">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={isDateDisabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
});
DatePicker.displayName = 'DatePicker';

export { DatePicker };
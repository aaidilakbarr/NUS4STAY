import React from 'react';

const STAR_VALUES = [1, 2, 3, 4, 5];

const SIZE_CLASSES = {
  sm: 'text-[18px]',
  md: 'text-[26px]',
  lg: 'text-[34px]',
};

const getDisplayStar = (rating, position) => {
  if (rating >= position) return { icon: 'star', filled: true };
  if (rating >= position - 0.5) return { icon: 'star_half', filled: true };
  return { icon: 'star', filled: false };
};

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  label = 'Rating pengalaman menginap',
}) {
  const normalizedValue = Number(value || 0);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (readOnly) {
    return (
      <div
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`${normalizedValue.toFixed(1)} dari 5 bintang`}
      >
        {STAR_VALUES.map((position) => {
          const star = getDisplayStar(normalizedValue, position);
          return (
            <span
              key={position}
              className={`material-symbols-outlined ${sizeClass} ${star.filled ? 'fill-1 text-tertiary' : 'text-outline-variant'}`}
              aria-hidden="true"
            >
              {star.icon}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label={label}>
      {STAR_VALUES.map((position) => {
        const isSelected = normalizedValue >= position;

        return (
          <button
            key={position}
            type="button"
            role="radio"
            aria-checked={normalizedValue === position}
            aria-label={`${position} dari 5 bintang`}
            onClick={() => onChange?.(position)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition hover:-translate-y-0.5 hover:bg-tertiary-container/70 focus-visible:outline-tertiary active:scale-95"
          >
            <span
              className={`material-symbols-outlined text-[32px] ${isSelected ? 'fill-1 text-tertiary' : 'text-outline'}`}
              aria-hidden="true"
            >
              star
            </span>
          </button>
        );
      })}
    </div>
  );
}

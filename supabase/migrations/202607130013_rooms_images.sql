-- Add images array column to rooms so each room can store multiple images.
-- Keeps the single `image` column for backward compatibility (thumbnail / first image).
alter table public.rooms
  add column if not exists images text[] not null default '{}';

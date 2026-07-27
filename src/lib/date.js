import { format, addDays, differenceInDays, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDateId(date, formatStr = 'd MMMM yyyy') {
  return format(new Date(date), formatStr, { locale: id });
}

export function formatDateShort(date) {
  return format(new Date(date), 'yyyy-MM-dd');
}

export function addDaysToDate(date, days) {
  return addDays(new Date(date), days);
}

export function getDaysDifference(startDate, endDate) {
  return differenceInDays(new Date(endDate), new Date(startDate));
}

export function isDateAfter(date, compareDate) {
  return isAfter(new Date(date), new Date(compareDate));
}

export function isDateBefore(date, compareDate) {
  return isBefore(new Date(date), new Date(compareDate));
}

export function getToday() {
  return startOfDay(new Date());
}

export function parseDate(dateString) {
  return parseISO(dateString);
}

export function getMinDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return format(startOfDay(date), 'yyyy-MM-dd');
}
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export const CHILE_TIMEZONE = 'America/Santiago';

export function dateTimeLocalToChileDate(
  dateTimeLocal: string | undefined,
): Date | null {
  if (!dateTimeLocal) return null;

  const [datePart, timePart] = dateTimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const dateInChile = new Date(year, month - 1, day, hour, minute);

  return fromZonedTime(dateInChile, CHILE_TIMEZONE);
}

export function chileDateToDateTimeLocal(date: Date | null): string {
  if (!date) return '';

  const dateInChile = toZonedTime(date, CHILE_TIMEZONE);

  const year = dateInChile.getFullYear();
  const month = String(dateInChile.getMonth() + 1).padStart(2, '0');
  const day = String(dateInChile.getDate()).padStart(2, '0');
  const hours = String(dateInChile.getHours()).padStart(2, '0');
  const minutes = String(dateInChile.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

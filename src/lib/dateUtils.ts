import { formatDistanceToNow, format } from 'date-fns';

/**
 * Safely parses any date representation into a valid Date object.
 * Handles SQLite "YYYY-MM-DD HH:MM:SS" strings by converting them to standard ISO format.
 */
export function parseSafeDate(rawDate: string | number | Date | null | undefined): Date | null {
  if (!rawDate) return null;
  if (rawDate instanceof Date) {
    return isNaN(rawDate.getTime()) ? null : rawDate;
  }
  if (typeof rawDate === 'number') {
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof rawDate === 'string') {
    let normalized = rawDate.trim();
    if (!normalized) return null;

    // Handle SQLite datetime format "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SSZ"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(normalized)) {
      normalized = normalized.replace(' ', 'T') + (normalized.endsWith('Z') ? '' : 'Z');
    }
    
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      return d;
    }

    const fallback = new Date(rawDate);
    if (!isNaN(fallback.getTime())) {
      return fallback;
    }
  }
  return null;
}

/**
 * Safely formats distance to now without ever throwing RangeError.
 */
export function safeFormatDistanceToNow(
  rawDate: string | number | Date | null | undefined,
  fallback = 'recently'
): string {
  try {
    const date = parseSafeDate(rawDate);
    if (!date) return fallback;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return fallback;
  }
}

/**
 * Safely formats a date string without ever throwing RangeError.
 */
export function safeFormatDate(
  rawDate: string | number | Date | null | undefined,
  formatStr = 'MMMM yyyy',
  fallback = 'Recently'
): string {
  try {
    const date = parseSafeDate(rawDate);
    if (!date) return fallback;
    return format(date, formatStr);
  } catch {
    return fallback;
  }
}

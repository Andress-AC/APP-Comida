/**
 * Get the "effective date" for a user, accounting for their day_start_hour.
 * If it's 2am and day_start_hour is 5, the effective date is still "yesterday".
 */
export function getEffectiveDate(dayStartHour: number = 5): Date {
  const now = new Date();
  if (now.getHours() < dayStartHour) {
    // Still counts as previous day
    now.setDate(now.getDate() - 1);
  }
  return now;
}

/**
 * Get effective date as YYYY-MM-DD string.
 */
export function getEffectiveDateStr(dayStartHour: number = 5): string {
  const d = getEffectiveDate(dayStartHour);
  return d.toISOString().split("T")[0];
}

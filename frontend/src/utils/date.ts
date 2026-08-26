const currentLocale = () =>
  typeof document !== "undefined" && document.documentElement.lang === "hi" ? "hi-IN" : "en-IN";

export const formatDate = (date: string | Date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat(currentLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

export const formatCalendarDate = (date: string | Date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat(currentLocale(), { dateStyle: "medium" }).format(value);
};

/* ==========================================================================
 * Naive business-local date/time helpers.
 *
 * The platform stores zone-less `LocalDateTime` / `LocalDate` values and runs
 * on one business clock (TZ=Asia/Kolkata in docker-compose). The browser must
 * therefore send the SAME wall-clock the admin picked — never a UTC-converted
 * ISO instant (`toISOString` shifts the time by the browser offset and was the
 * root cause of the coupon expiry drift). Keep every selector and payload in
 * these canonical shapes:
 *   date     → `YYYY-MM-DD`
 *   datetime → `YYYY-MM-DDTHH:mm`
 * ========================================================================== */

const pad = (n: number) => String(n).padStart(2, "0");

/** Local `YYYY-MM-DD` for a Date. */
export const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Local `YYYY-MM-DDTHH:mm` for a Date. */
export const toDateTimeInputValue = (date: Date) =>
  `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** Today's local `YYYY-MM-DD` (for `min` on date selectors). */
export const todayInputValue = () => toDateInputValue(new Date());

/** Now as local `YYYY-MM-DDTHH:mm` (for `min` on datetime selectors). */
export const nowInputValue = () => toDateTimeInputValue(new Date());

/**
 * Canonical payload for backend `LocalDateTime` fields: the picked wall-clock
 * with seconds, no timezone suffix. `YYYY-MM-DDTHH:mm` → `YYYY-MM-DDTHH:mm:ss`.
 */
export const toLocalDateTimePayload = (inputValue: string) => {
  if (!inputValue) return undefined;
  return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
};

/** Parse a canonical input value into a Date (local wall-clock). */
export const fromInputValue = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

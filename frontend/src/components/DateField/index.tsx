import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FormHelperText,
  InputAdornment,
  Popover,
  TextField,
} from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  formatCalendarDate,
  toDateInputValue,
  toDateTimeInputValue,
} from "../../utils/date";

/* ==========================================================================
 * DateField — the Cartly Editorial calendar.
 *
 * The native `<input type="date|datetime-local">` popup is drawn by the
 * browser and cannot be styled: it ignores our paper/ink/brand tokens and
 * clashes with the Editorial Warmth palette (glaringly in dark mode). This
 * component renders our own popover calendar from the same design tokens as
 * every other surface, so the opened calendar matches the UI in both modes.
 *
 * Value contract (mirrors utils/date.ts):
 *   mode="date"     → `YYYY-MM-DD`        (backend LocalDate)
 *   mode="datetime" → `YYYY-MM-DDTHH:mm`  (backend LocalDateTime, naive local)
 *
 * Works standalone (value/onChange) or with formik (form/name) like
 * TextInput/SelectInput. `min` disables earlier days; datetime mode also
 * disables earlier times on the min day.
 * ========================================================================== */

type DateFieldMode = "date" | "datetime";

interface DateFieldProps {
  label: string;
  value?: string;
  /** Required in standalone mode; formik mode (form+name) ignores it. */
  onChange?: (value: string) => void;
  /** `date` (YYYY-MM-DD) or `datetime` (YYYY-MM-DDTHH:mm). */
  mode?: DateFieldMode;
  /** Minimum selectable value, in the same shape as `value`. */
  min?: string;
  /** Maximum selectable value, in the same shape as `value`. */
  max?: string;
  /** formik bag (use `form` + `name` instead of value/onChange). */
  form?: any;
  name?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const parse = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Compare only the calendar day of two values. */
const sameDay = (a: Date, b: Date) => toDateInputValue(a) === toDateInputValue(b);

function DateField({
  label,
  value,
  onChange,
  mode = "date",
  min,
  max,
  form,
  name,
  helperText,
  required,
  disabled,
  placeholder = mode === "datetime" ? "Pick date & time" : "Pick a date",
}: DateFieldProps) {
  const controlled = Boolean(name && form);
  const rawValue = controlled ? form.values?.[name ?? ""] ?? "" : value ?? "";
  const setRawValue = (next: string) => {
    if (controlled) form.setFieldValue(name, next, true);
    else onChange?.(next);
  };

  const selected = parse(rawValue);
  const minDate = parse(min);
  const maxDate = parse(max);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const [viewYear, setViewYear] = useState(() => (selected ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected ?? new Date()).getMonth());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const anchor = selected ?? new Date();
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = first.getDay(); // Sunday-first grid
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i += 1) cells.push(null);
    const last = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let day = 1; day <= last; day += 1) cells.push(new Date(viewYear, viewMonth, day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  /** A day is disabled when it is entirely before `min` or after `max`. */
  const isDayDisabled = (day: Date) => {
    if (minDate) {
      const minDay = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      if (day.getTime() < minDay.getTime()) return true;
    }
    if (maxDate) {
      const maxDay = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      if (day.getTime() > maxDay.getTime()) return true;
    }
    return false;
  };

  const applyDate = (day: Date) => {
    const hours = selected && sameDay(selected, day) ? selected.getHours() : defaultHours();
    const minutes = selected && sameDay(selected, day) ? selected.getMinutes() : 0;
    const merged = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
    setRawValue(mode === "datetime" ? toDateTimeInputValue(merged) : toDateInputValue(merged));
  };

  const defaultHours = () => {
    if (!minDate) return 0;
    // When the min day is today, start at the current hour so the merged
    // value never lands before `min`.
    const now = new Date();
    return sameDay(now, minDate) ? now.getHours() : 0;
  };

  const setTimePart = (part: "hours" | "minutes", raw: string) => {
    const base = selected ?? new Date();
    const merged = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      part === "hours" ? Number(raw) : base.getHours(),
      part === "minutes" ? Number(raw) : base.getMinutes()
    );
    setRawValue(toDateTimeInputValue(merged));
  };

  const stepMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const stepYear = (delta: number) => setViewYear((y) => y + delta);

  const canGoPrev = () => {
    if (!minDate) return true;
    const firstOfView = new Date(viewYear, viewMonth, 1);
    return firstOfView > new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  };

  const canGoNext = () => {
    if (!maxDate) return true;
    const endOfView = new Date(viewYear, viewMonth + 1, 0);
    return endOfView < new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
  };

  const today = () => {
    const now = new Date();
    setRawValue(mode === "datetime" ? toDateTimeInputValue(now) : toDateInputValue(now));
  };

  const clear = () => setRawValue("");

  const display = selected ? formatCalendarDate(selected) : "";
  const error = Boolean(controlled && form.touched?.[name ?? ""] && form.errors?.[name ?? ""]);
  const helper = error ? form.errors?.[name ?? ""] : helperText;

  const selectClass = "input-control !h-9 !w-[4.7rem] !py-1 text-center";

  return (
    <div ref={rootRef} className="relative">
      <TextField
        fullWidth
        size="small"
        label={label}
        required={required}
        disabled={disabled}
        error={error}
        placeholder={placeholder}
        value={display}
        InputLabelProps={{ shrink: true }}
        inputProps={{ readOnly: true, "aria-haspopup": "dialog" }}
        onClick={() => !disabled && setAnchorEl(rootRef.current)}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setAnchorEl(rootRef.current);
          }
        }}
        sx={{
          "& .MuiInputBase-input": { cursor: disabled ? "default" : "pointer" },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <CalendarTodayOutlinedIcon sx={{ fontSize: 18 }} className="text-ink-soft" />
            </InputAdornment>
          ),
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          root: { sx: { zIndex: (theme: any) => theme.zIndex.modal + 1 } },
          paper: {
            elevation: 0,
            sx: {
              borderRadius: "4px",
              border: "1px solid rgb(var(--c-line))",
              backgroundColor: "rgb(var(--c-paper))",
              color: "rgb(var(--c-ink))",
              boxShadow: "var(--shadow-pop)",
              mt: 1,
            },
          },
        }}
        role="dialog"
        aria-label={`${label} calendar`}
      >
        <div className="w-[19rem] max-w-[calc(100vw-2rem)]">
          {/* header — month/year navigation */}
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => stepYear(-1)}
              disabled={!canGoPrev() && viewMonth === 0}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-soft hover:text-brand disabled:opacity-30"
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
              <span className="sr-only">«</span>
            </button>
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span className="text-ink">{MONTHS[viewMonth]}</span>
              <span className="text-ink-muted">{viewYear}</span>
            </div>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => stepYear(1)}
              disabled={!canGoNext() && viewMonth === 11}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-soft hover:text-brand disabled:opacity-30"
            >
              <ChevronRightIcon sx={{ fontSize: 16 }} />
              <span className="sr-only">»</span>
            </button>
          </div>

          {/* sub-header — month stepper */}
          <div className="flex items-center justify-between px-3 pt-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => stepMonth(-1)}
              disabled={!canGoPrev()}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-soft hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </button>
            <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => stepMonth(1)}
              disabled={!canGoNext()}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-soft hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          {/* weekday row + day grid */}
          <div className="px-3 pb-1 pt-2">
            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS.map((day, index) => (
                <span
                  key={`${day}-${index}`}
                  className="pb-1 text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted"
                >
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5 text-center">
              {days.map((day, index) => {
                if (!day) return <span key={`empty-${index}`} />;
                const disabledDay = isDayDisabled(day);
                const isSelected = selected ? sameDay(selected, day) : false;
                const isToday = sameDay(day, new Date());
                return (
                  <button
                    key={toDateInputValue(day)}
                    type="button"
                    disabled={disabledDay}
                    aria-label={formatCalendarDate(day)}
                    aria-pressed={isSelected}
                    onClick={() => applyDate(day)}
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
                      isSelected
                        ? "bg-action font-bold text-oncontrast"
                        : disabledDay
                        ? "cursor-not-allowed text-ink-faint/50"
                        : "text-ink hover:bg-brand-soft hover:text-brand"
                    } ${isToday && !isSelected ? "font-bold ring-1 ring-inset ring-brand/40" : ""}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* time row */}
          {mode === "datetime" && (
            <div className="flex items-center justify-center gap-2 border-t border-line px-3 py-2.5">
              <select
                aria-label="Hours"
                className={selectClass}
                value={selected ? String(selected.getHours()).padStart(2, "0") : ""}
                onChange={(event) => setTimePart("hours", event.target.value)}
              >
                <option value="" disabled>
                  HH
                </option>
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <span className="text-sm font-bold text-ink-muted">:</span>
              <select
                aria-label="Minutes"
                className={selectClass}
                value={selected ? String(selected.getMinutes()).padStart(2, "0") : ""}
                onChange={(event) => setTimePart("minutes", event.target.value)}
              >
                <option value="" disabled>
                  MM
                </option>
                {MINUTES.filter((m) => Number(m) % 5 === 0).map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* footer actions */}
          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <button
              type="button"
              onClick={clear}
              className="rounded-sm px-2 py-1 text-xs font-semibold text-ink-soft transition hover:bg-sunken hover:text-ink"
            >
              Clear
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={today}
                className="rounded-sm px-2 py-1 text-xs font-semibold text-ink-soft transition hover:bg-sunken hover:text-ink"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setAnchorEl(null)}
                className="rounded-sm bg-action px-3 py-1 text-xs font-bold text-oncontrast transition hover:bg-action-hover"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </Popover>

      {helper ? (
        <FormHelperText error={error} sx={{ marginLeft: 1, fontSize: 11 }}>
          {helper}
        </FormHelperText>
      ) : null}
    </div>
  );
}

export default DateField;

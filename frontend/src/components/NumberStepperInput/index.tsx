import React from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export interface NumberStepperInputProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function NumberStepperInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 100,
  prefix = "₹",
  placeholder = "0",
  disabled = false,
  className = "",
}: NumberStepperInputProps) {
  const numericValue = value === "" || value === undefined || value === null ? null : Number(value);

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (numericValue === null || isNaN(numericValue)) {
      onChange(String(min));
      return;
    }
    // Snap to the nearest step below, never dropping under min.
    const nextVal = Math.max(min, numericValue - step);
    onChange(String(nextVal));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (numericValue === null || isNaN(numericValue)) {
      const startVal = Math.max(min, step);
      onChange(String(max !== undefined ? Math.min(max, startVal) : startVal));
      return;
    }
    // Snap to the nearest step above, never exceeding max.
    const nextVal = max !== undefined ? Math.min(max, numericValue + step) : numericValue + step;
    onChange(String(nextVal));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange("");
      return;
    }
    const parsed = Number(raw);
    if (isNaN(parsed)) return;
    if (parsed < min) {
      onChange(String(min));
      return;
    }
    if (max !== undefined && parsed > max) {
      onChange(String(max));
      return;
    }
    onChange(raw);
  };

  const canDecrement = !disabled && numericValue !== null && !isNaN(numericValue) && numericValue > min;
  const canIncrement = !disabled && (numericValue === null || isNaN(numericValue) || max === undefined || numericValue < max);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <div className="flex h-9 w-full items-stretch rounded-md border border-line bg-paper shadow-sm transition-all focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 hover:border-ink-faint">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={!canDecrement}
          aria-label={`Decrease ${label} by ${step}`}
          className="flex w-7 shrink-0 items-center justify-center rounded-l-md border-r border-line/60 bg-sunken/40 text-ink-muted transition hover:bg-sunken hover:text-ink active:scale-95 disabled:pointer-events-none disabled:opacity-30"
        >
          <RemoveIcon sx={{ fontSize: 14 }} />
        </button>

        <div className="relative flex min-w-0 flex-1 items-center px-1.5">
          {prefix && (
            <span className="select-none text-xs font-semibold text-ink-muted">
              {prefix}
            </span>
          )}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleInputChange}
            className="w-full min-w-0 bg-transparent px-1 text-center font-display text-xs font-bold text-ink outline-none [appearance:textfield] placeholder:text-ink-muted/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={!canIncrement}
          aria-label={`Increase ${label} by ${step}`}
          className="flex w-7 shrink-0 items-center justify-center rounded-r-md border-l border-line/60 bg-sunken/40 text-ink-muted transition hover:bg-sunken hover:text-ink active:scale-95 disabled:pointer-events-none disabled:opacity-30"
        >
          <AddIcon sx={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  );
}

export default NumberStepperInput;

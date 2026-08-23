import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";

const STEPS = [
  { key: "cart", label: "Cart", to: "/cart" },
  { key: "details", label: "Address & payment", to: "/checkout" },
  { key: "done", label: "Confirmation" },
] as const;

/**
 * Checkout progress header — wireframe 04.
 * Cart and checkout are one flow; this makes the flow legible and lets people
 * step back to the cart without losing their place.
 */
function CheckoutSteps({ current }: { current: "cart" | "details" | "done" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Checkout progress" className="mb-6">
      <ol className="flex items-center gap-2 sm:gap-4">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const clickable = done && "to" in step && step.to && step.to !== location.pathname;
          return (
            <li key={step.key} className="flex flex-1 items-center gap-2 sm:gap-4">
              <button
                disabled={!clickable}
                onClick={() => clickable && navigate(step.to!)}
                className={`flex items-center gap-2 ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    done
                      ? "bg-brand text-oncontrast"
                      : active
                      ? "bg-contrast text-oncontrast"
                      : "border border-line bg-paper text-ink-muted"
                  }`}
                >
                  {done ? <CheckIcon sx={{ fontSize: 14 }} /> : i + 1}
                </span>
                <span
                  className={`hidden text-sm font-semibold sm:block ${
                    active ? "text-ink" : done ? "text-brand" : "text-ink-muted"
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={`h-px flex-1 ${i < currentIndex ? "bg-brand" : "bg-line"}`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default CheckoutSteps;

import { toast, ToastContainer, ToastContentProps } from "react-toastify";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";
import type { CSSProperties, ReactNode } from "react";

/**
 * Cartly Editorial — notification pops.
 *
 * Every toast is rendered as a quiet Editorial card: warm paper surface,
 * hairline border, small radius, Inter body copy, and a slim state-coloured
 * progress line. Status is signalled with a soft-coloured icon chip rather than
 * a loud solid fill, matching the design contract (no neon, no shadow-heavy
 * SaaS surfaces). Colours resolve through the shared tokens, so light and dark
 * mode flip for free.
 *
 * Success/error helpers (`utils/showSuccess.ts` / `utils/showError.ts`) route
 * through `notify()`; direct `toast.*` call sites should prefer these helpers
 * so every pop uses the same visual language.
 */

export type ToastVariant = "success" | "error" | "info" | "warning";

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircleOutline />,
  error: <ErrorOutline />,
  info: <InfoOutlined />,
  warning: <WarningAmberOutlined />,
};

/* Full Tailwind class strings per variant — never composed at runtime, so the
   JIT can see them. */
const VARIANT_STYLES: Record<ToastVariant, { chip: string; bar: string }> = {
  success: {
    chip: "bg-state-success-soft text-state-success-on",
    bar: "bg-state-success",
  },
  error: {
    chip: "bg-state-danger-soft text-state-danger-on",
    bar: "bg-state-danger",
  },
  info: {
    chip: "bg-state-info/15 text-state-info",
    bar: "bg-state-info",
  },
  warning: {
    chip: "bg-state-warning-soft text-state-warning-on",
    bar: "bg-state-warning",
  },
};

function BrandedToast({
  variant,
  message,
  duration,
  closeToast,
}: {
  variant: ToastVariant;
  message: string;
  duration: number;
  closeToast?: () => void;
}) {
  const s = VARIANT_STYLES[variant];

  return (
    <div
      role="status"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className="relative flex items-start gap-3 overflow-hidden rounded-md border border-line bg-paper px-4 py-3 shadow-lift"
    >
      <span
        className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[16px] ${s.chip}`}
        aria-hidden
      >
        {ICONS[variant]}
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">{message}</p>
      {closeToast && (
        <button
          type="button"
          onClick={closeToast}
          aria-label="Dismiss notification"
          className="mt-0.5 -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-sunken hover:text-ink"
        >
          <CloseRounded sx={{ fontSize: 16 }} />
        </button>
      )}
      <span
        className={`cartly-progress absolute inset-x-0 bottom-0 h-[3px] origin-left ${s.bar}`}
        style={{ "--toast-duration": `${duration}ms` } as CSSProperties}
      />
    </div>
  );
}

/**
 * Show a branded notification pop. Keeps react-toastify as the toast engine
 * (enter/exit transitions, stacking, pause-on-hover) but swaps its stock look
 * for the Cartly Editorial card above.
 */
export function notify(
  variant: ToastVariant,
  message: string,
  options?: { autoClose?: number },
) {
  const duration =
    options?.autoClose ?? (variant === "error" ? 4200 : variant === "success" ? 1800 : 2600);

  toast<ToastContentProps>(
    ({ closeToast }: ToastContentProps) => (
      <BrandedToast variant={variant} message={message} duration={duration} closeToast={closeToast} />
    ),
    {
      type: variant,
      autoClose: duration,
      closeButton: false,
      icon: false,
      hideProgressBar: true,
      closeOnClick: false,
      draggable: false,
      pauseOnHover: true,
      pauseOnFocusLoss: false,
      className: "cartly-toast",
      bodyClassName: "cartly-toast-body",
    },
  );
}

/**
 * Mount this once (near the app root). Positions toast pops bottom-right and
 * caps how many stack at once.
 */
export function Toasts() {
  return (
    <ToastContainer
      position="bottom-right"
      newestOnTop
      closeOnClick={false}
      draggable={false}
      pauseOnFocusLoss={false}
      pauseOnHover
      closeButton={false}
      icon={false}
      hideProgressBar
      toastClassName="cartly-toast"
      bodyClassName="cartly-toast-body"
      limit={4}
    />
  );
}

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "../../../brand";

/** Enclosed checkout chrome: brand reassurance without catalog distractions. */
export default function CheckoutHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-md">
      <div className="page-shell flex h-[4.5rem] items-center justify-between gap-4">
        <button
          onClick={() => navigate("/cart")}
          className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink-soft transition hover:text-ink"
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          <span className="hidden sm:inline">Back to cart</span>
        </button>

        <button onClick={() => navigate("/")} aria-label="Cartly home" className="absolute left-1/2 -translate-x-1/2">
          <BrandMark />
        </button>

        <div className="flex items-center gap-3 text-xs font-semibold text-ink-muted">
          <span className="hidden items-center gap-1.5 sm:flex">
            <LockOutlinedIcon sx={{ fontSize: 15 }} className="text-state-success" />
            Secure checkout
          </span>
          <a href="mailto:support@cartly.example" className="flex items-center gap-1.5 transition hover:text-brand">
            <HelpOutlineIcon sx={{ fontSize: 16 }} />
            <span className="hidden md:inline">Need help?</span>
          </a>
        </div>
      </div>
    </header>
  );
}

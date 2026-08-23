import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

import { AppState } from "../../store";
import { calculateCountOfCartItems } from "../../utils/cart";
import { useI18n } from "../../features/i18n";

/**
 * Mobile bottom tab bar — replaces the hamburger for the five core jobs.
 * Wireframe 06-A. Hidden from `lg` up, where the header nav takes over.
 */
function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const carts = useSelector((state: AppState) => state.cart);
  const { data: user } = useSelector((state: AppState) => state.user);
  const cartCount = calculateCountOfCartItems(carts);
  const { t } = useI18n();

  const TABS = [
    { label: t("nav.shop"), icon: StorefrontOutlinedIcon, to: "/", match: (p: string) => p === "/" },
    {
      label: t("mobile.search"),
      icon: SearchIcon,
      to: "/",
      state: { focusSearch: true },
      match: () => false,
    },
    {
      label: t("mobile.cart"),
      icon: ShoppingBagOutlinedIcon,
      to: "/cart",
      badge: cartCount,
      match: (p: string) => p.startsWith("/cart"),
    },
    {
      label: t("nav.orders"),
      icon: ReceiptLongOutlinedIcon,
      to: user.isLogedIn ? "/orders" : "/login",
      match: (p: string) => p.startsWith("/order"),
    },
    {
      label: t("mobile.you"),
      icon: PersonOutlineIcon,
      to: user.isLogedIn ? "/account" : "/login",
      match: (p: string) => p.startsWith("/account") || p.startsWith("/profile") || p.startsWith("/login"),
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => {
          const active = tab.match(location.pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.label} className="flex-1">
              <button
                onClick={() => navigate(tab.to, tab.state ? { state: tab.state } : undefined)}
                aria-current={active ? "page" : undefined}
                className={`flex h-[3.875rem] w-full flex-col items-center justify-center gap-1 text-[0.625rem] font-semibold transition ${
                  active ? "text-brand" : "text-ink-muted hover:text-ink"
                }`}
              >
                <span className="relative">
                  <Icon sx={{ fontSize: 21 }} />
                  {!!tab.badge && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-action px-1 text-[0.5625rem] font-bold text-oncontrast">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </span>
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileTabBar;

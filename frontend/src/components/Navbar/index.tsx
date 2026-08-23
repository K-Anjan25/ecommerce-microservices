import { useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Divider,
  Drawer,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";

import { AppState } from "../../store";
import { logout } from "../../store/actions/userAction";
import { CategoryApi } from "../../api/categoryApi";
import { calculateCountOfCartItems } from "../../utils/cart";
import { setToLocalStorage } from "../../utils/localStorage";
import { showError } from "../../utils/showError";
import { useColorSchemeContext } from "../../context/colorScheme";
import { BrandMark } from "../../brand";
import { CommerceSearch } from "../../features/catalog";
import { useStoreSettings } from "../../features/storefront";

const CartBadge = styled(Badge)({
  "& .MuiBadge-badge": {
    right: -1,
    top: 1,
    color: "#FBF9F4",
    backgroundColor: "#A4472D",
    fontWeight: 800,
    fontSize: 10,
    minWidth: 18,
    height: 18,
  },
});

/** Primary destinations. Kept short on purpose — the long tail lives in the
 *  account menu and the mobile drawer. */
const PRIMARY = [
  { path: "/", label: "Shop", exact: true },
  { path: "/flash-sales", label: "Deals" },
  { path: "/gift-cards", label: "Gift Cards" },
  { path: "/loyalty", label: "Rewards" },
];

const SECONDARY = [
  { path: "/orders", label: "Orders" },
  { path: "/returns", label: "Returns" },
  { path: "/referral", label: "Referral" },
  { path: "/addresses", label: "Addresses" },
  { path: "/compare", label: "Compare" },
];

const ANNOUNCE_KEY = "cartly-announce-dismissed";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<any>();
  const { data: user, error } = useSelector((state: AppState) => state.user);
  const carts = useSelector((state: AppState) => state.cart);
  const { isDark, toggle: toggleScheme } = useColorSchemeContext();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [announce, setAnnounce] = useState(
    () => sessionStorage.getItem(ANNOUNCE_KEY) !== "1"
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const isShop = location.pathname === "/";
  const cartCount = calculateCountOfCartItems(carts);

  const { data: categories = [] } = useQuery("nav-categories", CategoryApi.getCategories, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const { settings: storeSettings } = useStoreSettings();

  const activeCategory = (location.state as { category?: string } | null)?.category ?? "";

  useEffect(() => {
    error && showError(error);
  }, [error]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  /* ⌘K / Ctrl+K focuses the header search — the search is now the primary
     entry point into the catalog, so it deserves a shortcut. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setDrawerOpen(false);
    setAnchorElUser(null);
    navigate(path);
  };

  const submitNavSearch = (rawTerm: string) => {
    const term = rawTerm.trim();
    if (!term) return;
    navigate("/", { state: { search: term } });
    setDrawerOpen(false);
    searchRef.current?.blur();
  };

  const pickCategory = (name: string) => {
    navigate("/", { state: { category: name } });
  };

  const dismissAnnounce = () => {
    sessionStorage.setItem(ANNOUNCE_KEY, "1");
    setAnnounce(false);
  };

  const handleCloseUserMenu = (setting: string) => {
    switch (setting) {
      case "Logout":
        dispatch(logout());
        break;
      case "Profile":
        navigate(`/profile/${user.userId}`);
        break;
      case "Account":
        navigate("/account");
        break;
      case "Admin":
        setToLocalStorage("admin-nav", 0);
        navigate("/admin");
        break;
      default:
        navigate(setting);
    }
    setAnchorElUser(null);
  };

  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const initials =
    (user.firstName?.at(0)?.toUpperCase() ?? "") +
    (user.lastName?.at(0)?.toUpperCase() ?? "");

  return (
    <>
      {/* ── announcement ─────────────────────────────────────────────── */}
      {announce && storeSettings.announcementEnabled && (
        <div className="relative bg-contrast text-oncontrast">
          <div className="page-shell flex h-9 items-center justify-center gap-3">
            <p className="truncate pr-6 text-[0.6875rem] font-semibold tracking-wide sm:text-xs">
              {storeSettings.announcementText}
              {storeSettings.announcementLinkText && (
                <>
                  <span className="mx-2 text-ink-muted">·</span>
                  <a className="text-accent hover:underline" href={storeSettings.announcementLinkUrl || "/flash-sales"}>
                    {storeSettings.announcementLinkText}
                  </a>
                </>
              )}
            </p>
            <button
              aria-label="Dismiss announcement"
              onClick={dismissAnnounce}
              className="absolute right-3 text-ink-muted transition hover:text-oncontrast sm:right-6"
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </button>
          </div>
        </div>
      )}

      {/* ── header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="page-shell flex h-[4.5rem] items-center gap-4">
          <button
            aria-label="Open menu"
            className="icon-button -ml-2 lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </button>

          <button
            onClick={() => navigate("/")}
            className="shrink-0"
            aria-label="Cartly home"
          >
            <BrandMark compact={false} />
          </button>

          <nav className="ml-5 hidden items-center gap-5 xl:flex" aria-label="Primary navigation">
            {PRIMARY.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`border-b py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                  isActive(item.path, item.exact)
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-soft hover:border-ink/40 hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <CommerceSearch
            value={navSearch}
            onChange={setNavSearch}
            onSubmit={submitNavSearch}
            onProductSelect={(product) => navigate(`/products/${product.id}`)}
            autoFocusRef={searchRef}
            className="mx-auto hidden w-full max-w-sm md:block"
          />

          <div className="ml-auto flex items-center gap-1">
            <Tooltip title={isDark ? "Switch to light" : "Switch to dark"}>
              <button
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={isDark}
                onClick={toggleScheme}
                className="icon-button"
              >
                {isDark ? (
                  <LightModeOutlinedIcon sx={{ fontSize: 20 }} />
                ) : (
                  <DarkModeOutlinedIcon sx={{ fontSize: 20 }} />
                )}
              </button>
            </Tooltip>

            <Tooltip title="Compare">
              <button
                aria-label="Compare products"
                onClick={() => navigate("/compare")}
                className="icon-button hidden sm:inline-flex"
              >
                <CompareArrowsIcon sx={{ fontSize: 20 }} />
              </button>
            </Tooltip>

            {user.isLogedIn && (
              <Tooltip title="Orders">
                <button
                  aria-label="My orders"
                  onClick={() => navigate("/orders")}
                  className="icon-button hidden sm:inline-flex"
                >
                  <ReceiptLongOutlinedIcon sx={{ fontSize: 20 }} />
                </button>
              </Tooltip>
            )}

            <button
              aria-label={`Cart, ${cartCount} items`}
              onClick={() => navigate("/cart")}
              className="icon-button"
            >
              <CartBadge badgeContent={cartCount}>
                <ShoppingCartOutlinedIcon sx={{ fontSize: 21 }} />
              </CartBadge>
            </button>

            {user.isLogedIn ? (
              <>
                <button
                  onClick={(event) => setAnchorElUser(event.currentTarget)}
                  aria-label="Account menu"
                  className="ml-1 rounded-full ring-offset-2 transition hover:ring-2 hover:ring-brand/30"
                >
                  <Avatar
                    alt={(user.firstName ?? "") + (user.lastName ?? "")}
                    src={user.profileImageURL ?? ""}
                    sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700 }}
                    className="!bg-action !text-oncontrast"
                  >
                    {initials}
                  </Avatar>
                </button>
                <Menu
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  open={Boolean(anchorElUser)}
                  onClose={() => setAnchorElUser(null)}
                  slotProps={{ paper: { className: "!mt-2 !min-w-[220px] !rounded-lg !border !border-line" } }}
                >
                  <div className="px-4 pb-2 pt-1">
                    <p className="truncate text-sm font-bold text-ink">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                  </div>
                  <Divider />
                  <MenuItem onClick={() => handleCloseUserMenu("Account")}>Account</MenuItem>
                  <MenuItem onClick={() => handleCloseUserMenu("Profile")}>Profile</MenuItem>
                  {SECONDARY.map((s) => (
                    <MenuItem key={s.path} onClick={() => handleCloseUserMenu(s.path)}>
                      {s.label}
                    </MenuItem>
                  ))}
                  {isAdmin && [
                    <Divider key="d" />,
                    <MenuItem key="admin" onClick={() => handleCloseUserMenu("Admin")}>
                      <DashboardIcon sx={{ fontSize: 18, mr: 1.2 }} /> Admin console
                    </MenuItem>,
                  ]}
                  <Divider />
                  <MenuItem
                    onClick={() => handleCloseUserMenu("Logout")}
                    className="!text-state-danger"
                  >
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <div className="ml-2 hidden items-center gap-2 sm:flex">
                <button onClick={() => navigate("/login")} className="secondary-button !py-2">
                  Login
                </button>
                <button onClick={() => navigate("/register")} className="dark-button !py-2">
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── navigation rail: stable destinations first, live taxonomy second ── */}
      <div className="sticky top-[4.5rem] z-40 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="page-shell no-scrollbar flex h-12 items-center gap-1 overflow-x-auto">
          {isShop && categories.length > 0 && (
            <>
              <span className="mr-3 shrink-0 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-ink-muted">
                Browse
              </span>
              <button
                onClick={() => pickCategory("")}
                className={`shrink-0 border-b px-3 py-3 text-xs font-semibold transition ${
                  !activeCategory ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                All
              </button>
              {categories.slice(0, 12).map((c) => (
                <button
                  key={c.id}
                  onClick={() => pickCategory(c.name)}
                  className={`shrink-0 border-b px-3 py-3 text-xs font-semibold transition ${
                    activeCategory === c.name
                      ? "border-ink text-ink"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── mobile drawer ────────────────────────────────────────────── */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="flex h-full w-[19rem] flex-col bg-paper">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="font-heading text-lg font-extrabold tracking-[0.18em] text-ink">
              CARTLY
            </span>
            <button aria-label="Close menu" className="icon-button" onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </button>
          </div>

          <div className="px-5 pb-4">
            <CommerceSearch
              value={navSearch}
              onChange={setNavSearch}
              onSubmit={submitNavSearch}
              onProductSelect={(product) => {
                setDrawerOpen(false);
                navigate(`/products/${product.id}`);
              }}
              prominent
            />
          </div>

          <Divider />

          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <p className="eyebrow px-3 pb-2">Shop</p>
            {PRIMARY.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-sm font-semibold transition ${
                  isActive(item.path, item.exact)
                    ? "bg-brand-soft text-brand"
                    : "text-ink-soft hover:bg-sunken hover:text-ink"
                }`}
              >
                {item.label}
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              </button>
            ))}

            <p className="eyebrow px-3 pb-2 pt-4">Your account</p>
            {SECONDARY.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-sm font-semibold transition ${
                  isActive(item.path)
                    ? "bg-brand-soft text-brand"
                    : "text-ink-soft hover:bg-sunken hover:text-ink"
                }`}
              >
                {item.label}
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              </button>
            ))}

            {categories.length > 0 && (
              <>
                <p className="eyebrow px-3 pb-2 pt-4">Categories</p>
                <div className="flex flex-wrap gap-2 px-3">
                  {categories.slice(0, 12).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setDrawerOpen(false);
                        pickCategory(c.name);
                      }}
                      className="chip"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {user.isLogedIn && isAdmin && (
              <button
                onClick={() => {
                  setToLocalStorage("admin-nav", 0);
                  go("/admin");
                }}
                className="mt-4 flex w-full items-center gap-2 rounded-sm bg-contrast px-3 py-2.5 text-sm font-semibold text-oncontrast"
              >
                <DashboardIcon sx={{ fontSize: 18 }} /> Admin console
              </button>
            )}
          </nav>

          <div className="space-y-2 border-t border-line p-4">
            <button
              onClick={toggleScheme}
              aria-pressed={isDark}
              className="flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-sunken hover:text-ink"
            >
              <span className="flex items-center gap-2">
                {isDark ? (
                  <LightModeOutlinedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
                )}
                {isDark ? "Light mode" : "Dark mode"}
              </span>
              <span className="chip !px-2 !py-0.5 !text-[0.625rem]">
                {isDark ? "Dark" : "Light"}
              </span>
            </button>

            {user.isLogedIn ? (
              <button onClick={() => dispatch(logout())} className="secondary-button w-full">
                Logout
              </button>
            ) : (
              <>
                <button onClick={() => go("/login")} className="secondary-button w-full">
                  Login
                </button>
                <button onClick={() => go("/register")} className="dark-button w-full">
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default Navbar;

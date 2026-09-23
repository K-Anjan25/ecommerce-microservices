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
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";

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
import { MiniCartDrawer } from "../../features/cart";
import { useI18n } from "../../features/i18n";
import { DISPLAY_CURRENCIES, getDisplayCurrency, setDisplayCurrency } from "../../utils/currency";

const CartBadge = styled(Badge)({
  "& .MuiBadge-badge": {
    right: -4,
    top: -2,
    color: "#FFFFFF",
    backgroundColor: "#FF5722",
    fontWeight: 800,
    fontSize: 10,
    minWidth: 18,
    height: 18,
  },
});

const PRIMARY = [
  { path: "/flash-sales", label: "Deals" },
  { path: "/?sort=DATE_DESC", label: "New Arrivals" },
  { path: "/gift-cards", label: "Gift Ideas" },
  { path: "/about", label: "About Us" },
];

const ANNOUNCE_KEY = "cartly-announce-dismissed";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<any>();
  const { data: user, error } = useSelector((state: AppState) => state.user);
  const carts = useSelector((state: AppState) => state.cart);
  const { isDark, toggle: toggleScheme } = useColorSchemeContext();
  const { language, toggleLanguage, t } = useI18n();
  const [currency, setCurrency] = useState(getDisplayCurrency);
  const [anchorElCurrency, setAnchorElCurrency] = useState<null | HTMLElement>(null);

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElCategory, setAnchorElCategory] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [announce, setAnnounce] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(ANNOUNCE_KEY) === "1") setAnnounce(false);
  }, []);
  const searchRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const isStaff = isAdmin || user?.roles?.includes("ROLE_MANAGER");
  const cartCount = calculateCountOfCartItems(carts);

  const { data: categories = [] } = useQuery("nav-categories", CategoryApi.getCategories, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const { settings: storeSettings } = useStoreSettings();

  useEffect(() => {
    error && showError(error);
  }, [error]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

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
    setAnchorElCategory(null);
    navigate(path);
  };

  const submitNavSearch = (rawTerm: string) => {
    const term = rawTerm.trim();
    if (!term) return;
    navigate({ pathname: "/", search: `?q=${encodeURIComponent(term)}` }, { state: { search: term } });
    setDrawerOpen(false);
    searchRef.current?.blur();
  };

  const pickCategory = (name: string) => {
    setAnchorElCategory(null);
    navigate(
      { pathname: "/", search: `?category=${encodeURIComponent(name)}` },
      { state: { category: name } }
    );
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

  const initials =
    (user.firstName?.at(0)?.toUpperCase() ?? "") +
    (user.lastName?.at(0)?.toUpperCase() ?? "");

  return (
    <>
      {/* ── header (Concept B: top nav + search + user actions) ───────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-md">
        {/* Row 1: Nav destinations on desktop */}
        <div className="hidden border-b border-line/60 bg-paper py-1.5 md:block">
          <div className="page-shell flex items-center justify-between gap-6 text-xs font-semibold text-ink-soft">
            {/* left: destinations · right: utilities (in flow — the old
                absolute cluster centred against the whole sticky header and
                overlapped the Cart/Wishlist icons) */}
            <div className="flex items-center gap-6">
            <button
              onClick={(e) => setAnchorElCategory(e.currentTarget)}
              className="flex items-center gap-1 hover:text-brand"
            >
              Categories <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
            </button>
            <Menu
              anchorEl={anchorElCategory}
              open={Boolean(anchorElCategory)}
              onClose={() => setAnchorElCategory(null)}
              slotProps={{ paper: { className: "!mt-1 !rounded-xl !border !border-line !shadow-lift" } }}
            >
              <MenuItem onClick={() => pickCategory("")}>All Categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} onClick={() => pickCategory(c.name)}>
                  {c.name}
                </MenuItem>
              ))}
            </Menu>

            {PRIMARY.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="transition hover:text-brand"
              >
                {item.label}
              </button>
            ))}
            </div>

            <div className="flex items-center gap-3 border-l border-line pl-4">
              <Tooltip title={language === "en" ? "हिन्दी" : "English"}>
                <button
                  aria-label="Language"
                  onClick={toggleLanguage}
                  className="inline-flex items-center gap-1 hover:text-brand text-xs font-bold"
                >
                  <LanguageOutlinedIcon sx={{ fontSize: 16 }} />
                  {language === "en" ? "EN" : "HI"}
                </button>
              </Tooltip>
              <Tooltip title="Currency — display only, you are always charged in ₹ INR">
                <button
                  aria-label="Currency"
                  onClick={(event) => setAnchorElCurrency(event.currentTarget)}
                  className="inline-flex items-center gap-1 hover:text-brand text-xs font-bold"
                >
                  {currency.code}
                </button>
              </Tooltip>
              <Menu
                anchorEl={anchorElCurrency}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={Boolean(anchorElCurrency)}
                onClose={() => setAnchorElCurrency(null)}
                slotProps={{ paper: { className: "!mt-2 !min-w-[150px] !rounded-xl !border !border-line !shadow-lift" } }}
              >
                <div className="px-4 pb-2 pt-2">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-ink-muted">
                    Display currency
                  </p>
                  <p className="text-[0.625rem] text-ink-muted">Charged in ₹ INR</p>
                </div>
                <Divider />
                {DISPLAY_CURRENCIES.map((c) => (
                  <MenuItem
                    key={c.code}
                    selected={c.code === currency.code}
                    onClick={() => {
                      setAnchorElCurrency(null);
                      if (c.code !== currency.code) {
                        setCurrency(c);
                        setDisplayCurrency(c.code);
                        // Display currency is read on render; a reload applies
                        // it across every page instantly.
                        window.location.reload();
                      }
                    }}
                  >
                    {c.label}
                  </MenuItem>
                ))}
              </Menu>
              <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
                <button
                  aria-label="Toggle theme"
                  onClick={toggleScheme}
                  className="hover:text-brand"
                >
                  {isDark ? (
                    <LightModeOutlinedIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <DarkModeOutlinedIcon sx={{ fontSize: 16 }} />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Row 2: Logo, Search bar, and Actions (Concept B layout) */}
        <div className="page-shell flex h-16 sm:h-[4.5rem] items-center justify-between gap-4">
          <div className="flex items-center gap-2">
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
          </div>

          {/* Central search input matching Concept B */}
          <div className="mx-4 flex-1 max-w-xl hidden sm:block">
            <CommerceSearch
              value={navSearch}
              onChange={setNavSearch}
              onSubmit={submitNavSearch}
              onProductSelect={(product) => navigate(`/products/${product.id}`)}
              autoFocusRef={searchRef}
              placeholder="Search for products, brands & more..."
            />
          </div>

          {/* Right Action Icons: My Account, Cart, Wishlist */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Account */}
            {user.isLogedIn ? (
              <>
                <button
                  onClick={(event) => setAnchorElUser(event.currentTarget)}
                  aria-label="Account menu"
                  className="flex flex-col items-center text-xs font-medium text-ink transition hover:text-brand"
                >
                  <Avatar
                    alt={(user.firstName ?? "") + (user.lastName ?? "")}
                    src={user.profileImageURL ?? ""}
                    sx={{ width: 26, height: 26, fontSize: 11, fontWeight: 700 }}
                    className="!bg-brand !text-white"
                  >
                    {initials}
                  </Avatar>
                  <span className="hidden sm:inline-block mt-0.5 text-[0.6875rem]">My Account</span>
                </button>
                <Menu
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  open={Boolean(anchorElUser)}
                  onClose={() => setAnchorElUser(null)}
                  slotProps={{ paper: { className: "!mt-2 !min-w-[200px] !rounded-xl !border !border-line !shadow-lift" } }}
                >
                  <div className="px-4 pb-2 pt-1">
                    <p className="truncate text-sm font-bold text-ink">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {user.email || (user as { phoneNumber?: string }).phoneNumber || "Signed in"}
                    </p>
                  </div>
                  <Divider />
                  <MenuItem onClick={() => handleCloseUserMenu("Account")}>Account</MenuItem>
                  <MenuItem onClick={() => handleCloseUserMenu("Profile")}>Profile</MenuItem>
                  <MenuItem onClick={() => handleCloseUserMenu("/orders")}>Orders</MenuItem>
                  <MenuItem onClick={() => handleCloseUserMenu("/addresses")}>Addresses</MenuItem>
                  {isStaff && [
                    <Divider key="d" />,
                    <MenuItem key="admin" onClick={() => handleCloseUserMenu("Admin")}>
                      <DashboardIcon sx={{ fontSize: 18, mr: 1.2 }} /> Admin console
                    </MenuItem>,
                  ]}
                  <Divider />
                  <MenuItem
                    onClick={() => handleCloseUserMenu("Logout")}
                    className="!text-state-danger font-semibold"
                  >
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex flex-col items-center text-ink transition hover:text-brand"
                aria-label="My Account"
              >
                <PersonOutlineIcon sx={{ fontSize: 24 }} />
                <span className="hidden sm:inline-block text-[0.6875rem] font-medium">My Account</span>
              </button>
            )}

            {/* Cart with badge */}
            <button
              aria-label={`Cart, ${cartCount} items`}
              onClick={() => setCartOpen(true)}
              className="flex flex-col items-center text-ink transition hover:text-brand"
            >
              <CartBadge badgeContent={cartCount}>
                <ShoppingCartOutlinedIcon sx={{ fontSize: 24 }} />
              </CartBadge>
              <span className="hidden sm:inline-block text-[0.6875rem] font-medium mt-0.5">
                Cart {cartCount > 0 ? `(${cartCount})` : ""}
              </span>
            </button>

            {/* Wishlist */}
            <button
              aria-label="Wishlist"
              onClick={() => navigate(user.isLogedIn ? "/wishlist" : "/login")}
              className="flex flex-col items-center text-ink transition hover:text-brand"
            >
              <FavoriteBorderIcon sx={{ fontSize: 24 }} />
              <span className="hidden sm:inline-block text-[0.6875rem] font-medium mt-0.5">Wishlist</span>
            </button>
          </div>
        </div>

        {/* Mobile Search row */}
        <div className="px-4 pb-3 sm:hidden">
          <CommerceSearch
            value={navSearch}
            onChange={setNavSearch}
            onSubmit={submitNavSearch}
            onProductSelect={(product) => navigate(`/products/${product.id}`)}
            placeholder="Search for products, brands & more..."
            prominent
          />
        </div>
      </header>

      {/* ── Concept B Flash Sale Banner (Bright Orange) ───────────────── */}
      {announce && (
        <div className="relative bg-accent text-white py-2 px-4 shadow-sm">
          <div className="page-shell flex items-center justify-center text-center">
            <p className="text-xs sm:text-sm font-bold tracking-wide">
              {storeSettings.announcementText || "FLASH SALE! Up to 40% OFF Electronics & Home! Ends Midnight!"}
            </p>
            <button
              aria-label="Dismiss announcement"
              onClick={dismissAnnounce}
              className="absolute right-4 text-white/80 transition hover:text-white"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="flex h-full w-[19rem] flex-col bg-paper">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <BrandMark />
            <button aria-label="Close menu" className="icon-button" onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div>
              <p className="eyebrow pb-2">Destinations</p>
              <div className="space-y-1">
                <button
                  onClick={() => go("/")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-soft hover:text-brand"
                >
                  All Products <ChevronRightIcon sx={{ fontSize: 16 }} />
                </button>
                {PRIMARY.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-soft hover:text-brand"
                  >
                    {item.label} <ChevronRightIcon sx={{ fontSize: 16 }} />
                  </button>
                ))}
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <p className="eyebrow pb-2">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setDrawerOpen(false);
                        pickCategory(c.name);
                      }}
                      className="chip text-xs"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </nav>

          <div className="border-t border-line p-4 space-y-2">
            {user.isLogedIn ? (
              <button onClick={() => dispatch(logout())} className="secondary-button w-full">
                Logout
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => go("/login")} className="secondary-button">
                  Sign In
                </button>
                <button onClick={() => go("/register")} className="primary-button">
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <MiniCartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Navbar;

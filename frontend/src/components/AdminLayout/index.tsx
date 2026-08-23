import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import CategoryIcon from "@mui/icons-material/Category";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import WebOutlinedIcon from "@mui/icons-material/WebOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { Drawer } from "@mui/material";

import { AppState } from "../../store";
import { BrandMark } from "../../brand";

const NAV = [
  { path: "/admin", label: "Dashboard", icon: SpaceDashboardOutlinedIcon, exact: true },
  { path: "/admin/orders", label: "Orders", icon: ReceiptLongIcon, exact: false },
  { path: "/admin/products", label: "Products", icon: Inventory2Icon, exact: false },
  { path: "/admin/categories", label: "Categories", icon: CategoryIcon, exact: false },
  { path: "/admin/coupons", label: "Coupons", icon: ConfirmationNumberIcon, exact: false },
  { path: "/admin/returns", label: "Returns", icon: AssignmentReturnIcon, exact: false },
  { path: "/admin/storefront", label: "Storefront", icon: WebOutlinedIcon, exact: false },
  { path: "/admin/audit-log", label: "Audit log", icon: HistoryOutlinedIcon, exact: false },
  { path: "/admin/users", label: "Customers", icon: PeopleOutlineIcon, exact: false },
] as const;

/**
 * Admin console shell — wireframe 05.
 * An ink nav rail (instead of the old light sidebar) so the admin reads
 * instantly as a different mode from the storefront.
 */
function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data: user } = useSelector((state: AppState) => state.user);

  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const managerOnly =
    user.roles?.includes("ROLE_MANAGER") && !user.roles?.includes("ROLE_ADMIN");
  const visibleNav = managerOnly
    ? NAV.filter((item) => ["/admin", "/admin/orders", "/admin/returns"].includes(item.path))
    : NAV;
  const current = visibleNav.find((n) => isActive(n.path, n.exact)) ?? visibleNav[0];

  const initials =
    (user.firstName?.at(0)?.toUpperCase() ?? "") + (user.lastName?.at(0)?.toUpperCase() ?? "");

  const Rail = (
    <div className="flex h-full w-64 flex-col bg-contrast text-oncontrast">
      <div className="flex items-center justify-between px-5 py-5">
        <div>
          <BrandMark inverse />
          <span className="mt-2 block text-[0.5625rem] font-semibold uppercase tracking-[0.2em] text-accent">
            Studio administration
          </span>
        </div>
        <button
          aria-label="Close navigation"
          className="text-ink-muted hover:text-oncontrast lg:hidden"
          onClick={() => setOpen(false)}
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {visibleNav.map(({ path, label, icon: Icon, exact }) => {
          const active = isActive(path, exact);
          return (
            <button
              key={path}
              onClick={() => {
                setOpen(false);
                navigate(path);
              }}
              className={`flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-white/10 text-oncontrast"
                  : "text-ink-muted hover:bg-white/5 hover:text-oncontrast"
              }`}
            >
              <Icon sx={{ fontSize: 18 }} className={active ? "text-accent" : ""} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-3">
        <button
          onClick={() => navigate("/")}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-white/5 hover:text-oncontrast"
        >
          <StorefrontIcon sx={{ fontSize: 18 }} />
          Back to shop
        </button>
        <div className="flex items-center gap-3 rounded-sm bg-white/5 px-3 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action text-xs font-bold">
            {initials || "A"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-[0.625rem] text-ink-muted">
              {user.roles?.includes("ROLE_SUPER_ADMIN")
                ? "Super admin"
                : managerOnly
                ? "Store manager"
                : "Admin"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen shrink-0 overflow-y-auto lg:block">{Rail}</aside>

      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        {Rail}
      </Drawer>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-md sm:px-6 lg:py-4">
          <button
            aria-label="Open navigation"
            className="icon-button -ml-2 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </button>
          <div className="min-w-0">
            <p className="truncate font-display text-2xl text-ink">{current.label}</p>
            <p className="truncate text-xs text-ink-muted">
              Admin console · {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </p>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;

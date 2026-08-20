import { Box, Button } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import CategoryIcon from "@mui/icons-material/Category";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";

const NAV = [
  { path: "/admin", label: "Dashboard", icon: HomeIcon, exact: true },
  { path: "/admin/products", label: "Products", icon: Inventory2Icon, exact: false },
  { path: "/admin/categories", label: "Categories", icon: CategoryIcon, exact: false },
  { path: "/admin/orders", label: "Orders", icon: ReceiptLongIcon, exact: false },
  { path: "/admin/users", label: "Users", icon: PeopleOutlineIcon, exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <Box className="sticky top-24 space-y-1 rounded-xl border border-ink/10 bg-white p-4 shadow-card">
          <div className="mb-3 px-3 font-mono text-xs font-bold uppercase tracking-[0.25em] text-ink-muted">
            Admin
          </div>
          {NAV.map(({ path, label, icon: Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <Button
                key={path}
                fullWidth
                startIcon={<Icon />}
                onClick={() => navigate(path)}
                className={`justify-start !rounded-lg !px-3 !py-2.5 !text-sm !font-semibold normal-case ${
                  active
                    ? "!bg-brand-soft !text-brand"
                    : "!text-ink-soft hover:!bg-brand-tint hover:!text-brand"
                }`}
              >
                {label}
              </Button>
            );
          })}
          <Box className="border-t border-ink/10 pt-3">
            <Button
              fullWidth
              startIcon={<StorefrontIcon />}
              onClick={() => navigate("/")}
              className="justify-start !rounded-lg !px-3 !py-2.5 !text-sm !font-semibold normal-case !text-ink-soft hover:!bg-brand-tint hover:!text-brand"
            >
              Back to shop
            </Button>
          </Box>
        </Box>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {NAV.map(({ path, label, icon: Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <Button
                key={path}
                startIcon={<Icon />}
                onClick={() => navigate(path)}
                className={`shrink-0 rounded-full !px-3 !py-1.5 !text-sm !font-semibold normal-case ${
                  active
                    ? "!bg-brand !text-paper"
                    : "!border !border-ink/10 !bg-white !text-ink-soft"
                }`}
              >
                {label}
              </Button>
            );
          })}
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;

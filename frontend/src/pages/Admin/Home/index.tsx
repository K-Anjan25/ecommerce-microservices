import { Box, Chip, Divider, Typography } from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CategoryIcon from "@mui/icons-material/Category";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import { useTheme } from "@mui/material/styles";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CategoryApi } from "../../../api/categoryApi";
import { OrderApi } from "../../../api/orderApi";
import { ProductApi } from "../../../api/productApi";
import PageHeader from "../../../components/PageHeader";
import { AppState } from "../../../store";
import { PRODUCT_ADMIN_PARAM } from "../../../constants/product";
import { formatPrice } from "../../../utils/cart";

const statusColors: Record<string, string> = {
  PENDING: "!bg-state-warning-soft !text-state-warning-on",
  PAID: "!bg-state-success-soft !text-state-success-on",
  APPROVED: "!bg-brand-soft !text-brand",
  CANCELLING: "!bg-state-warning-soft !text-state-warning-on",
  CANCELLED: "!bg-state-danger-soft !text-state-danger-on",
  REFUNDED: "!bg-state-info/10 !text-state-info",
};

function Home() {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const axis = muiTheme.palette.text.disabled;
  const grid = muiTheme.palette.divider;
  const { data: user } = useSelector((state: AppState) => state.user);

  const { data: stats } = useQuery(["admin:dashboard"], OrderApi.getDashboardStats, {
    retry: false,
  });

  const { data: products } = useQuery(["admin:products", "stats"], () =>
    ProductApi.getProductsByPagination({
      ...PRODUCT_ADMIN_PARAM,
      pageNo: 0,
      pageSize: 1,
    })
  );

  const { data: allProducts } = useQuery(["admin:products", "lowstock"], () =>
    ProductApi.getProductsByPagination({
      ...PRODUCT_ADMIN_PARAM,
      pageNo: 0,
      pageSize: 100,
    })
  );

  const { data: categories } = useQuery(["admin:categories", "stats"], () =>
    CategoryApi.getCategories()
  );

  const lowStock = (allProducts?.data ?? []).filter(
    (p) => (p.quantityInStock ?? 999) <= 5
  );

  const topProductIds = (stats?.topProducts ?? []).map((t) => t.productId);
  const { data: topProductEntities } = useQuery(
    ["admin:top-products", topProductIds.join(",")],
    () => ProductApi.getProductsByIds(topProductIds),
    { enabled: topProductIds.length > 0, retry: false }
  );
  const topProductNames = new Map(
    (topProductEntities ?? []).map((p) => [p.id, p.name])
  );

  const kpis = [
    {
      label: "Revenue today",
      value: formatPrice(stats?.revenueToday ?? 0),
      sub: `${stats?.ordersToday ?? 0} order${(stats?.ordersToday ?? 0) === 1 ? "" : "s"} today`,
      icon: <TodayOutlinedIcon />,
      tint: "bg-brand-soft text-brand",
    },
    {
      label: "Revenue · last 7 days",
      value: formatPrice(stats?.revenueLast7Days ?? 0),
      sub: `${stats?.totalOrders ?? 0} orders all-time`,
      icon: <TrendingUpOutlinedIcon />,
      tint: "bg-accent/20 text-accent-dark",
    },
    {
      label: "Avg order value",
      value: formatPrice(stats?.avgOrderValue ?? 0),
      sub: "cancelled orders excluded",
      icon: <PaidOutlinedIcon />,
      tint: "bg-brand-tint text-brand-main",
    },
    {
      label: "Catalog",
      value: `${products?.totalSize ?? 0} products`,
      sub: `${categories?.length ?? 0} categories`,
      icon: <Inventory2Icon />,
      tint: "bg-brand-soft text-brand",
      path: "/admin/products",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? "Admin"}`}
        subtitle="Revenue, orders and catalog at a glance."
      />

      <div className="grid border-y border-line sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Box
            key={kpi.label}
            onClick={kpi.path ? () => navigate(kpi.path as string) : undefined}
            className={`border-b border-line p-5 sm:border-r xl:border-b-0 xl:last:border-r-0 ${kpi.path ? "cursor-pointer transition hover:bg-sunken" : ""}`}
          >
            <Box className="mb-4 text-brand">
              {kpi.icon}
            </Box>
            <Typography className="text-sm text-ink-soft">{kpi.label}</Typography>
            <Typography className="mt-1 !font-display !text-3xl !text-ink">
              {kpi.value}
            </Typography>
            <Typography variant="caption" className="text-ink-soft">
              {kpi.sub}
            </Typography>
          </Box>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Box className="border-t border-ink py-6">
          <Typography className="mb-4 !font-display !text-2xl !text-ink">
            Revenue · last 7 days
          </Typography>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.dailyRevenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke={axis} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke={axis}
                  width={70}
                  tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip
                  formatter={(value: any) => [formatPrice(Number(value)), "Revenue"]}
                  cursor={{ fill: "rgba(11,107,85,0.06)" }}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: muiTheme.palette.divider,
                    background: muiTheme.palette.background.paper,
                    color: muiTheme.palette.text.primary,
                  }}
                  itemStyle={{ color: muiTheme.palette.text.primary }}
                  labelStyle={{ color: muiTheme.palette.text.secondary }}
                />
                <Bar dataKey="revenue" fill={muiTheme.palette.primary.main} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Box>

        <Box className="border-t border-ink py-6">
          <Typography className="mb-4 !font-display !text-2xl !text-ink">
            Orders by status
          </Typography>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats?.ordersByStatus ?? {}).map(([status, count]) => (
              <Chip
                key={status}
                label={`${status} · ${count}`}
                className={statusColors[status] ?? "!bg-sunken !text-ink-soft"}
              />
            ))}
            {!stats?.ordersByStatus && (
              <Typography variant="body2" className="text-ink-soft">
                No order data yet.
              </Typography>
            )}
          </div>
          <Divider className="my-4" />
          <Box
            className="flex cursor-pointer items-center justify-between p-3 transition hover:bg-brand-tint"
            onClick={() => navigate("/admin/orders")}
          >
            <Box className="flex items-center gap-2">
              <ReceiptLongIcon className="text-brand" />
              <Typography className="font-semibold text-ink">Manage orders</Typography>
            </Box>
            <Chip size="small" label={`${stats?.totalOrders ?? 0} total`} className="!bg-brand-soft !text-brand" />
          </Box>
          <Box
            className="mt-2 flex cursor-pointer items-center justify-between p-3 transition hover:bg-brand-tint"
            onClick={() => navigate("/admin/categories")}
          >
            <Box className="flex items-center gap-2">
              <CategoryIcon className="text-brand" />
              <Typography className="font-semibold text-ink">Manage categories</Typography>
            </Box>
            <Chip size="small" label={`${categories?.length ?? 0}`} className="!bg-brand-soft !text-brand" />
          </Box>
        </Box>
      </div>

      <Box className="border-t border-ink py-6">
        <Typography className="mb-4 !font-display !text-2xl !text-ink">
          Top products by revenue
        </Typography>
        {(stats?.topProducts ?? []).length === 0 ? (
          <Typography variant="body2" className="text-ink-soft">
            No sales yet — top products will appear here once orders come in.
          </Typography>
        ) : (
          <div className="space-y-2">
            {(stats?.topProducts ?? []).map((top, index) => (
              <Box
                key={top.productId}
                className="flex items-center justify-between gap-4 border-b border-line py-3"
              >
                <Box className="flex min-w-0 items-center gap-3">
                  <Typography className="w-6 font-bold text-brand">
                    {index + 1}
                  </Typography>
                  <Typography className="truncate font-semibold text-ink">
                    {topProductNames.get(top.productId) ?? `Product ${top.productId.slice(0, 8)}`}
                  </Typography>
                </Box>
                <Box className="flex shrink-0 items-center gap-3">
                  <Chip size="small" label={`${top.unitsSold} sold`} className="!bg-brand-soft !text-brand" />
                  <Typography className="price-text">
                    {formatPrice(top.revenue)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </div>
        )}
      </Box>

      {lowStock.length > 0 && (
        <Box className="border-y border-state-warning/40 bg-state-warning-soft/40 py-6">
          <Box className="mb-3 flex items-center gap-2">
            <WarningAmberIcon className="text-state-warning-on" />
            <Typography variant="h6" className="font-semibold text-state-warning-on">
              Low stock alert
            </Typography>
            <Chip
              size="small"
              label={`${lowStock.length} product${lowStock.length > 1 ? "s" : ""}`}
              className="!bg-state-warning-soft !font-semibold !text-state-warning-on"
            />
          </Box>
          <Box className="flex flex-wrap gap-2">
            {lowStock.slice(0, 8).map((product) => (
              <Chip
                key={product.id}
                label={`${product.name} (${product.quantityInStock ?? 0} left)`}
                className={
                  (product.quantityInStock ?? 0) <= 0
                    ? "!bg-state-danger-soft !font-medium !text-state-danger-on"
                    : "!bg-white !font-medium !text-state-warning-on"
                }
                onClick={() => navigate(`/admin/addEditProduct/${product.id}`)}
              />
            ))}
          </Box>
        </Box>
      )}
    </div>
  );
}

export default Home;

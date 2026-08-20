import { Box, Typography } from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CategoryIcon from "@mui/icons-material/Category";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { CategoryApi } from "../../../api/categoryApi";
import { OrderApi } from "../../../api/orderApi";
import { ProductApi } from "../../../api/productApi";
import PageHeader from "../../../components/PageHeader";
import { AppState } from "../../../store";
import { PRODUCT_ADMIN_PARAM } from "../../../constants/product";

function Home() {
  const navigate = useNavigate();
  const { data: user } = useSelector((state: AppState) => state.user);

  const { data: products, isLoading: productsLoading } = useQuery(
    ["admin:products", "stats"],
    () =>
      ProductApi.getProductsByPagination({
        ...PRODUCT_ADMIN_PARAM,
        pageNo: 0,
        pageSize: 1,
      })
  );

  const { data: orders, isLoading: ordersLoading } = useQuery(
    ["admin:orders", "stats"],
    () => OrderApi.getOrders(0, 1)
  );

  const { data: categories, isLoading: categoriesLoading } = useQuery(
    ["admin:categories", "stats"],
    () => CategoryApi.getCategories()
  );

  const stats = [
    {
      label: "Total Products",
      value: products?.totalSize,
      loading: productsLoading,
      icon: <Inventory2Icon />,
      tint: "bg-brand-soft text-brand",
      path: "/admin/products",
    },
    {
      label: "Total Orders",
      value: orders?.totalSize,
      loading: ordersLoading,
      icon: <ReceiptLongIcon />,
      tint: "bg-accent/20 text-accent-dark",
      path: "/admin/orders",
    },
    {
      label: "Categories",
      value: categories?.length,
      loading: categoriesLoading,
      icon: <CategoryIcon />,
      tint: "bg-brand-tint text-brand-main",
      path: "/admin/categories",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? "Admin"}`}
        subtitle="Here is a quick overview of your store."
      />

      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <Box
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className="panel cursor-pointer p-6 transition hover:shadow-lg"
          >
            <Box className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${stat.tint}`}>
              {stat.icon}
            </Box>
            <Typography className="text-sm text-ink-soft">{stat.label}</Typography>
            <Typography variant="h4" className="mt-1 font-bold text-ink">
              {stat.loading ? "—" : (stat.value ?? 0)}
            </Typography>
          </Box>
        ))}
      </div>

      <div>
        <Typography variant="h6" className="mb-4 font-semibold text-ink">
          Quick actions
        </Typography>
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <Box
              key={stat.label}
              onClick={() => navigate(stat.path)}
              className="panel flex items-center justify-between p-6 transition hover:shadow-lg"
            >
              <Typography className="font-semibold text-ink">
                Manage {stat.label.toLowerCase()}
              </Typography>
              <Box className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.tint}`}>
                {stat.icon}
              </Box>
            </Box>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;

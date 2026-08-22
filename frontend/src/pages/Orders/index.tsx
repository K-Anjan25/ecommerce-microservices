import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { OrderApi } from "../../api/orderApi";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import { Button, Paper, Typography } from "@mui/material";
import { Order } from "../../types/order";
import { formatDate } from "../../utils/date";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../store";
import { addToCart } from "../../store/actions/cartAction";
import { showSuccess } from "../../utils/showSuccess";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

function Orders() {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const userId = useSelector((state: AppState) => state.user.data.userId);

  const { data: orders, isLoading } = useQuery(
    ["user:orders", userId],
    () => OrderApi.getOrders(0, 100),
    { enabled: Boolean(userId) }
  );

  const userOrders = orders?.data ?? [];

  const handleBuyAgain = (order: Order) => {
    order.items.forEach((item) => {
      dispatch(
        addToCart({
          product: { id: item.productId, name: item.productId } as any,
          quantity: item.quantity,
          variantId: item.variantId,
        })
      );
    });
    showSuccess("Items added to cart");
    navigate("/cart");
  };

  if (isLoading) {
    return (
      <div className="page-shell">
        <PageHeader title="Orders" subtitle="Your order history." />
        <Paper className="p-6"><Typography>Loading...</Typography></Paper>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Orders"
        subtitle={`${userOrders.length} order${userOrders.length === 1 ? "" : "s"} in your history`}
      />

      {userOrders.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<ReceiptLongOutlinedIcon fontSize="large" />}
            title="No orders yet"
            subtitle="When you place orders, they will show up here."
            action={
              <Button
                variant="contained"
                className="!bg-brand !text-paper hover:!bg-brand-main"
                onClick={() => navigate("/")}
              >
                Continue shopping
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order: Order) => (
            <Paper key={order.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Typography variant="subtitle1" className="font-semibold">
                    Order #{order.id}
                  </Typography>
                  <Typography className="text-sm text-ink-soft">
                    {formatDate(order.createdDate)} · {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </Typography>
                  <Typography className="text-sm text-ink-soft">
                    Status: <span className="font-semibold">{order.orderStatus}</span>
                  </Typography>
                </div>
                <div className="flex items-center gap-3">
                  <Typography className="price-text text-lg">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      minimumFractionDigits: 2,
                    }).format(order.totalAmount)}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ShoppingCartOutlinedIcon />}
                    onClick={() => handleBuyAgain(order)}
                  >
                    Buy again
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/orderDetail/${order.id}`)}
                  >
                    View details
                  </Button>
                </div>
              </div>
            </Paper>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;

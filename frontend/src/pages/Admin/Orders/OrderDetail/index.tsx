import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useQuery, useMutation } from "react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrderApi } from "../../../../api/orderApi";
import { ProductApi } from "../../../../api/productApi";
import { UserApi } from "../../../../api/userApi";
import { ReturnApi } from "../../../../api/returnApi";
import EmptyState from "../../../../components/EmptyState";
import Loader from "../../../../components/Loader";
import PageHeader from "../../../../components/PageHeader";
import TableWithDetail from "../../../../components/Table/TableWithDetail";
import { ORDER_PRODUCT_COLUMNS } from "../../../../constants/table";
import { Order } from "../../../../types/order";
import { ReturnRequest, ReturnStatus } from "../../../../types/returnRequest";
import { OrderProductRow } from "../../../../types/table";
import {
  calculateTotalPriceOfOneProduct,
  formatPrice,
} from "../../../../utils/cart";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { showSuccess } from "../../../../utils/showSuccess";
import { showError } from "../../../../utils/showError";

interface OrderLocation {
  state?: Order;
}

function OrderDetail() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { state: orderFromNav }: OrderLocation = useLocation();

  const { data: order, isLoading: orderLoading } = useQuery(
    ["admin:order", orderId],
    () => {
      if (orderFromNav) return orderFromNav;
      if (orderId) return OrderApi.getOrderById(orderId);
      return undefined;
    },
    { enabled: Boolean(orderId || orderFromNav) }
  );

  const resolvedOrder = orderFromNav ?? order;

  const { data: products, isLoading: productsLoading } = useQuery(
    ["admin:order-product", resolvedOrder?.id],
    () => {
      if (!resolvedOrder) return undefined;
      const productIds = resolvedOrder.items.map((item) => item.productId);
      return ProductApi.getProductsByIds(productIds);
    },
    { enabled: Boolean(resolvedOrder) }
  );

  const { data: user, isLoading: userLoading } = useQuery(
    ["admin:user", resolvedOrder?.customerId],
    () => {
      if (!resolvedOrder) return undefined;
      return UserApi.getUserById(resolvedOrder.customerId);
    },
    { enabled: Boolean(resolvedOrder) }
  );

  const { data: returns, refetch: refetchReturns } = useQuery(
    ["admin:returns", resolvedOrder?.id],
    () => {
      if (!resolvedOrder) return [];
      return ReturnApi.getReturnRequestsByOrder(resolvedOrder.id);
    },
    { enabled: Boolean(resolvedOrder) }
  );

  const approveMutation = useMutation(ReturnApi.approveReturnRequest, {
    onSuccess: () => { showSuccess("Return approved"); refetchReturns(); },
  });
  const rejectMutation = useMutation(ReturnApi.rejectReturnRequest, {
    onSuccess: () => { showSuccess("Return rejected"); refetchReturns(); },
  });
  const refundMutation = useMutation(ReturnApi.refundReturnRequest, {
    onSuccess: () => { showSuccess("Refund processed"); refetchReturns(); },
    onError: (e: any) => {
      showError(e.response?.data?.message ?? e.response?.data?.error ?? "Refund failed");
      refetchReturns();
    },
  });

  if (orderLoading && !orderFromNav) return <Loader />;

  if (!resolvedOrder) {
    return (
      <div className="panel">
        <EmptyState
          icon={<ReceiptLongOutlinedIcon fontSize="large" />}
          title="Order not found"
          subtitle="We could not find the order you are looking for."
          action={
            <Button
              variant="contained"
                            onClick={() => navigate("/admin/orders")}
            >
              Back to orders
            </Button>
          }
        />
      </div>
    );
  }

  const orderRows = products?.map((product) => {
    const quantity =
      resolvedOrder.items.find((item) => item.productId === product?.id)
        ?.quantity ?? 0;
    return new OrderProductRow(
      product.id,
      product.name,
      user?.firstName + " " + user?.lastName,
      user?.email ?? "",
      resolvedOrder.address.state,
      product.unitPrice,
      quantity,
      calculateTotalPriceOfOneProduct(product.unitPrice, quantity)
    );
  });

  const calculateSubtotal = () => {
    return orderRows
      ?.reduce((acc, product) => product.totalPrice + acc, 0)
      .toFixed(2);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order details"
        subtitle={`Order ${resolvedOrder.id}`}
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            className="border-ink/20 text-ink hover:border-brand hover:bg-brand-tint hover:text-brand"
            onClick={() => navigate("/admin/orders")}
          >
            Back to orders
          </Button>
        }
      />

      <Box className="flex flex-wrap gap-4">
        <Box className="panel flex items-center gap-2 px-5 py-3">
          <span className="text-sm text-ink-soft">Status:</span>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
            {resolvedOrder.orderStatus}
          </span>
        </Box>
        <Box className="panel flex items-center gap-2 px-5 py-3">
          <span className="text-sm text-ink-soft">Customer:</span>
          <span className="text-sm font-semibold text-ink">
            {user
              ? `${user.firstName} ${user.lastName} (${user.email})`
              : "—"}
          </span>
        </Box>
      </Box>

      {productsLoading || userLoading ? (
        <Loader />
      ) : (
        <TableWithDetail rows={orderRows} columns={ORDER_PRODUCT_COLUMNS} />
      )}

      <Paper className="ml-auto flex w-fit items-center gap-6 p-5">
        <div className="text-right">
          <Typography className="text-sm text-ink-soft">Subtotal</Typography>
          <Typography variant="h5" className="price-text">
            {formatPrice(Number(calculateSubtotal() ?? 0))}
          </Typography>
        </div>
      </Paper>

      {returns && returns.length > 0 && (
        <Paper className="p-6 sm:p-8">
          <Typography variant="h6" className="mb-4 font-bold">
            Returns & refunds
          </Typography>
          <div className="space-y-3">
            {returns.map((r: ReturnRequest) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-ink/10 p-4">
                <div>
                  <Typography className="font-semibold">Product {r.productId}</Typography>
                  <Typography className="text-sm text-ink-soft">Qty: {r.quantity} · Reason: {r.reason || "—"}</Typography>
                  {r.rejectionReason && (
                    <Typography className="text-sm text-rose-600">Rejected: {r.rejectionReason}</Typography>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Chip label={r.status} color={r.status === ReturnStatus.REFUNDED ? "success" : r.status === ReturnStatus.APPROVED ? "info" : r.status === ReturnStatus.REJECTED ? "error" : "warning"} />
                  {r.status === ReturnStatus.REQUESTED && (
                    <>
                      <Button size="small" variant="contained" onClick={() => approveMutation.mutate(r.id)}>Approve</Button>
                      <Button size="small" variant="outlined" onClick={() => rejectMutation.mutate({ id: r.id, reason: "Not eligible" })}>Reject</Button>
                    </>
                  )}
                  {r.status === ReturnStatus.APPROVED && (
                    <Button size="small" variant="contained" onClick={() => refundMutation.mutate(r.id)}>Refund</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Paper>
      )}
    </div>
  );
}

export default OrderDetail;

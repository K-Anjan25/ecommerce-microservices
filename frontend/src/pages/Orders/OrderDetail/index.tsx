import { useQuery, useMutation } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import { OrderApi } from "../../../api/orderApi";
import { ReturnApi } from "../../../api/returnApi";
import PageHeader from "../../../components/PageHeader";
import { Paper, Typography, Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import Loader from "../../../components/Loader";
import EmptyState from "../../../components/EmptyState";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { showSuccess } from "../../../utils/showSuccess";
import { showError } from "../../../utils/showError";
import { useState } from "react";
import { ReturnStatus, ReturnRequest } from "../../../types/returnRequest";
import { OrderItem } from "../../../types/order";

function UserOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", quantity: 1, reason: "" });

  const { data: order, isLoading } = useQuery(
    ["user:order", orderId],
    () => OrderApi.getOrderById(orderId!),
    { enabled: Boolean(orderId) }
  );

  const { data: returns } = useQuery(
    ["returns:order", orderId],
    () => ReturnApi.getReturnRequestsByOrder(orderId!),
    { enabled: Boolean(orderId) }
  );

  const createMutation = useMutation(ReturnApi.createReturnRequest, {
    onSuccess: () => {
      showSuccess("Return request submitted");
      setOpen(false);
      setForm({ productId: "", quantity: 1, reason: "" });
    },
    onError: () => showError("Failed to submit return request"),
  });

  const invoiceMutation = useMutation(OrderApi.getInvoice, {
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    onError: () => showError("Could not download invoice"),
  });

  const handleSubmit = () => {
    if (!form.productId || form.quantity < 1) {
      showError("Select a product and quantity");
      return;
    }
    createMutation.mutate({
      orderId: order!.id,
      customerId: order!.customerId,
      productId: form.productId,
      quantity: form.quantity,
      reason: form.reason || undefined,
    });
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!order) {
    return (
      <div className="page-shell">
        <PageHeader title="Order" subtitle="Order details." />
        <Paper className="p-6"><Typography>Order not found</Typography></Paper>
      </div>
    );
  }

  const productReturns = returns?.filter((r: ReturnRequest) => r.productId) ?? [];

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title={`Order #${order.id}`}
        subtitle={new Date(order.createdDate).toLocaleString()}
        actions={
          <>
            <Button
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={() => invoiceMutation.mutate(orderId!)}
              disabled={invoiceMutation.isLoading}
            >
              Invoice
            </Button>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/orders")}>
              Back to orders
            </Button>
          </>
        }
      />

      <Paper className="p-6">
        <Typography variant="h6" className="mb-4 font-bold">
          Items
        </Typography>
        <div className="space-y-3">
          {order.items.map((item: OrderItem) => {
            const hasReturn = productReturns.some((r: ReturnRequest) => r.productId === item.productId);
            return (
              <div key={item.productId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink/10 p-4">
                <div>
                  <Typography className="font-semibold">Product {item.productId}</Typography>
                  <Typography className="text-sm text-ink-soft">Qty: {item.quantity}</Typography>
                </div>
                <div className="flex items-center gap-2">
                  {hasReturn ? (
                    <Chip label="Return requested" size="small" color="info" />
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setOpen(true)}
                    >
                      Request return
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Request return</DialogTitle>
        <DialogContent>
          <div className="space-y-3 pt-2">
            <FormControl fullWidth size="small">
              <InputLabel>Product</InputLabel>
              <Select
                value={form.productId}
                label="Product"
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
              >
                {order.items.map((item) => (
                  <MenuItem key={item.productId} value={item.productId}>
                    Product {item.productId} (Qty: {item.quantity})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Quantity"
              type="number"
              size="small"
              fullWidth
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              inputProps={{ min: 1, max: order.items.find((i: OrderItem) => i.productId === form.productId)?.quantity ?? 1 }}
            />
            <TextField
              label="Reason (optional)"
              size="small"
              fullWidth
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default UserOrderDetail;

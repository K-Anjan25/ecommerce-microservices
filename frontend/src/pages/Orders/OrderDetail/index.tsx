import { useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

import { OrderApi } from "../../../api/orderApi";
import { ProductApi } from "../../../api/productApi";
import { ReturnApi } from "../../../api/returnApi";
import PageHeader from "../../../components/PageHeader";
import EmptyState from "../../../components/EmptyState";
import { StatusPill } from "../../../components/DataTable";
import { showSuccess } from "../../../utils/showSuccess";
import { showError } from "../../../utils/showError";
import { ReturnRequest } from "../../../types/returnRequest";
import { OrderItem } from "../../../types/order";
import { formatPrice } from "../../../utils/cart";
import { formatDate } from "../../../utils/date";

/** Happy-path progression shown as a timeline; cancelled/refunded fall back. */
const FLOW = ["PENDING", "PAID", "APPROVED"];

function UserOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", quantity: 1, reason: "" });

  const { data: order, isLoading, refetch: refetchOrder } = useQuery(
    ["user:order", orderId],
    () => OrderApi.getOrderById(orderId!),
    { enabled: Boolean(orderId) }
  );

  const productIds = useMemo(
    () => Array.from(new Set((order?.items ?? []).map((i) => i.productId))),
    [order]
  );

  /* The old screen printed "Product <uuid>" for every line. Resolve the real
     products so items, the return dialog and the returns list all read. */
  const { data: products } = useQuery(
    ["user:order:products", productIds.join(",")],
    () => ProductApi.getProductsByIds(productIds),
    { enabled: productIds.length > 0, retry: false }
  );
  const byId = useMemo(() => new Map((products ?? []).map((p) => [p.id, p])), [products]);
  const nameOf = (id: string) => byId.get(id)?.name ?? `Product ${id.slice(0, 8)}…`;

  const { data: returns, refetch: refetchReturns } = useQuery(
    ["returns:order", orderId],
    () => ReturnApi.getReturnRequestsByOrder(orderId!),
    { enabled: Boolean(orderId) }
  );

  const createMutation = useMutation(ReturnApi.createReturnRequest, {
    onSuccess: () => {
      showSuccess("Return request submitted");
      setOpen(false);
      setForm({ productId: "", quantity: 1, reason: "" });
      refetchReturns();
    },
    onError: (e: any) =>
      showError(e.response?.data?.message ?? "Failed to submit return request"),
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

  const cancelMutation = useMutation(() => OrderApi.cancelMyOrder(orderId!), {
    onSuccess: () => {
      showSuccess("Order cancelled and reservations restored");
      refetchOrder();
    },
    onError: (error: any) =>
      showError(error.response?.data?.message ?? "This order cannot be cancelled automatically"),
  });

  /** Opening the dialog from a line preselects that line. */
  const openReturn = (item: OrderItem) => {
    setForm({ productId: item.productId, quantity: 1, reason: "" });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.productId || form.quantity < 1) {
      showError("Select a product and quantity");
      return;
    }
    createMutation.mutate({
      orderId: order!.id,
      productId: form.productId,
      quantity: form.quantity,
      reason: form.reason || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="page-shell space-y-6">
        <Skeleton variant="text" width={220} height={40} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton variant="rectangular" height={340} className="!rounded-sm" />
          <Skeleton variant="rectangular" height={260} className="!rounded-sm" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-shell">
        <div className="panel">
          <EmptyState
            icon={<ReceiptLongOutlinedIcon fontSize="large" />}
            title="Order not found"
            subtitle="We couldn't find that order. It may belong to another account."
            action={
              <button className="primary-button" onClick={() => navigate("/orders")}>
                Back to orders
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const productReturns = returns ?? [];
  const returnFor = (productId: string) =>
    productReturns.find((r: ReturnRequest) => r.productId === productId);

  const subtotal = order.items.reduce((acc, item) => {
    const p = byId.get(item.productId);
    const variant = item.variantId ? p?.variants?.find((v) => v.id === item.variantId) : undefined;
    return acc + (variant?.price ?? p?.unitPrice ?? 0) * item.quantity;
  }, 0);

  const currentStep = FLOW.indexOf(order.orderStatus);
  const terminal = ["CANCELLED", "REFUNDED"].includes(order.orderStatus);

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        eyebrow="Order"
        title={`Order #${order.id.slice(0, 8)}…`}
        subtitle={`Placed ${formatDate(order.createdDate)}`}
        actions={
          <>
            <button
              onClick={() => navigate("/orders")}
              className="secondary-button !py-2"
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              All orders
            </button>
            {order.orderStatus === "PENDING" && (
              <LoadingButton
                variant="outlined"
                color="error"
                onClick={() => cancelMutation.mutate()}
                loading={cancelMutation.isLoading}
              >
                Cancel order
              </LoadingButton>
            )}
            <LoadingButton
              variant="contained"
              startIcon={<PictureAsPdfOutlinedIcon sx={{ fontSize: 17 }} />}
              onClick={() => invoiceMutation.mutate(orderId!)}
              loading={invoiceMutation.isLoading}
            >
              Invoice
            </LoadingButton>
          </>
        }
      />

      {/* ── status timeline ─────────────────────────────────────────── */}
      <section className="border-y border-line py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="eyebrow">Status</p>
          <StatusPill value={order.orderStatus} />
        </div>
        {terminal ? (
          <p className="text-sm text-ink-soft">
            This order was {order.orderStatus.toLowerCase()}. Any refund is issued to the
            original payment method.
          </p>
        ) : (
          <ol className="flex items-center gap-2">
            {["Placed", "Paid", "Approved", "Delivered"].map((label, i) => {
              const done = i <= currentStep;
              return (
                <li key={label} className="flex flex-1 items-center gap-2">
                  <span className="flex flex-col items-center gap-1.5">
                    <span
                      className={`h-3 w-3 rounded-full ${done ? "bg-action" : "bg-line"}`}
                    />
                    <span
                      className={`whitespace-nowrap text-[0.625rem] font-bold uppercase tracking-wide ${
                        done ? "text-ink" : "text-ink-muted"
                      }`}
                    >
                      {label}
                    </span>
                  </span>
                  {i < 3 && (
                    <span
                      className={`mb-5 h-px flex-1 ${i < currentStep ? "bg-action" : "bg-line"}`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ── items ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <section className="border-t border-ink">
            <div className="border-b border-line py-4">
              <h2 className="font-display text-2xl font-normal">
                Items · {order.items.length}
              </h2>
            </div>
            <ul className="divide-y divide-line">
              {order.items.map((item: OrderItem) => {
                const p = byId.get(item.productId);
                const cover = p?.images?.[0] || p?.imageUrl;
                const variant = item.variantId
                  ? p?.variants?.find((v) => v.id === item.variantId)
                  : undefined;
                const unit = variant?.price ?? p?.unitPrice ?? 0;
                const existing = returnFor(item.productId);
                return (
                  <li
                    key={`${item.productId}-${item.variantId ?? "base"}`}
                    className="flex gap-4 py-5"
                  >
                    <button
                      onClick={() => navigate(`/products/${item.productId}`)}
                      className="h-20 w-16 shrink-0 overflow-hidden bg-sunken"
                      aria-label={`View ${nameOf(item.productId)}`}
                    >
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-ink-faint">
                          <ImageOutlinedIcon sx={{ fontSize: 19 }} />
                        </span>
                      )}
                    </button>

                    <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-xl text-ink">
                          {nameOf(item.productId)}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          Qty {item.quantity}
                          {unit ? ` · ${formatPrice(unit)} each` : ""}
                        </p>
                        {variant && (
                          <span className="chip mt-1.5 !px-2 !py-0.5 !text-[0.625rem]">
                            {variant.name}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {!!unit && (
                          <span className="price-text text-sm">
                            {formatPrice(unit * item.quantity)}
                          </span>
                        )}
                        {existing ? (
                          <StatusPill value={existing.status} />
                        ) : (
                          <button
                            onClick={() => openReturn(item)}
                            className="secondary-button !px-3 !py-1.5 !text-xs"
                          >
                            Request return
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {productReturns.length > 0 && (
            <section className="border-t border-ink py-5">
              <h2 className="mb-4 font-display text-2xl font-normal">Returns on this order</h2>
              <ul className="space-y-2.5">
                {productReturns.map((r: ReturnRequest) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {nameOf(r.productId)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        Qty {r.quantity}
                        {r.reason ? ` · ${r.reason}` : ""}
                      </p>
                    </div>
                    <StatusPill value={r.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── summary + address ─────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="border-t border-ink py-5">
            <h2 className="mb-4 font-display text-2xl font-normal">Payment summary</h2>
            <dl className="space-y-2.5 text-sm">
              {!!subtotal && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="font-semibold">{formatPrice(subtotal)}</dd>
                </div>
              )}
              {!!order.discountAmount && (
                <div className="flex justify-between">
                  <dt className="text-state-success">Discount</dt>
                  <dd className="font-semibold text-state-success">
                    −{formatPrice(order.discountAmount)}
                  </dd>
                </div>
              )}
              {!!order.loyaltyDiscountAmount && (
                <div className="flex justify-between">
                  <dt className="text-state-success">Loyalty ({order.loyaltyPointsRedeemed} points)</dt>
                  <dd className="font-semibold text-state-success">−{formatPrice(order.loyaltyDiscountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="font-semibold">
                  {order.shippingAmount ? formatPrice(order.shippingAmount) : "Free"}
                </dd>
              </div>
              {!!order.taxAmount && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Tax</dt>
                  <dd className="font-semibold">{formatPrice(order.taxAmount)}</dd>
                </div>
              )}
              {!!order.giftWrapFee && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Gift wrap</dt>
                  <dd className="font-semibold">{formatPrice(order.giftWrapFee)}</dd>
                </div>
              )}
              {!!order.giftCardAmount && (
                <div className="flex justify-between">
                  <dt className="text-state-success">Gift card ending {order.giftCardCodeLast4}</dt>
                  <dd className="font-semibold text-state-success">−{formatPrice(order.giftCardAmount)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-medium">Amount charged</span>
              <span className="font-display text-2xl">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </section>

          <section className="border-t border-line py-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
              <PlaceOutlinedIcon sx={{ fontSize: 17 }} className="text-ink-muted" />
              Delivery address
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft">
              {order.address.addressDetail}
              <br />
              {order.address.district}, {order.address.state}
            </p>
            {order.shippingMethod && (
              <p className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-ink-muted">
                <LocalShippingOutlinedIcon sx={{ fontSize: 15 }} />
                {order.shippingMethod === "EXPRESS" ? "Express" : "Standard"} shipping
                {order.giftWrap ? " · gift wrapped" : ""}
              </p>
            )}
          </section>
        </aside>
      </div>

      {/* ── return dialog ───────────────────────────────────────────── */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="!font-display !text-2xl !font-normal">Request a return</DialogTitle>
        <DialogContent dividers>
          <div className="space-y-4 py-1">
            <div>
              <label htmlFor="ret-product" className="eyebrow mb-1.5 block">
                Item
              </label>
              <select
                id="ret-product"
                className="input-control"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value, quantity: 1 })}
              >
                <option value="">Select an item</option>
                {order.items.map((item) => (
                  <option key={item.productId} value={item.productId}>
                    {nameOf(item.productId)} (qty {item.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ret-qty" className="eyebrow mb-1.5 block">
                Quantity
              </label>
              <input
                id="ret-qty"
                type="number"
                className="input-control"
                min={1}
                max={
                  order.items.find((i: OrderItem) => i.productId === form.productId)?.quantity ?? 1
                }
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>

            <div>
              <label htmlFor="ret-reason" className="eyebrow mb-1.5 block">
                Reason (optional)
              </label>
              <textarea
                id="ret-reason"
                rows={3}
                className="input-control !h-auto py-2.5"
                placeholder="Wrong size, damaged on arrival, changed my mind…"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            <p className="text-xs text-ink-muted">
              Returns can be requested within 7 days of delivery. Once an admin approves it,
              stock is restored and the refund is issued to your original payment method.
            </p>
          </div>
        </DialogContent>
        <DialogActions className="!px-6 !py-4">
          <button className="secondary-button !py-2" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <LoadingButton
            variant="contained"
            onClick={handleSubmit}
            loading={createMutation.isLoading}
          >
            Submit request
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default UserOrderDetail;

import { useMemo } from "react";
import { useMutation, useQuery } from "react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import { OrderApi } from "../../../../api/orderApi";
import { ProductApi } from "../../../../api/productApi";
import { UserApi } from "../../../../api/userApi";
import { ReturnApi } from "../../../../api/returnApi";
import DataTable, { DataColumn, StatusPill } from "../../../../components/DataTable";
import EmptyState from "../../../../components/EmptyState";
import PageHeader from "../../../../components/PageHeader";
import { Order } from "../../../../types/order";
import { ReturnRequest, ReturnStatus } from "../../../../types/returnRequest";
import { formatPrice } from "../../../../utils/cart";
import { formatDate } from "../../../../utils/date";
import { showSuccess } from "../../../../utils/showSuccess";
import { showError } from "../../../../utils/showError";

interface OrderLocation {
  state?: Order;
}

type LineRow = {
  id: string;
  name: string;
  cover?: string;
  variant?: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

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
    () =>
      resolvedOrder
        ? ProductApi.getProductsByIds(resolvedOrder.items.map((i) => i.productId))
        : undefined,
    { enabled: Boolean(resolvedOrder), retry: false }
  );

  const { data: user } = useQuery(
    ["admin:user", resolvedOrder?.customerId],
    () => (resolvedOrder ? UserApi.getUserById(resolvedOrder.customerId) : undefined),
    { enabled: Boolean(resolvedOrder), retry: false }
  );

  const { data: returns, refetch: refetchReturns } = useQuery(
    ["admin:returns", resolvedOrder?.id],
    () => (resolvedOrder ? ReturnApi.getReturnRequestsByOrder(resolvedOrder.id) : []),
    { enabled: Boolean(resolvedOrder) }
  );

  const approveMutation = useMutation(ReturnApi.approveReturnRequest, {
    onSuccess: () => {
      showSuccess("Return approved");
      refetchReturns();
    },
    onError: (e: any) => showError(e.response?.data?.message ?? "Could not approve"),
  });
  const rejectMutation = useMutation(ReturnApi.rejectReturnRequest, {
    onSuccess: () => {
      showSuccess("Return rejected");
      refetchReturns();
    },
    onError: (e: any) => showError(e.response?.data?.message ?? "Could not reject"),
  });
  const refundMutation = useMutation(ReturnApi.refundReturnRequest, {
    onSuccess: () => {
      showSuccess("Refund processed");
      refetchReturns();
    },
    onError: (e: any) => {
      showError(e.response?.data?.message ?? e.response?.data?.error ?? "Refund failed");
      refetchReturns();
    },
  });

  const byId = useMemo(() => new Map((products ?? []).map((p) => [p.id, p])), [products]);
  const nameOf = (id: string) => byId.get(id)?.name ?? `Product ${id.slice(0, 8)}…`;

  const rows: LineRow[] = useMemo(() => {
    if (!resolvedOrder) return [];
    return resolvedOrder.items.map((item) => {
      const p = byId.get(item.productId);
      const variant = item.variantId
        ? p?.variants?.find((v) => v.id === item.variantId)
        : undefined;
      const unitPrice = variant?.price ?? p?.unitPrice ?? 0;
      return {
        id: `${item.productId}-${item.variantId ?? "base"}`,
        name: p?.name ?? `Product ${item.productId.slice(0, 8)}…`,
        cover: p?.images?.[0] || p?.imageUrl,
        variant: variant?.name,
        unitPrice,
        quantity: item.quantity,
        total: Math.round(unitPrice * item.quantity * 100) / 100,
      };
    });
  }, [resolvedOrder, byId]);

  if (orderLoading && !orderFromNav) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width={240} height={40} />
        <Skeleton variant="rectangular" height={110} className="!rounded-lg" />
        <Skeleton variant="rectangular" height={280} className="!rounded-lg" />
      </div>
    );
  }

  if (!resolvedOrder) {
    return (
      <div className="panel">
        <EmptyState
          icon={<ReceiptLongOutlinedIcon fontSize="large" />}
          title="Order not found"
          subtitle="We could not find the order you are looking for."
          action={
            <button className="primary-button" onClick={() => navigate("/admin/orders")}>
              Back to orders
            </button>
          }
        />
      </div>
    );
  }

  const subtotal = rows.reduce((acc, r) => acc + r.total, 0);

  const columns: DataColumn<LineRow>[] = [
    {
      id: "name",
      label: "Product",
      minWidth: 240,
      render: (r) => (
        <span className="flex items-center gap-3">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xs border border-line bg-sunken">
            {r.cover ? (
              <img src={r.cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-ink-faint">
                <ImageOutlinedIcon sx={{ fontSize: 15 }} />
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{r.name}</span>
            {r.variant && <span className="text-xs text-ink-muted">{r.variant}</span>}
          </span>
        </span>
      ),
    },
    {
      id: "unitPrice",
      label: "Unit price",
      align: "right",
      hideBelow: "lg",
      render: (r) => formatPrice(r.unitPrice),
    },
    { id: "quantity", label: "Qty", align: "right", render: (r) => r.quantity },
    {
      id: "total",
      label: "Subtotal",
      align: "right",
      render: (r) => <span className="font-semibold">{formatPrice(r.total)}</span>,
    },
  ];

  const summaryRows: [string, string, boolean?][] = [
    ["Items subtotal", formatPrice(subtotal)],
    ...(resolvedOrder.discountAmount
      ? ([["Discount", `−${formatPrice(resolvedOrder.discountAmount)}`, true]] as [
          string,
          string,
          boolean
        ][])
      : []),
    ["Shipping", resolvedOrder.shippingAmount ? formatPrice(resolvedOrder.shippingAmount) : "Free"],
    ...(resolvedOrder.taxAmount ? ([["Tax", formatPrice(resolvedOrder.taxAmount)]] as [string, string][]) : []),
    ...(resolvedOrder.giftWrapFee
      ? ([["Gift wrap", formatPrice(resolvedOrder.giftWrapFee)]] as [string, string][])
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Order"
        title={`#${resolvedOrder.id.slice(0, 8)}…`}
        subtitle={`Placed ${formatDate(resolvedOrder.createdDate)}`}
        actions={
          <button onClick={() => navigate("/admin/orders")} className="secondary-button !py-2">
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            Back to orders
          </button>
        }
      />

      {/* ── facts row ────────────────────────────────────────────────── */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="panel p-5">
          <p className="eyebrow">Status</p>
          <div className="mt-2">
            <StatusPill value={resolvedOrder.orderStatus} />
          </div>
          <p className="mt-3 font-heading text-xl font-extrabold text-ink">
            {formatPrice(resolvedOrder.totalAmount)}
          </p>
          <p className="text-xs text-ink-muted">Order total</p>
        </div>

        <div className="panel p-5">
          <p className="eyebrow flex items-center gap-1.5">
            <PersonOutlineIcon sx={{ fontSize: 14 }} />
            Customer
          </p>
          {user ? (
            <>
              <p className="mt-2 truncate text-sm font-bold text-ink">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-ink-soft">{user.email}</p>
              <button
                onClick={() => navigate("/admin/users")}
                className="mt-3 text-xs font-semibold text-brand hover:underline"
              >
                View in customers →
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">Guest order</p>
          )}
        </div>

        <div className="panel p-5">
          <p className="eyebrow flex items-center gap-1.5">
            <PlaceOutlinedIcon sx={{ fontSize: 14 }} />
            Ship to
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {resolvedOrder.address.addressDetail}
            <br />
            {resolvedOrder.address.district}, {resolvedOrder.address.state}
          </p>
          {resolvedOrder.shippingMethod && (
            <p className="mt-2 text-xs text-ink-muted">
              {resolvedOrder.shippingMethod === "EXPRESS" ? "Express" : "Standard"} shipping
              {resolvedOrder.giftWrap ? " · gift wrapped" : ""}
            </p>
          )}
        </div>
      </div>

      {/* ── lines + totals ───────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {productsLoading ? (
          <Skeleton variant="rectangular" height={240} className="!rounded-lg" />
        ) : (
          <DataTable<LineRow>
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            caption={`${rows.length} line item${rows.length === 1 ? "" : "s"}`}
          />
        )}

        <aside className="panel-raised h-fit p-5">
          <h2 className="mb-4 font-heading text-base font-bold">Totals</h2>
          <dl className="space-y-2.5 text-sm">
            {summaryRows.map(([label, value, positive]) => (
              <div key={label} className="flex justify-between">
                <dt className={positive ? "text-state-success" : "text-ink-soft"}>{label}</dt>
                <dd className={`font-semibold ${positive ? "text-state-success" : ""}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-heading text-base font-bold">Total</span>
            <span className="font-heading text-xl font-extrabold">
              {formatPrice(resolvedOrder.totalAmount)}
            </span>
          </div>
        </aside>
      </div>

      {/* ── returns queue ────────────────────────────────────────────── */}
      {returns && returns.length > 0 && (
        <section className="panel p-5 sm:p-6">
          <h2 className="mb-4 font-heading text-base font-bold">Returns &amp; refunds</h2>
          <ul className="space-y-3">
            {returns.map((r: ReturnRequest) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-line p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{nameOf(r.productId)}</p>
                  <p className="text-xs text-ink-muted">
                    Qty {r.quantity} · {r.reason || "no reason given"}
                  </p>
                  {r.rejectionReason && (
                    <p className="mt-1 text-xs text-state-danger">
                      Rejected: {r.rejectionReason}
                    </p>
                  )}
                  {r.refundAmount != null && (
                    <p className="mt-1 text-xs text-state-success">
                      Refunded {formatPrice(r.refundAmount)}
                      {r.refundTransactionId ? ` · ${r.refundTransactionId}` : ""}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill value={r.status} />
                  {r.status === ReturnStatus.REQUESTED && (
                    <>
                      <LoadingButton
                        size="small"
                        variant="contained"
                        loading={approveMutation.isLoading}
                        onClick={() => approveMutation.mutate(r.id)}
                      >
                        Approve
                      </LoadingButton>
                      <LoadingButton
                        size="small"
                        variant="outlined"
                        loading={rejectMutation.isLoading}
                        onClick={() =>
                          rejectMutation.mutate({ id: r.id, reason: "Not eligible" })
                        }
                      >
                        Reject
                      </LoadingButton>
                    </>
                  )}
                  {r.status === ReturnStatus.APPROVED && (
                    <LoadingButton
                      size="small"
                      variant="contained"
                      loading={refundMutation.isLoading}
                      onClick={() => refundMutation.mutate(r.id)}
                    >
                      Refund
                    </LoadingButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default OrderDetail;

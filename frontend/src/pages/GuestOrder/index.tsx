import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { useMutation, useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";

import { OrderApi } from "../../api/orderApi";
import { ProductApi } from "../../api/productApi";
import EmptyState from "../../components/EmptyState";
import { StatusPill } from "../../components/DataTable";
import { formatPrice } from "../../utils/cart";
import { formatDate } from "../../utils/date";
import { showError } from "../../utils/showError";
import { showSuccess } from "../../utils/showSuccess";

function readCapability() {
  const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  try { return decodeURIComponent(raw); } catch { return ""; }
}

function GuestOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [capability] = useState(readCapability);

  useEffect(() => {
    // Remove the capability from browser history and screenshots immediately.
    if (window.location.hash) window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const { data: order, isLoading, isError, refetch } = useQuery(
    ["guest-order", orderId],
    () => OrderApi.getGuestOrder(orderId!, capability),
    { enabled: Boolean(orderId && capability), retry: false }
  );

  const { data: tracking = [] } = useQuery(
    ["guest-order-track", orderId, capability],
    () => OrderApi.getGuestOrderTracking(orderId!, capability),
    { enabled: Boolean(orderId && capability), retry: false }
  );
  const cancelMutation = useMutation(
    () => OrderApi.cancelGuestOrder(orderId!, capability),
    {
      onSuccess: () => {
        showSuccess("Order cancelled and reservations restored");
        refetch();
      },
      onError: (error: any) =>
        showError(error.response?.data?.message ?? "This order cannot be cancelled automatically"),
    }
  );

  const productIds = useMemo(
    () => Array.from(new Set((order?.items ?? []).map((item) => item.productId))),
    [order]
  );
  const { data: products = [] } = useQuery(
    ["guest-order-products", productIds.join(",")],
    () => ProductApi.getProductsByIds(productIds),
    { enabled: productIds.length > 0, retry: false }
  );
  const names = useMemo(() => new Map(products.map((product) => [product.id, product.name])), [products]);

  if (!capability || isError) {
    return (
      <div className="page-shell">
        <EmptyState
          icon={<LockOutlinedIcon fontSize="large" />}
          title="This guest tracking link is invalid"
          subtitle="Use the complete private link from the order confirmation email. The capability is checked securely and is never accepted from a query string."
          action={<button className="primary-button" onClick={() => navigate("/")}>Return to the shop</button>}
        />
      </div>
    );
  }

  if (isLoading || !order) {
    return <div className="page-shell space-y-4 py-8"><Skeleton height={54} /><Skeleton variant="rectangular" height={320} /></div>;
  }

  return (
    <div className="page-shell space-y-8 py-4 sm:py-8">
      <header className="border-t border-ink pt-6">
        <p className="eyebrow">Private guest tracking</p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-4xl font-normal text-ink sm:text-5xl">Order #{order.id.slice(0, 8)}</h1>
            <p className="mt-2 text-sm text-ink-muted">Placed {formatDate(order.createdDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill value={order.orderStatus} />
            {order.orderStatus === "PENDING" && (
              <button
                type="button"
                className="secondary-button !border-state-danger !py-2 text-state-danger"
                disabled={cancelMutation.isLoading}
                onClick={() => cancelMutation.mutate()}
              >
                {cancelMutation.isLoading ? "Cancelling…" : "Cancel order"}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="border-t border-line">
            <div className="flex items-center gap-2 py-5">
              <Inventory2OutlinedIcon sx={{ fontSize: 18 }} className="text-ink-muted" />
              <h2 className="font-display text-2xl">Items</h2>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <li key={`${item.productId}-${item.variantId ?? "base"}`} className="flex justify-between gap-4 py-4 text-sm">
                  <span className="font-semibold text-ink">{names.get(item.productId) ?? `Product ${item.productId.slice(0, 8)}`}</span>
                  <span className="text-ink-muted">Quantity {item.quantity}</span>
                </li>
              ))}
            </ul>
          </section>

          {tracking.length > 0 && (
            <section className="border-t border-line py-5">
              <h2 className="mb-4 font-display text-2xl">Order activity &amp; timeline</h2>
              <ol className="relative ml-2 space-y-3 border-l border-line pl-4">
                {tracking.map((evt: any, idx: number) => (
                  <li key={evt.id || idx} className="relative">
                    <div className="absolute -left-[1.3125rem] mt-1 h-2.5 w-2.5 rounded-full border border-paper bg-brand" />
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-xs font-bold uppercase text-ink">{evt.status}</span>
                      {evt.changedAt && (
                        <span className="text-xs text-ink-muted">{formatDate(evt.changedAt)}</span>
                      )}
                    </div>
                    {evt.note && <p className="mt-0.5 text-xs text-ink-soft">{evt.note}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="space-y-7">
          <section className="border-t border-ink py-5">
            <h2 className="font-display text-2xl">Order total</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Shipping</dt><dd>{order.shippingAmount ? formatPrice(order.shippingAmount) : "Free"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Tax</dt><dd>{formatPrice(order.taxAmount ?? 0)}</dd></div>
              {!!order.giftCardAmount && <div className="flex justify-between text-state-success"><dt>Gift card</dt><dd>−{formatPrice(order.giftCardAmount)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-3 font-semibold"><dt>Provider / COD amount</dt><dd>{formatPrice(order.totalAmount)}</dd></div>
            </dl>
          </section>
          <section className="border-t border-line py-5">
            <h2 className="flex items-center gap-2 font-display text-xl"><PlaceOutlinedIcon sx={{ fontSize: 17 }} />Delivery address</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {order.address.addressDetail}<br />{order.address.district}, {order.address.state}
            </p>
          </section>
          <section className="border-t border-line py-5 text-xs leading-relaxed text-ink-muted">
            <LocalShippingOutlinedIcon sx={{ fontSize: 17 }} className="mb-2" />
            <p>This page is available only through the private capability in your email. Keep that email secure.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default GuestOrder;

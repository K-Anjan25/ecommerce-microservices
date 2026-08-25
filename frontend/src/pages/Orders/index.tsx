import { useMemo } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Skeleton } from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import { OrderApi } from "../../api/orderApi";
import { ProductApi } from "../../api/productApi";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import { StatusPill } from "../../components/DataTable";
import { AppState } from "../../store";
import { addToCart } from "../../store/actions/cartAction";
import { Order } from "../../types/order";
import { formatDate } from "../../utils/date";
import { formatPrice } from "../../utils/cart";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";

function Orders() {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const userId = useSelector((state: AppState) => state.user.data.userId);

  const { data: orders, isLoading } = useQuery(
    ["user:orders", userId],
    () => OrderApi.getMyOrders(),
    { enabled: Boolean(userId) }
  );

  const userOrders = orders ?? [];

  /* Resolve every product referenced across every order in one request, so the
     list can show real thumbnails and names instead of bare ids. */
  const allProductIds = useMemo(
    () => Array.from(new Set(userOrders.flatMap((o) => o.items.map((i) => i.productId)))),
    [userOrders]
  );

  const { data: productList } = useQuery(
    ["user:orders:products", allProductIds.join(",")],
    () => ProductApi.getProductsByIds(allProductIds),
    { enabled: allProductIds.length > 0, retry: false }
  );

  const byId = useMemo(
    () => new Map((productList ?? []).map((p) => [p.id, p])),
    [productList]
  );

  const handleBuyAgain = async (order: Order) => {
    // Fetch the real products so cart lines have prices/images; items whose
    // product no longer exists are skipped instead of adding broken lines.
    try {
      const productIds = Array.from(new Set(order.items.map((item) => item.productId)));
      const products = await ProductApi.getProductsByIds(productIds);
      const lookup = new Map(products.map((p) => [p.id, p]));
      let added = 0;
      order.items.forEach((item) => {
        const product = lookup.get(item.productId);
        if (!product) return;
        const variant = item.variantId
          ? product.variants?.find((v) => v.id === item.variantId)
          : undefined;
        dispatch(
          addToCart({
            product,
            quantity: item.quantity,
            variantId: item.variantId,
            variantName: variant?.name,
          })
        );
        added += 1;
      });
      if (added === 0) {
        showError("These products are no longer available");
        return;
      }
      showSuccess("Items added to cart");
      navigate("/cart");
    } catch {
      showError("Could not re-add these items — products are no longer available");
    }
  };

  const spent = userOrders
    .filter((o) => o.orderStatus !== "CANCELLED")
    .reduce((a, o) => a + (o.totalAmount ?? 0), 0);

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Your orders"
        subtitle={
          userOrders.length
            ? `${userOrders.length} order${userOrders.length === 1 ? "" : "s"} · ${formatPrice(
                spent
              )} spent`
            : "Everything you've bought, with invoices and returns."
        }
        actions={
          <button onClick={() => navigate("/returns")} className="secondary-button !py-2">
            View returns
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={148} className="!rounded-sm" />
          ))}
        </div>
      ) : userOrders.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<ReceiptLongOutlinedIcon fontSize="large" />}
            title="No orders yet"
            subtitle="Once you place an order it shows up here with its status, invoice and a one-tap re-order."
            action={
              <button className="primary-button" onClick={() => navigate("/")}>
                Start shopping
              </button>
            }
          />
        </div>
      ) : (
        <ul className="border-t border-ink">
          {userOrders.map((order: Order) => {
            const items = order.items;
            const known = items.map((i) => byId.get(i.productId)).filter(Boolean);
            return (
              <li key={order.id} className="border-b border-line py-6">
                {/* header strip */}
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <p className="text-eyebrow font-bold uppercase text-ink-muted">Order</p>
                      <p className="font-mono text-xs font-semibold text-ink">#{order.id}</p>
                    </div>
                    <div>
                      <p className="text-eyebrow font-bold uppercase text-ink-muted">Placed</p>
                      <p className="text-xs font-semibold text-ink">
                        {formatDate(order.createdDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-eyebrow font-bold uppercase text-ink-muted">Total</p>
                      <p className="text-xs font-semibold text-ink">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <StatusPill value={order.orderStatus} />
                </div>

                {/* body */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex shrink-0 gap-2">
                      {items.slice(0, 4).map((item, idx) => {
                        const p = byId.get(item.productId);
                        const cover = p?.images?.[0] || p?.imageUrl;
                        return (
                          <span
                            key={`${item.productId}-${item.variantId ?? "base"}-${idx}`}
                            className="h-16 w-12 overflow-hidden bg-sunken"
                          >
                            {cover ? (
                              <img src={cover} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full items-center justify-center text-ink-faint">
                                <ImageOutlinedIcon sx={{ fontSize: 17 }} />
                              </span>
                            )}
                          </span>
                        );
                      })}
                      {items.length > 4 && (
                        <span className="flex h-16 w-12 items-center justify-center bg-contrast text-xs font-bold text-oncontrast">
                          +{items.length - 4}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl text-ink">
                        {known.length
                          ? known
                              .slice(0, 2)
                              .map((p) => p!.name)
                              .join(", ")
                          : `${items.length} item${items.length === 1 ? "" : "s"}`}
                        {known.length > 2 && ` +${known.length - 2} more`}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {items.length} item{items.length === 1 ? "" : "s"}
                        {order.shippingMethod ? ` · ${order.shippingMethod.toLowerCase()} shipping` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() => handleBuyAgain(order)}
                      className="secondary-button !py-2"
                    >
                      <ShoppingCartOutlinedIcon sx={{ fontSize: 16 }} />
                      Buy again
                    </button>
                    <button
                      onClick={() => navigate(`/orderDetail/${order.id}`)}
                      className="dark-button !py-2"
                    >
                      Details
                      <ChevronRightIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Orders;

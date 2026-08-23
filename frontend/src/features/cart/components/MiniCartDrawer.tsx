import { Drawer } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { AppState } from "../../../store";
import {
  decreaseProductQuantity,
  increaseProductQuantity,
  removeFromCart,
} from "../../../store/actions/cartAction";
import {
  calculateCountOfCartItems,
  calculateTotalPriceOfCartItems,
  formatPrice,
} from "../../../utils/cart";

type Props = { open: boolean; onClose: () => void };

/** Quiet bag preview inspired by WooCommerce's Mini-Cart block. */
export default function MiniCartDrawer({ open, onClose }: Props) {
  const items = useSelector((state: AppState) => state.cart);
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const count = calculateCountOfCartItems(items);
  const subtotal = Number(calculateTotalPriceOfCartItems(items));

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ className: "!w-full !max-w-[27rem] !bg-paper" }}
    >
      <div className="flex h-full flex-col">
        <header className="flex h-[4.5rem] items-center justify-between border-b border-line px-5 sm:px-7">
          <div>
            <p className="font-display text-2xl text-ink">Your bag</p>
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted">
              {count} item{count === 1 ? "" : "s"}
            </p>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close bag">
            <CloseIcon />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <ShoppingBagOutlinedIcon sx={{ fontSize: 40 }} className="text-ink-faint" />
            <p className="mt-5 font-display text-3xl text-ink">Your bag is empty</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
              Discover considered pieces selected for everyday life.
            </p>
            <button onClick={() => go("/")} className="primary-button mt-6">
              Explore the collection
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 sm:px-7">
              {items.map((item) => {
                const image = item.product.images?.[0] || item.product.imageUrl;
                const variant = item.variantId || undefined;
                const unitPrice =
                  item.product.variants?.find((option) => option.id === variant)?.price ??
                  item.product.unitPrice;
                return (
                  <li
                    key={`${item.product.id}-${variant ?? "base"}`}
                    className="grid grid-cols-[5rem_1fr] gap-4 border-b border-line py-5"
                  >
                    <button
                      onClick={() => go(`/products/${item.product.id}`)}
                      className="aspect-[4/5] overflow-hidden bg-sunken"
                    >
                      {image && <img src={image} alt="" className="h-full w-full object-cover" />}
                    </button>
                    <div className="min-w-0">
                      <button onClick={() => go(`/products/${item.product.id}`)} className="block text-left">
                        <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                          {item.product.brand || "Cartly"}
                        </span>
                        <span className="mt-1 block line-clamp-2 font-display text-xl leading-tight text-ink">
                          {item.product.name}
                        </span>
                      </button>
                      {item.variantName && <p className="mt-1 text-xs text-ink-muted">{item.variantName}</p>}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center border border-line">
                          <button
                            onClick={() =>
                              item.quantity <= 1
                                ? dispatch(removeFromCart(item.product.id, variant))
                                : dispatch(decreaseProductQuantity(item.product.id, variant))
                            }
                            className="flex h-8 w-8 items-center justify-center text-ink-soft hover:bg-sunken"
                            aria-label="Decrease quantity"
                          >
                            <RemoveIcon sx={{ fontSize: 15 }} />
                          </button>
                          <span className="min-w-7 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(increaseProductQuantity(item.product.id, variant))}
                            className="flex h-8 w-8 items-center justify-center text-ink-soft hover:bg-sunken"
                            aria-label="Increase quantity"
                          >
                            <AddIcon sx={{ fontSize: 15 }} />
                          </button>
                        </div>
                        <span className="font-display text-lg text-ink">
                          {formatPrice(unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="border-t border-ink bg-paper px-5 py-5 sm:px-7">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-soft">Subtotal</span>
                <span className="font-display text-3xl text-ink">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">Shipping, tax and discounts are confirmed at checkout.</p>
              <button onClick={() => go("/checkout")} className="primary-button mt-5 w-full !py-3">
                Checkout
              </button>
              <button
                onClick={() => go("/cart")}
                className="mt-3 w-full border-b border-ink pb-1 text-xs font-semibold uppercase tracking-[0.1em] text-ink"
              >
                Review bag
              </button>
            </footer>
          </>
        )}
      </div>
    </Drawer>
  );
}

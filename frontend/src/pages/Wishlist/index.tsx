import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Skeleton from "@mui/material/Skeleton";

import EmptyState from "../../components/EmptyState";
import FeatureHero from "../../components/FeatureHero";
import { useWishlist } from "../../hooks/useWishlist";
import { formatPrice } from "../../utils/cart";
import { showSuccess } from "../../utils/showSuccess";

function Wishlist() {
  const navigate = useNavigate();
  const { items, isLoading, removeFromWishlist, clearWishlist } = useWishlist();

  return (
    <div className="page-shell space-y-8">
      <FeatureHero
        eyebrow="Saved for later"
        title="Your wishlist, kept warm."
        description="Products you have hearted across the storefront. Move on them before a flash sale ends."
      />

      <section className="border-t border-line pt-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <h2 className="font-display text-3xl font-normal text-ink">Saved items</h2>
          <div className="flex items-center gap-3">
            {!isLoading && <span className="text-xs text-ink-muted">{items.length} saved</span>}
            {items.length > 0 && (
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => {
                  if (window.confirm("Remove every item from your wishlist?")) {
                    clearWishlist();
                    showSuccess("Wishlist cleared");
                  }
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="product-grid py-6">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} variant="rectangular" height={280} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-6">
            <EmptyState
              icon={<FavoriteOutlinedIcon fontSize="large" />}
              title="Nothing saved yet"
              subtitle="Tap the heart on any product card to keep it here for later."
              action={
                <Button variant="contained" onClick={() => navigate("/")}>
                  Browse the shop
                </Button>
              }
            />
          </div>
        ) : (
          <div className="product-grid py-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="panel group flex cursor-pointer flex-col overflow-hidden"
                onClick={() => navigate(`/products/${item.productId}`)}
                role="link"
                aria-label={`View ${item.productName ?? "saved product"}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-sunken">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName ?? "Saved product"}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-faint">
                      <ImageOutlinedIcon sx={{ fontSize: 38 }} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-ink">
                    {item.productName ?? "Saved product"}
                  </h3>
                  {item.unitPrice != null && (
                    <span className="price-text text-base">{formatPrice(item.unitPrice)}</span>
                  )}
                  <div className="mt-auto flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      onClick={() => navigate(`/products/${item.productId}`)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeFromWishlist(item.productId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Wishlist;

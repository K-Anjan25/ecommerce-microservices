import { Skeleton } from "@mui/material";

/**
 * Skeleton that mirrors the real (unboxed) product-card anatomy so the grid
 * does not jump when data lands: 4:5 cover, eyebrow, name, rating, price and
 * a full-width action bar — no panel, no resting shadow.
 */
function ProductViewPlaceholder() {
  return (
    <div className="flex h-full flex-col">
      <Skeleton
        variant="rectangular"
        className="aspect-[4/5] !h-auto !rounded-none !bg-sunken"
      />
      <div className="flex flex-1 flex-col gap-1.5 px-0 pt-3">
        <Skeleton width="45%" height={10} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={14} />
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <Skeleton width="34%" height={18} />
          <Skeleton width="20%" height={12} />
        </div>
        <div className="pt-2.5">
          <Skeleton variant="rectangular" height={40} className="!rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export default ProductViewPlaceholder;

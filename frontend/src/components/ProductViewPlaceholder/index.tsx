import { Box, Skeleton } from "@mui/material";

function ProductViewPlaceholder() {
  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <Skeleton
        variant="rectangular"
        className="aspect-[4/3] !rounded-none !bg-contrast/10"
      />
      <Box className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton width="60%" />
        <Skeleton width="90%" />
        <Skeleton width="80%" />
        <Box className="mt-auto flex justify-between pt-3">
          <Skeleton width="30%" />
          <Skeleton variant="circular" width={36} height={36} />
        </Box>
      </Box>
    </div>
  );
}

export default ProductViewPlaceholder;

import { useMutation, useQuery, useQueryClient } from "react-query";
import { api } from "../api/client";
import { WishlistItem } from "../types/wishlist";

// /v1/wishlist is behind the gateway AuthFilter — signed-in users only.

const getWishlist = async () => {
  const { data } = await api.get<WishlistItem[]>("/v1/wishlist");
  return data;
};

const addItem = async (item: {
  productId: string;
  productName?: string;
  unitPrice?: number;
  imageUrl?: string;
}) => {
  const { data } = await api.post<WishlistItem>("/v1/wishlist", item);
  return data;
};

const removeItem = async (productId: string) => {
  await api.delete("/v1/wishlist", { params: { productId } });
};

const clearWishlist = async () => {
  await api.delete("/v1/wishlist/clear");
};

export const WishlistApi = { getWishlist, addItem, removeItem, clearWishlist };

export const WISHLIST_QUERY_KEY = "wishlist";

const isSignedIn = () =>
  typeof window !== "undefined" && Boolean(localStorage.getItem("access-token"));

/** Shared wishlist state: one query, shared mutations, optimistic remove. */
export function useWishlist() {
  const queryClient = useQueryClient();
  const enabled = isSignedIn();

  const { data: items = [], isLoading } = useQuery(
    WISHLIST_QUERY_KEY,
    WishlistApi.getWishlist,
    { enabled, retry: false }
  );

  const invalidate = () => queryClient.invalidateQueries(WISHLIST_QUERY_KEY);

  const addMutation = useMutation(WishlistApi.addItem, { onSuccess: invalidate });

  const removeMutation = useMutation(WishlistApi.removeItem, {
    onSuccess: invalidate,
  });

  const clearMutation = useMutation(WishlistApi.clearWishlist, {
    onSuccess: invalidate,
  });

  const productIdSet = new Set(items.map((item) => item.productId));

  const isInWishlist = (productId: string) => productIdSet.has(productId);

  const toggle = (item: {
    productId: string;
    productName?: string;
    unitPrice?: number;
    imageUrl?: string;
  }) => {
    if (!enabled) return false; // caller redirects unauthenticated users
    if (isInWishlist(item.productId)) removeMutation.mutate(item.productId);
    else addMutation.mutate(item);
    return true;
  };

  return {
    items,
    isLoading: enabled && isLoading,
    isInWishlist,
    toggle,
    removeFromWishlist: removeMutation.mutate,
    clearWishlist: clearMutation.mutate,
    isBusy:
      addMutation.isLoading || removeMutation.isLoading || clearMutation.isLoading,
  };
}

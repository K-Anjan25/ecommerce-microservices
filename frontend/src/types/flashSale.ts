export interface FlashSale {
  id?: number;
  productId: string;
  productName?: string;
  flashPrice: number;
  originalPrice?: number;
  startsAt?: string;
  endsAt?: string;
  active: boolean;
}

export type FlashSaleStatus = "scheduled" | "live" | "ended" | "inactive";

/** Derive the human status chip from the sale window + active flag. */
export const flashSaleStatus = (sale: FlashSale, now = new Date()): FlashSaleStatus => {
  if (!sale.active) return "inactive";
  const starts = sale.startsAt ? new Date(sale.startsAt) : null;
  const ends = sale.endsAt ? new Date(sale.endsAt) : null;
  if (starts && now < starts) return "scheduled";
  if (ends && now > ends) return "ended";
  return "live";
};

export enum GiftCardStatus {
  ACTIVE = "ACTIVE",
  REDEEMED = "REDEEMED",
  EXPIRED = "EXPIRED",
}

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  initialBalance: number;
  expiryDate: string;
  status: GiftCardStatus;
  recipientEmail?: string;
}

export interface PurchaseGiftCardRequest {
  amount: number;
  recipientEmail?: string;
  expiryDate: string;
}

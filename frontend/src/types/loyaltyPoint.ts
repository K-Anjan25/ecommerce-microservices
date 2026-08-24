export enum LoyaltyPointType {
  EARNED = "EARNED",
  REDEEMED = "REDEEMED",
  RESTORED = "RESTORED",
  EXPIRED = "EXPIRED",
}

export interface LoyaltyPoint {
  id: string;
  customerId: string;
  points: number;
  description: string;
  type: LoyaltyPointType;
  amount: number;
  createdDate: string;
}

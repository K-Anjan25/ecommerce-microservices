export interface ShippingQuote {
  id?: string;
  pincode: string;
  cost: number;
  freeAbove?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  carrier: string;
  active: boolean;
}

export interface TaxRule {
  id?: string;
  state: string;
  rate: number;
  taxName: string;
  code?: string;
  active: boolean;
}

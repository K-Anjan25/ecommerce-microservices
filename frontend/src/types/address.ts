export interface SavedAddress {
  id: string;
  state: string;
  district: string;
  addressDetail: string;
  /** ISO-3166 alpha-2 destination country; "IN" is the home market. */
  country?: string;
  pincode?: string;
  phoneNumber?: string;
  defaultAddress: boolean;
}

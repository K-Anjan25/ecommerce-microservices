declare global {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    order_id?: string;
    handler: (response: RazorpayResponse) => void;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
      color?: string;
      backdrop_color?: string;
    };
    modal?: {
      ondismiss?: () => void;
      escape?: boolean;
      animation?: boolean;
      backdropclose?: boolean;
      confirm_close?: boolean;
    };
  }

  interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  interface RazorpayInstance {
    open: () => void;
    close: () => void;
    on: (event: string, handler: (response: unknown) => void) => void;
  }

  interface RazorpayConstructor {
    new (options: RazorpayOptions): RazorpayInstance;
  }

  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export {};

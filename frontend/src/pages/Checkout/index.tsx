import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useMutation } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as Yup from "yup";

// Store & APIs - Maintaining your existing Redux state and API integrations
import { AppState } from "../../store";
import { clearAllItems, removeFromCart, decreaseProductQuantity, increaseProductQuantity } from "../../store/actions/cartAction";
import { OrderApi } from "../../api/orderApi";
import { ProductApi } from "../../api/productApi";
import { CreateOrderRequest } from "../../types/order";

// Utils
import { calculateCountOfCartItems, calculateTotalPriceOfCartItems, calculateTotalPriceOfOneProduct } from "../../utils/cart";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { cn, formatPrice } from "../../lib/utils";

// Shadcn/UI Components
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";

// Icons
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Package,
  Receipt,
  Lock,
  ChevronRight,
  CheckCircle2,
  MapPin,
} from "lucide-react";

// Tax rate
const TAX_RATE = 0.10; // 10% tax

// Form validation schema
const checkoutSchema = Yup.object().shape({
  state: Yup.string().required("State is required"),
  district: Yup.string().required("District is required"),
  addressDetail: Yup.string().required("Address details are required").min(10, "Please enter a more detailed address"),
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const [searchParams] = useSearchParams();

  // Redux State - Maintaining your existing state connections
  const items = useSelector((state: AppState) => state.cart);
  const { data: user } = useSelector((state: AppState) => state.user);

  // Local State
  const [districts, setDistricts] = useState<any[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentStep, setCurrentStep] = useState<"cart" | "shipping" | "payment">("cart");

  // Load state/district data
  const statesAndDistrict = require("../../formdata.json");
  const states = statesAndDistrict.map((state: any) => ({
    name: state.state_name,
    id: state.state_name,
  }));

  const getDistricts = (stateName: string) => {
    return statesAndDistrict
      .find((state: any) => state.state_name === stateName)
      ?.districts.map((district: any) => ({
        name: district.district_name,
        id: district.district_name,
      })) || [];
  };

  // Calculate totals
  const subtotal = parseFloat(calculateTotalPriceOfCartItems(items));
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;
  const itemCount = calculateCountOfCartItems(items);

  // Form handling
  const form = useFormik({
    initialValues: {
      state: "",
      district: "",
      addressDetail: "",
    },
    validationSchema: checkoutSchema,
    onSubmit: (values) => {
      // Move to payment step when shipping form is valid
      setCurrentStep("payment");
    },
  });

  // Update districts when state changes
  useEffect(() => {
    if (form.values.state) {
      setDistricts(getDistricts(form.values.state));
      form.setFieldValue("district", "");
    }
  }, [form.values.state]);

  // Session storage for form persistence
  useEffect(() => {
    const savedFormData = sessionStorage.getItem("checkout_form");
    if (savedFormData) {
      const parsed = JSON.parse(savedFormData);
      form.setValues(parsed);
      if (parsed.state) {
        setDistricts(getDistricts(parsed.state));
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("checkout_form", JSON.stringify(form.values));
  }, [form.values]);

  // Order mutation - Maintaining your existing API integration
  const createMutation = useMutation(OrderApi.createOrder, {
    onSuccess: () => {
      showSuccess("Order has been placed successfully!");
      dispatch(clearAllItems());
      sessionStorage.removeItem("checkout_form");
      navigate("/");
    },
    onError: (e: any) => {
      const res = e.response?.data?.message as string;
      getProducts(res);
    },
  });

  const getProducts = async (res: string) => {
    if (!res) return;
    try {
      const productIds = res.substring(1, res.length - 1).split(",") as string[];
      const products = await ProductApi.getProductsByIds(productIds);
      const productNames = products.map((product) => product.name);
      showError(`${productNames.join(", ")} not in stock!`);
    } catch (error) {
      showError("Some products are not available");
    }
  };

  // Razorpay Integration
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setIsProcessingPayment(true);

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      showError("Failed to load Razorpay. Please try again.");
      setIsProcessingPayment(false);
      return;
    }

    const options: RazorpayOptions = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_placeholder",
      amount: Math.round(total * 100), // Razorpay expects amount in paise
      currency: "INR",
      name: "FinStore",
      description: `Payment for ${itemCount} item(s)`,
      image: "/logo.png",
      handler: function (response: RazorpayResponse) {
        // On successful payment, create the order
        const products = items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        }));

        const order = {
          address: {
            state: form.values.state,
            district: form.values.district,
            addressDetail: form.values.addressDetail,
          },
          items: products,
          paymentId: response.razorpay_payment_id,
        } as CreateOrderRequest;

        createMutation.mutate(order);
        setIsProcessingPayment(false);
      },
      prefill: {
        name: user?.firstName ? `${user.firstName} ${user.lastName}` : "",
        email: user?.email || "",
      },
      notes: {
        address: form.values.addressDetail,
      },
      theme: {
        color: "#182052", // Primary navy color
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
        },
        escape: true,
        animation: true,
        backdropclose: false,
        confirm_close: true,
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      showError("Failed to initialize payment. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  // Cart actions
  const handleRemoveItem = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const handleDecreaseQuantity = (productId: string) => {
    dispatch(decreaseProductQuantity(productId));
  };

  const handleIncreaseQuantity = (productId: string) => {
    dispatch(increaseProductQuantity(productId));
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you have not added any products to your cart yet.
            </p>
            <Button onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-primary-foreground/80 mt-1">
            Complete your purchase securely
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {[
              { key: "cart", label: "Review Cart", icon: ShoppingBag },
              { key: "shipping", label: "Shipping", icon: Truck },
              { key: "payment", label: "Payment", icon: CreditCard },
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => {
                    if (step.key === "cart") setCurrentStep("cart");
                    if (step.key === "shipping" && currentStep !== "cart") setCurrentStep("shipping");
                  }}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    currentStep === step.key
                      ? "text-primary font-medium"
                      : (step.key === "cart" || (step.key === "shipping" && currentStep === "payment"))
                      ? "text-muted-foreground hover:text-foreground cursor-pointer"
                      : "text-muted-foreground/50 cursor-not-allowed"
                  )}
                  disabled={
                    (step.key === "shipping" && currentStep === "cart") ||
                    (step.key === "payment" && currentStep !== "payment")
                  }
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      currentStep === step.key
                        ? "bg-primary text-primary-foreground"
                        : (step.key === "cart" || (step.key === "shipping" && currentStep === "payment"))
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {(step.key === "cart" || (step.key === "shipping" && currentStep === "payment")) ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden sm:block">{step.label}</span>
                </button>
                {index < 2 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2 md:mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items / Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Review Step */}
            {currentStep === "cart" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Cart Items ({itemCount})
                  </CardTitle>
                  <CardDescription>Review your items before proceeding</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.product.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-foreground truncate">
                                {item.product.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.product.unitPrice)} each
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.product.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 border border-border rounded-lg">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDecreaseQuantity(item.product.id)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleIncreaseQuantity(item.product.id)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-mono font-semibold text-foreground">
                              {formatPrice(calculateTotalPriceOfOneProduct(item.product.unitPrice, item.quantity))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" size="lg" onClick={() => setCurrentStep("shipping")}>
                    Continue to Shipping
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Shipping Step */}
            {currentStep === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                  <CardDescription>Where should we deliver your order?</CardDescription>
                </CardHeader>
                <form onSubmit={form.handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          State
                        </label>
                        <select
                          name="state"
                          value={form.values.state}
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                          className={cn(
                            "input-fintech",
                            form.touched.state && form.errors.state && "border-destructive ring-destructive"
                          )}
                        >
                          <option value="">Select State</option>
                          {states.map((state: any) => (
                            <option key={state.id} value={state.id}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                        {form.touched.state && form.errors.state && (
                          <p className="text-sm text-destructive mt-1">{form.errors.state}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          District
                        </label>
                        <select
                          name="district"
                          value={form.values.district}
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                          disabled={!form.values.state}
                          className={cn(
                            "input-fintech",
                            form.touched.district && form.errors.district && "border-destructive ring-destructive",
                            !form.values.state && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <option value="">Select District</option>
                          {districts.map((district: any) => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                        {form.touched.district && form.errors.district && (
                          <p className="text-sm text-destructive mt-1">{form.errors.district}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Address Details
                      </label>
                      <textarea
                        name="addressDetail"
                        value={form.values.addressDetail}
                        onChange={form.handleChange}
                        onBlur={form.handleBlur}
                        rows={3}
                        placeholder="Enter your full address including house/flat number, street name, landmark..."
                        className={cn(
                          "input-fintech resize-none",
                          form.touched.addressDetail && form.errors.addressDetail && "border-destructive ring-destructive"
                        )}
                      />
                      {form.touched.addressDetail && form.errors.addressDetail && (
                        <p className="text-sm text-destructive mt-1">{form.errors.addressDetail}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep("cart")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue to Payment
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            {/* Payment Step */}
            {currentStep === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                  <CardDescription>Complete your purchase securely with Razorpay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shipping Summary */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Shipping to:</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {form.values.addressDetail}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {form.values.district}, {form.values.state}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep("shipping")}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Payment Security Info */}
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Lock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Secure Payment</p>
                        <p className="text-sm text-muted-foreground">
                          Your payment is encrypted and secure
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Buyer Protection</p>
                        <p className="text-sm text-muted-foreground">
                          Full refund if item not received
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Razorpay Button */}
                  <Button
                    onClick={handleRazorpayPayment}
                    disabled={isProcessingPayment || createMutation.isLoading}
                    loading={isProcessingPayment || createMutation.isLoading}
                    size="lg"
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white gap-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    Pay with Razorpay - {formatPrice(total)}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By proceeding, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCurrentStep("shipping")}
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Shipping
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items Summary */}
                  <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-fintech">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-mono font-medium">
                          {formatPrice(calculateTotalPriceOfOneProduct(item.product.unitPrice, item.quantity))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                      <span className="font-mono">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span className="font-mono">{formatPrice(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-mono text-success">Free</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-mono font-bold text-primary">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {/* Tax Note */}
                  <p className="text-xs text-muted-foreground text-center">
                    Including 10% GST
                  </p>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card>
                <CardContent className="py-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                      <ShieldCheck className="h-6 w-6 text-primary mx-auto" />
                      <p className="text-xs text-muted-foreground">Secure Payment</p>
                    </div>
                    <div className="space-y-1">
                      <Truck className="h-6 w-6 text-primary mx-auto" />
                      <p className="text-xs text-muted-foreground">Free Shipping</p>
                    </div>
                    <div className="space-y-1">
                      <Package className="h-6 w-6 text-primary mx-auto" />
                      <p className="text-xs text-muted-foreground">Easy Returns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

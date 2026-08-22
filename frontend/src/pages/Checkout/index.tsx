import { Box, Button, Checkbox, Divider, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { OrderApi } from "../../api/orderApi";
import { PaymentApi } from "../../api/paymentApi";
import { AddressApi } from "../../api/addressApi";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import SelectInput from "../../components/SelectInput";
import TextInput from "../../components/TextInput";
import orderForm from "../../forms/orderForm";
import { AppState } from "../../store";
import { clearAllItems } from "../../store/actions/cartAction";
import { CreateOrderRequest, ShippingMethod } from "../../types/order";
import { PaymentRequest } from "../../types/payment";
import { SavedAddress } from "../../types/address";
import {
  calculateCountOfCartItems,
  calculateTotalPriceOfCartItems,
  formatPrice,
} from "../../utils/cart";
import { showError } from "../../utils/showError";
import { showSuccess } from "../../utils/showSuccess";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import statesAndDistrict from "../../formdata.json";

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const items = useSelector((state: AppState) => state.cart);
  const isLoggedIn = useSelector((state: AppState) => state.user.data.isLogedIn);
  const [districts, setDistricts] = useState<{ name: string; id: string }[]>([]);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(ShippingMethod.STANDARD);
  const [giftWrap, setGiftWrap] = useState(false);
  const subtotal = Number(calculateTotalPriceOfCartItems(items));
  const itemCount = calculateCountOfCartItems(items);
  const shippingCost = subtotal >= 500 ? 0 : shippingMethod === ShippingMethod.EXPRESS ? 100 : 50;
  const giftWrapFee = giftWrap ? 50 : 0;
  const tax = Number(((subtotal + shippingCost + giftWrapFee) * 0.18).toFixed(2));
  const total = subtotal + shippingCost + giftWrapFee + tax;

  const { data: defaultAddress } = useQuery(
    "defaultAddress",
    AddressApi.getDefaultAddress,
    { retry: false }
  );

  const applyAddress = (address: SavedAddress) => {
    form.setValues({
      ...form.values,
      state: address.state,
      district: address.district,
      addressDetail: address.addressDetail,
    });
    setDistricts(
      statesAndDistrict
        .find((s: any) => s.state_name === address.state)
        ?.districts.map((d: any) => ({ name: d.district_name, id: d.district_name })) ?? []
    );
  };

  const form = useFormik({
    ...orderForm,
    onSubmit: (values) => {
      const products = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        variantId: item.variantId,
      }));

      const order = {
        address: {
          state: values.state,
          district: values.district,
          addressDetail: values.addressDetail,
        },
        items: products,
        shippingMethod,
        customerEmail: isLoggedIn ? undefined : values.customerEmail,
        giftWrap,
      } as CreateOrderRequest;

      createOrderMutation.mutate(order);
    },
  });

  const createOrderMutation = useMutation(OrderApi.createOrder, {
    onSuccess: (order) => {
      const payment = {
        orderId: order.id,
        amount: order.totalAmount ?? total,
        currency: "INR",
        provider: "RAZORPAY",
      } as PaymentRequest;

      paymentMutation.mutate(payment);
    },
    onError: (e: any) => {
      showError(e.response?.data?.message ?? "Order could not be created");
    },
  });

  const paymentMutation = useMutation(PaymentApi.initiatePayment, {
    onSuccess: (payment) => {
      if (payment.status === "FAILED") {
        showError(payment.message ?? "Payment failed");
        return;
      }

      showSuccess("Payment completed and order has been created successfully");
      dispatch(clearAllItems());
      sessionStorage.removeItem("checkout_form");
      navigate("/");
    },
    onError: (e: any) => {
      showError(e.response?.data?.message ?? "Payment could not be completed");
    },
  });

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
      }));
  };

  useEffect(() => {
    setDistricts(getDistricts(form.values.state) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.state]);

  useEffect(() => {
    const savedFormData = sessionStorage.getItem("checkout_form");
    if (savedFormData) {
      form.setValues(JSON.parse(savedFormData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem("checkout_form", JSON.stringify(form.values));
  }, [form.values]);

  const busy = createOrderMutation.isLoading || paymentMutation.isLoading;

  if (items.length === 0) {
    return (
      <div className="page-shell">
        <div className="panel">
          <EmptyState
            icon={<ShoppingCartOutlinedIcon fontSize="large" />}
            title="Your cart is empty"
            subtitle="Add products to your cart before checking out."
            action={
              <Button
                variant="contained"
                className="!bg-brand !text-paper hover:!bg-brand-main"
                onClick={() => navigate("/")}
              >
                Continue shopping
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-8">
      <PageHeader
        title="Checkout"
        subtitle={`${itemCount} item${itemCount === 1 ? "" : "s"} · secure payment`}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {items.map((item) => (
            <Card key={item.product.id} product={item.product} />
          ))}
        </div>

        <div className="panel h-fit p-6 lg:sticky lg:top-24">
          <Typography variant="h5" className="font-bold">
            Payment details
          </Typography>
          <Typography className="mt-1 text-sm text-ink-soft">
            Razorpay will open to complete your payment.
          </Typography>
          <Divider className="my-4" />

          <form onSubmit={form.handleSubmit} className="space-y-3">
            {!isLoggedIn && (
              <TextInput
                name="customerEmail"
                label="Email for order updates"
                form={form}
                type="email"
              />
            )}

            {defaultAddress && (
              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={() => applyAddress(defaultAddress)}
              >
                Use default address
              </Button>
            )}

            <SelectInput name="state" label="State" form={form} data={states} />
            <SelectInput
              name="district"
              label="District"
              form={form}
              data={districts}
            />
            <TextInput
              name="addressDetail"
              label="Address detail"
              form={form}
              multiline
              rows={3}
            />

            <FormControl size="small" fullWidth>
              <InputLabel id="shipping-method-label">Shipping method</InputLabel>
              <Select
                labelId="shipping-method-label"
                value={shippingMethod}
                label="Shipping method"
                onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
              >
                <MenuItem value={ShippingMethod.STANDARD}>Standard (3-5 days)</MenuItem>
                <MenuItem value={ShippingMethod.EXPRESS}>Express (1-2 days)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  name="giftWrap"
                  color="primary"
                />
              }
              label="Gift wrap (+₹50)"
            />

            <Box className="rounded-xl bg-brand-tint p-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">
                  Subtotal ({itemCount} items)
                </span>
                <span className="font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Shipping</span>
                <span className="font-semibold">
                  {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Tax (18% GST)</span>
                <span className="font-semibold">{formatPrice(tax)}</span>
              </div>
              {giftWrap && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">Gift wrap</span>
                  <span className="font-semibold">{formatPrice(giftWrapFee)}</span>
                </div>
              )}
              <Divider className="my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="price-text">{formatPrice(total)}</span>
              </div>
            </Box>

            <LoadingButton
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              loading={busy}
              className="!bg-brand !text-paper hover:!bg-brand-main"
            >
              Pay and place order
            </LoadingButton>
            <Button fullWidth onClick={() => navigate("/cart")}>
              Back to cart
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Checkout;

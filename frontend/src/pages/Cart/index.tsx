import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useMutation } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";

import { OrderApi } from "../../api/orderApi";
import { ProductApi } from "../../api/productApi";
import CartLine from "../../components/CartLine";
import CheckoutSteps from "../../components/CheckoutSteps";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import SelectInput from "../../components/SelectInput";
import TextInput from "../../components/TextInput";
import createOrderForm from "../../forms/orderForm";
import { AppState } from "../../store";
import { clearAllItems } from "../../store/actions/cartAction";
import { CreateOrderRequest } from "../../types/order";
import {
  calculateCountOfCartItems,
  calculateTotalPriceOfCartItems,
  formatPrice,
} from "../../utils/cart";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import statesAndDistrict from "../../formdata.json";

const FREE_SHIPPING_THRESHOLD = 999;

function Cart() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const items = useSelector((state: AppState) => state.cart);
  const [modalOpen, setModalOpen] = useState(searchParams.get("order") === "true");
  const [districts, setDistricts] = useState<{ name: string; id: string }[]>([]);
  const dispatch = useDispatch<any>();

  const form = useFormik({
    ...createOrderForm(),
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
        state: values.state,
      } as CreateOrderRequest;
      createMutation.mutate(order);
    },
  });

  useEffect(() => {
    setDistricts(getDistricts(form.values.state) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.state]);

  const openModal = () => {
    setModalOpen(true);
    setSearchParams({ order: "true" });
  };

  const closeModal = () => {
    setModalOpen(false);
    setSearchParams({ order: "false" });
    form.resetForm();
  };

  const createMutation = useMutation(OrderApi.createOrder, {
    onSuccess: () => {
      showSuccess("Order has been created successfully");
      dispatch(clearAllItems());
      closeModal();
    },
    onError: (e: any) => {
      const res = e.response?.data?.message as string;
      getProducts(res);
    },
  });

  const states = statesAndDistrict.map((state: any) => ({
    name: state.state_name,
    id: state.state_name,
  }));

  const getDistricts = (stateName: string) =>
    statesAndDistrict
      .find((state: any) => state.state_name === stateName)
      ?.districts.map((district: any) => ({
        name: district.district_name,
        id: district.district_name,
      }));

  const getProducts = async (res: string) => {
    if (!res) return;
    try {
      const productIds = res.substring(1, res.length - 1).split(",") as string[];
      const products = await ProductApi.getProductsByIds(productIds);
      showError(`${products.map((p) => p.name)} not in stock!`);
    } catch {
      showError("Some products are not available");
    }
  };

  useEffect(() => {
    const savedFormData = sessionStorage.getItem("cart_form");
    if (savedFormData) form.setValues(JSON.parse(savedFormData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem("cart_form", JSON.stringify(form.values));
  }, [form.values]);

  const itemCount = calculateCountOfCartItems(items);
  const subtotal = Number(calculateTotalPriceOfCartItems(items));
  const freeShippingGap = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (items.length === 0) {
    return (
      <div className="page-shell">
        <CheckoutSteps current="cart" />
        <div className="panel">
          <EmptyState
            icon={<ShoppingCartOutlinedIcon fontSize="large" />}
            title="Your cart is empty"
            subtitle="Looks like you haven't added any products yet. Explore the shop and find something you like."
            action={
              <button className="primary-button" onClick={() => navigate("/")}>
                Continue shopping
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell pb-8">
      <CheckoutSteps current="cart" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Step 1 of 3</p>
          <h1 className="page-title mt-1">Your cart</h1>
          <p className="page-subtitle">
            {itemCount} item{itemCount === 1 ? "" : "s"} · review quantities before checkout
          </p>
        </div>
        <button onClick={() => navigate("/")} className="secondary-button !py-2">
          <ArrowBackIcon sx={{ fontSize: 16 }} />
          Continue shopping
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ── line items ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* free-shipping nudge */}
          <div className="panel p-4">
            <div className="flex items-center gap-2 text-sm">
              <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} className="text-brand" />
              {freeShippingGap > 0 ? (
                <span className="text-ink-soft">
                  Add{" "}
                  <span className="font-bold text-ink">{formatPrice(freeShippingGap)}</span>{" "}
                  more for free shipping
                </span>
              ) : (
                <span className="font-semibold text-state-success">
                  You&apos;ve unlocked free shipping
                </span>
              )}
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="panel px-4 sm:px-5">
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <CartLine key={`${item.product.id}-${item.variantId ?? "base"}`} item={item} />
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <ReplayOutlinedIcon sx={{ fontSize: 15 }} /> 7-day returns on every item
            </span>
            <span className="flex items-center gap-1.5">
              <LockOutlinedIcon sx={{ fontSize: 15 }} /> Payment is captured only on confirmation
            </span>
          </div>
        </div>

        {/* ── sticky summary ─────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="panel-raised p-5">
            <h2 className="font-heading text-base font-bold">Order summary</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal ({itemCount} items)</dt>
                <dd className="font-semibold">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="font-semibold text-ink-muted">
                  {freeShippingGap > 0 ? "At checkout" : "Free"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Tax &amp; discounts</dt>
                <dd className="font-semibold text-ink-muted">At checkout</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-heading text-base font-bold">Total so far</span>
              <span className="font-heading text-xl font-extrabold">{formatPrice(subtotal)}</span>
            </div>

            <button onClick={() => navigate("/checkout")} className="primary-button mt-5 w-full !py-3">
              Checkout
            </button>
            <LoadingButton
              variant="text"
              fullWidth
              onClick={openModal}
              loading={createMutation.isLoading}
              className="!mt-2 !text-sm !font-semibold !text-ink-soft hover:!bg-sunken"
            >
              Quick order (cash on delivery)
            </LoadingButton>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.6875rem] text-ink-muted">
              <LockOutlinedIcon sx={{ fontSize: 13 }} />
              Secure checkout · coupons, gift cards &amp; points apply next
            </p>
          </div>
        </aside>
      </div>

      <Modal
        open={modalOpen}
        setOpen={setModalOpen}
        title="Delivery information"
        disableBtn={true}
        onClose={closeModal}
      >
        <form onSubmit={form.handleSubmit} className="space-y-4 pt-2">
          <SelectInput name="state" label="State" form={form} data={states} />
          <SelectInput name="district" label="District" form={form} data={districts} />
          <TextInput name="addressDetail" label="Address detail" form={form} />
          <Box className="flex gap-2 pt-2">
            <Button
              fullWidth
              variant="outlined"
              className="!border-line !text-ink hover:!bg-sunken"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <LoadingButton
              fullWidth
              variant="contained"
              type="submit"
              loading={createMutation.isLoading}
            >
              Place order
            </LoadingButton>
          </Box>
        </form>
      </Modal>
    </div>
  );
}

export default Cart;

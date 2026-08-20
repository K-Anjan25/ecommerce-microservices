import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useMutation } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OrderApi } from "../../api/orderApi";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import SelectInput from "../../components/SelectInput";
import TextInput from "../../components/TextInput";
import orderForm from "../../forms/orderForm";
import { AppState } from "../../store";
import { clearAllItems } from "../../store/actions/cartAction";
import { CreateOrderRequest } from "../../types/order";
import {
  calculateCountOfCartItems,
  calculateTotalPriceOfCartItems,
  formatPrice,
} from "../../utils/cart";
import { showSuccess } from "../../utils/showSuccess";
import { ProductApi } from "../../api/productApi";
import { showError } from "../../utils/showError";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import statesAndDistrict from "../../formdata.json";
import { Box, Button, Divider, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";

function Cart() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const items = useSelector((state: AppState) => state.cart);
  const [modalOpen, setModalOpen] = useState(
    searchParams.get("order") === "true"
  );
  const [districts, setDistricts] = useState<{ name: string; id: string }[]>(
    []
  );
  const dispatch = useDispatch<any>();

  const form = useFormik({
    ...orderForm,
    onSubmit: (values) => {
      const products = items.map((item) => {
        return { productId: item.product.id, quantity: item.quantity };
      });
      const order = {
        address: {
          state: values.state,
          district: values.district,
          addressDetail: values.addressDetail,
        },
        items: products,
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

  const states = statesAndDistrict.map((state: any) => {
    return { name: state.state_name, id: state.state_name };
  });

  const getDistricts = (stateName: string) => {
    return statesAndDistrict
      .find((state: any) => state.state_name === stateName)
      ?.districts.map((district: any) => {
        return { name: district.district_name, id: district.district_name };
      });
  };

  const getProducts = async (res: string) => {
    if (!res) return;
    try {
      const productIds = res.substring(1, res.length - 1).split(",") as string[];
      const products = await ProductApi.getProductsByIds(productIds);
      const productNames = products.map((product) => product.name);
      showError(`${productNames} not in stock!`);
    } catch (error) {
      showError("Some products are not available");
    }
  };

  useEffect(() => {
    const savedFormData = sessionStorage.getItem("cart_form");
    if (savedFormData) {
      form.setValues(JSON.parse(savedFormData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem("cart_form", JSON.stringify(form.values));
  }, [form.values]);

  const itemCount = calculateCountOfCartItems(items);
  const totalPrice = calculateTotalPriceOfCartItems(items);

  if (items.length === 0) {
    return (
      <div className="page-shell">
        <div className="panel">
          <EmptyState
            icon={<ShoppingCartOutlinedIcon fontSize="large" />}
            title="Your cart is empty"
            subtitle="Looks like you haven't added any products yet. Explore the shop and find something you like."
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
        title="Your cart"
        subtitle={`${itemCount} item${itemCount === 1 ? "" : "s"} in your cart`}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {items.map((item) => (
            <Card key={item.product.id} product={item.product} />
          ))}
        </div>

        <div className="panel h-fit p-6 lg:sticky lg:top-24">
          <Typography variant="h5" className="font-bold">
            Order summary
          </Typography>
          <Divider className="my-4" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">
                Subtotal ({itemCount} items)
              </span>
              <span className="font-semibold">{formatPrice(Number(totalPrice))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Shipping</span>
              <span className="font-semibold text-ink-soft">Calculated at checkout</span>
            </div>
          </div>
          <Divider className="my-4" />
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="price-text text-lg">
              {formatPrice(Number(totalPrice))}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <LoadingButton
              variant="contained"
              size="large"
              onClick={openModal}
              loading={createMutation.isLoading}
              className="!bg-brand !text-paper hover:!bg-brand-main"
            >
              Place order (COD)
            </LoadingButton>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/checkout")}
              className="!border-ink/20 !text-ink hover:!border-brand hover:!bg-brand-tint hover:!text-brand"
            >
              Checkout with payment
            </Button>
          </div>
        </div>
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
          <SelectInput
            name="district"
            label="District"
            form={form}
            data={districts}
          />
          <TextInput name="addressDetail" label="Address detail" form={form} />
          <Box className="flex gap-2 pt-2">
            <Button
              fullWidth
              variant="outlined"
              className="!border-ink/20 !text-ink hover:!bg-brand-tint"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <LoadingButton
              fullWidth
              variant="contained"
              type="submit"
              loading={createMutation.isLoading}
              className="!bg-brand !text-paper hover:!bg-brand-main"
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

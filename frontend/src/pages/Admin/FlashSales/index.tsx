import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  Box,
  Button,
  Chip,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import AddIcon from "@mui/icons-material/Add";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PageHeader from "../../../components/PageHeader";
import EmptyState from "../../../components/EmptyState";
import Modal from "../../../components/Modal";
import SelectInput from "../../../components/SelectInput";
import TextInput from "../../../components/TextInput";
import DateField from "../../../components/DateField";
import SkeletonRows from "../../../components/SkeletonRows";
import { useFormik } from "formik";
import * as yup from "yup";
import { ProductApi } from "../../../api/productApi";
import { FlashSaleApi } from "../../../api/flashSaleApi";
import { FlashSale, flashSaleStatus } from "../../../types/flashSale";
import { PRODUCT_ADMIN_PARAM } from "../../../constants/product";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";
import { formatPrice } from "../../../utils/cart";
import { formatDate, nowInputValue, toLocalDateTimePayload } from "../../../utils/date";

const STATUS_STYLES: Record<string, string> = {
  live: "!bg-state-success-soft !font-semibold !text-state-success-on",
  scheduled: "!bg-brand-soft !font-semibold !text-brand",
  ended: "!bg-sunken !font-semibold !text-ink-soft",
  inactive: "!bg-sunken !font-semibold !text-ink-muted",
};

const createSchema = yup.object({
  productId: yup.string().required("Pick a product"),
  flashPrice: yup
    .number()
    .min(0.01, "Must be > 0")
    .required("Flash price is required"),
  startsAt: yup.string().required("Start date & time is required"),
  endsAt: yup
    .string()
    .required("End date & time is required")
    .test("after-start", "Must end after it starts", function (value) {
      const { startsAt } = this.parent;
      return !value || !startsAt || new Date(value) > new Date(startsAt);
    }),
});

function FlashSales() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: sales, isLoading } = useQuery(
    "admin:flash-sales",
    FlashSaleApi.getAllFlashSales,
    { retry: false }
  );

  // Product picker source — reuse the admin catalog list.
  const { data: products } = useQuery(
    ["admin:flash-sale-products"],
    () => ProductApi.getProductsByPagination({ ...PRODUCT_ADMIN_PARAM, pageSize: 100 }),
    { enabled: createOpen }
  );

  const invalidate = () => queryClient.invalidateQueries("admin:flash-sales");

  const createMutation = useMutation(FlashSaleApi.createFlashSale, {
    onSuccess: () => {
      showSuccess("Flash sale scheduled");
      setCreateOpen(false);
      form.resetForm();
      invalidate();
    },
    onError: (e: any) =>
      showError(e.response?.data?.message ?? "Could not create flash sale"),
  });

  const deleteMutation = useMutation(FlashSaleApi.deleteFlashSale, {
    onSuccess: () => {
      showSuccess("Flash sale deleted");
      invalidate();
    },
    onError: () => showError("Could not delete flash sale"),
  });

  const productOptions = useMemo(
    () =>
      (products?.data ?? []).map((product) => ({
        id: product.id,
        name: `${product.name} — ${formatPrice(product.unitPrice)}`,
      })),
    [products]
  );

  const form = useFormik({
    initialValues: {
      productId: "",
      flashPrice: "",
      startsAt: "",
      endsAt: "",
    },
    validationSchema: createSchema,
    onSubmit: (values) => {
      createMutation.mutate({
        productId: values.productId,
        flashPrice: Number(values.flashPrice),
        startsAt: toLocalDateTimePayload(values.startsAt),
        endsAt: toLocalDateTimePayload(values.endsAt),
        active: true,
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flash sales"
        subtitle="Schedule limited-time flash prices. One sale per product; the storefront shows the live countdown."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            New flash sale
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : (sales ?? []).length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<LocalOfferOutlinedIcon fontSize="large" />}
            title="No flash sales yet"
            subtitle="Schedule a product's flash price with a start and end time — it appears on the Deals page the moment it goes live."
            action={
              <Button variant="contained" onClick={() => setCreateOpen(true)}>
                Create flash sale
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {(sales ?? []).map((sale: FlashSale) => {
            const status = flashSaleStatus(sale);
            return (
              <Box
                key={sale.id}
                className="panel flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <Box className="flex flex-wrap items-center gap-3">
                  <Chip
                    label={status.toUpperCase()}
                    size="small"
                    className={STATUS_STYLES[status]}
                  />
                  <Typography className="font-semibold text-ink">
                    {sale.productName ?? sale.productId}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${formatPrice(sale.flashPrice)}${
                      sale.originalPrice
                        ? ` · was ${formatPrice(sale.originalPrice)}`
                        : ""
                    }`}
                    className="!bg-brand-soft !font-semibold !text-brand"
                  />
                  <Chip
                    size="small"
                    label={`From ${sale.startsAt ? formatDate(sale.startsAt) : "—"}`}
                    className="!bg-sunken !text-ink-soft"
                  />
                  <Chip
                    size="small"
                    label={`Until ${sale.endsAt ? formatDate(sale.endsAt) : "—"}`}
                    className="!bg-sunken !text-ink-soft"
                  />
                </Box>
                <Box className="flex items-center gap-2">
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => deleteMutation.mutate(sale.id!)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        setOpen={setCreateOpen}
        title="New flash sale"
        disableBtn
        onClose={() => setCreateOpen(false)}
      >
        <form onSubmit={form.handleSubmit} className="space-y-4 pt-2">
          <SelectInput
            name="productId"
            label="Product"
            form={form}
            data={productOptions}
          />
          <TextInput
            name="flashPrice"
            label="Flash price (₹)"
            form={form}
            type="number"
            helperText="Shown as the sale price for the whole window."
          />
          <DateField
            label="Starts at"
            mode="datetime"
            form={form}
            name="startsAt"
            helperText="Business-local date & time (IST)."
          />
          <DateField
            label="Ends at"
            mode="datetime"
            min={form.values.startsAt || nowInputValue()}
            form={form}
            name="endsAt"
            helperText="Must be after the start."
          />
          <Box className="flex justify-end gap-2 pt-1">
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <LoadingButton
              variant="contained"
              type="submit"
              loading={createMutation.isLoading}
            >
              Schedule sale
            </LoadingButton>
          </Box>
        </form>
      </Modal>
    </div>
  );
}

export default FlashSales;

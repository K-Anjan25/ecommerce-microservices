import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  Box,
  Button,
  Chip,
  Divider,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import AddIcon from "@mui/icons-material/Add";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PageHeader from "../../../components/PageHeader";
import EmptyState from "../../../components/EmptyState";
import Modal from "../../../components/Modal";
import SelectInput from "../../../components/SelectInput";
import TextInput from "../../../components/TextInput";
import DateField from "../../../components/DateField";
import { useFormik } from "formik";
import * as yup from "yup";
import { CouponApi } from "../../../api/couponApi";
import { Coupon, CouponType } from "../../../types/coupon";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";
import { formatPrice } from "../../../utils/cart";
import { formatDate, nowInputValue, toLocalDateTimePayload } from "../../../utils/date";

const typeOptions = [
  { name: "Percent off (%)", id: CouponType.PERCENT },
  { name: "Fixed amount off (₹)", id: CouponType.FIXED },
];

const createSchema = yup.object({
  code: yup.string().min(3).max(30).required("Code is required"),
  type: yup.string().required("Type is required"),
  value: yup
    .number()
    .min(0.01, "Must be > 0")
    .max(1000000)
    .required("Value is required"),
  minOrderAmount: yup.number().min(0).nullable(),
  maxDiscount: yup.number().min(0).nullable(),
  validUntil: yup.string().nullable(),
  usageLimit: yup.number().min(1).integer().nullable(),
});

const editSchema = yup.object({
  minOrderAmount: yup.number().min(0).nullable(),
  maxDiscount: yup.number().min(0).nullable(),
  validUntil: yup.string().nullable(),
  usageLimit: yup.number().min(1).integer().nullable(),
});

interface EditTarget {
  id: string;
  code: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  validUntil?: string;
  usageLimit?: number;
}

function Coupons() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const { data: coupons, isLoading } = useQuery("admin:coupons", CouponApi.getCoupons, {
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries("admin:coupons");

  const createMutation = useMutation(CouponApi.createCoupon, {
    onSuccess: () => {
      showSuccess("Coupon created");
      setCreateOpen(false);
      form.resetForm();
      invalidate();
    },
    onError: (e: any) =>
      showError(e.response?.data?.message ?? "Could not create coupon"),
  });

  const toggleMutation = useMutation(
    (coupon: Coupon) =>
      CouponApi.updateCoupon(coupon.id, { active: !coupon.active }),
    {
      onSuccess: () => invalidate(),
      onError: () => showError("Could not update coupon"),
    }
  );

  const deleteMutation = useMutation(CouponApi.deleteCoupon, {
    onSuccess: () => {
      showSuccess("Coupon deleted");
      invalidate();
    },
    onError: () => showError("Could not delete coupon"),
  });

  const editMutation = useMutation(
    ({ id, changes }: { id: string; changes: Record<string, unknown> }) =>
      CouponApi.updateCoupon(id, changes),
    {
      onSuccess: () => {
        showSuccess("Coupon updated");
        setEditTarget(null);
        invalidate();
      },
      onError: (e: any) =>
        showError(e.response?.data?.message ?? "Could not update coupon"),
    }
  );

  const form = useFormik({
    initialValues: {
      code: "",
      type: CouponType.PERCENT as string,
      value: "",
      minOrderAmount: "",
      maxDiscount: "",
      validUntil: "",
      usageLimit: "",
    },
    validationSchema: createSchema,
    onSubmit: (values) => {
      createMutation.mutate({
        code: values.code.trim().toUpperCase(),
        type: values.type as CouponType,
        value: Number(values.value),
        minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : undefined,
        maxDiscount: values.maxDiscount ? Number(values.maxDiscount) : undefined,
        // Business-local wall clock (no UTC conversion) — the backend stores
        // zone-less LocalDateTime on the same business clock the admin picks.
        validUntil: toLocalDateTimePayload(values.validUntil),
        usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
      });
    },
  });

  const editForm = useFormik({
    enableReinitialize: true,
    initialValues: {
      minOrderAmount: editTarget?.minOrderAmount != null ? String(editTarget.minOrderAmount) : "",
      maxDiscount: editTarget?.maxDiscount != null ? String(editTarget.maxDiscount) : "",
      validUntil: editTarget?.validUntil ? toInputValue(editTarget.validUntil) : "",
      usageLimit: editTarget?.usageLimit != null ? String(editTarget.usageLimit) : "",
    },
    validationSchema: editSchema,
    onSubmit: (values) => {
      if (!editTarget) return;
      // Partial update — backend treats null as "leave unchanged". Only send
      // fields the admin can actually edit; clearable optionals send null.
      const changes: Record<string, unknown> = {
        minOrderAmount: values.minOrderAmount === "" ? null : Number(values.minOrderAmount),
        maxDiscount: values.maxDiscount === "" ? null : Number(values.maxDiscount),
        validUntil: values.validUntil ? toLocalDateTimePayload(values.validUntil) : null,
        usageLimit: values.usageLimit === "" ? null : Number(values.usageLimit),
      };
      editMutation.mutate({ id: editTarget.id, changes });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        subtitle="Create discount codes, control their window and limits."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            New coupon
          </Button>
        }
      />

      {isLoading ? (
        <Typography className="text-ink-soft">Loading coupons…</Typography>
      ) : (coupons ?? []).length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<ConfirmationNumberOutlinedIcon fontSize="large" />}
            title="No coupons yet"
            subtitle="Create your first discount code to start running promotions."
            action={
              <Button
                variant="contained"
                onClick={() => setCreateOpen(true)}
              >
                Create coupon
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {(coupons ?? []).map((coupon) => (
            <Box
              key={coupon.id}
              className="panel flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <Box className="flex flex-wrap items-center gap-3">
                <Chip
                  label={coupon.code}
                  className="!bg-brand-soft !font-mono !font-bold !text-brand"
                />
                <Typography className="font-semibold text-ink">
                  {coupon.type === CouponType.PERCENT
                    ? `${coupon.value}% off`
                    : `${formatPrice(coupon.value)} off`}
                </Typography>
                {coupon.minOrderAmount ? (
                  <Chip
                    size="small"
                    label={`Min ${formatPrice(coupon.minOrderAmount)}`}
                    className="!bg-sunken !text-ink-soft"
                  />
                ) : null}
                {coupon.maxDiscount ? (
                  <Chip
                    size="small"
                    label={`Max ${formatPrice(coupon.maxDiscount)}`}
                    className="!bg-sunken !text-ink-soft"
                  />
                ) : null}
                <Chip
                  size="small"
                  label={
                    coupon.usageLimit
                      ? `Used ${coupon.usedCount}/${coupon.usageLimit}`
                      : `Used ${coupon.usedCount}`
                  }
                  className="!bg-sunken !text-ink-soft"
                />
                {coupon.validUntil ? (
                  <Chip
                    size="small"
                    label={`Until ${formatDate(coupon.validUntil)}`}
                    className="!bg-sunken !text-ink-soft"
                  />
                ) : null}
              </Box>
              <Box className="flex items-center gap-2">
                <Chip
                  size="small"
                  label={coupon.active ? "Active" : "Inactive"}
                  onClick={() => toggleMutation.mutate(coupon)}
                  className={
                    coupon.active
                      ? "!cursor-pointer !bg-state-success-soft !font-semibold !text-state-success-on"
                      : "!cursor-pointer !bg-sunken !font-semibold !text-ink-soft"
                  }
                />
                <Button
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                  onClick={() =>
                    setEditTarget({
                      id: coupon.id,
                      code: coupon.code,
                      minOrderAmount: coupon.minOrderAmount,
                      maxDiscount: coupon.maxDiscount,
                      validUntil: coupon.validUntil,
                      usageLimit: coupon.usageLimit,
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() => deleteMutation.mutate(coupon.id)}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        setOpen={setCreateOpen}
        title="New coupon"
        disableBtn
        onClose={() => setCreateOpen(false)}
      >
        <form onSubmit={form.handleSubmit} className="space-y-4 pt-2">
          <TextInput name="code" label="Code (e.g. WELCOME10)" form={form} />
          <SelectInput
            name="type"
            label="Discount type"
            form={form}
            data={typeOptions}
          />
          <TextInput name="value" label="Value" form={form} type="number" />
          <TextInput
            name="minOrderAmount"
            label="Minimum order amount (optional)"
            form={form}
            type="number"
          />
          <TextInput
            name="maxDiscount"
            label="Max discount (optional, % type)"
            form={form}
            type="number"
          />
          <TextInput
            name="usageLimit"
            label="Total usage limit (optional)"
            form={form}
            type="number"
          />
          <DateField
            label="Valid until (optional)"
            mode="datetime"
            min={nowInputValue()}
            helperText="Business-local date & time (IST)."
            form={form}
            name="validUntil"
          />
          <Divider />
          <Box className="flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <LoadingButton
              variant="contained"
              type="submit"
              loading={createMutation.isLoading}
            >
              Create coupon
            </LoadingButton>
          </Box>
        </form>
      </Modal>

      <Modal
        open={Boolean(editTarget)}
        setOpen={(open) => !open && setEditTarget(null)}
        title={`Edit ${editTarget?.code ?? "coupon"}`}
        disableBtn
        onClose={() => setEditTarget(null)}
      >
        <form onSubmit={editForm.handleSubmit} className="space-y-4 pt-2">
          <Typography variant="body2" className="text-ink-soft">
            Code, discount type and value are immutable — deactivate and recreate the
            coupon to change them.
          </Typography>
          <TextInput
            name="minOrderAmount"
            label="Minimum order amount"
            form={editForm}
            type="number"
            helperText="Leave empty for no minimum."
          />
          <TextInput
            name="maxDiscount"
            label="Max discount"
            form={editForm}
            type="number"
            helperText="Leave empty for no cap."
          />
          <TextInput
            name="usageLimit"
            label="Total usage limit"
            form={editForm}
            type="number"
            helperText="Leave empty for unlimited."
          />
          <DateField
            label="Valid until"
            mode="datetime"
            helperText="Business-local date & time (IST). Clear to remove the deadline."
            form={editForm}
            name="validUntil"
          />
          <Divider />
          <Box className="flex justify-end gap-2">
            <Button onClick={() => setEditTarget(null)}>Cancel</Button>
            <LoadingButton
              variant="contained"
              type="submit"
              loading={editMutation.isLoading}
            >
              Save changes
            </LoadingButton>
          </Box>
        </form>
      </Modal>
    </div>
  );
}

/** Backend naive `2026-08-26T10:00:00` → selector `2026-08-26T10:00`. */
function toInputValue(backendValue: string) {
  return backendValue.slice(0, 16);
}

export default Coupons;

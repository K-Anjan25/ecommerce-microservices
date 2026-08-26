import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Button } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import AddIcon from "@mui/icons-material/Add";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PageHeader from "../../../components/PageHeader";
import EmptyState from "../../../components/EmptyState";
import Modal from "../../../components/Modal";
import TextInput from "../../../components/TextInput";
import SkeletonRows from "../../../components/SkeletonRows";
import { useFormik } from "formik";
import * as yup from "yup";
import { ShippingApi, ShippingRate } from "../../../api/shippingApi";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";
import { formatPrice } from "../../../utils/cart";

const rateSchema = yup.object({
  pincode: yup
    .string()
    .matches(/^\d{6}$/, "Use a 6-digit pincode")
    .required("Pincode is required"),
  cost: yup.number().min(0).required("Shipping cost is required"),
  freeAbove: yup.number().min(0).nullable(),
  estimatedDaysMin: yup.number().min(0).integer().required("Required"),
  estimatedDaysMax: yup
    .number()
    .min(0)
    .integer()
    .test("after-min", "Must be ≥ the minimum", function (value) {
      const { estimatedDaysMin } = this.parent;
      return value == null || estimatedDaysMin == null || value >= estimatedDaysMin;
    })
    .required("Required"),
  carrier: yup.string().trim().required("Carrier is required"),
});

interface RateFormValues {
  pincode: string;
  cost: string;
  freeAbove: string;
  estimatedDaysMin: string;
  estimatedDaysMax: string;
  carrier: string;
}

const emptyValues: RateFormValues = {
  pincode: "",
  cost: "",
  freeAbove: "",
  estimatedDaysMin: "",
  estimatedDaysMax: "",
  carrier: "",
};

function ShippingRates() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingRate | null>(null);

  const { data: rates, isLoading } = useQuery("admin:shipping-rates", ShippingApi.getRates, {
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries("admin:shipping-rates");

  const saveMutation = useMutation(
    (values: RateFormValues) => {
      const payload = {
        pincode: values.pincode.trim(),
        cost: Number(values.cost),
        freeAbove: values.freeAbove === "" ? undefined : Number(values.freeAbove),
        estimatedDaysMin: Number(values.estimatedDaysMin),
        estimatedDaysMax: Number(values.estimatedDaysMax),
        carrier: values.carrier.trim(),
        active: editing ? editing.active : true,
      };
      return editing
        ? ShippingApi.updateRate(editing.id, payload)
        : ShippingApi.createRate(payload);
    },
    {
      onSuccess: () => {
        showSuccess(editing ? "Shipping rate updated" : "Shipping rate created");
        setModalOpen(false);
        setEditing(null);
        invalidate();
      },
      onError: (e: any) =>
        showError(e.response?.data?.message ?? "Could not save shipping rate"),
    }
  );

  const deleteMutation = useMutation(ShippingApi.deleteRate, {
    onSuccess: () => {
      showSuccess("Shipping rate deleted");
      invalidate();
    },
    onError: () => showError("Could not delete shipping rate"),
  });

  const form = useFormik<RateFormValues>({
    enableReinitialize: true,
    initialValues: editing
      ? {
          pincode: editing.pincode,
          cost: String(editing.cost),
          freeAbove: editing.freeAbove != null ? String(editing.freeAbove) : "",
          estimatedDaysMin: String(editing.estimatedDaysMin),
          estimatedDaysMax: String(editing.estimatedDaysMax),
          carrier: editing.carrier,
        }
      : emptyValues,
    validationSchema: rateSchema,
    onSubmit: (values) => saveMutation.mutate(values),
  });

  const summary = useMemo(
    () => `${(rates ?? []).length} pincode rate${(rates ?? []).length === 1 ? "" : "s"}`,
    [rates]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipping rates"
        subtitle="Per-pincode shipping cost, free-shipping threshold and delivery estimate used at checkout."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              form.resetForm();
              setModalOpen(true);
            }}
          >
            New rate
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonRows rows={4} columns={5} />
      ) : (rates ?? []).length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<LocalShippingOutlinedIcon fontSize="large" />}
            title="No shipping rates yet"
            subtitle="Add a rate per serviceable pincode — checkout quotes from this table and shows “not serviceable” when no rate matches."
            action={
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  form.resetForm();
                  setModalOpen(true);
                }}
              >
                Add the first rate
              </Button>
            }
          />
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
                <th className="px-4 py-2.5">Pincode</th>
                <th className="px-4 py-2.5">Cost</th>
                <th className="px-4 py-2.5">Free above</th>
                <th className="px-4 py-2.5">Delivery</th>
                <th className="px-4 py-2.5">Carrier</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(rates ?? []).map((rate) => (
                <tr key={rate.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold text-ink">{rate.pincode}</td>
                  <td className="px-4 py-3 text-ink">{formatPrice(rate.cost)}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {rate.freeAbove != null ? formatPrice(rate.freeAbove) : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {rate.estimatedDaysMin}–{rate.estimatedDaysMax} days
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{rate.carrier}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="small"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => {
                          setEditing(rate);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => {
                          if (window.confirm(`Delete the rate for ${rate.pincode}?`)) {
                            deleteMutation.mutate(rate.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line/60 px-4 py-2 text-xs text-ink-muted">{summary}</p>
        </div>
      )}

      <Modal
        open={modalOpen}
        setOpen={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? `Edit rate ${editing.pincode}` : "New shipping rate"}
        disableBtn
        onClose={() => setEditing(null)}
      >
        <form onSubmit={form.handleSubmit} className="space-y-4 pt-2">
          <TextInput name="pincode" label="Pincode" form={form} />
          <TextInput name="cost" label="Shipping cost (₹)" form={form} type="number" />
          <TextInput
            name="freeAbove"
            label="Free shipping above (optional)"
            form={form}
            type="number"
            helperText="Orders above this amount ship free to this pincode."
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput name="estimatedDaysMin" label="Min days" form={form} type="number" />
            <TextInput name="estimatedDaysMax" label="Max days" form={form} type="number" />
          </div>
          <TextInput name="carrier" label="Carrier" form={form} helperText="e.g. Delhivery, BlueDart, Store pickup" />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <LoadingButton variant="contained" type="submit" loading={saveMutation.isLoading}>
              {editing ? "Save changes" : "Create rate"}
            </LoadingButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ShippingRates;

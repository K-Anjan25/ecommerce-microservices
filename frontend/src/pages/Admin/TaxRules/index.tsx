import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Button, Chip } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import AddIcon from "@mui/icons-material/Add";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PageHeader from "../../../components/PageHeader";
import EmptyState from "../../../components/EmptyState";
import Modal from "../../../components/Modal";
import TextInput from "../../../components/TextInput";
import SkeletonRows from "../../../components/SkeletonRows";
import { useFormik } from "formik";
import * as yup from "yup";
import { TaxApi } from "../../../api/taxApi";
import { TaxRule } from "../../../types/shipping";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";

const ruleSchema = yup.object({
  state: yup.string().trim().required("State name is required"),
  rate: yup
    .number()
    .min(0, "Must be ≥ 0")
    .max(100, "Must be ≤ 100")
    .required("Tax rate (%) is required"),
  taxName: yup.string().trim().required("e.g. GST / VAT label is required"),
  code: yup.string(),
});

interface RuleFormValues {
  state: string;
  rate: string;
  taxName: string;
  code: string;
}

const emptyValues: RuleFormValues = { state: "", rate: "", taxName: "", code: "" };

function TaxRules() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRule | null>(null);

  const { data: rules, isLoading } = useQuery("admin:tax-rules", TaxApi.getRules, {
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries("admin:tax-rules");

  const saveMutation = useMutation(
    (values: RuleFormValues) => {
      const payload: TaxRule = {
        state: values.state.trim(),
        rate: Number(values.rate),
        taxName: values.taxName.trim(),
        code: values.code.trim() || undefined,
        active: editing ? editing.active : true,
      };
      return editing && editing.id
        ? TaxApi.updateRule(editing.id, payload)
        : TaxApi.createRule(payload);
    },
    {
      onSuccess: () => {
        showSuccess(editing ? "Tax rule updated" : "Tax rule created");
        setModalOpen(false);
        setEditing(null);
        invalidate();
      },
      onError: (e: any) =>
        showError(e.response?.data?.message ?? "Could not save tax rule"),
    }
  );

  const deleteMutation = useMutation(TaxApi.deleteRule, {
    onSuccess: () => {
      showSuccess("Tax rule deleted");
      invalidate();
    },
    onError: () => showError("Could not delete tax rule"),
  });

  const toggleMutation = useMutation(
    (rule: TaxRule) => TaxApi.updateRule(rule.id!, { ...rule, active: !rule.active }),
    {
      onSuccess: () => invalidate(),
      onError: () => showError("Could not update tax rule"),
    }
  );

  const form = useFormik<RuleFormValues>({
    enableReinitialize: true,
    initialValues: editing
      ? {
          state: editing.state,
          rate: String(editing.rate),
          taxName: editing.taxName,
          code: editing.code ?? "",
        }
      : emptyValues,
    validationSchema: ruleSchema,
    onSubmit: (values) => saveMutation.mutate(values),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax rules"
        subtitle="Per-state tax applied to order pricing at checkout. One active rule per state."
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
            New rule
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonRows rows={4} columns={4} />
      ) : (rules ?? []).length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<PercentOutlinedIcon fontSize="large" />}
            title="No tax rules yet"
            subtitle="Checkout treats every order as tax-free until a rule matches the shipping state."
            action={
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  form.resetForm();
                  setModalOpen(true);
                }}
              >
                Add the first rule
              </Button>
            }
          />
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
                <th className="px-4 py-2.5">State</th>
                <th className="px-4 py-2.5">Rate</th>
                <th className="px-4 py-2.5">Label</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(rules ?? []).map((rule) => (
                <tr key={rule.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">{rule.state}</td>
                  <td className="px-4 py-3 text-ink">{rule.rate}%</td>
                  <td className="px-4 py-3 text-ink-soft">{rule.taxName}</td>
                  <td className="px-4 py-3 font-mono text-ink-soft">{rule.code || "—"}</td>
                  <td className="px-4 py-3">
                    <Chip
                      size="small"
                      label={rule.active ? "Active" : "Inactive"}
                      onClick={() => toggleMutation.mutate(rule)}
                      className={
                        rule.active
                          ? "!cursor-pointer !bg-state-success-soft !font-semibold !text-state-success-on"
                          : "!cursor-pointer !bg-sunken !font-semibold !text-ink-soft"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="small"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => {
                          setEditing(rule);
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
                          if (window.confirm(`Delete the tax rule for ${rule.state}?`)) {
                            deleteMutation.mutate(rule.id!);
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
        </div>
      )}

      <Modal
        open={modalOpen}
        setOpen={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? `Edit tax rule — ${editing.state}` : "New tax rule"}
        disableBtn
        onClose={() => setEditing(null)}
      >
        <form onSubmit={form.handleSubmit} className="space-y-4 pt-2">
          <TextInput name="state" label="State" form={form} helperText="Must match the customer's shipping state name." />
          <TextInput name="rate" label="Rate (%)" form={form} type="number" />
          <TextInput name="taxName" label="Label" form={form} helperText="Shown on invoices, e.g. GST, SGST+CGST." />
          <TextInput name="code" label="Code (optional)" form={form} helperText="e.g. GST-19" />
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
              {editing ? "Save changes" : "Create rule"}
            </LoadingButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TaxRules;

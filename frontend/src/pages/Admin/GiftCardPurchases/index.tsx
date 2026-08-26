import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import { Box, Button, Chip, Divider, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import AddIcon from "@mui/icons-material/Add";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";

import { GiftCardApi } from "../../../api/giftCardApi";
import DataTable, { DataColumn, TableIconButton } from "../../../components/DataTable";
import DateField from "../../../components/DateField";
import EmptyState from "../../../components/EmptyState";
import Modal from "../../../components/Modal";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import TextInput from "../../../components/TextInput";
import { GiftCard, GiftCardPurchaseAdmin } from "../../../types/giftCard";
import { formatPrice } from "../../../utils/cart";
import { formatCalendarDate, todayInputValue } from "../../../utils/date";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";

const FILTERS: GiftCardPurchaseAdmin["status"][] = [
  "ISSUED",
  "PENDING_PAYMENT",
  "REFUNDED",
  "FAILED",
];

const statusTone: Record<GiftCardPurchaseAdmin["status"], string> = {
  ISSUED: "!bg-state-success-soft !text-state-success-on",
  PENDING_PAYMENT: "!bg-state-warning-soft !text-state-warning-on",
  REFUNDED: "!bg-state-info/10 !text-state-info",
  FAILED: "!bg-state-danger-soft !text-state-danger-on",
};

const readable = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

export default function GiftCardPurchasesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<GiftCardPurchaseAdmin["status"]>("ISSUED");
  const [issueOpen, setIssueOpen] = useState(false);
  const [issuedCard, setIssuedCard] = useState<GiftCard | null>(null);
  const { data = [], isLoading, isError } = useQuery(
    ["admin:gift-card-purchases", status],
    () => GiftCardApi.listPurchases(status),
    { retry: false }
  );

  const refundMutation = useMutation(GiftCardApi.refundPurchase, {
    onSuccess: (result) => {
      queryClient.invalidateQueries(["admin:gift-card-purchases"]);
      showSuccess(`Refunded ${formatPrice(Number(result.refundedAmount ?? 0))}`);
    },
    onError: (error: any) => {
      showError(error.response?.data?.message ?? "Gift-card refund failed");
    },
  });

  const issueMutation = useMutation(GiftCardApi.issueGiftCard, {
    onSuccess: (card) => {
      queryClient.invalidateQueries(["admin:gift-card-purchases"]);
      setIssueOpen(false);
      setIssuedCard(card);
      issueForm.resetForm();
    },
    onError: (error: any) => {
      showError(error.response?.data?.message ?? "Gift-card issuance failed");
    },
  });

  const issueForm = useFormik({
    initialValues: {
      amount: "",
      recipientEmail: "",
      expiryDate: defaultIssueExpiry(),
      reason: "",
    },
    validationSchema: yup.object({
      amount: yup.number().min(1, "Minimum ₹1").max(100000, "Maximum ₹1,00,000").required("Amount is required"),
      recipientEmail: yup.string().email("Enter a valid email"),
      expiryDate: yup.string().required("Expiry date is required"),
      reason: yup.string().max(300).required("Reason is required for the audit ledger"),
    }),
    onSubmit: (values) => {
      issueMutation.mutate({
        amount: Number(values.amount),
        recipientEmail: values.recipientEmail.trim() || undefined,
        expiryDate: values.expiryDate,
        reason: values.reason.trim(),
      });
    },
  });

  const columns: DataColumn<GiftCardPurchaseAdmin>[] = [
    {
      id: "createdAt",
      label: "Created",
      minWidth: 165,
      render: (item) => item.createdAt
        ? new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : "—",
    },
    {
      id: "amount",
      label: "Value",
      align: "right",
      minWidth: 105,
      render: (item) => <span className="font-semibold">{formatPrice(item.amount)}</span>,
    },
    {
      id: "recipientEmail",
      label: "Recipient",
      minWidth: 210,
      render: (item) => item.recipientEmail || <span className="text-ink-muted">Purchaser wallet</span>,
    },
    {
      id: "expiryDate",
      label: "Expires",
      minWidth: 110,
    },
    {
      id: "orderId",
      label: "Order",
      minWidth: 180,
      mono: true,
      hideBelow: "lg",
      render: (item) => item.orderId,
    },
    {
      id: "status",
      label: "Status",
      minWidth: 145,
      render: (item) => (
        <Chip size="small" label={readable(item.status)} className={`!rounded-none !font-semibold ${statusTone[item.status]}`} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stored value"
        title="Gift-card purchases"
        subtitle="Review settlement-backed issuance and refund only unused card value."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIssueOpen(true)}>
            Issue card
          </Button>
        }
      />

      <div className="flex flex-wrap gap-5 border-b border-line">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`border-b-2 pb-3 text-xs font-bold uppercase tracking-[0.12em] transition ${
              status === item ? "border-brand text-brand" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {readable(item)}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="border-y border-state-danger/40 bg-state-danger-soft/30 px-4 py-5 text-sm text-state-danger-on">
          Could not load gift-card purchases. Try again in a moment.
        </div>
      ) : isLoading ? (
        <SkeletonRows rows={6} columns={6} />
      ) : data.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<CardGiftcardOutlinedIcon fontSize="large" />}
            title={`No ${readable(status).toLowerCase()} purchases`}
            subtitle="Gift-card purchase intents will appear here as customers start the secure purchase flow."
          />
        </div>
      ) : (
        <DataTable
          rows={data}
          columns={columns}
          getRowId={(item) => item.purchaseId}
          caption={`${data.length} ${readable(status).toLowerCase()} purchase${data.length === 1 ? "" : "s"}`}
          actions={(item) => item.status === "ISSUED" ? (
            <TableIconButton
              label="Refund unused gift-card value"
              tone="danger"
              onClick={() => {
                if (window.confirm(`Refund the unused balance for this ${formatPrice(item.amount)} gift card?`)) {
                  refundMutation.mutate(item.purchaseId);
                }
              }}
            >
              <UndoOutlinedIcon sx={{ fontSize: 17 }} />
            </TableIconButton>
          ) : null}
          actionsLabel="Refund"
        />
      )}

      <p className="text-xs leading-relaxed text-ink-muted">
        Refunds are provider-backed and idempotent. A card that has already been spent cannot be refunded automatically.
      </p>

      <Modal
        open={issueOpen}
        setOpen={setIssueOpen}
        title="Issue a gift card"
        disableBtn
        onClose={() => setIssueOpen(false)}
      >
        <form onSubmit={issueForm.handleSubmit} className="space-y-4 pt-2">
          <Typography variant="body2" className="text-ink-soft">
            Manual issuance activates immediately and is recorded in the audit ledger.
            Share the generated code with the recipient over a trusted channel.
          </Typography>
          <TextInput
            name="amount"
            label="Amount (₹)"
            form={issueForm}
            type="number"
          />
          <TextInput
            name="recipientEmail"
            label="Recipient email (optional)"
            form={issueForm}
            type="email"
          />
          <DateField
            label="Expiry date"
            mode="date"
            min={todayInputValue()}
            helperText="Card stays redeemable through the whole expiry day."
            form={issueForm}
            name="expiryDate"
          />
          <TextInput
            name="reason"
            label="Reason (audit note)"
            form={issueForm}
            helperText="e.g. support compensation, marketing giveaway"
          />
          <Divider />
          <Box className="flex justify-end gap-2">
            <Button onClick={() => setIssueOpen(false)}>Cancel</Button>
            <LoadingButton
              variant="contained"
              type="submit"
              loading={issueMutation.isLoading}
            >
              Issue card
            </LoadingButton>
          </Box>
        </form>
      </Modal>

      <Modal
        open={Boolean(issuedCard)}
        setOpen={(open) => !open && setIssuedCard(null)}
        title="Gift card issued"
        disableBtn
        onClose={() => setIssuedCard(null)}
      >
        {issuedCard && (
          <div className="space-y-4 pt-2">
            <Typography variant="body2" className="text-ink-soft">
              {formatPrice(issuedCard.initialBalance)} card is active. Copy the code now —
              it is shown in full only here.
            </Typography>
            <Box className="rounded-sm border border-line bg-sunken px-4 py-3 text-center">
              <Typography className="font-mono text-lg font-bold tracking-widest text-ink">
                {issuedCard.code}
              </Typography>
            </Box>
            <Typography variant="body2" className="text-ink-soft">
              Expires {formatCalendarDate(issuedCard.expiryDate)}
              {issuedCard.recipientEmail ? ` · recipient ${issuedCard.recipientEmail}` : ""}
            </Typography>
            <Box className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard?.writeText(issuedCard.code);
                  showSuccess("Gift-card code copied");
                }}
              >
                Copy code
              </Button>
              <Button variant="contained" onClick={() => setIssuedCard(null)}>
                Done
              </Button>
            </Box>
          </div>
        )}
      </Modal>
    </div>
  );
}

function defaultIssueExpiry() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import { Chip } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useState } from "react";

import { GiftCardApi } from "../../../api/giftCardApi";
import DataTable, { DataColumn, TableIconButton } from "../../../components/DataTable";
import EmptyState from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import { GiftCardPurchaseAdmin } from "../../../types/giftCard";
import { formatPrice } from "../../../utils/cart";
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
    </div>
  );
}

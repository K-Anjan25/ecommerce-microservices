import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import { Alert, Chip } from "@mui/material";
import { useQuery } from "react-query";

import DataTable, { DataColumn } from "../../../components/DataTable";
import EmptyState from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import { PaymentReconciliationApi } from "../../../api/paymentReconciliationApi";
import { PaymentReconciliationCase } from "../../../types/paymentReconciliation";
import { formatPrice } from "../../../utils/cart";

const readable = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

const columns: DataColumn<PaymentReconciliationCase>[] = [
  {
    id: "createdAt",
    label: "Flagged",
    minWidth: 170,
    render: (item) => new Date(item.createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  },
  {
    id: "provider",
    label: "Provider",
    minWidth: 110,
    render: (item) => (
      <Chip
        size="small"
        label={item.provider}
        className="!rounded-none !bg-state-warning-soft !font-semibold !text-state-warning-on"
      />
    ),
  },
  {
    id: "amount",
    label: "Amount",
    align: "right",
    minWidth: 110,
    render: (item) => <span className="font-semibold">{formatPrice(item.amount)}</span>,
  },
  {
    id: "orderId",
    label: "Order",
    minWidth: 190,
    mono: true,
    render: (item) => item.orderId,
  },
  {
    id: "transactionId",
    label: "Provider reference",
    minWidth: 180,
    mono: true,
    hideBelow: "lg",
    render: (item) => item.transactionId || <span className="text-ink-muted">—</span>,
  },
  {
    id: "reason",
    label: "Reason",
    minWidth: 260,
    hideBelow: "xl",
    render: (item) => item.reason,
  },
];

export default function PaymentReconciliationPage() {
  const { data = [], isLoading, isError, refetch, isFetching } = useQuery(
    "admin:payment-reconciliation",
    () => PaymentReconciliationApi.list("OPEN"),
    { retry: false, refetchInterval: 60_000 }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Payment reconciliation"
        subtitle="Stale provider payments waiting for verified settlement or failure callbacks."
        actions={(
          <button
            type="button"
            className="secondary-button !py-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <SyncOutlinedIcon sx={{ fontSize: 17 }} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        )}
      />

      <Alert severity="warning" icon={<WarningAmberOutlinedIcon />}>
        This is a read-only queue. Do not release inventory or mark a payment settled manually;
        provider confirmation must arrive through the signed webhook path.
      </Alert>

      {isError ? (
        <div className="border-y border-state-danger/40 bg-state-danger-soft/30 px-4 py-5 text-sm text-state-danger-on">
          Could not load the reconciliation queue. Try refreshing in a moment.
        </div>
      ) : isLoading ? (
        <SkeletonRows rows={5} columns={6} />
      ) : data.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<WarningAmberOutlinedIcon fontSize="large" />}
            title="No payments need review"
            subtitle="The queue will populate when an online payment stays pending beyond its reconciliation window."
          />
        </div>
      ) : (
        <DataTable
          rows={data}
          columns={columns}
          getRowId={(item) => item.id}
          caption={`${data.length} open case${data.length === 1 ? "" : "s"}`}
        />
      )}

      {!isLoading && !isError && data.length > 0 && (
        <p className="text-xs text-ink-muted">
          Status: {readable("OPEN")} · refreshed automatically every minute
        </p>
      )}
    </div>
  );
}

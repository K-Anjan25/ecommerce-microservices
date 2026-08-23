import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Typography,
} from "@mui/material";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import PageHeader from "../../../components/PageHeader";
import EmptyState from "../../../components/EmptyState";
import { ReturnApi } from "../../../api/returnApi";
import { ProductApi } from "../../../api/productApi";
import { ReturnRequest, ReturnStatus } from "../../../types/returnRequest";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";
import { formatDate } from "../../../utils/date";
import { formatPrice } from "../../../utils/cart";

const FILTERS = ["ALL", "REQUESTED", "APPROVED", "REFUNDED", "REJECTED"] as const;
type Filter = (typeof FILTERS)[number];

const statusChip: Record<string, string> = {
  REQUESTED: "!bg-state-warning-soft !text-state-warning-on",
  APPROVED: "!bg-brand-soft !text-brand",
  REFUNDED: "!bg-state-info/10 !text-state-info",
  REJECTED: "!bg-state-danger-soft !text-state-danger-on",
};

function AdminReturns() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("ALL");

  const { data: returns, isLoading } = useQuery(
    "admin:returns",
    ReturnApi.getAllReturnRequests,
    { retry: false }
  );

  const productIds = Array.from(
    new Set((returns ?? []).map((r) => r.productId))
  );
  const { data: products } = useQuery(
    ["admin:returns:products", productIds.join(",")],
    () => ProductApi.getProductsByIds(productIds),
    { enabled: productIds.length > 0, retry: false }
  );
  const productNames = new Map(
    (products ?? []).map((p) => [p.id, p.name])
  );

  const invalidate = () => {
    queryClient.invalidateQueries("admin:returns");
    queryClient.invalidateQueries("admin:dashboard");
  };

  const onDone = (message: string) => {
    showSuccess(message);
    invalidate();
  };

  const approveMutation = useMutation(ReturnApi.approveReturnRequest, {
    onSuccess: () => onDone("Return approved — stock restored"),
    onError: (e: any) =>
      showError(e.response?.data?.message ?? "Approve failed"),
  });

  const rejectMutation = useMutation(ReturnApi.rejectReturnRequest, {
    onSuccess: () => onDone("Return rejected"),
    onError: (e: any) =>
      showError(e.response?.data?.message ?? "Reject failed"),
  });

  const refundMutation = useMutation(ReturnApi.refundReturnRequest, {
    onSuccess: () => onDone("Refund processed"),
    onError: (e: any) =>
      showError(
        e.response?.data?.message ?? e.response?.data?.error ?? "Refund failed"
      ),
  });

  const filtered =
    filter === "ALL"
      ? returns ?? []
      : (returns ?? []).filter((r) => r.status === filter);

  const counts = (returns ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns & refunds"
        subtitle="Approve requests, then trigger the provider refund."
      />

      <Box className="flex flex-wrap gap-6 border-b border-line">
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f === "ALL" ? `All (${returns?.length ?? 0})` : `${f} (${counts[f] ?? 0})`}
            onClick={() => setFilter(f)}
            className={`!rounded-none !border-b-2 !bg-transparent !px-0 !font-semibold ${filter === f ? "!border-brand !text-brand" : "!border-transparent !text-ink-muted"}`}
          />
        ))}
      </Box>

      {isLoading ? (
        <Typography className="text-ink-soft">Loading return requests…</Typography>
      ) : filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<AssignmentReturnOutlinedIcon fontSize="large" />}
            title={filter === "ALL" ? "No return requests" : `No ${filter.toLowerCase()} returns`}
            subtitle="Customer return requests will appear here for review."
          />
        </div>
      ) : (
        <div className="border-t border-ink">
          {filtered.map((r: ReturnRequest) => (
            <Box key={r.id} className="border-b border-line py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      size="small"
                      label={r.status}
                      className={statusChip[r.status] ?? "!bg-sunken !text-ink-soft"}
                    />
                    <Typography className="font-semibold text-ink">
                      {productNames.get(r.productId) ??
                        `Product ${r.productId.slice(0, 8)}`}
                    </Typography>
                    <Typography className="text-sm text-ink-soft">
                      × {r.quantity}
                    </Typography>
                  </div>
                  <Typography variant="body2" className="mt-1 text-ink-soft">
                    Order{" "}
                    <span
                      className="cursor-pointer font-medium text-brand underline"
                      onClick={() => navigate(`/admin/orderDetail/${r.orderId}`)}
                    >
                      #{r.orderId.slice(0, 8)}
                    </span>
                    {r.createdDate ? ` · ${formatDate(r.createdDate)}` : ""}
                  </Typography>
                  {r.reason && (
                    <Typography variant="body2" className="text-ink-soft">
                      Reason: {r.reason}
                    </Typography>
                  )}
                  {r.status === ReturnStatus.REFUNDED && r.refundAmount != null && (
                    <Typography variant="body2" className="text-state-info">
                      Refunded {formatPrice(r.refundAmount)}
                      {r.refundTransactionId ? ` · Ref ${r.refundTransactionId}` : ""}
                    </Typography>
                  )}
                  {r.status === ReturnStatus.REJECTED && r.rejectionReason && (
                    <Typography variant="body2" className="text-state-danger-on">
                      Rejected: {r.rejectionReason}
                    </Typography>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {r.status === ReturnStatus.REQUESTED && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                                                disabled={approveMutation.isLoading}
                        onClick={() => approveMutation.mutate(r.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={rejectMutation.isLoading}
                        onClick={() =>
                          rejectMutation.mutate({ id: r.id, reason: "Not eligible" })
                        }
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {r.status === ReturnStatus.APPROVED && (
                    <Button
                      size="small"
                      variant="contained"
                      disabled={refundMutation.isLoading}
                      onClick={() => refundMutation.mutate(r.id)}
                      className="!bg-state-info !text-oncontrast hover:!bg-state-info"
                    >
                      Refund
                    </Button>
                  )}
                </div>
              </div>
            </Box>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminReturns;

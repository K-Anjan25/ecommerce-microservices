import { useQuery } from "react-query";
import { ReturnApi } from "../../api/returnApi";
import PageHeader from "../../components/PageHeader";
import { Paper, Typography, Box, Chip } from "@mui/material";
import EmptyState from "../../components/EmptyState";
import { useNavigate } from "react-router-dom";
import { ReturnStatus } from "../../types/returnRequest";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

function Returns() {
  const navigate = useNavigate();
  const { data: returnRequests, isLoading } = useQuery("myReturnRequests", ReturnApi.getMyReturnRequests);

  if (isLoading) {
    return (
      <div className="page-shell">
        <PageHeader title="Returns" subtitle="Your return requests." />
        <Paper className="p-6"><Typography>Loading...</Typography></Paper>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title="Returns"
        subtitle={`${returnRequests?.length ?? 0} return request${(returnRequests?.length ?? 0) === 1 ? "" : "s"}`}
      />

      {!returnRequests || returnRequests.length === 0 ? (
        <Paper className="p-6 sm:p-8">
          <EmptyState
            icon={<ReceiptLongOutlinedIcon fontSize="large" />}
            title="No returns yet"
            subtitle="If you need to return an item, you can request a return from your order details."
            action={
              <button
                onClick={() => navigate("/orders")}
                className="btn-primary"
              >
                View orders
              </button>
            }
          />
        </Paper>
      ) : (
        <div className="space-y-4">
          {returnRequests.map((req) => (
            <Paper key={req.id} className="p-6">
              <Box className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Typography variant="subtitle1" className="font-semibold">
                    Return #{req.id}
                  </Typography>
                  <Typography className="text-sm text-ink-soft">
                    Order #{req.orderId} · Qty: {req.quantity}
                  </Typography>
                  {req.reason && (
                    <Typography className="text-sm text-ink-soft">
                      Reason: {req.reason}
                    </Typography>
                  )}
                  {req.rejectionReason && (
                    <Typography className="text-sm text-rose-600">
                      Rejected: {req.rejectionReason}
                    </Typography>
                  )}
                  {req.refundAmount != null && req.status === ReturnStatus.REFUNDED && (
                    <Typography className="text-sm text-ink-soft">
                      Refunded: ₹ {req.refundAmount.toFixed(2)}
                      {req.refundTransactionId ? ` · Ref: ${req.refundTransactionId}` : ""}
                    </Typography>
                  )}
                </div>
                <Chip
                  label={req.status}
                  color={
                    req.status === ReturnStatus.APPROVED
                      ? "success"
                      : req.status === ReturnStatus.REJECTED
                      ? "error"
                      : req.status === ReturnStatus.REFUNDED
                      ? "info"
                      : "warning"
                  }
                  size="small"
                />
              </Box>
            </Paper>
          ))}
        </div>
      )}
    </div>
  );
}

export default Returns;

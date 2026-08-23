import { useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@mui/material";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";

import { ReturnApi } from "../../api/returnApi";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { StatusPill } from "../../components/DataTable";
import { ReturnStatus } from "../../types/returnRequest";
import { formatPrice } from "../../utils/cart";

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: ReturnStatus.REQUESTED, label: "Requested" },
  { key: ReturnStatus.APPROVED, label: "Approved" },
  { key: ReturnStatus.REFUNDED, label: "Refunded" },
  { key: ReturnStatus.REJECTED, label: "Rejected" },
];

function Returns() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const { data: returnRequests, isLoading } = useQuery(
    "myReturnRequests",
    ReturnApi.getMyReturnRequests
  );

  const all = returnRequests ?? [];
  const visible = filter ? all.filter((r) => r.status === filter) : all;
  const countFor = (key: string) =>
    key ? all.filter((r) => r.status === key).length : all.length;

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Returns"
        subtitle="Track every return request and its refund. Start a new one from an order's detail page."
        actions={
          <button onClick={() => navigate("/orders")} className="secondary-button !py-2">
            View orders
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={110} className="!rounded-lg" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<AssignmentReturnOutlinedIcon fontSize="large" />}
            title="No returns yet"
            subtitle="Need to send something back? Open the order, pick the item and request a return — you have 7 days from delivery."
            action={
              <button onClick={() => navigate("/orders")} className="primary-button">
                View orders
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line">
            {FILTERS.map((f) => (
              <button
                key={f.key || "all"}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 border-b-2 py-3 text-xs font-semibold uppercase tracking-[0.08em] ${filter === f.key ? "border-brand text-brand" : "border-transparent text-ink-muted"}`}
              >
                {f.label}
                <span className={"ml-1 text-ink-muted"}>
                  {countFor(f.key)}
                </span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<AssignmentReturnOutlinedIcon fontSize="large" />}
                title="Nothing in this status"
                subtitle="Try a different filter to see your other return requests."
                action={
                  <button className="secondary-button" onClick={() => setFilter("")}>
                    Show all
                  </button>
                }
              />
            </div>
          ) : (
            <ul className="border-t border-ink">
              {visible.map((req) => (
                <li key={req.id} className="border-b border-line py-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-xl text-ink">
                        Return{" "}
                        <span className="font-mono text-xs text-ink-soft">#{req.id}</span>
                      </p>
                      <button
                        onClick={() => navigate(`/orderDetail/${req.orderId}`)}
                        className="mt-0.5 text-xs font-semibold text-brand hover:underline"
                      >
                        Order #{req.orderId}
                      </button>
                    </div>
                    <StatusPill value={req.status} />
                  </div>

                  <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-3 sm:justify-start">
                      <dt className="text-ink-muted sm:w-24">Quantity</dt>
                      <dd className="font-semibold text-ink">{req.quantity}</dd>
                    </div>
                    {req.reason && (
                      <div className="flex justify-between gap-3 sm:justify-start">
                        <dt className="shrink-0 text-ink-muted sm:w-24">Reason</dt>
                        <dd className="text-right text-ink sm:text-left">{req.reason}</dd>
                      </div>
                    )}
                    {req.refundAmount != null && req.status === ReturnStatus.REFUNDED && (
                      <>
                        <div className="flex justify-between gap-3 sm:justify-start">
                          <dt className="text-ink-muted sm:w-24">Refunded</dt>
                          <dd className="font-semibold text-state-success">
                            {formatPrice(req.refundAmount)}
                          </dd>
                        </div>
                        {req.refundTransactionId && (
                          <div className="flex justify-between gap-3 sm:justify-start">
                            <dt className="shrink-0 text-ink-muted sm:w-24">Reference</dt>
                            <dd className="truncate font-mono text-xs text-ink-soft">
                              {req.refundTransactionId}
                            </dd>
                          </div>
                        )}
                      </>
                    )}
                  </dl>

                  {req.rejectionReason && (
                    <p className="mt-4 border border-state-danger/30 bg-state-danger-soft px-4 py-2.5 text-xs text-state-danger-on">
                      <span className="font-bold">Rejected:</span> {req.rejectionReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default Returns;

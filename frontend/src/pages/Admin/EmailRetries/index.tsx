import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import { Chip } from "@mui/material";
import { useState } from "react";
import { useQuery } from "react-query";

import { EmailRetryApi } from "../../../api/emailRetryApi";
import DataTable, { DataColumn } from "../../../components/DataTable";
import EmptyState from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import { EmailRetryAdmin, EmailRetryStatus } from "../../../types/emailRetry";

const FILTERS: EmailRetryStatus[] = ["DEAD", "PENDING"];

const columns: DataColumn<EmailRetryAdmin>[] = [
  {
    id: "createdAt",
    label: "Created",
    minWidth: 175,
    render: (item) => new Date(item.createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  },
  {
    id: "attempts",
    label: "Attempts",
    align: "right",
    minWidth: 95,
    render: (item) => <span className="font-semibold">{item.attempts}</span>,
  },
  {
    id: "lastAttemptAt",
    label: "Last attempt",
    minWidth: 175,
    hideBelow: "lg",
    render: (item) => item.lastAttemptAt
      ? new Date(item.lastAttemptAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : <span className="text-ink-muted">Not attempted</span>,
  },
  {
    id: "nextAttemptAt",
    label: "Next retry",
    minWidth: 175,
    render: (item) => item.status === "DEAD"
      ? <span className="text-state-danger-on">Manual review</span>
      : new Date(item.nextAttemptAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
  },
  {
    id: "status",
    label: "Status",
    minWidth: 110,
    render: (item) => (
      <Chip
        size="small"
        label={item.status}
        className={item.status === "DEAD"
          ? "!rounded-none !bg-state-danger-soft !font-semibold !text-state-danger-on"
          : "!rounded-none !bg-state-warning-soft !font-semibold !text-state-warning-on"}
      />
    ),
  },
];

export default function EmailRetriesPage() {
  const [status, setStatus] = useState<EmailRetryStatus>("DEAD");
  const { data = [], isLoading, isError } = useQuery(
    ["admin:email-retries", status],
    () => EmailRetryApi.list(status),
    { retry: false, refetchInterval: 60_000 }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Email delivery"
        subtitle="Delivery metadata only — email contents and recipients remain encrypted and private."
      />

      <div className="border-y border-line bg-canvas px-4 py-4 text-sm leading-relaxed text-ink-soft">
        Dead retries require manual review of SMTP/provider health. The admin console cannot read or replay the encrypted message body.
      </div>

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
            {item === "DEAD" ? "Needs review" : "Retrying"}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="border-y border-state-danger/40 bg-state-danger-soft/30 px-4 py-5 text-sm text-state-danger-on">
          Could not load email delivery metadata. Try again in a moment.
        </div>
      ) : isLoading ? (
        <SkeletonRows rows={5} columns={5} />
      ) : data.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<MarkEmailUnreadOutlinedIcon fontSize="large" />}
            title={status === "DEAD" ? "No emails need manual review" : "No email retries pending"}
            subtitle="Successful messages are removed from the retry outbox after delivery."
          />
        </div>
      ) : (
        <DataTable
          rows={data}
          columns={columns}
          getRowId={(item) => item.id}
          caption={`${data.length} ${status.toLowerCase()} delivery record${data.length === 1 ? "" : "s"}`}
        />
      )}
    </div>
  );
}

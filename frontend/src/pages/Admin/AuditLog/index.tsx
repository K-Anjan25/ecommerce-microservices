import { useQuery } from "react-query";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PageHeader from "../../../components/PageHeader";
import DataTable, { DataColumn } from "../../../components/DataTable";
import EmptyState from "../../../components/EmptyState";
import SkeletonRows from "../../../components/SkeletonRows";
import { AuditApi } from "../../../api/auditApi";
import { AuditLogEntry } from "../../../types/audit";

const readable = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

const columns: DataColumn<AuditLogEntry>[] = [
  {
    id: "createdAt",
    label: "When",
    minWidth: 170,
    render: (entry) => new Date(entry.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
  },
  {
    id: "action",
    label: "Action",
    minWidth: 190,
    render: (entry) => <span className="font-semibold text-ink">{readable(entry.action)}</span>,
  },
  { id: "source", label: "Area", minWidth: 100 },
  { id: "actorId", label: "Actor", minWidth: 190, mono: true, hideBelow: "lg" },
  {
    id: "targetId",
    label: "Target",
    minWidth: 190,
    mono: true,
    render: (entry) => `${entry.targetType} · ${entry.targetId}`,
  },
  {
    id: "details",
    label: "Details",
    minWidth: 180,
    hideBelow: "xl",
    render: (entry) => entry.details || <span className="text-ink-muted">—</span>,
  },
];

export default function AuditLogPage() {
  const { data = [], isLoading } = useQuery("admin:audit-log", AuditApi.getAuditLog, {
    retry: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Audit log"
        subtitle="The latest administrator mutations across identity, catalog and commerce."
      />
      {isLoading ? (
        <SkeletonRows rows={8} columns={6} />
      ) : data.length === 0 ? (
        <div className="border-t border-ink">
          <EmptyState
            icon={<HistoryOutlinedIcon fontSize="large" />}
            title="No administrator activity yet"
            subtitle="Product, storefront, staff and return mutations will be recorded here."
          />
        </div>
      ) : (
        <DataTable
          rows={data}
          columns={columns}
          getRowId={(entry) => `${entry.source}-${entry.id}`}
          caption={`${data.length} recent event${data.length === 1 ? "" : "s"}`}
          dense
        />
      )}
    </div>
  );
}

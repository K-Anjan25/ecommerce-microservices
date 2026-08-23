import React from "react";
import TablePagination from "@mui/material/TablePagination";

export type DataColumn<T> = {
  id: string;
  label: string;
  align?: "left" | "right" | "center";
  minWidth?: number;
  /** Render ids / SKUs / amounts in the mono face. */
  mono?: boolean;
  /** Hide this column below the given breakpoint (desktop table only). */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  /** Custom cell. Falls back to `row[id]`. */
  render?: (row: T) => React.ReactNode;
  /** Drop the column from the stacked mobile card. */
  hideOnCard?: boolean;
};

export interface DataTableProps<T> {
  rows: T[] | undefined;
  columns: readonly DataColumn<T>[];
  getRowId: (row: T) => string;
  /** Row-level actions, rendered in a right-aligned trailing column. */
  actions?: (row: T) => React.ReactNode;
  actionsLabel?: string;
  onRowClick?: (row: T) => void;
  /** Pagination — omit `page` to render the table without a footer. */
  page?: number;
  itemsPerPage?: number;
  totalSize?: number;
  onPageChange?: any;
  onItemsPerPageChange?: any;
  /** Small caption above the table body, e.g. "12 products". */
  caption?: React.ReactNode;
  dense?: boolean;
}

const hideClass = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

/**
 * DataTable — wireframe 05, "recent orders" density.
 *
 * One table primitive for the whole admin: full-bleed inside its panel,
 * sticky uppercase-eyebrow header, hairline rows, and — below `md` — a stacked
 * card list instead of a horizontally-scrolling table, because a 7-column admin
 * table on a phone is unusable.
 */
function DataTable<T>({
  rows,
  columns,
  getRowId,
  actions,
  actionsLabel = "Actions",
  onRowClick,
  page,
  itemsPerPage,
  totalSize,
  onPageChange,
  onItemsPerPageChange,
  caption,
  dense = false,
}: DataTableProps<T>) {
  const cell = (row: T, col: DataColumn<T>) =>
    col.render ? col.render(row) : ((row as any)[col.id] as React.ReactNode);

  const rowPad = dense ? "py-2" : "py-3";

  return (
    <div className="panel overflow-hidden">
      {caption && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <span className="text-xs font-semibold text-ink-soft">{caption}</span>
        </div>
      )}

      {/* ── desktop / tablet: real table ─────────────────────────────── */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-canvas">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  style={{ minWidth: col.minWidth }}
                  className={`whitespace-nowrap border-b border-line px-4 py-2.5 text-eyebrow font-bold uppercase text-ink-muted ${
                    alignClass[col.align ?? "left"]
                  } ${col.hideBelow ? hideClass[col.hideBelow] : ""}`}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th
                  scope="col"
                  className="whitespace-nowrap border-b border-line px-4 py-2.5 text-right text-eyebrow font-bold uppercase text-ink-muted"
                >
                  {actionsLabel}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows?.map((row) => (
              <tr
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter") onRowClick(row);
                      }
                    : undefined
                }
                className={`group border-b border-line/70 transition last:border-0 ${
                  onRowClick ? "cursor-pointer hover:bg-brand-tint" : "hover:bg-canvas"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={`px-4 ${rowPad} align-middle text-ink ${
                      alignClass[col.align ?? "left"]
                    } ${col.mono ? "font-mono text-xs text-ink-soft" : ""} ${
                      col.hideBelow ? hideClass[col.hideBelow] : ""
                    }`}
                  >
                    {cell(row, col)}
                  </td>
                ))}
                {actions && (
                  <td
                    className={`px-4 ${rowPad} text-right`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── mobile: stacked cards ────────────────────────────────────── */}
      <ul className="divide-y divide-line md:hidden">
        {rows?.map((row) => {
          const [primary, ...rest] = columns.filter((c) => !c.hideOnCard);
          return (
            <li key={getRowId(row)}>
              <div
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`p-4 ${onRowClick ? "cursor-pointer active:bg-brand-tint" : ""}`}
              >
                <p className="font-heading text-sm font-bold text-ink">{cell(row, primary)}</p>
                <dl className="mt-2 space-y-1.5">
                  {rest.map((col) => (
                    <div key={col.id} className="flex items-start justify-between gap-3 text-xs">
                      <dt className="shrink-0 font-semibold text-ink-muted">{col.label}</dt>
                      <dd
                        className={`min-w-0 text-right text-ink ${
                          col.mono ? "font-mono text-ink-soft" : ""
                        }`}
                      >
                        {cell(row, col)}
                      </dd>
                    </div>
                  ))}
                </dl>
                {actions && (
                  <div
                    className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(row)}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* ── footer ───────────────────────────────────────────────────── */}
      {page !== undefined && itemsPerPage !== undefined && (
        <div className="border-t border-line">
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalSize || 0}
            rowsPerPage={itemsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onItemsPerPageChange}
            sx={{
              ".MuiTablePagination-toolbar": { minHeight: 52, paddingLeft: 2 },
              ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                fontSize: 12,
                color: "#5A5F6E",
                margin: 0,
              },
            }}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;

/* ── small shared cell helpers ────────────────────────────────────────── */

export function TableIconButton({
  label,
  onClick,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "neutral" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-xs border border-line bg-paper transition ${
        tone === "danger"
          ? "text-ink-soft hover:border-state-danger hover:bg-rose-50 hover:text-state-danger"
          : "text-ink-soft hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-brand-soft text-brand",
  PAID: "bg-emerald-50 text-emerald-700",
  SHIPPED: "bg-sky-50 text-sky-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLING: "bg-orange-50 text-orange-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-sky-50 text-sky-700",
  REQUESTED: "bg-amber-50 text-amber-700",
  REJECTED: "bg-rose-50 text-rose-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  DISABLED: "bg-rose-50 text-rose-700",
};

export function StatusPill({ value }: { value: string }) {
  const key = (value ?? "").toUpperCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wide ${
        STATUS_TONE[key] ?? "bg-sunken text-ink-soft"
      }`}
    >
      {key.replace(/_/g, " ") || "—"}
    </span>
  );
}

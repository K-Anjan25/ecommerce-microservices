import DeleteForeverIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/EditOutlined";
import DataTable, { DataColumn, StatusPill, TableIconButton } from "../../DataTable";
import { Column } from "../../../types/table";
import type { TableRow as TableRowType } from "../../../types/table";

export interface TableProps {
  rows: TableRowType[] | undefined;
  columns: readonly Column[];
  totalSize: number | undefined;
  editItem: (row: any) => void;
  deleteItem: (id: string) => void;
  handleChangePage: any;
  handleChangeItemsPerPage: any;
  itemsPerPage: number;
  page: number;
}

/** Columns whose values should read as status pills / monospace ids. */
const STATUS_IDS = new Set(["orderStatus", "status"]);
const MONO_IDS = new Set(["id"]);

export const toDataColumns = (columns: readonly Column[]): DataColumn<TableRowType>[] =>
  columns.map((c, i) => ({
    id: String(c.id),
    label: c.label,
    align: c.align,
    minWidth: c.minWidth,
    mono: MONO_IDS.has(String(c.id)),
    // keep the first two columns at every width; push the rest behind breakpoints
    hideBelow: i > 2 ? "lg" : undefined,
    render: STATUS_IDS.has(String(c.id))
      ? (row) => <StatusPill value={String((row as any)[c.id] ?? "")} />
      : undefined,
  }));

/**
 * Admin table with per-row edit/delete. Thin adapter over DataTable so the
 * admin has exactly one table look (wireframe 05).
 */
function TableWithActions({
  deleteItem,
  editItem,
  rows,
  totalSize,
  handleChangePage,
  handleChangeItemsPerPage,
  itemsPerPage,
  page,
  columns,
}: TableProps) {
  return (
    <DataTable<TableRowType>
      rows={rows}
      columns={toDataColumns(columns)}
      getRowId={(row) => row.id}
      caption={
        totalSize !== undefined
          ? `${totalSize} record${totalSize === 1 ? "" : "s"}`
          : undefined
      }
      actions={(row) => (
        <>
          <TableIconButton label="Edit" onClick={() => editItem(row)}>
            <EditIcon sx={{ fontSize: 16 }} />
          </TableIconButton>
          <TableIconButton label="Delete" tone="danger" onClick={() => deleteItem(row.id)}>
            <DeleteForeverIcon sx={{ fontSize: 16 }} />
          </TableIconButton>
        </>
      )}
      page={page}
      itemsPerPage={itemsPerPage}
      totalSize={totalSize}
      onPageChange={handleChangePage}
      onItemsPerPageChange={handleChangeItemsPerPage}
    />
  );
}

export default TableWithActions;

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DataTable from "../../DataTable";
import { toDataColumns } from "../TableWithActions";
import { Column } from "../../../types/table";
import type { TableRow as TableRowType } from "../../../types/table";

export interface TableProps {
  rows: TableRowType[] | undefined;
  columns: readonly Column[];
  totalSize?: number | undefined;
  handleChangePage?: any;
  handleChangeItemsPerPage?: any;
  itemsPerPage?: number;
  page?: number;
  onClickDetail?: (tableRow: TableRowType) => void;
}

/**
 * Admin table whose rows open a detail view. Same primitive as
 * TableWithActions, with a trailing affordance instead of edit/delete.
 */
function TableWithDetail({
  rows,
  totalSize,
  handleChangePage,
  handleChangeItemsPerPage,
  itemsPerPage,
  page,
  columns,
  onClickDetail,
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
      onRowClick={onClickDetail}
      actions={
        onClickDetail
          ? () => (
              <span className="text-ink-muted transition group-hover:text-brand">
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              </span>
            )
          : undefined
      }
      actionsLabel=""
      page={page}
      itemsPerPage={itemsPerPage}
      totalSize={totalSize}
      onPageChange={handleChangePage}
      onItemsPerPageChange={handleChangeItemsPerPage}
    />
  );
}

export default TableWithDetail;

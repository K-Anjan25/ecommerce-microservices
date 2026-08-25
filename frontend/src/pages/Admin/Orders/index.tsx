import { useState, useMemo } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { Box, Chip, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { OrderApi } from "../../../api/orderApi";
import EmptyState from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import TableWithDetail from "../../../components/Table/TableWithDetail";
import { ORDER_COLUMNS } from "../../../constants/table";
import usePagination from "../../../hooks/usePagination";
import { OrderRow, TableRow } from "../../../types/table";
import { formatDate } from "../../../utils/date";

const FILTERS = ["ALL", "PENDING", "PAID", "APPROVED", "CANCELLED", "REFUNDED"] as const;
type Filter = (typeof FILTERS)[number];

function Orders() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const { page, handleChangePage, handleChangeItemsPerPage, itemsPerPage } =
    usePagination();

  const { data: orders, isLoading } = useQuery(
    ["admin:orders", page, itemsPerPage],
    () => OrderApi.getOrders(page, itemsPerPage)
  );

  const filteredOrders = useMemo(() => {
    const list = orders?.data ?? [];
    return list.filter((order) => {
      const matchesFilter = filter === "ALL" || order.orderStatus === filter;
      const matchesSearch =
        !search.trim() ||
        order.id.toLowerCase().includes(search.trim().toLowerCase()) ||
        (order.customerId && order.customerId.toLowerCase().includes(search.trim().toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  const orderRows = filteredOrders.map(
    (order) =>
      new OrderRow(
        order.id,
        order.items.length,
        order.orderStatus,
        formatDate(order.createdDate)
      )
  );

  const counts = useMemo(() => {
    return (orders?.data ?? []).reduce<Record<string, number>>((acc, o) => {
      acc[o.orderStatus] = (acc[o.orderStatus] ?? 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const navigateDetailOrder = (orderRow: TableRow) => {
    const order = orders?.data.find((order) => order.id === orderRow.id);
    navigate(`/admin/orderDetail/${order?.id}`, {
      state: order,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Review customer orders and manage their fulfillment status."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box className="flex flex-wrap gap-4 border-b border-line pb-1">
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={
                f === "ALL"
                  ? `All (${orders?.totalSize ?? orders?.data?.length ?? 0})`
                  : `${f} (${counts[f] ?? 0})`
              }
              onClick={() => setFilter(f)}
              className={`!rounded-none !border-b-2 !bg-transparent !px-0 !font-semibold ${
                filter === f
                  ? "!border-brand !text-brand"
                  : "!border-transparent !text-ink-muted hover:!text-ink"
              }`}
            />
          ))}
        </Box>

        <div className="w-full sm:w-64">
          <TextField
            size="small"
            fullWidth
            placeholder="Search order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" className="text-ink-muted" />
                </InputAdornment>
              ),
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonRows rows={5} columns={ORDER_COLUMNS.length} />
      ) : orderRows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<ReceiptLongOutlinedIcon fontSize="large" />}
            title={filter === "ALL" && !search ? "No orders yet" : "No matching orders"}
            subtitle={
              filter === "ALL" && !search
                ? "When customers place orders, they will show up here."
                : "Try adjusting your filter or search criteria."
            }
          />
        </div>
      ) : (
        <TableWithDetail
          rows={orderRows}
          columns={ORDER_COLUMNS}
          totalSize={search || filter !== "ALL" ? orderRows.length : orders?.totalSize}
          handleChangePage={handleChangePage}
          handleChangeItemsPerPage={handleChangeItemsPerPage}
          page={page}
          itemsPerPage={itemsPerPage}
          onClickDetail={navigateDetailOrder}
        />
      )}
    </div>
  );
}

export default Orders;

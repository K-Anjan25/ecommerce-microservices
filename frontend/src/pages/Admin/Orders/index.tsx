import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
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

function Orders() {
  const navigate = useNavigate();
  const { page, handleChangePage, handleChangeItemsPerPage, itemsPerPage } =
    usePagination();

  const { data: orders, isLoading } = useQuery(
    ["admin:orders", page, itemsPerPage],
    () => OrderApi.getOrders(page, itemsPerPage)
  );

  const orderRows = orders?.data.map(
    (order) =>
      new OrderRow(
        order.id,
        order.items.length,
        order.orderStatus,
        formatDate(order.createdDate)
      )
  );

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
        subtitle="Review customer orders and their status."
      />
      {isLoading ? (
        <SkeletonRows rows={5} columns={ORDER_COLUMNS.length} />
      ) : orders?.data.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<ReceiptLongOutlinedIcon fontSize="large" />}
            title="No orders yet"
            subtitle="When customers place orders, they will show up here."
          />
        </div>
      ) : (
        <TableWithDetail
          rows={orderRows}
          columns={ORDER_COLUMNS}
          totalSize={orders?.totalSize}
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

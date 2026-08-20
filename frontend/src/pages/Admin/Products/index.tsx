import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { ProductApi } from "../../../api/productApi";
import EmptyState from "../../../components/EmptyState";
import Modal from "../../../components/Modal";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import TableWithActions from "../../../components/Table/TableWithActions";
import { PRODUCT_ADMIN_PARAM } from "../../../constants/product";
import { PRODUCT_COLUMNS } from "../../../constants/table";
import usePagination from "../../../hooks/usePagination";
import { ProductRow } from "../../../types/table";
import { formatDate } from "../../../utils/date";
import { formatPrice } from "../../../utils/cart";
import { showSuccess } from "../../../utils/showSuccess";

function Products() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [productId, setProductId] = useState<string>();
  const { page, handleChangePage, handleChangeItemsPerPage, itemsPerPage } =
    usePagination();

  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery(
    ["admin:products", page, itemsPerPage],
    () =>
      ProductApi.getProductsByPagination({
        ...PRODUCT_ADMIN_PARAM,
        pageNo: page,
        pageSize: itemsPerPage,
      })
  );

  const productRows = products?.data.map(
    (product) =>
      new ProductRow(
        product.id,
        product.name,
        product.category.name,
        formatPrice(product.unitPrice),
        formatDate(product.createdDate)
      )
  );

  const deleteItem = (id: string) => {
    setProductId(id);
    setModalOpen(true);
  };

  const handleClickModal = () => {
    deleteMutation.mutate(productId!);
  };

  const editItem = (productRow: ProductRow) => {
    const product = products?.data.find((item) => item.id === productRow.id);
    navigate(`/admin/addEditProduct/${productRow.id}`, {
      state: product,
    });
  };

  const deleteMutation = useMutation(ProductApi.deleteProduct, {
    onSuccess: () => {
      showSuccess("Product has been deleted successfully");
      queryClient.invalidateQueries("admin:products");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Create, edit and remove products from your store."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className="!bg-brand !text-paper hover:!bg-brand-main"
            onClick={() => navigate("/admin/addEditProduct")}
          >
            Create product
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonRows rows={5} columns={PRODUCT_COLUMNS.length + 2} />
      ) : products?.data.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<Inventory2OutlinedIcon fontSize="large" />}
            title="No products yet"
            subtitle="Create your first product to start selling."
            action={
              <Button
                variant="contained"
                className="!bg-brand !text-paper hover:!bg-brand-main"
                onClick={() => navigate("/admin/addEditProduct")}
              >
                Create product
              </Button>
            }
          />
        </div>
      ) : (
        <TableWithActions
          rows={productRows}
          columns={PRODUCT_COLUMNS}
          deleteItem={deleteItem}
          editItem={editItem}
          totalSize={products?.totalSize}
          handleChangePage={handleChangePage}
          handleChangeItemsPerPage={handleChangeItemsPerPage}
          page={page}
          itemsPerPage={itemsPerPage}
        />
      )}

      <Modal
        open={modalOpen}
        setOpen={setModalOpen}
        onClickModal={handleClickModal}
        title="Product delete action"
      >
        Are you sure you want to delete this product?
      </Modal>
    </div>
  );
}

export default Products;

import { Button, TextField, InputAdornment, Box, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { useState, useMemo } from "react";
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
import ProductCsvTools from "./ProductCsvTools";

const STOCK_FILTERS = ["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const;
type StockFilter = (typeof STOCK_FILTERS)[number];

function Products() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [productId, setProductId] = useState<string>();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
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

  const filteredProducts = useMemo(() => {
    const list = products?.data ?? [];
    return list.filter((product) => {
      const stock = product.quantityInStock ?? 0;
      let matchesStock = true;
      if (stockFilter === "IN_STOCK") matchesStock = stock > 5;
      else if (stockFilter === "LOW_STOCK") matchesStock = stock > 0 && stock <= 5;
      else if (stockFilter === "OUT_OF_STOCK") matchesStock = stock <= 0;

      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.category?.name && product.category.name.toLowerCase().includes(term)) ||
        (product.brand && product.brand.toLowerCase().includes(term));

      return matchesStock && matchesSearch;
    });
  }, [products, stockFilter, search]);

  const productRows = filteredProducts.map(
    (product) =>
      new ProductRow(
        product.id,
        product.name,
        product.category?.name || "General",
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
          <>
            <ProductCsvTools />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/admin/addEditProduct")}
            >
              Create product
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box className="flex flex-wrap gap-4 border-b border-line pb-1">
          {STOCK_FILTERS.map((sf) => (
            <Chip
              key={sf}
              label={
                sf === "ALL"
                  ? "All stock"
                  : sf === "IN_STOCK"
                  ? "In stock"
                  : sf === "LOW_STOCK"
                  ? "Low stock (≤5)"
                  : "Out of stock"
              }
              onClick={() => setStockFilter(sf)}
              className={`!rounded-none !border-b-2 !bg-transparent !px-0 !font-semibold ${
                stockFilter === sf
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
            placeholder="Search products…"
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
        <SkeletonRows rows={5} columns={PRODUCT_COLUMNS.length + 2} />
      ) : productRows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<Inventory2OutlinedIcon fontSize="large" />}
            title={stockFilter === "ALL" && !search ? "No products yet" : "No matching products"}
            subtitle={
              stockFilter === "ALL" && !search
                ? "Create your first product to start selling."
                : "Try adjusting your search or stock filter."
            }
            action={
              stockFilter === "ALL" && !search ? (
                <Button
                  variant="contained"
                  onClick={() => navigate("/admin/addEditProduct")}
                >
                  Create product
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <TableWithActions
          rows={productRows}
          columns={PRODUCT_COLUMNS}
          deleteItem={deleteItem}
          editItem={editItem}
          totalSize={search || stockFilter !== "ALL" ? productRows.length : products?.totalSize}
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

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
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import LoadingButton from "@mui/lab/LoadingButton";
import MenuItem from "@mui/material/MenuItem";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { Category as CategoryType } from "../../../types/category";
import { CategoryApi } from "../../../api/categoryApi";
import { showError } from "../../../utils/showError";

const STOCK_FILTERS = ["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const;
type StockFilter = (typeof STOCK_FILTERS)[number];

function Products() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [productId, setProductId] = useState<string>();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<number | "">("");
  const [bulkPercent, setBulkPercent] = useState("");
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

  // ── Bulk operations ────────────────────────────────────────────────────
  const { data: categories } = useQuery(["admin-category:categories"], () =>
    CategoryApi.getCategories()
  );

  const clearSelection = () => setSelectedIds(new Set());
  const toggleRow = (id: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAllOnPage = () =>
    setSelectedIds((current) => {
      const allOnPage = productRows.every((row) => current.has(row.id));
      const next = new Set(current);
      productRows.forEach((row) => (allOnPage ? next.delete(row.id) : next.add(row.id)));
      return next;
    });

  const afterBulk = (message: string) => {
    showSuccess(message);
    clearSelection();
    queryClient.invalidateQueries("admin:products");
  };
  const bulkError = (e: unknown) => {
    const response = (e as { response?: { data?: { message?: string } | string } })?.response?.data;
    showError(typeof response === "string" ? response : response?.message ?? "Bulk action failed");
  };

  const bulkMoveMutation = useMutation(
    () => ProductApi.bulkMoveToCategory(Array.from(selectedIds), bulkCategoryId as number),
    { onSuccess: (r) => afterBulk(`${r.updated} product(s) moved`), onError: bulkError }
  );
  const bulkDeleteMutation = useMutation(() => ProductApi.bulkDelete(Array.from(selectedIds)), {
    onSuccess: (r) => afterBulk(`${r.deleted} product(s) deleted`),
    onError: bulkError,
  });

  const runBulkPrice = (direction: 1 | -1) => {
    const value = Number(bulkPercent);
    if (!value || value <= 0 || selectedIds.size === 0) return;
    ProductApi.bulkAdjustPrice(Array.from(selectedIds), direction * value)
      .then((r) => afterBulk(`${r.updated} product(s) repriced by ${direction * value}%`))
      .catch(bulkError);
  };

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
        <>
        {selectedIds.size > 0 && (
          <Paper className="flex flex-wrap items-center gap-3 border-l-4 !border-l-brand p-4">
            <span className="text-sm font-bold text-ink">{selectedIds.size} selected</span>
            <Button size="small" onClick={toggleAllOnPage}>
              Select all on page
            </Button>
            <TextField
              select
              size="small"
              label="Move to category"
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value as number | "")}
              className="min-w-[12rem]"
            >
              {(categories ?? []).map((category: CategoryType) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <LoadingButton
              size="small"
              variant="outlined"
              disabled={bulkCategoryId === ""}
              loading={bulkMoveMutation.isLoading}
              onClick={() => bulkMoveMutation.mutate()}
            >
              Move
            </LoadingButton>
            <TextField
              size="small"
              type="number"
              label="Price ±%"
              value={bulkPercent}
              onChange={(e) => setBulkPercent(e.target.value)}
              className="w-28"
              inputProps={{ min: 1, max: 100 }}
            />
            <Button size="small" variant="outlined" onClick={() => runBulkPrice(-1)}>
              Discount
            </Button>
            <Button size="small" variant="outlined" onClick={() => runBulkPrice(1)}>
              Increase
            </Button>
            <LoadingButton
              size="small"
              color="error"
              variant="contained"
              startIcon={<DeleteOutlineOutlinedIcon />}
              loading={bulkDeleteMutation.isLoading}
              onClick={() => bulkDeleteMutation.mutate()}
            >
              Delete
            </LoadingButton>
            <Button size="small" onClick={clearSelection}>
              Clear
            </Button>
          </Paper>
        )}
        <TableWithActions
          rows={productRows}
          columns={[
            {
              id: "select",
              label: "",
              render: (row) => (
                <Checkbox
                  size="small"
                  aria-label={`Select ${row.name}`}
                  checked={selectedIds.has(row.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleRow(row.id)}
                />
              ),
            },
            ...PRODUCT_COLUMNS,
          ]}
          deleteItem={deleteItem}
          editItem={editItem}
          totalSize={search || stockFilter !== "ALL" ? productRows.length : products?.totalSize}
          handleChangePage={handleChangePage}
          handleChangeItemsPerPage={handleChangeItemsPerPage}
          page={page}
          itemsPerPage={itemsPerPage}
        />
        </>
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

import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem as MuiMenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { CategoryApi } from "../../../api/categoryApi";
import { ProductApi } from "../../../api/productApi";
import { PRODUCT_PARAM } from "../../../constants/product";
import EmptyState from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";
import { Category } from "../../../types/category";

/** Rows flattened from the category tree (max two levels, Amazon-style). */
interface CategoryRow {
  category: Category;
  depth: number;
}

const bySortOrder = (a: Category, b: Category) =>
  (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
  a.name.localeCompare(b.name);

const errorMessage = (e: unknown): string => {
  const response = (e as { response?: { data?: { message?: string } | string } })?.response?.data;
  if (typeof response === "string") return response;
  return response?.message ?? "Something went wrong — please try again.";
};

function Categories() {
  const queryClient = useQueryClient();

  // ── Create form state ──────────────────────────────────────────────────
  const [categoryName, setCategoryName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");

  // ── Row menu / edit dialog / delete confirm state ──────────────────────
  const [menuAnchor, setMenuAnchor] = useState<{ category: Category; el: HTMLElement } | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState<number | "">("");
  const [deleting, setDeleting] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery(["admin-category:categories"], () =>
    CategoryApi.getCategories()
  );

  // Product counts per category (single lightweight fetch, admin-only page).
  const { data: productsData } = useQuery(
    ["admin-category:productCounts"],
    () =>
      ProductApi.getProducts({
        ...PRODUCT_PARAM,
        size: 500,
        page: 0,
        filter: "",
        searchTerm: "",
      }),
    { staleTime: 60 * 1000, retry: false }
  );

  /** Products per category, keyed by category name (server facet counts first). */
  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();
    productsData?.facets?.categories?.forEach((facet) => {
      counts.set(facet.value, facet.count);
    });
    if (counts.size === 0) {
      productsData?.content?.forEach((product) => {
        if (product?.categoryName) {
          counts.set(product.categoryName, (counts.get(product.categoryName) ?? 0) + 1);
        }
      });
    }
    return counts;
  }, [productsData]);

  const rows = useMemo<CategoryRow[]>(() => {
    const all = categories ?? [];
    const roots = all.filter((c) => c.parentId == null).sort(bySortOrder);
    const flat: CategoryRow[] = [];
    roots.forEach((root) => {
      flat.push({ category: root, depth: 0 });
      all
        .filter((c) => c.parentId === root.id)
        .sort(bySortOrder)
        .forEach((child) => flat.push({ category: child, depth: 1 }));
    });
    // Orphans whose parent row is missing still need to be manageable.
    all
      .filter((c) => c.parentId != null && !roots.some((r) => r.id === c.parentId))
      .sort(bySortOrder)
      .forEach((orphan) => flat.push({ category: orphan, depth: 0 }));
    return flat;
  }, [categories]);

  const roots = useMemo(() => (categories ?? []).filter((c) => c.parentId == null).sort(bySortOrder), [
    categories,
  ]);

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const invalidate = () => {
    queryClient.invalidateQueries("admin-category:categories");
    queryClient.invalidateQueries("nav-categories");
  };

  const createMutation = useMutation(
    (payload: { name: string; parentId: number | null }) => CategoryApi.saveCategory(payload),
    {
      onSuccess: () => {
        setCategoryName("");
        setParentId("");
        showSuccess("Category has been created successfully");
        invalidate();
      },
      onError: (e) => showError(errorMessage(e)),
    }
  );

  const updateMutation = useMutation(
    (payload: { id: number; name: string; parentId: number | null }) =>
      CategoryApi.updateCategory(payload.id, { name: payload.name, parentId: payload.parentId }),
    {
      onSuccess: () => {
        setEditing(null);
        showSuccess("Category has been updated");
        invalidate();
      },
      onError: (e) => showError(errorMessage(e)),
    }
  );

  const deleteMutation = useMutation((id: number) => CategoryApi.deleteCategory(id), {
    onSuccess: () => {
      setDeleting(null);
      showSuccess("Category has been deleted");
      invalidate();
    },
    onError: (e) => {
      setDeleting(null);
      showError(errorMessage(e));
    },
  });

  const addCategory = () => {
    if (categoryName.trim()) {
      createMutation.mutate({ name: categoryName.trim(), parentId: parentId === "" ? null : parentId });
    }
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setEditName(category.name);
    setEditParentId(category.parentId ?? "");
    setMenuAnchor(null);
  };

  const saveEdit = () => {
    if (!editing || !editName.trim()) return;
    updateMutation.mutate({
      id: editing.id,
      name: editName.trim(),
      parentId: editParentId === "" ? null : editParentId,
    });
  };

  const deleteCount = deleting ? productCounts.get(deleting.name) ?? 0 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Organise products into browsable categories — rename, nest, reorder and retire them."
      />

      <Paper className="max-w-2xl p-6">
        <Typography className="mb-3 font-semibold text-ink">Add a category</Typography>
        <Box className="flex flex-col gap-2 sm:flex-row">
          <TextField
            fullWidth
            size="small"
            label="Category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <Select
            size="small"
            displayEmpty
            value={parentId}
            onChange={(e) => setParentId(e.target.value as number | "")}
            className="min-w-[11rem]"
            renderValue={(selected) =>
              String(selected) === "" ? (
                <span className="text-ink-muted">Top level</span>
              ) : (
                roots.find((r) => r.id === Number(selected))?.name ?? "Top level"
              )
            }
          >
            <MuiMenuItem value="">Top level</MuiMenuItem>
            {roots.map((root) => (
              <MuiMenuItem key={root.id} value={root.id}>
                {root.name}
              </MuiMenuItem>
            ))}
          </Select>
          <LoadingButton
            variant="contained"
            loading={createMutation.isLoading}
            disabled={!categoryName.trim()}
            onClick={addCategory}
            startIcon={<CategoryOutlinedIcon />}
            sx={{ whiteSpace: "nowrap" }}
          >
            Add
          </LoadingButton>
        </Box>
        <Typography className="mt-2 text-xs text-ink-muted">
          Add a top-level department, or pick a parent to create a subcategory.
        </Typography>
      </Paper>

      {isLoading ? (
        <SkeletonRows rows={4} columns={3} />
      ) : rows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<CategoryOutlinedIcon fontSize="large" />}
            title="No categories yet"
            subtitle="Add your first category above to get started."
          />
        </div>
      ) : (
        <Paper className="overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-line bg-brand-soft/40 px-5 py-3 text-[0.6875rem] font-bold uppercase tracking-wide text-ink-muted">
            <span>Category</span>
            <span className="hidden sm:block">Slug</span>
            <span className="text-center">Products</span>
            <span className="w-10" />
          </div>
          {rows.map(({ category, depth }) => (
            <div
              key={category.id}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-line px-5 py-3 last:border-b-0 transition hover:bg-brand-soft/20"
            >
              <Box className="flex min-w-0 items-center gap-1.5" style={{ paddingLeft: depth * 28 }}>
                {depth > 0 && (
                  <SubdirectoryArrowRightIcon className="text-ink-muted" sx={{ fontSize: 16 }} />
                )}
                <Box className="min-w-0">
                  <Typography className="truncate font-semibold text-ink">{category.name}</Typography>
                  {depth === 0 && (
                    <Typography className="text-[0.6875rem] text-ink-muted">
                      {(categories ?? []).some((c) => c.parentId === category.id)
                        ? "Department"
                        : "Top level"}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Typography className="hidden sm:block text-xs text-ink-muted">
                {category.slug ?? slugify(category.name)}
              </Typography>
              <Box className="text-center">
                <Chip
                  size="small"
                  label={productCounts.get(category.name) ?? 0}
                  className="!bg-brand-soft !font-bold !text-brand"
                />
              </Box>
              <IconButton
                size="small"
                aria-label={`Manage ${category.name}`}
                onClick={(e) => setMenuAnchor({ category, el: e.currentTarget })}
              >
                <MoreVertIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </div>
          ))}
        </Paper>
      )}

      {/* Row actions menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        slotProps={{ paper: { className: "!mt-1 !min-w-[160px] !rounded-xl !border !border-line !shadow-lift" } }}
      >
        <MuiMenuItem onClick={() => menuAnchor && openEdit(menuAnchor.category)}>
          <EditOutlinedIcon sx={{ fontSize: 18, mr: 1.2 }} /> Edit
        </MuiMenuItem>
        <MuiMenuItem
          onClick={() => {
            setDeleting(menuAnchor!.category);
            setMenuAnchor(null);
          }}
          className="!text-state-danger"
        >
          <DeleteOutlineOutlinedIcon sx={{ fontSize: 18, mr: 1.2 }} /> Delete
        </MuiMenuItem>
      </Menu>

      {/* Edit dialog */}
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle className="font-bold">Edit category</DialogTitle>
        <DialogContent className="space-y-4">
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Category name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Typography className="text-xs text-ink-muted">
            URL slug: <span className="font-semibold">{slugify(editName) || "—"}</span> (auto-generated)
          </Typography>
          <Select
            fullWidth
            size="small"
            displayEmpty
            value={editParentId}
            onChange={(e) => setEditParentId(e.target.value as number | "")}
            renderValue={(selected) =>
              String(selected) === "" ? (
                <span className="text-ink-muted">Top level</span>
              ) : (
                roots.find((r) => r.id === Number(selected))?.name ?? "Top level"
              )
            }
          >
            <MuiMenuItem value="">Top level</MuiMenuItem>
            {roots
              .filter((root) => root.id !== editing?.id)
              .map((root) => (
                <MuiMenuItem key={root.id} value={root.id}>
                  {root.name}
                </MuiMenuItem>
              ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <LoadingButton
            variant="contained"
            loading={updateMutation.isLoading}
            disabled={!editName.trim()}
            onClick={saveEdit}
          >
            Save changes
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} fullWidth maxWidth="xs">
        <DialogTitle className="font-bold">Delete “{deleting?.name}”?</DialogTitle>
        <DialogContent>
          {deleteCount > 0 ? (
            <Typography className="text-sm text-ink-soft">
              This category still has <strong>{deleteCount}</strong> product
              {deleteCount === 1 ? "" : "s"} assigned. Move or remove them first — the catalog never
              loses product associations by accident.
            </Typography>
          ) : (
            <Typography className="text-sm text-ink-soft">
              This will permanently remove the category. Products are not affected. This action cannot
              be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <LoadingButton
            color="error"
            variant="contained"
            loading={deleteMutation.isLoading}
            disabled={deleteCount > 0}
            onClick={() => deleting && deleteMutation.mutate(deleting.id)}
          >
            Delete category
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Categories;

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
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
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

const bySortOrder = (a: Category, b: Category) =>
  (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
  a.name.localeCompare(b.name);

const errorMessage = (e: unknown): string => {
  const response = (e as { response?: { data?: { message?: string } | string } })?.response?.data;
  if (typeof response === "string") return response;
  return response?.message ?? "Something went wrong — please try again.";
};

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Row model flattened from the (deep) tree, with depth + expand info. */
interface CategoryRow {
  category: Category;
  depth: number;
  hasChildren: boolean;
}

function Categories() {
  const queryClient = useQueryClient();

  // ── Create form ────────────────────────────────────────────────────────
  const [categoryName, setCategoryName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // ── Row menu / edit dialog / delete confirm ────────────────────────────
  const [menuAnchor, setMenuAnchor] = useState<{ category: Category; el: HTMLElement } | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState<number | "">("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [deleting, setDeleting] = useState<Category | null>(null);

  // ── Tree expansion + drag & drop ───────────────────────────────────────
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  const { data: categories, isLoading } = useQuery(["admin-category:categories"], () =>
    CategoryApi.getCategories()
  );

  // Product counts per category (server facet counts, name-keyed).
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

  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();
    productsData?.facets?.categories?.forEach((facet) => counts.set(facet.value, facet.count));
    if (counts.size === 0) {
      productsData?.content?.forEach((product) => {
        if (product?.categoryName) {
          counts.set(product.categoryName, (counts.get(product.categoryName) ?? 0) + 1);
        }
      });
    }
    return counts;
  }, [productsData]);

  const all = useMemo(() => [...(categories ?? [])].sort(bySortOrder), [categories]);
  const childrenOf = (pid: number | null) =>
    all.filter((c) => (c.parentId ?? null) === pid);

  /** Depth-first flatten honouring collapsed state. */
  const rows = useMemo<CategoryRow[]>(() => {
    const out: CategoryRow[] = [];
    const walk = (nodes: Category[], depth: number) => {
      nodes.forEach((node) => {
        const kids = childrenOf(node.id);
        out.push({ category: node, depth, hasChildren: kids.length > 0 });
        if (kids.length > 0 && !collapsed.has(node.id)) walk(kids, depth + 1);
      });
    };
    walk(childrenOf(null), 0);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, collapsed]);

  const isDescendant = (candidateId: number, ancestorId: number): boolean => {
    let cursor = all.find((c) => c.id === candidateId);
    const seen = new Set<number>();
    while (cursor?.parentId != null && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      if (cursor.parentId === ancestorId) return true;
      cursor = all.find((c) => c.id === cursor!.parentId);
    }
    return false;
  };

  const invalidate = () => {
    queryClient.invalidateQueries("admin-category:categories");
    queryClient.invalidateQueries("nav-categories");
  };

  const createMutation = useMutation(
    (payload: { name: string; parentId: number | null; description?: string; imageUrl?: string }) =>
      CategoryApi.saveCategory(payload),
    {
      onSuccess: () => {
        setCategoryName("");
        setParentId("");
        setDescription("");
        setImageUrl("");
        showSuccess("Category has been created successfully");
        invalidate();
      },
      onError: (e) => showError(errorMessage(e)),
    }
  );

  const updateMutation = useMutation(
    (payload: {
      id: number;
      name: string;
      parentId: number | null;
      description?: string | null;
      imageUrl?: string | null;
    }) =>
      CategoryApi.updateCategory(payload.id, {
        name: payload.name,
        parentId: payload.parentId,
        description: payload.description,
        imageUrl: payload.imageUrl,
      }),
    {
      onSuccess: () => {
        setEditing(null);
        showSuccess("Category has been updated");
        invalidate();
      },
      onError: (e) => showError(errorMessage(e)),
    }
  );

  const moveMutation = useMutation(
    (payload: { id: number; parentId: number | null; position: number }) =>
      CategoryApi.moveCategory(payload.id, payload.parentId, payload.position),
    {
      onSuccess: () => invalidate(),
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
      createMutation.mutate({
        name: categoryName.trim(),
        parentId: parentId === "" ? null : parentId,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
    }
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setEditName(category.name);
    setEditParentId(category.parentId ?? "");
    setEditDescription(category.description ?? "");
    setEditImageUrl(category.imageUrl ?? "");
    setMenuAnchor(null);
  };

  const saveEdit = () => {
    if (!editing || !editName.trim()) return;
    updateMutation.mutate({
      id: editing.id,
      name: editName.trim(),
      parentId: editParentId === "" ? null : editParentId,
      description: editDescription.trim() || null,
      imageUrl: editImageUrl.trim() || null,
    });
  };

  /** Reorder within current siblings by ±1. */
  const reorder = (category: Category, delta: number) => {
    const siblings = childrenOf(category.parentId ?? null);
    const index = siblings.findIndex((c) => c.id === category.id);
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;
    moveMutation.mutate({
      id: category.id,
      parentId: category.parentId ?? null,
      position: targetIndex > index ? targetIndex + 1 : targetIndex,
    });
  };

  /** Drop handlers: onto a row = nest under it; onto the root strip = top level. */
  const handleDrop = (target: Category | null) => {
    setDropTargetId(null);
    if (dragId == null) return;
    const dragged = all.find((c) => c.id === dragId);
    setDragId(null);
    if (!dragged) return;
    if (target) {
      if (dragged.id === target.id || isDescendant(target.id, dragged.id)) {
        showError("A category can't be dropped into its own subcategory.");
        return;
      }
      const siblingCount = childrenOf(target.id).length;
      moveMutation.mutate({ id: dragged.id, parentId: target.id, position: siblingCount });
    } else {
      moveMutation.mutate({ id: dragged.id, parentId: null, position: 0 });
    }
  };

  const deleteCount = deleting ? productCounts.get(deleting.name) ?? 0 : 0;
  const hasSubcategories = deleting ? childrenOf(deleting.id).length > 0 : false;

  /** Parent choices for the selects — excludes the edited node's subtree. */
  const parentChoices = useMemo(() => {
    const out: { category: Category; depth: number }[] = [];
    const walk = (nodes: Category[], depth: number) => {
      nodes.forEach((node) => {
        out.push({ category: node, depth });
        if (!(editing && node.id === editing.id) && !(editing && isDescendant(node.id, editing.id))) {
          walk(childrenOf(node.id), depth + 1);
        }
      });
    };
    walk(childrenOf(null), 0);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, editing]);

  const parentLabel = (id: number | "") =>
    id === "" ? "Top level" : all.find((c) => c.id === id)?.name ?? "Top level";

  const renderSelect = (
    value: number | "",
    onChange: (v: number | "") => void,
    excludeSelf = false
  ) => (
    <Select
      fullWidth={excludeSelf}
      size="small"
      displayEmpty
      value={value}
      onChange={(e) => onChange(e.target.value as number | "")}
      renderValue={(selected) =>
        String(selected) === "" ? (
          <span className="text-ink-muted">Top level</span>
        ) : (
          parentLabel(Number(selected))
        )
      }
    >
      <MuiMenuItem value="">Top level</MuiMenuItem>
      {parentChoices.map(({ category, depth }) => (
        <MuiMenuItem key={category.id} value={category.id} sx={{ pl: 2 + depth * 3 }}>
          {depth > 0 && <SubdirectoryArrowRightIcon sx={{ fontSize: 14, mr: 1 }} />}
          {category.name}
        </MuiMenuItem>
      ))}
    </Select>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Departments, subcategories and deeper — drag to nest, reorder, and add imagery."
      />

      <Paper className="max-w-3xl p-6">
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
          <Box className="min-w-[11rem]">{renderSelect(parentId, setParentId)}</Box>
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
        <Box className="mt-3 flex flex-col gap-2 sm:flex-row">
          <TextField
            fullWidth
            size="small"
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            fullWidth
            size="small"
            label="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/images/store/tiles/tile-home.png"
          />
        </Box>
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
            <span className="w-24 text-right">Actions</span>
          </div>

          {/* Drop strip: release here to promote to top level */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDropTargetId(-1);
            }}
            onDragLeave={() => setDropTargetId((cur) => (cur === -1 ? null : cur))}
            onDrop={() => handleDrop(null)}
            className={`px-5 py-1.5 text-center text-[0.6875rem] font-bold uppercase tracking-wide transition ${
              dropTargetId === -1
                ? "bg-brand-soft text-brand"
                : "text-ink-muted/60"
            } ${dragId == null ? "hidden" : ""}`}
          >
            Drop here → top level
          </div>

          {rows.map(({ category, depth, hasChildren }) => {
            const isDropTarget = dropTargetId === category.id;
            const isDragging = dragId === category.id;
            return (
              <div
                key={category.id}
                draggable
                onDragStart={() => setDragId(category.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setDropTargetId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragId != null && dragId !== category.id) setDropTargetId(category.id);
                }}
                onDragLeave={() => setDropTargetId((cur) => (cur === category.id ? null : cur))}
                onDrop={() => handleDrop(category)}
                className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-line px-5 py-3 last:border-b-0 transition ${
                  isDragging ? "opacity-40" : ""
                } ${isDropTarget ? "bg-brand-soft/60 ring-1 ring-inset ring-brand/40" : "hover:bg-brand-soft/20"}`}
                style={{ paddingLeft: 20 + depth * 28, cursor: "grab" }}
              >
                <Box className="flex min-w-0 items-center gap-1.5">
                  {hasChildren ? (
                    <IconButton
                      size="small"
                      className="!p-0.5"
                      aria-label={collapsed.has(category.id) ? "Expand" : "Collapse"}
                      onClick={() =>
                        setCollapsed((cur) => {
                          const next = new Set(cur);
                          if (next.has(category.id)) next.delete(category.id);
                          else next.add(category.id);
                          return next;
                        })
                      }
                    >
                      {collapsed.has(category.id) ? (
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <ExpandMoreIcon sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  ) : (
                    <span className="inline-block w-[22px]" />
                  )}
                  {depth > 0 && (
                    <SubdirectoryArrowRightIcon className="text-ink-muted" sx={{ fontSize: 15 }} />
                  )}
                  {category.imageUrl && (
                    <img
                      src={category.imageUrl}
                      alt=""
                      className="h-7 w-7 rounded object-cover border border-line"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  )}
                  <Box className="min-w-0">
                    <Typography className="truncate font-semibold text-ink">{category.name}</Typography>
                    {category.description && (
                      <Typography className="truncate text-[0.6875rem] text-ink-muted">
                        {category.description}
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
                <Box className="flex items-center justify-end gap-0.5">
                  <IconButton
                    size="small"
                    aria-label={`Move ${category.name} up`}
                    disabled={moveMutation.isLoading}
                    onClick={() => reorder(category, -1)}
                  >
                    <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Move ${category.name} down`}
                    disabled={moveMutation.isLoading}
                    onClick={() => reorder(category, 1)}
                  >
                    <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Manage ${category.name}`}
                    onClick={(e) => setMenuAnchor({ category, el: e.currentTarget })}
                  >
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </div>
            );
          })}
          <div className="px-5 py-2 text-[0.6875rem] text-ink-muted">
            Tip: drag a row onto another category to nest it (drop on the strip above the list for top
            level). Arrows reorder within the same parent.
          </div>
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

      {/* Edit dialog — name, parent, description, image */}
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
          {renderSelect(editParentId, setEditParentId, true)}
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <Box className="flex items-start gap-3">
            <TextField
              fullWidth
              size="small"
              label="Image URL"
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
              placeholder="/images/store/tiles/tile-home.png"
            />
            {editImageUrl.trim() && (
              <img
                src={editImageUrl}
                alt="Preview"
                className="h-12 w-12 shrink-0 rounded border border-line object-cover"
                onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
              />
            )}
          </Box>
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
          {hasSubcategories ? (
            <Typography className="text-sm text-ink-soft">
              This category still has subcategories. Move or delete them first — the tree never loses
              nodes by accident.
            </Typography>
          ) : deleteCount > 0 ? (
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
            disabled={hasSubcategories || deleteCount > 0}
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

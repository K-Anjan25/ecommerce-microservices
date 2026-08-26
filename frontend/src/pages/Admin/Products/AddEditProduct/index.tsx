import { Box, Button, Checkbox, FormControlLabel, IconButton, Paper, Typography } from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useFormik } from "formik";
import { useEffect } from "react";
import { useMutation, useQuery } from "react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CategoryApi } from "../../../../api/categoryApi";
import { ProductApi } from "../../../../api/productApi";
import Loader from "../../../../components/Loader";
import PageHeader from "../../../../components/PageHeader";
import SelectInput from "../../../../components/SelectInput";
import TextInput from "../../../../components/TextInput";
import productForm, { emptyVariant, toVariantForm } from "../../../../forms/productForm";
import {
  ProductAdmin,
  ProductForm,
  ProductPayload,
  ProductVariantForm,
} from "../../../../types/product";
import { showError } from "../../../../utils/showError";
import { showSuccess } from "../../../../utils/showSuccess";
import { ChangeEvent } from "react";
import { FileApi } from "../../../../api/file";
import ClearIcon from "@mui/icons-material/Clear";
import LoadingButton from "@mui/lab/LoadingButton";

interface AddEditProductLocation {
  state: ProductAdmin;
}

function AddEditProduct() {
  const navigate = useNavigate();
  const { state: productParam }: AddEditProductLocation = useLocation();
  const { productId } = useParams();

  const { isLoading, data } = useQuery(["admin:product"], () => {
    if (productId && !productParam) return ProductApi.getProductById(productId);
  });

  const { data: categories } = useQuery(["admin:categories"], () =>
    CategoryApi.getCategories()
  );

  const product = productParam ?? data;
  const MODE = product ? "edit" : "add";
  const form = useFormik({
    initialValues: productForm.initialValues(MODE === "edit"),
    validationSchema: productForm.validationSchema(MODE === "edit"),
    onSubmit: (values) => {
      if (MODE === "add") {
        addProduct(values);
      } else {
        editProduct(values);
      }
    },
  });

  useEffect(() => {
    if (MODE === "edit" && product) {
      const newProduct = {
        ...product,
        categoryId: product.category?.id,
      } as Partial<Pick<ProductAdmin, "createdDate" | "id" | "category">>;
      delete newProduct.id;
      delete newProduct.createdDate;
      delete newProduct.category;

      const initialFormData = {
        ...productForm.initialValues(),
        ...newProduct,
        // The form owns the gallery and variants; normalize numbers to strings.
        images: product.images ?? [],
        variants: (product.variants ?? []).map(toVariantForm),
      };
      form.setValues(initialFormData, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MODE, product]);

  const addProduct = (data: ProductForm) => {
    createMutation.mutate(toPayload(data));
  };

  const editProduct = (data: ProductForm) => {
    editMutation.mutate({ data: toPayload(data), id: product.id });
  };

  /** Form state → wire format: coerce variant numbers, drop blank optionals,
   *  always send images[]/variants[] (the form owns them; [] clears). */
  const toPayload = (data: ProductForm): ProductPayload => ({
    ...data,
    images: data.images ?? [],
    variants: (data.variants ?? []).map((variant) => ({
      ...(variant.id ? { id: variant.id } : {}),
      name: variant.name.trim(),
      sku: variant.sku?.trim() || undefined,
      price:
        variant.price === "" || variant.price == null
          ? undefined
          : Number(variant.price),
      quantityInStock:
        variant.quantityInStock === "" || variant.quantityInStock == null
          ? undefined
          : Number(variant.quantityInStock),
      attributes: variant.attributes?.trim() || undefined,
    })),
  });

  const editMutation = useMutation(ProductApi.updateProduct, {
    onSuccess: () => {
      showSuccess("Product has been updated successfully");
      navigate(`/admin/products`);
    },
    onError: (error: any) =>
      showError(error.response?.data?.message ?? "Could not update the product"),
  });

  const createMutation = useMutation(ProductApi.saveProduct, {
    onSuccess: () => {
      showSuccess("Product has been created successfully");
      navigate(`/admin/products`);
    },
    onError: (error: any) =>
      showError(error.response?.data?.message ?? "Could not create the product"),
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    const fileData = new FormData();
    fileData.append("file", e.target.files[0]);
    try {
      const res = await FileApi.saveFile(fileData);
      form.setFieldValue("imageUrl", res);
    } catch (error: any) {
      showError(
        error.response?.data?.message ??
          "Image upload failed — is the API gateway running and reachable?"
      );
    }
  };

  const handleRemoveFile = async () => {
    try {
      await FileApi.removeFile(form.values.imageUrl.split("/").pop() ?? "");
      form.setFieldValue("imageUrl", "");
    } catch (error: any) {
      showError(error.response?.data?.message ?? "Could not remove the image");
    }
  };

  const handleGalleryAdd = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    const fileData = new FormData();
    fileData.append("file", e.target.files[0]);
    try {
      const res = await FileApi.saveFile(fileData);
      form.setFieldValue("images", [...(form.values.images ?? []), res]);
    } catch (error: any) {
      showError(error.response?.data?.message ?? "Image upload failed");
    }
    e.target.value = "";
  };

  const handleGalleryRemove = async (index: number) => {
    const image = form.values.images?.[index];
    const next = (form.values.images ?? []).filter((_, i) => i !== index);
    form.setFieldValue("images", next);
    if (image) {
      try {
        await FileApi.removeFile(image.split("/").pop() ?? "");
      } catch {
        // File already gone or protected — the URL removal still stands.
      }
    }
  };

  const addVariantRow = () => {
    form.setFieldValue("variants", [...(form.values.variants ?? []), { ...emptyVariant }]);
  };

  const removeVariantRow = (index: number) => {
    form.setFieldValue(
      "variants",
      (form.values.variants ?? []).filter((_, i) => i !== index)
    );
  };

  const setVariantField = (
    index: number,
    field: keyof ProductVariantForm,
    value: string
  ) => {
    const next = [...(form.values.variants ?? [])];
    next[index] = { ...next[index], [field]: value };
    form.setFieldValue("variants", next);
  };

  const hasVariants = (form.values.variants ?? []).length > 0;

  if (isLoading) return <Loader />;

  const busy = createMutation.isLoading || editMutation.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title={MODE === "edit" ? "Edit product" : "Create product"}
        subtitle={
          MODE === "edit"
            ? "Update the details of this product."
            : "Add a new product to your store."
        }
      />

      <Paper className="max-w-2xl p-6 sm:p-8">
        <form onSubmit={form.handleSubmit} className="space-y-6">
          <TextInput name="name" label="Product Name" form={form} />
          <SelectInput
            name="categoryId"
            label="Select Category"
            form={form}
            data={categories}
          />
          <TextInput name="description" label="Description" form={form} multiline minRows={3} />
          <div className="grid grid-cols-2 gap-4">
            <TextInput name="unitPrice" label="Unit Price" form={form} type="number" />
            <TextInput
              name="originalPrice"
              label="Was-Price (optional)"
              form={form}
              type="number"
              helperText="Shows the −% sale badge when above the unit price."
            />
            <TextInput name="brand" label="Brand (optional)" form={form} />
            <TextInput name="badge" label="Badge (optional)" form={form} helperText="e.g. NEW, BESTSELLER" />
          </div>
          <FormControlLabel
            control={
              <Checkbox
                name="featured"
                checked={Boolean(form.values.featured)}
                onChange={(event) =>
                  form.setFieldValue("featured", event.target.checked)
                }
              />
            }
            label="Feature on the homepage"
            className="!text-sm !text-ink-soft"
          />

          {!hasVariants && (
            <TextInput
              name="quantityInStock"
              label="Quantity In Stock"
              form={form}
              type="number"
              helperText="Hidden when the product uses variants — stock is tracked per variant then."
            />
          )}

          <Box>
            <p className="muted-label mb-2">Cover image (required)</p>
            <Box className="flex items-center gap-3">
              {form.values.imageUrl && (
                <Box className="flex items-center gap-1">
                  <img
                    src={form.values.imageUrl}
                    alt="Product preview"
                    className="h-14 w-14 rounded-sm border border-line object-cover"
                  />
                  <IconButton
                    aria-label="Remove image"
                    color="secondary"
                    onClick={handleRemoveFile}
                  >
                    <ClearIcon />
                  </IconButton>
                </Box>
              )}
              <Button
                variant="outlined"
                component="label"
                className="border-ink/20 text-ink hover:border-brand hover:bg-brand-tint hover:text-brand"
              >
                Upload image
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </Button>
            </Box>
          </Box>

          {/* gallery — extra photos beyond the cover (images[]) */}
          <Box>
            <p className="muted-label mb-2">
              More photos (optional) — {form.values.images?.length ?? 0} added
            </p>
            <Box className="flex flex-wrap items-center gap-2">
              {(form.values.images ?? []).map((image, index) => (
                <Box key={`${image}-${index}`} className="relative">
                  <img
                    src={image}
                    alt={`Product photo ${index + 2}`}
                    className="h-14 w-14 rounded-sm border border-line object-cover"
                  />
                  <IconButton
                    aria-label={`Remove photo ${index + 2}`}
                    size="small"
                    onClick={() => handleGalleryRemove(index)}
                    className="!absolute -right-2 -top-2 !h-6 !w-6 !bg-paper !shadow-sm"
                  >
                    <ClearIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                variant="outlined"
                component="label"
                startIcon={<AddPhotoAlternateOutlinedIcon />}
                className="border-ink/20 text-ink hover:border-brand hover:bg-brand-tint hover:text-brand"
              >
                Add photo
                <input
                  type="file"
                  hidden
                  onChange={handleGalleryAdd}
                  accept="image/*"
                />
              </Button>
            </Box>
          </Box>

          {/* variants — replaces simple stock when present */}
          <Box className="space-y-3">
            <Box className="flex items-center justify-between">
              <Box>
                <p className="muted-label">Variants (optional)</p>
                <p className="text-xs text-ink-muted">
                  e.g. sizes or colors with their own price and stock. Saved
                  rows keep their identity, so existing carts stay valid.
                </p>
              </Box>
              <Button
                size="small"
                startIcon={<AddOutlinedIcon />}
                onClick={addVariantRow}
              >
                Add variant
              </Button>
            </Box>
            {hasVariants && (
              <Box className="space-y-3 rounded-sm border border-line bg-canvas p-3">
                {(form.values.variants ?? []).map((variant, index) => (
                  <Box key={variant.id ?? `new-${index}`} className="space-y-2">
                    {index > 0 && <Box className="border-t border-line" />}
                    <Box className="flex items-center justify-between">
                      <Typography variant="body2" className="font-semibold text-ink">
                        Variant {index + 1}
                      </Typography>
                      <IconButton
                        aria-label={`Remove variant ${index + 1}`}
                        size="small"
                        onClick={() => removeVariantRow(index)}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                    <div className="grid grid-cols-2 gap-3">
                      <TextInput
                        name={`variants.${index}.name`}
                        label="Name (e.g. Large / Red)"
                        form={form}
                        value={variant.name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setVariantField(index, "name", e.target.value)
                        }
                      />
                      <TextInput
                        name={`variants.${index}.sku`}
                        label="SKU (optional)"
                        form={form}
                        value={variant.sku ?? ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setVariantField(index, "sku", e.target.value)
                        }
                      />
                      <TextInput
                        name={`variants.${index}.price`}
                        label="Price (optional)"
                        form={form}
                        type="number"
                        value={variant.price ?? ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setVariantField(index, "price", e.target.value)
                        }
                        helperText="Defaults to the unit price when empty."
                      />
                      <TextInput
                        name={`variants.${index}.quantityInStock`}
                        label="Stock"
                        form={form}
                        type="number"
                        value={variant.quantityInStock ?? ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setVariantField(index, "quantityInStock", e.target.value)
                        }
                      />
                    </div>
                    <TextInput
                      name={`variants.${index}.attributes`}
                      label="Attributes (optional)"
                      form={form}
                      value={variant.attributes ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setVariantField(index, "attributes", e.target.value)
                      }
                      helperText="Free text shown on the product page, e.g. Size: L, Color: Red"
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box className="flex gap-3 pt-2">
            <LoadingButton
              variant="contained"
              fullWidth
              size="large"
              type="submit"
              loading={busy}
            >
              {MODE === "edit" ? "Save changes" : "Create product"}
            </LoadingButton>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => navigate("/admin/products")}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </div>
  );
}

export default AddEditProduct;

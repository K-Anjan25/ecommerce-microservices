import { Box, Button, Checkbox, FormControlLabel, IconButton, Paper } from "@mui/material";
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
import productForm from "../../../../forms/productForm";
import { ProductAdmin, ProductForm } from "../../../../types/product";
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
    if (MODE === "edit") {
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
      };
      form.setValues(initialFormData, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MODE, product]);

  const addProduct = (data: ProductForm) => {
    createMutation.mutate(data);
  };

  const editProduct = (data: ProductForm) => {
    editMutation.mutate({ data, id: product.id });
  };

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

          {MODE === "add" && (
            <TextInput
              name="quantityInStock"
              label="Quantity In Stock"
              form={form}
              type="number"
            />
          )}

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

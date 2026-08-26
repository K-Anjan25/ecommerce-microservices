import * as yup from "yup";
import { ProductForm, ProductVariantForm } from "../types/product";

export const emptyVariant: ProductVariantForm = {
  name: "",
  sku: "",
  price: "",
  quantityInStock: "",
  attributes: "",
};

/** Fetched `ProductVariant` (numeric fields) → form-state strings. */
export const toVariantForm = (variant: any): ProductVariantForm => ({
  id: variant.id,
  name: variant.name ?? "",
  sku: variant.sku ?? "",
  price: variant.price != null ? String(variant.price) : "",
  quantityInStock:
    variant.quantityInStock != null ? String(variant.quantityInStock) : "",
  attributes: variant.attributes ?? "",
});

const validationSchema = (isEdit: boolean) =>
  yup.object({
    description: yup.string().required("description is required"),
    name: yup.string().required("name is required"),
    categoryId: yup.number().required("category is required"),
    imageUrl: yup.string().required("image is required"),
    quantityInStock: yup.number().when("variants", {
      is: (variants?: ProductVariantForm[]) =>
        !isEdit && (!variants || variants.length === 0),
      then: yup
        .number()
        .min(0, "Stock cannot be negative")
        .required("Stock is required when the product has no variants"),
      otherwise: yup.number().notRequired(),
    }),
    unitPrice: yup
      .number()
      .min(0, "unitPrice should be of minimum 0")
      .required("unitPrice is required"),
    originalPrice: yup
      .number()
      .min(0)
      .test(
        "above-unit-price",
        "Sale anchor must be above the unit price",
        function (value) {
          return value == null || this.parent.unitPrice == null || value > this.parent.unitPrice;
        }
      )
      .nullable(),
    brand: yup.string().max(60).nullable(),
    badge: yup.string().max(30).nullable(),
    images: yup.array().of(yup.string().required()),
    variants: yup.array().of(
      yup.object({
        name: yup.string().trim().required("Variant name is required"),
        sku: yup.string().max(60).nullable(),
        price: yup.number().min(0, "Cannot be negative").nullable(),
        quantityInStock: yup
          .number()
          .integer("Whole numbers only")
          .min(0, "Cannot be negative")
          .nullable(),
        attributes: yup.string().max(300, "Keep it under 300 characters").nullable(),
      })
    ),
  });

const initialValues = (isEdit: boolean = true): ProductForm => {
  return {
    categoryId: undefined,
    description: "",
    name: "",
    unitPrice: undefined,
    imageUrl: "",
    brand: "",
    originalPrice: undefined,
    badge: "",
    featured: false,
    images: [],
    variants: [],
    ...(!isEdit && { quantityInStock: undefined }),
  };
};

const productForm = {
  validationSchema,
  initialValues,
};

export default productForm;

import * as yup from "yup";
import { ProductForm } from "../types/product";

const validationSchema = (isEdit: boolean) =>
  yup.object({
    description: yup.string().required("description is required"),
    name: yup.string().required("name is required"),
    categoryId: yup.number().required("category is required"),
    imageUrl: yup.string().required("image is required"),
    quantityInStock: yup.number().when([], {
      is: () => !isEdit,
      then: yup
        .number()
        .min(0, "Stock cannot be negative")
        .required("quantityInStock is required"),
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
    ...(!isEdit && { quantityInStock: undefined }),
  };
};

const productForm = {
  validationSchema,
  initialValues,
};

export default productForm;

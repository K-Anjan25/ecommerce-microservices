import * as yup from "yup";
import { OrderForm } from "../types/order";
import { isIndia, POSTAL_CODE_RE } from "../formdata/countries";

interface OrderFormOptions {
  /** Guest checkout: customerEmail is collected and required. */
  guest?: boolean;
  /** Checkout flow: pincode is collected (needed for delivery quotes). */
  requirePincode?: boolean;
}

const createOrderForm = (options: OrderFormOptions = {}) => {
  const { guest = false, requirePincode = false } = options;

  const validationSchema = yup.object({
    country: yup.string().required("country is required"),
    state: yup.string().required("state is required"),
    district: yup.string().required("district is required"),
    addressDetail: yup.string().required("addressDetail is required"),
    pincode: requirePincode
      ? yup
          .string()
          .when("country", {
            is: (country: string) => isIndia(country),
            then: (schema) =>
              schema.matches(/^\d{6}$/, "Enter a valid 6-digit pincode").required("pincode is required"),
            otherwise: (schema) =>
              schema.matches(POSTAL_CODE_RE, "Enter a valid postal code").required("postal code is required"),
          })
      : yup.string(),
    phoneNumber: yup
      .string()
      .when("country", {
        is: (country: string) => isIndia(country),
        then: (schema) => schema.matches(/^$|^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
        otherwise: (schema) =>
          schema.matches(/^$|^[+]?[\d\s-]{7,15}$/, "Enter a valid contact number"),
      })
      .nullable(),
    // Only require an email for guest checkout — the field is not rendered
    // for logged-in users, so a blanket required() would block their submit.
    customerEmail: guest
      ? yup
          .string()
          .email("Invalid email")
          .required("Email is required for guest checkout")
      : yup.string(),
  });

  const initialValues: OrderForm = {
    country: "IN",
    state: "",
    district: "",
    addressDetail: "",
    pincode: "",
    phoneNumber: "",
    customerEmail: "",
  };

  return { validationSchema, initialValues };
};

export default createOrderForm;

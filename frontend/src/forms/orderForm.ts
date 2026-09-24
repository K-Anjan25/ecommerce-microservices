import * as yup from "yup";
import { OrderForm } from "../types/order";
import { getTerritory, isValidPhone, isValidPostal } from "../formdata/territories";

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
    // First-level division: required except for city-states (Singapore),
    // where the field isn't rendered and the default is stored instead.
    state: yup
      .string()
      .test("state", "region is required", function (value) {
        if (getTerritory(this.parent.country).regionHidden) return true;
        return Boolean(value && value.trim());
      }),
    district: yup.string().required("city is required"),
    addressDetail: yup.string().required("addressDetail is required"),
    pincode: requirePincode
      ? yup.string().test("postal", "", function (value) {
          const territory = getTerritory(this.parent.country);
          const trimmed = (value ?? "").trim();
          if (!trimmed) {
            // Countries without universal post codes don't require it.
            return territory.postalRegex
              ? this.createError({
                  message: `Enter a valid ${territory.postalLabel.toLowerCase()}`,
                })
              : true;
          }
          if (!isValidPostal(this.parent.country, trimmed)) {
            return this.createError({
              message: `Enter a valid ${territory.postalLabel.replace(" (optional)", "").toLowerCase()}`,
            });
          }
          return true;
        })
      : yup.string(),
    phoneNumber: yup
      .string()
      .test("phone", "", function (value) {
        const trimmed = (value ?? "").trim();
        if (!trimmed) return true; // phone stays optional
        if (!isValidPhone(this.parent.country, trimmed)) {
          return this.createError({
            message: `Enter a valid ${getTerritory(this.parent.country).phoneExample.toLowerCase()}`,
          });
        }
        return true;
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

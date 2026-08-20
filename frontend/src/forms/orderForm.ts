import * as yup from "yup";
import { OrderForm } from "../types/order";

const validationSchema = yup.object({
  state: yup.string().required("state is required"),
  district: yup.string().required("district is required"),
  addressDetail: yup.string().required("addressDetail is required"),
});

const initialValues: OrderForm = {
  state: "",
  district: "",
  addressDetail: "",
};

const orderForm = {
  validationSchema,
  initialValues,
};

export default orderForm;

import * as yup from "yup";
import { AccountForm } from "../types/account";

const validationSchema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup.string().required("New password is required"),
});

const initialValues: AccountForm = {
  currentPassword: "",
  newPassword: "",
};

const accountForm = {
  validationSchema,
  initialValues,
};

export default accountForm;

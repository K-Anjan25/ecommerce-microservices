import { Paper, Typography } from "@mui/material";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import * as yup from "yup";
import { useMutation } from "react-query";
import { useFormik } from "formik";
import { setToken } from "../../utils/token";
import TextInput from "../../components/TextInput";
import PageHeader from "../../components/PageHeader";
import { showSuccess } from "../../utils/showSuccess";
import { useNavigate } from "react-router-dom";

import accountForm from "../../forms/accountForm";
import { UserApi } from "../../api/userApi";
import { LoadingButton } from "@mui/lab";
import { showError } from "../../utils/showError";

const validationSchema = accountForm.validationSchema.shape({
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm your new password"),
});

const initialValues = {
  ...accountForm.initialValues,
  confirmNewPassword: "",
};

function Account() {
  const navigate = useNavigate();

  const form = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      updateMutation.mutate({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    },
  });

  const updateMutation = useMutation(UserApi.updatePassword, {
    onSuccess: (res) => {
      setToken({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      showSuccess("Your password has been updated successfully");
      navigate(`/`);
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message as string);
    },
  });

  return (
    <div className="page-shell">
      <PageHeader
        title="Account"
        subtitle="Keep your account secure with a strong password."
      />
      <Paper className="mx-auto max-w-xl p-6 sm:p-10">
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-brand-tint p-4">
          <LockResetOutlinedIcon className="mt-0.5 !text-brand" />
          <div>
            <Typography className="font-semibold text-brand">
              Change password
            </Typography>
            <Typography className="text-sm text-ink-soft">
              You will need to sign in again after changing your password.
            </Typography>
          </div>
        </div>

        <form onSubmit={form.handleSubmit} className="space-y-6">
          <TextInput
            name="currentPassword"
            label="Current password"
            type="password"
            form={form}
          />
          <TextInput
            name="newPassword"
            label="New password"
            type="password"
            form={form}
          />
          <TextInput
            name="confirmNewPassword"
            label="Confirm new password"
            type="password"
            form={form}
          />

          <LoadingButton
            variant="contained"
            fullWidth
            size="large"
            type="submit"
            loading={updateMutation.isLoading}
            className="!bg-brand !text-paper hover:!bg-brand-main"
          >
            Update password
          </LoadingButton>
        </form>
      </Paper>
    </div>
  );
}

export default Account;

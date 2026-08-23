import { Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import TextInput from "../../../components/TextInput";
import AuthLayout from "../../../components/AuthLayout";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserApi } from "../../../api/userApi";
import { showSuccess } from "../../../utils/showSuccess";
import { showError } from "../../../utils/showError";

function ForgetPassword() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const resetPassword = async () => {
    setLoading(true);
    try {
      await UserApi.requestPasswordReset(value);
      showSuccess("If the account exists, a reset link has been sent");
      navigate("/login");
    } catch (e: any) {
      const res = e.response?.data?.message as string;
      showError(res);
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Typography variant="h4" component="h1" className="font-bold">
        Reset your password
      </Typography>
      <Typography className="mt-1 text-ink-soft">
        Enter your email and we&apos;ll send a secure, one-time reset link.
      </Typography>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          resetPassword();
        }}
      >
        <TextInput
          name="email"
          label="Email"
          form={{ values: { email: value }, handleChange: (e: any) => setValue(e.target.value) }}
          type="email"
        />
        <LoadingButton
          variant="contained"
          fullWidth
          type="submit"
          loading={loading}
        >
          Send
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}

export default ForgetPassword;

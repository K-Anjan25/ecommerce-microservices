import { Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { useFormik } from "formik";
import AuthLayout from "../../components/AuthLayout";
import TextInput from "../../components/TextInput";
import registerForm from "../../forms/registerForm";
import { showSuccess } from "../../utils/showSuccess";
import { Link, useNavigate } from "react-router-dom";
import { RegisterForm } from "../../types/user";
import { api } from "../../api/client";
import { useState } from "react";
import { showError } from "../../utils/showError";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useFormik({
    ...registerForm,
    onSubmit: (values) => {
      const { passwordConfirm, ...registerValues } = values;
      register(registerValues);
    },
  });

  const register = async (creds: RegisterForm) => {
    setLoading(true);
    try {
      await api.post("/user/register", creds);
      showSuccess("You have successfully registered!");
      navigate("/login");
    } catch (error: any) {
      showError(error.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthLayout>
      <Typography variant="h4" component="h1" className="!font-display !text-4xl !font-normal !tracking-[-0.02em]">
        Create your account
      </Typography>
      <Typography className="mt-1 text-ink-soft">
        Join Cartly to shop and track orders.
      </Typography>

      <form onSubmit={form.handleSubmit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="firstName" label="First Name" form={form} />
          <TextInput name="lastName" label="Last Name" form={form} />
        </div>
        <TextInput name="email" label="Email" form={form} />
        <TextInput
          name="password"
          label="Password"
          form={form}
          type="password"
        />
        <TextInput
          name="passwordConfirm"
          label="Password Confirm"
          form={form}
          type="password"
        />
        <LoadingButton
          variant="contained"
          fullWidth
          type="submit"
          loading={loading}
        >
          Register
        </LoadingButton>
      </form>

      <Typography className="mt-6 text-center text-ink-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  );
}

export default Register;

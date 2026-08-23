import { Button, Typography } from "@mui/material";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import LoadingButton from "@mui/lab/LoadingButton";
import AuthLayout from "../../components/AuthLayout";
import TextInput from "../../components/TextInput";
import loginForm from "../../forms/loginForm";
import { AppState } from "../../store";
import { login } from "../../store/actions/userAction";
import { useEffect, useState } from "react";
import { showSuccess } from "../../utils/showSuccess";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Login() {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading } = useSelector((state: AppState) => state.user);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (data.isLogedIn) {
      showSuccess("You have successfully logged in!");
      // Return the user to the page that required login (RequireAuth passes
      // `state.from`), falling back to home.
      const from = (location.state as { from?: { pathname?: string } } | null)?.from;
      navigate(from?.pathname ?? "/");
    }
  }, [data, navigate, location.state]);

  const form = useFormik({
    ...loginForm,
    onSubmit: (values) => {
      dispatch(login(values));
    },
  });

  return (
    <AuthLayout>
      <Typography variant="h4" component="h1" className="font-bold">
        Welcome back
      </Typography>
      <Typography className="mt-1 text-ink-soft">
        Sign in to continue shopping.
      </Typography>

      <form onSubmit={form.handleSubmit} className="mt-8 space-y-4">
        <TextInput name="email" label="Email" form={form} />
        <TextInput
          name="password"
          label="Password"
          form={form}
          type={showPassword ? "text" : "password"}
          InputProps={{
            endAdornment: (
              <Button
                size="small"
                onClick={() => setShowPassword((v) => !v)}
                className="text-brand"
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            ),
          }}
        />
        <Link
          to="/forgetPassword"
          className="block text-right text-sm font-semibold text-brand hover:underline"
        >
          Forgot your password?
        </Link>
        <LoadingButton
          variant="contained"
          fullWidth
          type="submit"
          loading={loading}
        >
          Login
        </LoadingButton>
      </form>

      <Typography className="mt-6 text-center text-ink-soft">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-brand hover:underline">
          Create one
        </Link>
      </Typography>
    </AuthLayout>
  );
}

export default Login;

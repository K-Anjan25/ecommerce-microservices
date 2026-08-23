import { useState } from "react";
import { Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../../components/AuthLayout";
import { UserApi } from "../../../api/userApi";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return showError("This reset link is incomplete");
    if (password.length < 8) return showError("Use at least 8 characters");
    if (password !== confirm) return showError("Passwords do not match");
    setLoading(true);
    try {
      await UserApi.confirmPasswordReset(token, password);
      showSuccess("Password updated. You can now sign in");
      navigate("/login", { replace: true });
    } catch (error: any) {
      showError(error.response?.data?.message ?? "This reset link is invalid or expired");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Typography component="h1" className="!font-display !text-4xl !font-normal !tracking-[-0.02em]">
        Choose a new password
      </Typography>
      <Typography className="mt-2 text-ink-soft">
        This one-time link expires after 30 minutes and cannot be reused.
      </Typography>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="eyebrow mb-1.5 block">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-control"
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="input-control"
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        <LoadingButton type="submit" variant="contained" fullWidth size="large" loading={loading}>
          Update password
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}

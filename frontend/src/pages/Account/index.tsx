
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Link } from "react-router-dom";
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
import Switch from "@mui/material/Switch";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "react-query";
import { AppState } from "../../store";
import { SubscriptionApi } from "../../api/subscriptionApi";
import { formatPrice } from "../../utils/currency";
import { showError } from "../../utils/showError";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";

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
  const queryClient = useQueryClient();
  const { data: me } = useSelector((state: AppState) => state.user);
  const [mfaOn, setMfaOn] = useState(Boolean(me?.mfaEnabled));

  const mfaMutation = useMutation(UserApi.setMfaEnabled, {
    onSuccess: (res) => {
      setMfaOn(res.mfaEnabled);
      showSuccess(
        res.mfaEnabled
          ? "Two-step verification is on — sign-in will now ask for an emailed code."
          : "Two-step verification is off."
      );
    },
    onError: (err: any) => showError(err?.response?.data?.message ?? "Could not update the setting"),
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery(
    "my-subscriptions",
    SubscriptionApi.getMySubscriptions,
    { retry: false }
  );

  const subMutation = useMutation(
    async (payload: { id: string; active?: boolean; cancel?: boolean }) => {
      if (payload.cancel) {
        await SubscriptionApi.cancelSubscription(payload.id);
        return;
      }
      await SubscriptionApi.updateSubscription(payload.id, { active: payload.active });
    },
    {
      onSuccess: () => {
        showSuccess("Subscription updated");
        queryClient.invalidateQueries("my-subscriptions");
      },
      onError: (err: any) => showError(err?.response?.data?.message ?? "Could not update the subscription"),
    }
  );

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
      <div className="mx-auto max-w-xl border-t border-ink py-7 sm:py-9">
        <div className="mb-8 flex items-start gap-3 border-b border-line pb-6">
          <LockResetOutlinedIcon className="mt-0.5 !text-brand" />
          <div>
            <p className="font-heading text-2xl font-extrabold text-ink">Change password</p>
            <p className="mt-1 text-sm text-ink-soft">
              You will need to sign in again after changing your password.
            </p>
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
          >
            Update password
          </LoadingButton>
        </form>

        {/* ── Two-step verification ─────────────────────────────────── */}
        <div className="mt-10 flex items-start justify-between gap-4 border-t border-line pt-8">
          <div>
            <p className="font-heading text-2xl font-extrabold text-ink">
              Two-step verification
            </p>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              When on, signing in asks for a 6-digit code we email you — after your password.
            </p>
          </div>
          <Switch
            checked={mfaOn}
            disabled={mfaMutation.isLoading}
            onChange={(e) => mfaMutation.mutate(e.target.checked)}
          />
        </div>

        {/* ── Subscriptions (auto-reorder) ──────────────────────────── */}
        <div className="mt-10 border-t border-line pt-8">
          <div className="flex items-center justify-between">
            <p className="font-heading text-2xl font-extrabold text-ink">Subscriptions</p>
            <Link
              to="/subscriptions"
              className="text-xs font-bold text-brand hover:underline"
            >
              Manage all →
            </Link>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Subscribe &amp; Save auto-reorders. We remind you before each delivery — with a saved
            payment method it's charged automatically, otherwise pay from Orders when you're ready.
          </p>
          {subsLoading ? (
            <p className="mt-4 text-sm text-ink-muted">Loading…</p>
          ) : !subscriptions?.length ? (
            <p className="mt-4 text-sm text-ink-muted">
              No subscriptions yet — start one from any product page with “Subscribe &amp; save”.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-ink">{sub.productName}</p>
                    <p className="text-xs text-ink-soft">
                      × {sub.quantity} · every {sub.intervalDays} days ·{" "}
                      {formatPrice(sub.unitPrice)} each
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {sub.active
                        ? `Next delivery around ${new Date(sub.nextRunAt).toLocaleDateString()}`
                        : "Paused"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      aria-label={sub.active ? "Pause subscription" : "Resume subscription"}
                      onClick={() => subMutation.mutate({ id: sub.id, active: !sub.active })}
                      className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold text-ink transition hover:border-brand hover:text-brand"
                    >
                      {sub.active ? (
                        <PauseCircleOutlineIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <PlayCircleOutlineIcon sx={{ fontSize: 16 }} />
                      )}
                      {sub.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      aria-label="Cancel subscription"
                      onClick={() => subMutation.mutate({ id: sub.id, cancel: true })}
                      className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold text-state-danger transition hover:border-state-danger"
                    >
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Account;

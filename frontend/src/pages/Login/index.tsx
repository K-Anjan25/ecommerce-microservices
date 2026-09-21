import { Button, MenuItem, TextField, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import AuthLayout from "../../components/AuthLayout";
import TextInput from "../../components/TextInput";
import loginForm from "../../forms/loginForm";
import { AppState } from "../../store";
import { login, userMe } from "../../store/actions/userAction";
import { useEffect, useState } from "react";
import { showSuccess } from "../../utils/showSuccess";
import { showError } from "../../utils/showError";
import { setToken } from "../../utils/token";
import { UserApi, PhoneOtpSent } from "../../api/userApi";
import { Login } from "../../types/user";
import { COUNTRIES } from "../../formdata/countries";
import { isValidLocalNumber, toE164 } from "../../utils/phone";
import { Link, useLocation, useNavigate } from "react-router-dom";

/** Backend error code meaning: code correct, but the number has no account. */
const NEW_NUMBER = "NO_ACCOUNT";

function Login() {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading } = useSelector((state: AppState) => state.user);
  const [showPassword, setShowPassword] = useState(false);

  // Phone sign-in state machine: number → code → (new numbers) profile.
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [dial, setDial] = useState("+91");
  const [localNumber, setLocalNumber] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [otp, setOtp] = useState("");
  const [otpInfo, setOtpInfo] = useState<PhoneOtpSent | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "" });
  const phone = toE164(dial, localNumber);

  useEffect(() => {
    if (data.isLogedIn) {
      showSuccess("You have successfully logged in!");
      // Return the user to the page that required login (RequireAuth passes
      // `state.from`), falling back to home.
      const from = (location.state as { from?: { pathname?: string } } | null)?.from;
      navigate(from?.pathname ?? "/");
    }
  }, [data, navigate, location.state]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const form = useFormik({
    ...loginForm,
    onSubmit: (values) => {
      dispatch(login(values));
    },
  });

  const sendCode = async () => {
    if (!isValidLocalNumber(dial, localNumber)) {
      showError(dial === "+91" ? "Enter a valid 10-digit mobile number" : "Enter a valid phone number");
      return;
    }
    setSending(true);
    try {
      const info = await UserApi.requestPhoneOtp(phone);
      setOtpInfo(info);
      setSecondsLeft(60);
      setStep("otp");
      showSuccess(`Code sent to ${phone}`);
    } catch (error: any) {
      showError(error.response?.data?.message ?? "Could not send the code");
    } finally {
      setSending(false);
    }
  };

  const finishSession = async (tokens: Login) => {
    setToken(tokens);
    // Hydrate the profile the same way email login does.
    await dispatch(userMe());
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(otp)) {
      showError("Enter the 6-digit code from the SMS");
      return;
    }
    setVerifying(true);
    try {
      const tokens = await UserApi.verifyPhoneOtp(phone, otp);
      await finishSession(tokens);
    } catch (error: any) {
      const message: string = error.response?.data?.message ?? "Could not verify the code";
      if (message === NEW_NUMBER) {
        setStep("register");
      } else {
        showError(message);
      }
    } finally {
      setVerifying(false);
    }
  };

  const completeSignUp = async () => {
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      showError("Enter your first and last name");
      return;
    }
    if (profile.email.trim() && !/^\S+@\S+\.\S+$/.test(profile.email.trim())) {
      showError("Enter a valid email (or leave it blank)");
      return;
    }
    setRegistering(true);
    try {
      const tokens = await UserApi.registerPhone({
        phone,
        code: otp,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        email: profile.email.trim() || undefined,
      });
      showSuccess("Your account is ready — welcome to Cartly!");
      await finishSession(tokens);
    } catch (error: any) {
      showError(error.response?.data?.message ?? "Could not create the account");
    } finally {
      setRegistering(false);
    }
  };

  const resetPhoneFlow = () => {
    setStep("phone");
    setOtp("");
    setOtpInfo(null);
    setProfile({ firstName: "", lastName: "", email: "" });
  };

  const dialSelect = (
    <TextField
      select
      value={dial}
      onChange={(e) => setDial(e.target.value)}
      aria-label="Country code"
      sx={{ width: 128, flexShrink: 0 }}
      className="[&_.MuiOutlinedInput-root]:!rounded-xl"
    >
      {COUNTRIES.map((c) => (
        <MenuItem key={c.code} value={c.dial}>
          <span className="text-sm font-semibold">{c.dial}</span>
          <span className="ml-2 text-xs text-ink-muted">{c.code}</span>
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <AuthLayout>
      <Typography
        variant="h4"
        component="h1"
        className="!font-heading !text-3xl !font-extrabold !tracking-tight sm:!text-4xl"
      >
        Welcome back
      </Typography>
      <Typography className="mt-1 text-ink-soft">Sign in to continue shopping.</Typography>

      {/* Email | Phone switcher */}
      <div className="mt-8 grid grid-cols-2 rounded-xl border border-line p-1">
        {(["email", "phone"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`rounded-lg py-2 text-sm font-bold transition ${
              mode === m ? "bg-ink text-paper" : "text-ink-soft hover:text-brand"
            }`}
          >
            {m === "email" ? "Email" : "Phone"}
          </button>
        ))}
      </div>

      {mode === "email" ? (
        <form onSubmit={form.handleSubmit} className="mt-8 space-y-5">
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
          <LoadingButton variant="contained" fullWidth type="submit" loading={loading}>
            Login
          </LoadingButton>
        </form>
      ) : step === "phone" ? (
        <div className="mt-8 space-y-5">
          <Typography className="text-sm text-ink-soft">
            We&apos;ll text you a one-time code — no password needed.
          </Typography>
          <div className="flex gap-2">
            {dialSelect}
            <TextField
              label="Phone number"
              value={localNumber}
              onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d\s-]/g, ""))}
              onKeyPress={(e) => e.key === "Enter" && sendCode()}
              placeholder={dial === "+91" ? "98765 43210" : "201 555 0123"}
              inputProps={{
                inputMode: "numeric",
                maxLength: 14,
                autoComplete: "tel-national",
              }}
              fullWidth
              className="[&_.MuiOutlinedInput-root]:!rounded-xl"
            />
          </div>
          <LoadingButton
            variant="contained"
            fullWidth
            loading={sending}
            onClick={sendCode}
          >
            Send code
          </LoadingButton>
        </div>
      ) : step === "otp" ? (
        <div className="mt-8 space-y-5">
          <Typography className="text-sm text-ink-soft">
            Enter the 6-digit code we sent to{" "}
            <span className="font-bold text-ink">{phone}</span>.{" "}
            <button type="button" onClick={resetPhoneFlow} className="font-semibold text-brand hover:underline">
              Change number
            </button>
          </Typography>
          <TextField
            label="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyPress={(e) => e.key === "Enter" && verifyCode()}
            inputProps={{ inputMode: "numeric", maxLength: 6, style: { letterSpacing: "0.5em", fontWeight: 700 } }}
            fullWidth
            className="[&_.MuiOutlinedInput-root]:!rounded-xl"
          />
          {otpInfo?.devCode && (
            <p className="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-xs font-semibold text-state-warning-on">
              Preview environment — no SMS provider is connected, so your code is{" "}
              <span className="font-heading font-extrabold tracking-widest">{otpInfo.devCode}</span>
            </p>
          )}
          <LoadingButton
            variant="contained"
            fullWidth
            loading={verifying}
            onClick={verifyCode}
          >
            Verify &amp; sign in
          </LoadingButton>
          <Button
            fullWidth
            disabled={secondsLeft > 0}
            onClick={sendCode}
            className="text-brand"
          >
            {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <Typography className="text-sm text-ink-soft">
            <span className="font-bold text-ink">{phone}</span> isn&apos;t on Cartly yet — add
            your details to finish creating the account. Your number is already verified.
          </Typography>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="First name"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              fullWidth
              className="[&_.MuiOutlinedInput-root]:!rounded-xl"
            />
            <TextField
              label="Last name"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              fullWidth
              className="[&_.MuiOutlinedInput-root]:!rounded-xl"
            />
          </div>
          <TextField
            label="Email (optional)"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            helperText="Order updates go to your email when added."
            fullWidth
            className="[&_.MuiOutlinedInput-root]:!rounded-xl"
          />
          <LoadingButton
            variant="contained"
            fullWidth
            loading={registering}
            onClick={completeSignUp}
          >
            Create account &amp; sign in
          </LoadingButton>
          <button
            type="button"
            onClick={resetPhoneFlow}
            className="block w-full text-center text-sm font-semibold text-brand hover:underline"
          >
            Use a different number
          </button>
        </div>
      )}

      <Typography className="mt-8 text-center text-ink-soft">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-brand hover:underline">
          Create one
        </Link>
      </Typography>
    </AuthLayout>
  );
}

export default Login;

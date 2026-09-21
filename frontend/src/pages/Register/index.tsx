import { Typography } from "@mui/material";
import { MenuItem, TextField } from "@mui/material";
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
import { COUNTRIES, flagEmoji } from "../../formdata/countries";
import { isValidLocalNumber, toE164 } from "../../utils/phone";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Optional phone (E.164 with country code) — enables passwordless phone sign-in.
  const [dial, setDial] = useState("+91");
  const [localNumber, setLocalNumber] = useState("");

  const form = useFormik({
    ...registerForm,
    onSubmit: (values) => {
      const { passwordConfirm, ...registerValues } = values;
      const phoneNumber = localNumber.trim() ? toE164(dial, localNumber) : undefined;
      if (phoneNumber && !isValidLocalNumber(dial, localNumber)) {
        showError(dial === "+91" ? "Enter a valid 10-digit mobile number" : "Enter a valid phone number");
        return;
      }
      register({ ...registerValues, phoneNumber });
    },
  });

  const register = async (creds: RegisterForm & { phoneNumber?: string }) => {
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
      <Typography variant="h4" component="h1" className="!font-heading !text-3xl !font-extrabold !tracking-tight sm:!text-4xl">
        Create your account
      </Typography>
      <Typography className="mt-1 text-ink-soft">
        Join Cartly to shop and track orders.
      </Typography>

      <form onSubmit={form.handleSubmit} className="mt-10 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="firstName" label="First Name" form={form} />
          <TextInput name="lastName" label="Last Name" form={form} />
        </div>
        <TextInput name="email" label="Email" form={form} />
        <div>
          <div className="flex gap-2">
            <TextField
              select
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              aria-label="Country code"
              sx={{ width: 104, flexShrink: 0 }}
              className="[&_.MuiOutlinedInput-root]:!rounded-xl"
            >
              {COUNTRIES.map((c) => (
                <MenuItem key={c.code} value={c.dial}>
                  <span className="text-base leading-none">{flagEmoji(c.code)}</span>
                  <span className="ml-2 text-sm font-semibold">{c.dial}</span>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Phone number (optional)"
              value={localNumber}
              onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d\s-]/g, ""))}
              placeholder={dial === "+91" ? "98765 43210" : "201 555 0123"}
              inputProps={{ inputMode: "numeric", maxLength: 14, autoComplete: "tel-national" }}
              fullWidth
              className="[&_.MuiOutlinedInput-root]:!rounded-xl"
            />
          </div>
        </div>
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

      <Typography className="mt-8 text-center text-ink-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  );
}

export default Register;

import React from "react";
import { Box } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { BrandMark } from "../../brand";

const highlights = [
  "One account for electronics, fashion, home and more",
  "Guest checkout when you want it",
  "Orders, returns and rewards in one place",
];

/** Editorial account shell: brand story on the left, quiet task surface on the right. */
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box className="min-h-[calc(100vh-7rem)] border border-line bg-paper lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <Box className="relative hidden min-h-[42rem] overflow-hidden lg:block">
        <img
          src="/images/store/auth-side.jpg"
          alt="A happy Cartly shopper holding orange and blue shopping bags"
          width={768}
          height={1344}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-oncontrast xl:p-14">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-accent">
            The Cartly membership
          </p>
          <h2 className="mt-4 max-w-xl font-heading text-4xl font-extrabold leading-[1.02] tracking-tight xl:text-5xl">
            Deals, drops and delivery — all in one account.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/75">
            Save your details, follow every order and check out in seconds across electronics, fashion, home and more.
          </p>
          <ul className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-white/90">
                <CheckIcon sx={{ fontSize: 16 }} className="mt-0.5 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Box>

      <Box className="flex min-h-[40rem] items-center justify-center px-6 py-14 sm:px-14 lg:px-20">
        <Box className="w-full max-w-md">
          <div className="mb-12 border-b border-line pb-8">
            <BrandMark />
          </div>
          {children}
          <p className="mt-12 border-t border-line pt-6 text-xs leading-relaxed text-ink-muted">
            Secure sign-in. We only use your details to manage your account and orders.
          </p>
        </Box>
      </Box>
    </Box>
  );
}

export default AuthLayout;

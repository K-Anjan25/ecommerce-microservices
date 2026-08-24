import React from "react";
import { Box } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { BrandMark } from "../../brand";

const highlights = [
  "A considered collection across home and life",
  "Guest checkout when you want it",
  "Orders, returns and rewards in one place",
];

/** Editorial account shell: brand story on the left, quiet task surface on the right. */
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box className="min-h-[calc(100vh-7rem)] border border-line bg-paper lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <Box className="relative hidden min-h-[42rem] overflow-hidden lg:block">
        <img
          src="/images/editorial/hero.jpg"
          alt="A warm, considered home interior"
          width={1024}
          height={1152}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#221A16]/85 via-transparent to-[#221A16]/10" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-oncontrast xl:p-14">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-accent">
            The Cartly membership
          </p>
          <h2 className="mt-4 max-w-xl font-display text-5xl font-normal leading-[0.98] tracking-[-0.03em]">
            Keep the things you love close.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70">
            Save your details, follow every order and return to considered pieces without starting over.
          </p>
          <ul className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-white/85">
                <CheckIcon sx={{ fontSize: 16 }} className="mt-0.5 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Box>

      <Box className="flex min-h-[38rem] items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <Box className="w-full max-w-md">
          <div className="mb-10 border-b border-line pb-6">
            <BrandMark />
          </div>
          {children}
          <p className="mt-10 border-t border-line pt-5 text-xs leading-relaxed text-ink-muted">
            Secure sign-in. We only use your details to manage your account and orders.
          </p>
        </Box>
      </Box>
    </Box>
  );
}

export default AuthLayout;

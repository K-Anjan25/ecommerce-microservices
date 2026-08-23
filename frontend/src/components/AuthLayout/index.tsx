import { Box, Typography } from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import React from "react";

const highlights = [
  { icon: <LocalShippingIcon />, text: "Track your orders in real time" },
  { icon: <ShieldOutlinedIcon />, text: "Secure checkout with JWT auth" },
  { icon: <CreditCardIcon />, text: "Cash on delivery & online payments" },
];

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box className="min-h-[calc(100vh-8rem)]">
      <Box className="grid overflow-hidden rounded-xl2 border border-line bg-paper shadow-card lg:grid-cols-2">
        <Box className="grain relative hidden flex-col justify-between bg-contrast p-12 text-oncontrast lg:flex">
          <Box className="flex items-center gap-3">
            <ShoppingBagIcon fontSize="large" className="text-accent" />
            <Typography
              variant="h5"
              className="font-heading font-extrabold tracking-[0.2em]"
            >
              CARTLY
            </Typography>
          </Box>

          <Box>
            <Typography variant="h3" className="font-heading font-extrabold leading-[1.1] tracking-tight">
              Everything you need, one cart.
            </Typography>
            <Typography className="mt-4 max-w-md text-ink-muted">
              Shop curated products, manage your cart, and track every order —
              powered by a resilient microservices backend.
            </Typography>
            <Box className="mt-8 space-y-3">
              {highlights.map((item, idx) => (
                <Box key={idx} className="flex items-center gap-3 text-oncontrast">
                  <Box className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-accent">
                    {item.icon}
                  </Box>
                  <Typography>{item.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Typography className="text-xs text-ink-muted">
            Spring Boot · React · RabbitMQ · PostgreSQL
          </Typography>
        </Box>

        <Box className="flex items-center justify-center bg-paper px-6 py-12 sm:px-12">
          <Box className="w-full max-w-md">
            <Box className="mb-8 flex items-center gap-2 lg:hidden">
              <ShoppingBagIcon className="text-brand" />
              <Typography
                variant="h6"
                className="font-heading font-extrabold tracking-[0.2em]"
              >
                CARTLY
              </Typography>
            </Box>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default AuthLayout;

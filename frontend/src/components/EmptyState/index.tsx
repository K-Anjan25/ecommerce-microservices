import { Box, Typography } from "@mui/material";
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <Box className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <Box className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
          {icon}
        </Box>
      )}
      <Typography variant="h6" className="font-semibold text-ink">
        {title}
      </Typography>
      {subtitle && (
        <Typography className="mt-1 max-w-md text-ink-soft">{subtitle}</Typography>
      )}
      {action && <Box className="mt-6">{action}</Box>}
    </Box>
  );
}

export default EmptyState;

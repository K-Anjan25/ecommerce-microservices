import { Box, Typography } from "@mui/material";
import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box className="page-header flex flex-wrap items-end justify-between gap-4">
      <Box>
        <Typography variant="h4" component="h1" className="page-title">
          {title}
        </Typography>
        {subtitle && <Typography className="page-subtitle">{subtitle}</Typography>}
      </Box>
      {actions && <Box className="flex shrink-0 gap-2">{actions}</Box>}
    </Box>
  );
}

export default PageHeader;

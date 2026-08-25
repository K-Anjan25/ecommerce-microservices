import { Box, Button, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
function Unauthorized() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Typography variant="h1" className="!font-display !text-ink">
        401
      </Typography>
      <Typography variant="h6" className="!text-ink-muted">
        You don't have permission to access this page
      </Typography>

      <Button onClick={() => navigate("/")} variant="contained" color="primary">
        Main Page
      </Button>
    </Box>
  );
}

export default Unauthorized;

import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";

function NotFound() {
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
        404
      </Typography>
      <Typography variant="h6" className="!text-ink-muted">
        The page you’re looking for doesn’t exist.
      </Typography>
      <Button component={Link} to="/" variant="contained" color="primary">
        Main Page
      </Button>
    </Box>
  );
}

export default NotFound;

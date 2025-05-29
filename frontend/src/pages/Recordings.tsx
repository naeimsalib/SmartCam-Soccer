import React from "react";
import { Box, Typography } from "@mui/material";

const Recordings = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
      }}
    >
      <Typography variant="h4" align="center" fontWeight={400}>
        Your Recordings
      </Typography>
    </Box>
  );
};

export default Recordings;

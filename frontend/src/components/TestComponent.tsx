import React from "react";
import { Box, Typography } from "@mui/material";

const TestComponent = () => {
  return (
    <Box
      sx={{
        p: 2,
        background: "#1a1a1a",
        borderRadius: 2,
        color: "#fff",
      }}
    >
      <Typography variant="h6">Test Component</Typography>
    </Box>
  );
};

export default TestComponent;

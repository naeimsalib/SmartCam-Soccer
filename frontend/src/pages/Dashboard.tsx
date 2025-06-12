import React from "react";
import { Box, Typography } from "@mui/material";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: "#111",
        pt: { xs: 10, md: 12 },
        pb: 6,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Navbar />
      <Typography
        variant="h3"
        fontWeight={900}
        sx={{
          color: "#fff",
          mb: 6,
          fontFamily: "Montserrat, sans-serif",
          textAlign: "center",
        }}
      >
        Dashboard
      </Typography>
    </Box>
  );
};

export default Dashboard;

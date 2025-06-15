import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import Navbar from "../components/Navbar";
import TestComponent from "../components/TestComponent";

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
      }}
    >
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 10 }}>
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

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <TestComponent />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;

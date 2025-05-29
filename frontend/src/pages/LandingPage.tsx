import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const NAVBAR_HEIGHT = 64;

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
        pt: { xs: "96px", md: "104px" },
        pb: 6,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ textAlign: "center", px: 2, width: "100%", maxWidth: 700 }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 700, fontSize: { xs: "2.2rem", md: "3.5rem" } }}
        >
          Welcome to SmartCam Soccer
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          color="text.secondary"
          sx={{ fontWeight: 400, fontSize: { xs: "1.1rem", md: "1.5rem" } }}
        >
          Your intelligent soccer field recording solution
        </Typography>
        <Typography
          variant="body1"
          paragraph
          sx={{
            mt: 4,
            fontSize: { xs: "1rem", md: "1.15rem" },
            color: "text.secondary",
          }}
        >
          Book your field, record your game, and relive your best moments with
          our advanced AI-powered camera system.
        </Typography>
        <Box
          sx={{
            mt: 5,
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/login")}
            sx={{ px: 4, py: 1.5, fontSize: "1.1rem", fontWeight: 600 }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/about")}
            sx={{ px: 4, py: 1.5, fontSize: "1.1rem", fontWeight: 600 }}
          >
            Learn More
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;

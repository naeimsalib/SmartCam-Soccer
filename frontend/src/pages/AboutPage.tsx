import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const AboutPage = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111",
        pt: { xs: 10, md: 12 },
        pb: 6,
        boxSizing: "border-box",
      }}
    >
      <Navbar />
      <Box
        sx={{
          textAlign: "center",
          px: 2,
          width: "100%",
          maxWidth: 900,
          mt: 10,
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          fontWeight={900}
          sx={{ color: "#fff", fontFamily: "Montserrat, sans-serif", mb: 2 }}
        >
          About{" "}
          <Box component="span" sx={{ color: "#F44336" }}>
            EZREC
          </Box>
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          mt={4}
          fontWeight={700}
          sx={{ color: "#F44336", fontFamily: "Montserrat, sans-serif", mb: 2 }}
        >
          Our Mission
        </Typography>
        <Typography
          variant="body1"
          paragraph
          sx={{ color: "#fff", opacity: 0.85, fontSize: "1.2rem", mb: 3 }}
        >
          EZREC is dedicated to revolutionizing how streaming and recording is
          done. Our powerful, easy-to-use solution lets anyone set up, stream,
          and share with just a few clicks.
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          mt={4}
          fontWeight={700}
          sx={{ color: "#F44336", fontFamily: "Montserrat, sans-serif", mb: 2 }}
        >
          How It Works
        </Typography>
        <Typography
          variant="body1"
          paragraph
          sx={{ color: "#fff", opacity: 0.85, fontSize: "1.2rem", mb: 3 }}
        >
          1. Set up your device in seconds.
          <br />
          2. Start streaming instantly.
          <br />
          3. Share your stream with the world.
          <br />
          4. Access your recordings anytime.
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          mt={4}
          fontWeight={700}
          sx={{ color: "#F44336", fontFamily: "Montserrat, sans-serif", mb: 2 }}
        >
          Why Choose EZREC?
        </Typography>
        <Typography
          variant="body1"
          paragraph
          sx={{ color: "#fff", opacity: 0.85, fontSize: "1.2rem", mb: 3 }}
        >
          • Automated, reliable streaming
          <br />
          • High-quality video
          <br />
          • Effortless sharing
          <br />
          • Secure cloud storage
          <br />
          • User-friendly interface
          <br />
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            mt: 5,
            px: 4,
            py: 1.5,
            fontSize: "1.1rem",
            fontWeight: 700,
            background: "#F44336",
            color: "#fff",
            borderRadius: 2,
            fontFamily: "Montserrat, sans-serif",
            boxShadow: "none",
            "&:hover": { background: "#d32f2f", boxShadow: "none" },
          }}
          onClick={() => navigate("/contact")}
        >
          Contact Us
        </Button>
      </Box>
    </Box>
  );
};

export default AboutPage;

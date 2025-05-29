import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

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
        background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
        pt: { xs: "96px", md: "104px" },
      }}
    >
      <Box sx={{ textAlign: "center", px: 2, width: "100%", maxWidth: 900 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight={600}>
          About SmartCam Soccer
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          mt={4}
          fontWeight={500}
        >
          Our Mission
        </Typography>
        <Typography variant="body1" paragraph>
          SmartCam Soccer is dedicated to revolutionizing how soccer games are
          recorded and analyzed. Our AI-powered camera system automatically
          tracks and records games, providing high-quality footage that can be
          accessed and downloaded at any time.
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          mt={4}
          fontWeight={500}
        >
          How It Works
        </Typography>
        <Typography variant="body1" paragraph>
          1. Book your field through our easy-to-use calendar system
          <br />
          2. Our smart cameras automatically start recording at your scheduled
          time
          <br />
          3. Access your recordings through your personal dashboard
          <br />
          4. Download and share your game footage whenever you want
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          mt={4}
          fontWeight={500}
        >
          Features
        </Typography>
        <Typography variant="body1" paragraph>
          • Automated recording based on your reservation &nbsp;•&nbsp;
          High-quality video capture &nbsp;•&nbsp; Easy access to past
          recordings &nbsp;•&nbsp; Secure cloud storage &nbsp;•&nbsp;
          User-friendly interface &nbsp;•&nbsp; Real-time availability calendar
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{ mt: 5, px: 4, py: 1.5, fontSize: "1.1rem", fontWeight: 600 }}
          onClick={() => navigate("/login")}
        >
          Get Started Today
        </Button>
      </Box>
    </Box>
  );
};

export default AboutPage;

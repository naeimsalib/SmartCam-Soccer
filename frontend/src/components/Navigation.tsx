import React from "react";
import { AppBar, Toolbar, Button, Box, Typography } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Navigation = () => {
  const location = useLocation();
  return (
    <AppBar
      position="static"
      sx={{ background: "#111", boxShadow: "none", py: 1 }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: 80 }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="h4"
            component={Link}
            to="/"
            sx={{
              fontWeight: 900,
              letterSpacing: 1,
              color: "#fff",
              textDecoration: "none",
              fontFamily: "Montserrat, sans-serif",
              mr: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box component="span" sx={{ color: "#fff" }}>
              EZ
            </Box>
            <Box component="span" sx={{ color: "#F44336", ml: 0.5 }}>
              REC
            </Box>
          </Typography>
        </Box>
        {/* Nav Links */}
        <Box
          sx={{ display: "flex", gap: 3, flex: 1, justifyContent: "center" }}
        >
          {navLinks.map((link) => (
            <Button
              key={link.to}
              component={Link}
              to={link.to}
              sx={{
                color: "#fff",
                fontWeight: 600,
                fontSize: "1.1rem",
                letterSpacing: 1,
                borderBottom:
                  location.pathname === link.to
                    ? "2px solid #F44336"
                    : "2px solid transparent",
                borderRadius: 0,
                background: "none",
                px: 2,
                py: 1,
                textTransform: "none",
                fontFamily: "Montserrat, sans-serif",
                transition: "border-bottom 0.2s",
                "&:hover": {
                  borderBottom: "2px solid #F44336",
                  background: "none",
                },
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>
        {/* Login Button */}
        <Button
          variant="outlined"
          component={Link}
          to="/login"
          sx={{
            borderColor: "#fff",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.1rem",
            px: 3,
            py: 1.2,
            borderRadius: 2,
            boxShadow: "none",
            textTransform: "none",
            fontFamily: "Montserrat, sans-serif",
            borderWidth: 2,
            mr: 2,
            "&:hover": {
              background: "rgba(255,255,255,0.08)",
              borderColor: "#fff",
              boxShadow: "none",
            },
          }}
        >
          Login
        </Button>
        {/* Get Started Button */}
        <Button
          variant="contained"
          component={Link}
          to="/contact"
          sx={{
            background: "#F44336",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.1rem",
            px: 3,
            py: 1.2,
            borderRadius: 2,
            boxShadow: "none",
            textTransform: "none",
            fontFamily: "Montserrat, sans-serif",
            "&:hover": {
              background: "#d32f2f",
              boxShadow: "none",
            },
          }}
        >
          Get Started
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;

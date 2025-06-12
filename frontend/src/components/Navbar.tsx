import React from "react";
import { AppBar, Toolbar, Button, Box, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Book Field", path: "/calendar" },
    { label: "Recordings", path: "/recordings" },
    { label: "Settings", path: "/settings" },
    { label: "About", path: "/about" },
  ];

  return (
    <AppBar position="fixed" sx={{ background: "#111" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="h4"
            onClick={() => navigate("/dashboard")}
            sx={{
              fontWeight: 900,
              letterSpacing: 1,
              color: "#fff",
              textDecoration: "none",
              fontFamily: "Montserrat, sans-serif",
              mr: 4,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
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

        {/* Navigation Items */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: 1,
                textTransform: "none",
                fontFamily: "Montserrat, sans-serif",
                borderBottom:
                  location.pathname === item.path
                    ? "2px solid #F44336"
                    : "2px solid transparent",
                borderRadius: 0,
                px: 2,
                py: 1,
                transition: "all 0.2s",
                "&:hover": {
                  background: "rgba(244, 67, 54, 0.1)",
                  borderBottom: "2px solid #F44336",
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* Logout Button */}
        <Button
          color="inherit"
          onClick={handleLogout}
          sx={{
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: 1,
            textTransform: "none",
            fontFamily: "Montserrat, sans-serif",
            border: "2px solid #F44336",
            borderRadius: 2,
            px: 3,
            py: 1,
            transition: "all 0.2s",
            "&:hover": {
              background: "#F44336",
              color: "#fff",
            },
          }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

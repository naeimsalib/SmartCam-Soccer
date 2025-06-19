import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Book Field", path: "/calendar" },
    { label: "Recordings", path: "/recordings" },
    { label: "Settings", path: "/settings" },
    { label: "About", path: "/about-authenticated" },
  ];

  // Mobile Drawer Content
  const mobileDrawerContent = (
    <Box
      sx={{
        width: 280,
        height: "100%",
        background: "#111",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          onClick={() => handleNavigation("/dashboard")}
          sx={{
            fontWeight: 900,
            letterSpacing: 1,
            color: "#fff",
            fontFamily: "Montserrat, sans-serif",
            cursor: "pointer",
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
        <IconButton onClick={handleMobileMenuClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />

      {/* Navigation Items */}
      <List sx={{ flex: 1, py: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                px: 3,
                py: 1.5,
                borderLeft:
                  location.pathname === item.path
                    ? "4px solid #F44336"
                    : "4px solid transparent",
                "&:hover": {
                  background: "rgba(244, 67, 54, 0.1)",
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: location.pathname === item.path ? 700 : 500,
                  color: location.pathname === item.path ? "#F44336" : "#fff",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Logout Button */}
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          onClick={handleLogout}
          sx={{
            color: "#fff",
            border: "2px solid #F44336",
            borderRadius: 2,
            py: 1.5,
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": {
              background: "#F44336",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ background: "#111" }}>
        <Toolbar
          sx={{
            justifyContent: "space-between",
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              onClick={() => navigate("/dashboard")}
              sx={{
                fontWeight: 900,
                letterSpacing: 1,
                color: "#fff",
                textDecoration: "none",
                fontFamily: "Montserrat, sans-serif",
                mr: { xs: 1, md: 4 },
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

          {/* Desktop Navigation Items */}
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
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
          )}

          {/* Right side */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Desktop Logout Button */}
            {!isMobile && (
              <Button
                color="inherit"
                onClick={handleLogout}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
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
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleMobileMenuToggle}
                sx={{ color: "#fff" }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        PaperProps={{
          sx: {
            background: "#111",
          },
        }}
      >
        {mobileDrawerContent}
      </Drawer>
    </>
  );
};

export default Navbar;

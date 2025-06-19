import React, { useState } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import {
  AccountCircle,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient"; // Import supabase for logout functionality

const Navigation: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // For active link styling
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      setError("Error signing out. Please try again.");
    }
    handleClose();
    handleMobileMenuClose();
  };

  const handleNavigation = (path: string) => {
    if (path === "/#features") {
      if (location.pathname !== "/") {
        navigate("/");
        // Wait for navigation to complete before scrolling
        setTimeout(() => {
          const featuresElement = document.getElementById("features");
          if (featuresElement) {
            featuresElement.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        const featuresElement = document.getElementById("features");
        if (featuresElement) {
          featuresElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      navigate(path);
    }
    handleMobileMenuClose();
  };

  const authenticatedNavItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Book Field", path: "/calendar" },
    { label: "Recordings", path: "/recordings" },
    { label: "Settings", path: "/settings" },
    { label: "About", path: "/about-authenticated" },
  ];

  const publicNavItems = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/features" },
    { label: "Pricing", path: "/pricing" },
    { label: "About", path: "/about" },
  ];

  const currentNavItems = user ? authenticatedNavItems : publicNavItems;

  // Mobile Drawer Content
  const mobileDrawerContent = (
    <Box
      sx={{
        width: 280,
        height: "100%",
        background: "rgba(0, 0, 0, 0.95)",
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
          onClick={() => {
            navigate(user ? "/dashboard" : "/");
            handleMobileMenuClose();
          }}
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
          <FiberManualRecordIcon
            sx={{ color: "#F44336", fontSize: "small", ml: 0.5 }}
          />
        </Typography>
        <IconButton onClick={handleMobileMenuClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />

      {/* Navigation Items */}
      <List sx={{ flex: 1, py: 2 }}>
        {currentNavItems.map((item) => (
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

        {!user && (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate("/login");
                handleMobileMenuClose();
              }}
              sx={{
                px: 3,
                py: 1.5,
                borderLeft:
                  location.pathname === "/login"
                    ? "4px solid #F44336"
                    : "4px solid transparent",
                "&:hover": {
                  background: "rgba(244, 67, 54, 0.1)",
                },
              }}
            >
              <ListItemText
                primary="Sign In"
                primaryTypographyProps={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: location.pathname === "/login" ? 700 : 500,
                  color: location.pathname === "/login" ? "#F44336" : "#fff",
                }}
              />
            </ListItemButton>
          </ListItem>
        )}
      </List>

      {/* Sign Out Button for Mobile */}
      {user && (
        <>
          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              onClick={handleSignOut}
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
              Sign Out
            </Button>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Toolbar
          sx={{
            width: "100%",
            maxWidth: "lg",
            margin: "0 auto",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              onClick={() => navigate(user ? "/dashboard" : "/")}
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
              <FiberManualRecordIcon
                sx={{
                  color: "#F44336",
                  fontSize: isMobile ? "small" : "medium",
                  ml: 0.5,
                }}
              />
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 1 }}>
              {currentNavItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => handleNavigation(item.path)}
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
              {!user && (
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/login"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    letterSpacing: 1,
                    textTransform: "none",
                    fontFamily: "Montserrat, sans-serif",
                    borderBottom:
                      location.pathname === "/login"
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
                  Sign In
                </Button>
              )}
            </Box>
          )}

          {/* Right side icons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Desktop User Menu */}
            {!isMobile && user && (
              <>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    sx: {
                      background: "rgba(0, 0, 0, 0.9)",
                      backdropFilter: "blur(10px)",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                </Menu>
              </>
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
            background: "rgba(0, 0, 0, 0.95)",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        {mobileDrawerContent}
      </Drawer>
    </>
  );
};

export default Navigation;

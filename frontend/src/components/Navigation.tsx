import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient'; // Import supabase for logout functionality

const Navigation: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // For active link styling

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      setError('Error signing out. Please try again.');
    }
    handleClose();
  };

  const handleNavigation = (path: string) => {
    if (path === '/#features') {
      if (location.pathname !== '/') {
        navigate('/');
        // Wait for navigation to complete before scrolling
        setTimeout(() => {
          const featuresElement = document.getElementById('features');
          if (featuresElement) {
            featuresElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        const featuresElement = document.getElementById('features');
        if (featuresElement) {
          featuresElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(path);
    }
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

  return (
    <AppBar position="fixed" sx={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}>
      <Toolbar sx={{ width: '100%', maxWidth: 'lg', margin: '0 auto', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h4"
            onClick={() => navigate(user ? "/dashboard" : "/")}
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
            <FiberManualRecordIcon sx={{ color: '#F44336', fontSize: 'small', ml: 0.5 }} />
          </Typography>
        </Box>

        {/* Navigation Items */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {(user ? authenticatedNavItems : publicNavItems).map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => handleNavigation(item.path)}
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
          {!user && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/login"
              sx={{
                fontWeight: 700,
                fontSize: "1rem",
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

        {/* User Icon/Sign Out Button */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
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
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                  },
                }}
              >
                <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
              </Menu>
            </>
          ) : null}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
